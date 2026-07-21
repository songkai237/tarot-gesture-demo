import "./styles.css";
import { HandTracking } from "./handTracking";
import { tarotDetails } from "./tarotDetails";
import { drawCard, orientationLabel, tarotDeck } from "./tarotData";
import { TarotScene } from "./tarotScene";
import type { CameraStatus, DrawnCard, GestureFrame, SceneMode } from "./types";

const canvas = getElement<HTMLCanvasElement>("scene");
const video = getElement<HTMLVideoElement>("camera");
const startButton = getElement<HTMLButtonElement>("startButton");
const resetButton = getElement<HTMLButtonElement>("resetButton");
const permissionScreen = getElement<HTMLElement>("permissionScreen");
const permissionNote = getElement<HTMLElement>("permissionNote");
const cameraStatus = getElement<HTMLElement>("cameraStatus");
const gestureStatus = getElement<HTMLElement>("gestureStatus");
const modeLabel = getElement<HTMLElement>("modeLabel");
const cardDetail = getElement<HTMLElement>("cardDetail");
const cardArcana = getElement<HTMLElement>("cardArcana");
const cardName = getElement<HTMLElement>("cardName");
const cardOrientation = getElement<HTMLElement>("cardOrientation");
const cardKeywords = getElement<HTMLElement>("cardKeywords");
const symbolism = getElement<HTMLElement>("symbolism");
const uprightMeaning = getElement<HTMLElement>("uprightMeaning");
const reversedMeaning = getElement<HTMLElement>("reversedMeaning");
const loveMeaning = getElement<HTMLElement>("loveMeaning");
const careerMeaning = getElement<HTMLElement>("careerMeaning");
const adviceMeaning = getElement<HTMLElement>("adviceMeaning");
const shortInterpretation = getElement<HTMLElement>("shortInterpretation");

const scene = new TarotScene({
  canvas,
  deck: tarotDeck
});

let mode: SceneMode = "loading";
let handTracking: HandTracking | null = null;
let lastGestureName = "未检测";
let revealTimer = 0;
let returnInProgress = false;
let returnGesture: ReturnGestureState = createReturnGestureState();

const openPalmHoldMs = 300;
const fistHoldMs = 600;
const returnGestureTimeoutMs = 3000;
const returnGestureMaxVelocity = 0.28;

type ReturnGesturePhase = "idle" | "priming_open_palm" | "awaiting_open_exit" | "awaiting_fist" | "holding_fist";

type ReturnGestureState = {
  phase: ReturnGesturePhase;
  startedAt: number;
  fistStartedAt: number;
};

setMode("loading");

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  permissionNote.textContent = "正在加载手势模型，请稍等。";

  handTracking = new HandTracking(video, {
    onStatus: setCameraStatus,
    onGesture: handleGesture,
    onError: handleCameraError
  });

  await handTracking.start();

  if (mode !== "camera_error") {
    permissionScreen.classList.add("hidden");
    setMode("shuffle");
  }
});

resetButton.addEventListener("click", resetReading);

window.addEventListener("beforeunload", () => {
  handTracking?.stop();
});

function handleGesture(gesture: GestureFrame): void {
  if (mode === "returning") {
    gestureStatus.textContent = "放回中";
    return;
  }

  if (mode === "revealed") {
    handleRevealedGesture(gesture);
    return;
  }

  lastGestureName = gestureLabel(gesture);
  gestureStatus.textContent = lastGestureName;

  if (mode === "shuffle") {
    applyPointShuffle(gesture);

    if (gesture.name === "fist") {
      prepareDraw();
    }
  } else if (mode === "ready_to_draw") {
    if (applyPointShuffle(gesture)) {
      setMode("shuffle");
      return;
    }

    if (gesture.name === "fist") {
      scene.stopRotation();
    }

    if (gesture.name === "open_palm" && gesture.confidence > 0.76 && Math.abs(gesture.velocityX) < 0.28) {
      triggerDraw();
    }
  }
}

function applyPointShuffle(gesture: GestureFrame): boolean {
  if (gesture.name === "point_left") {
    scene.setDirectionalShuffle("counterclockwise");
    return true;
  }

  if (gesture.name === "point_right") {
    scene.setDirectionalShuffle("clockwise");
    return true;
  }

  return false;
}

function prepareDraw(): void {
  scene.stopRotation();
  setMode("ready_to_draw");
}

function triggerDraw(): void {
  setMode("drawing");
  const selectedIndex = scene.getSelectedIndex();
  const drawn = drawCard(selectedIndex);
  scene.drawCurrentCard(drawn);
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => {
    showCardDetail(drawn);
    setMode("revealed");
  }, 1050);
}

function resetReading(): void {
  window.clearTimeout(revealTimer);
  returnGesture = createReturnGestureState();

  if (mode === "revealed") {
    startReturnAnimation();
    return;
  }

  finishResetReading();
}

function startReturnAnimation(): void {
  if (returnInProgress) {
    return;
  }

  returnInProgress = true;
  setMode("returning");
  cardDetail.classList.add("hidden");
  resetButton.classList.add("hidden");
  scene.returnCardToRing(() => {
    finishResetReading();
  });
}

function finishResetReading(): void {
  returnGesture = createReturnGestureState();
  returnInProgress = false;
  scene.reset();
  cardDetail.classList.add("hidden");
  resetButton.classList.add("hidden");
  gestureStatus.textContent = "未检测";
  setMode("shuffle");
}

