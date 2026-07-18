import type { GestureFrame, GestureName } from "./types";

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

const fingertipIndexes = [8, 12, 16, 20];
const pipIndexes = [6, 10, 14, 18];
const palmIndexes = [0, 5, 9, 13, 17];

export class GestureRecognizer {
  private lastPalmX = 0.5;
  private lastTime = performance.now();
  private smoothedVelocity = 0;
  private lastFistAt = 0;

  update(landmarks: Landmark[], now = performance.now()): GestureFrame {
    const palm = getPalmCenter(landmarks);
    const dt = Math.max((now - this.lastTime) / 1000, 0.016);
    const rawVelocity = (palm.x - this.lastPalmX) / dt;
    this.smoothedVelocity = this.smoothedVelocity * 0.72 + rawVelocity * 0.28;
    this.lastPalmX = palm.x;
    this.lastTime = now;

    const openScore = getOpenPalmScore(landmarks);
    const fistScore = getFistScore(landmarks);
    const pointGesture = getPointGesture(landmarks);
    const canTriggerFist = now - this.lastFistAt > 1500;

    let name: GestureName = "none";
    let confidence = Math.max(openScore, fistScore, pointGesture.confidence);

    if (fistScore >= 0.86 && canTriggerFist) {
      name = "fist";
      confidence = fistScore;
      this.lastFistAt = now;
    } else if (pointGesture.confidence >= 0.78) {
      name = pointGesture.name;
      confidence = pointGesture.confidence;
    } else if (openScore >= 0.68) {
      name = "open_palm";
      confidence = openScore;
    }

    return {
      name,
      palmX: palm.x,
      velocityX: this.smoothedVelocity,
      confidence
    };
  }

  reset(): void {
    this.lastPalmX = 0.5;
    this.lastTime = performance.now();
    this.smoothedVelocity = 0;
    this.lastFistAt = 0;
  }
}

function getPalmCenter(landmarks: Landmark[]): Landmark {
  const center = palmIndexes.reduce(
    (acc, index) => {
      const point = landmarks[index];
      return {
        x: acc.x + point.x,
        y: acc.y + point.y
      };
    },
    { x: 0, y: 0 }
  );

  return {
    x: center.x / palmIndexes.length,
    y: center.y / palmIndexes.length
  };
}

function getOpenPalmScore(landmarks: Landmark[]): number {
  const extended = fingertipIndexes.reduce((count, tipIndex, itemIndex) => {
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndexes[itemIndex]];
    return count + (tip.y < pip.y ? 1 : 0);
  }, 0);

  return extended / fingertipIndexes.length;
}

function getFistScore(landmarks: Landmark[]): number {
  const folded = fingertipIndexes.reduce((count, tipIndex, itemIndex) => {
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndexes[itemIndex]];
    return count + (tip.y >= pip.y - 0.015 ? 1 : 0);
  }, 0);

  const wrist = landmarks[0];
  const fingertipDistance = averageDistance(
    fingertipIndexes.map((index) => distance(wrist, landmarks[index]))
  );
  const knuckleDistance = averageDistance([5, 9, 13, 17].map((index) => distance(wrist, landmarks[index])));
  const compactness = folded === fingertipIndexes.length && fingertipDistance < knuckleDistance * 1.72 ? 0.18 : 0;

  return Math.min(1, folded / fingertipIndexes.length + compactness);
}

function getPointGesture(landmarks: Landmark[]): { name: GestureName; confidence: number } {
  const indexExtended = landmarks[8].y < landmarks[6].y - 0.025;
  const otherFingersFolded = [12, 16, 20].reduce((count, tipIndex, itemIndex) => {
    const pip = landmarks[[10, 14, 18][itemIndex]];
    return count + (landmarks[tipIndex].y >= pip.y - 0.01 ? 1 : 0);
  }, 0);

  if (!indexExtended || otherFingersFolded < 2) {
    return { name: "none", confidence: 0 };
  }

  const displayedTipX = 1 - landmarks[8].x;
  const name = displayedTipX < 0.44 ? "point_left" : displayedTipX > 0.56 ? "point_right" : "point_center";
  const confidence = 0.5 + otherFingersFolded / 6;
  return { name, confidence };
}

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function averageDistance(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