function showCardDetail(drawn: DrawnCard): void {
  const { card, orientation } = drawn;
  const detail = tarotDetails[card.id];
  cardArcana.textContent = card.arcana === "major" ? "Major Arcana" : `${card.suit ?? "Minor"} Arcana`;
  cardName.textContent = card.name;
  cardOrientation.textContent = orientationLabel(orientation);
  cardKeywords.replaceChildren(
    ...card.keywords.slice(0, 5).map((keyword) => {
      const tag = document.createElement("span");
      tag.textContent = keyword;
      return tag;
    })
  );
  uprightMeaning.textContent = card.uprightMeaning;
  reversedMeaning.textContent = card.reversedMeaning;
  symbolism.textContent = detail.symbolism;
  loveMeaning.textContent = detail.love[orientation];
  careerMeaning.textContent = detail.career[orientation];
  adviceMeaning.textContent = detail.advice[orientation];
  shortInterpretation.textContent =
    orientation === "upright"
      ? card.shortInterpretation
      : `逆位提醒：先看见阻滞的源头，再重新选择你的节奏。${card.shortInterpretation}`;
  cardDetail.classList.remove("hidden");
  resetButton.classList.remove("hidden");
}

function handleRevealedGesture(gesture: GestureFrame): void {
  const now = performance.now();
  const isOpenPalm = gesture.name === "open_palm" && gesture.confidence > 0.76;
  const isStillFist = gesture.name === "fist" && gesture.confidence > 0.86 && Math.abs(gesture.velocityX) < returnGestureMaxVelocity;

  if (returnGesture.phase !== "idle" && now - returnGesture.startedAt > returnGestureTimeoutMs) {
    cancelReturnGesture("重洗确认已取消");
    return;
  }

  if (returnGesture.phase === "idle") {
    if (isOpenPalm) {
      returnGesture = { phase: "priming_open_palm", startedAt: now, fistStartedAt: 0 };
      gestureStatus.textContent = "张掌确认中";
    } else {
      gestureStatus.textContent = "重洗：张掌后握拳";
    }
    return;
  }

  if (returnGesture.phase === "priming_open_palm") {
    if (!isOpenPalm) {
      cancelReturnGesture();
      return;
    }

    if (now - returnGesture.startedAt >= openPalmHoldMs) {
      returnGesture.phase = "awaiting_open_exit";
      gestureStatus.textContent = "握拳并停住以放回";
      modeLabel.textContent = "握拳确认放回当前卡牌";
    } else {
      gestureStatus.textContent = "张掌确认中";
    }
    return;
  }

  if (returnGesture.phase === "awaiting_open_exit") {
    if (!isOpenPalm) {
      returnGesture.phase = "awaiting_fist";
    }
    gestureStatus.textContent = "握拳并停住以放回";
    return;
  }

  if (returnGesture.phase === "awaiting_fist") {
    if (isStillFist) {
      returnGesture.phase = "holding_fist";
      returnGesture.fistStartedAt = now;
      gestureStatus.textContent = "确认放回中";
    } else {
      gestureStatus.textContent = "握拳并停住以放回";
    }
    return;
  }

  if (!isStillFist) {
    returnGesture.phase = "awaiting_fist";
    returnGesture.fistStartedAt = 0;
    gestureStatus.textContent = "握拳并停住以放回";
    return;
  }

  if (now - returnGesture.fistStartedAt >= fistHoldMs) {
    resetReading();
    return;
  }

  gestureStatus.textContent = "确认放回中";
}

function cancelReturnGesture(status = "重洗：张掌后握拳"): void {
  returnGesture = createReturnGestureState();
  gestureStatus.textContent = status;
  modeLabel.textContent = "张掌后握拳放回卡牌，或点击按钮重新洗牌";
}

function createReturnGestureState(): ReturnGestureState {
  return { phase: "idle", startedAt: 0, fistStartedAt: 0 };
}

function setCameraStatus(status: CameraStatus): void {
  cameraStatus.textContent = status;
  if (mode !== "camera_error") {
    if (status === "加载模型") {
      modeLabel.textContent = "正在加载手势模型";
    } else if (status === "寻找手掌" && mode === "shuffle") {
      modeLabel.textContent = "把手掌放入摄像头画面";
    } else if (status === "手势识别中" && mode === "shuffle") {
      modeLabel.textContent = "伸出一根手指，左偏逆时针，右偏顺时针";
    }
  }
}

function handleCameraError(message: string): void {
  setMode("camera_error");
  permissionScreen.classList.remove("hidden");
  startButton.disabled = false;
  permissionNote.textContent = `摄像头启动失败：${message}`;
}

function setMode(nextMode: SceneMode): void {
  mode = nextMode;
  const labels: Record<SceneMode, string> = {
    loading: "点击启动摄像头开始",
    shuffle: "伸出一根手指控制洗牌，握拳停止",
    ready_to_draw: "张开手掌抽牌，单指偏移可继续洗牌",
    drawing: "正在抽牌",
    revealed: "张掌后握拳放回卡牌，或点击按钮重新洗牌",
    returning: "正在放回卡牌",
    camera_error: "摄像头不可用"
  };
  modeLabel.textContent = labels[nextMode];

  if (nextMode === "revealed") {
    returnGesture = createReturnGestureState();
    gestureStatus.textContent = "重洗：张掌后握拳";
  }
}

function gestureLabel(gesture: GestureFrame): string {
  if (gesture.name === "fist") {
    return "握拳";
  }

  if (gesture.name === "point_left") {
    return "单指左偏";
  }

  if (gesture.name === "point_right") {
    return "单指右偏";
  }

  if (gesture.name === "point_center") {
    return "单指居中";
  }

  if (gesture.name === "open_palm") {
    return "张掌";
  }

  return lastGestureName === "未检测" ? "未检测" : "寻找手掌";
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}
