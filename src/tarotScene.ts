import * as THREE from "three";
import type { DrawnCard, TarotCard } from "./types";

type CardView = {
  card: TarotCard;
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  backMaterial: THREE.MeshBasicMaterial;
  frontMaterial: THREE.MeshBasicMaterial;
  angle: number;
};

type CardTransform = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
};

type SceneOptions = {
  canvas: HTMLCanvasElement;
  deck: TarotCard[];
};

export class TarotScene {
  private canvas: HTMLCanvasElement;
  private deck: TarotCard[];
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  private ring = new THREE.Group();
  private particles: THREE.Points;
  private cards: CardView[] = [];
  private startedAt = performance.now();
  private lastFrameAt = this.startedAt;
  private ringRotation = 0;
  private angularVelocity = 0.12;
  private selectedIndex = 0;
  private drawnIndex: number | null = null;
  private drawProgress = 0;
  private returnProgress = 0;
  private returnStart: CardTransform | null = null;
  private returnComplete: (() => void) | null = null;
  private mode: "shuffle" | "drawing" | "revealed" | "returning" = "shuffle";
  private rotationLocked = false;
  private resizeObserver: ResizeObserver;

  constructor(options: SceneOptions) {
    this.canvas = options.canvas;
    this.deck = options.deck;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.camera.position.set(0, 2.1, 8.6);
    this.camera.lookAt(0, 0.1, 0);

    this.particles = this.createParticles();
    this.scene.add(this.particles);
    this.scene.add(this.ring);
    this.addLights();
    this.createCards();

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.canvas);
    this.resize();
    this.animate();
  }

  setDirectionalShuffle(direction: "clockwise" | "counterclockwise"): void {
    if (this.mode !== "shuffle") {
      return;
    }

    this.rotationLocked = false;
    const acceleration = direction === "clockwise" ? 0.045 : -0.045;
    this.angularVelocity = THREE.MathUtils.clamp(this.angularVelocity + acceleration, -1.35, 1.35);
  }

  stopRotation(): void {
    this.angularVelocity = 0;
    this.rotationLocked = true;
  }

  drawCurrentCard(drawnCard: DrawnCard): number {
    if (this.mode !== "shuffle") {
      return this.selectedIndex;
    }

    const matchingIndex = this.deck.findIndex((card) => card.id === drawnCard.card.id);
    this.drawnIndex = matchingIndex >= 0 ? matchingIndex : this.selectedIndex;
    this.mode = "drawing";
    this.drawProgress = 0;
    this.angularVelocity = 0;
    this.rotationLocked = true;
    return this.drawnIndex;
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  reset(): void {
    this.mode = "shuffle";
    this.drawnIndex = null;
    this.drawProgress = 0;
    this.returnProgress = 0;
    this.returnStart = null;
    this.returnComplete = null;
    this.rotationLocked = false;
    this.cards.forEach((card) => {
      card.mesh.material = card.backMaterial;
      card.mesh.renderOrder = 0;
      card.backMaterial.depthTest = true;
      card.frontMaterial.depthTest = true;
      card.group.scale.setScalar(1);
    });
  }

  returnCardToRing(onComplete: () => void): void {
    if (this.drawnIndex === null || this.mode === "returning") {
      onComplete();
      return;
    }

    const drawn = this.cards[this.drawnIndex];
    this.mode = "returning";
    this.returnProgress = 0;
    this.returnStart = {
      position: drawn.group.position.clone(),
      rotation: drawn.group.rotation.clone(),
      scale: drawn.group.scale.x
    };
    this.returnComplete = onComplete;
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }

  private animate = (): void => {
    const now = performance.now();
    const elapsed = (now - this.startedAt) / 1000;
    const delta = Math.min((now - this.lastFrameAt) / 1000, 0.033);
    this.lastFrameAt = now;

    this.updateRing(delta, elapsed);
    this.updateParticles(elapsed);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };

  private updateRing(delta: number, elapsed: number): void {
    if (this.mode === "shuffle") {
      this.ringRotation += this.angularVelocity * delta;
      this.angularVelocity *= 0.985;

      if (!this.rotationLocked && Math.abs(this.angularVelocity) < 0.08) {
        this.angularVelocity += Math.sin(elapsed * 0.7) * 0.0009;
      }
    }

    const radius = this.getRingRadius();
    const angleStep = (Math.PI * 2) / this.cards.length;
    let frontScore = -Infinity;
    let frontIndex = 0;

    this.cards.forEach((card, index) => {
      const angle = card.angle + this.ringRotation;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = Math.sin(angle * 2 + elapsed * 0.8) * 0.18;
      const isDrawn = this.drawnIndex === index;

      if (!isDrawn || this.mode === "shuffle") {
        card.group.position.set(x, y, z);
        card.group.rotation.set(0, angle, 0);
        card.group.lookAt(this.camera.position);
        card.mesh.material = card.backMaterial;

        const scale = z > frontScore ? 1.16 : 1;
        card.group.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12);
      }

      if (z > frontScore) {
        frontScore = z;
        frontIndex = index;
      }
    });

    this.selectedIndex = frontIndex;
    this.cards[this.selectedIndex]?.group.scale.lerp(new THREE.Vector3(1.22, 1.22, 1.22), 0.12);

    if (this.mode === "drawing" && this.drawnIndex !== null) {
      const drawn = this.cards[this.drawnIndex];
      this.drawProgress = Math.min(1, this.drawProgress + delta * 0.72);
      const eased = easeOutCubic(this.drawProgress);
      drawn.mesh.material = this.drawProgress > 0.46 ? drawn.frontMaterial : drawn.backMaterial;
      drawn.mesh.renderOrder = 1000;
      drawn.backMaterial.depthTest = false;
      drawn.frontMaterial.depthTest = false;
      drawn.group.position.lerpVectors(drawn.group.position, this.getDrawnCardTarget(), eased * 0.18);
      drawn.group.rotation.set(0, Math.sin(eased * Math.PI) * Math.PI, 0);
      drawn.group.scale.setScalar(THREE.MathUtils.lerp(1.2, this.getDrawnCardScale(), eased));

      if (this.drawProgress >= 1) {
        this.mode = "revealed";
      }
    }

    if (this.mode === "returning" && this.drawnIndex !== null && this.returnStart) {
      const drawn = this.cards[this.drawnIndex];
      const target = this.getCardRingTransform(drawn, elapsed);
      this.returnProgress = Math.min(1, this.returnProgress + delta * 1.12);
      const eased = easeInOutCubic(this.returnProgress);
      drawn.mesh.renderOrder = 1000;
      drawn.backMaterial.depthTest = false;
      drawn.frontMaterial.depthTest = false;
      drawn.mesh.material = this.returnProgress > 0.38 ? drawn.backMaterial : drawn.frontMaterial;
      drawn.group.position.lerpVectors(this.returnStart.position, target.position, eased);
      drawn.group.rotation.set(
        THREE.MathUtils.lerp(this.returnStart.rotation.x, target.rotation.x, eased),
        THREE.MathUtils.lerp(this.returnStart.rotation.y, target.rotation.y, eased),
        THREE.MathUtils.lerp(this.returnStart.rotation.z, target.rotation.z, eased)
      );
      drawn.group.scale.setScalar(THREE.MathUtils.lerp(this.returnStart.scale, target.scale, eased));

      if (this.returnProgress >= 1) {
        const complete = this.returnComplete;
        this.reset();
        complete?.();
      }
    }

    this.ring.rotation.y = Math.sin(elapsed * 0.24) * 0.05;
  }

  private createCards(): void {
    const angleStep = (Math.PI * 2) / this.deck.length;

    this.deck.forEach((card, index) => {
      const group = new THREE.Group();
      const geometry = new THREE.PlaneGeometry(0.74, 1.18);
      const backMaterial = new THREE.MeshBasicMaterial({
        map: createCardBackTexture(index),
        transparent: true
      });
      const frontMaterial = new THREE.MeshBasicMaterial({
        map: createCardFrontTexture(card),
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, backMaterial);
      group.add(mesh);
      this.ring.add(group);
      this.cards.push({
        card,
        group,
        mesh,
        backMaterial,
        frontMaterial,
        angle: index * angleStep
      });
    });
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0xfff1cd, 1.2);
    const key = new THREE.PointLight(0xf5c66b, 18, 18);
    const cyan = new THREE.PointLight(0x7de7df, 9, 16);
    key.position.set(0, 3.6, 4.5);
    cyan.position.set(-4, -1.5, 2);
    this.scene.add(ambient, key, cyan);
  }

  private createParticles(): THREE.Points {
    const count = 780;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorA = new THREE.Color("#f0c05f");
    const colorB = new THREE.Color("#79e4dc");

    for (let index = 0; index < count; index += 1) {
      const radius = 3 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 5;
      positions[index * 3] = Math.sin(angle) * radius;
      positions[index * 3 + 1] = height;
      positions[index * 3 + 2] = Math.cos(angle) * radius;

      const color = colorA.clone().lerp(colorB, Math.random() * 0.5);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      })
    );
  }

  private updateParticles(elapsed: number): void {
    this.particles.rotation.y = elapsed * 0.025;
    this.particles.rotation.x = Math.sin(elapsed * 0.08) * 0.08;
  }

  private getRingRadius(): number {
    return window.innerWidth < 760 ? 3.1 : 4.6;
  }

  private getCardRingTransform(card: CardView, elapsed: number): CardTransform {
    const radius = this.getRingRadius();
    const angle = card.angle + this.ringRotation;
    const position = new THREE.Vector3(
      Math.sin(angle) * radius,
      Math.sin(angle * 2 + elapsed * 0.8) * 0.18,
      Math.cos(angle) * radius
    );
    const temp = new THREE.Group();
    temp.position.copy(position);
    temp.rotation.set(0, angle, 0);
    temp.lookAt(this.camera.position);
    return {
      position,
      rotation: temp.rotation.clone(),
      scale: 1
    };
  }

  private getDrawnCardTarget(): THREE.Vector3 {
    return window.innerWidth < 760 ? new THREE.Vector3(0, 1.35, 2.35) : new THREE.Vector3(0, 1.28, 3.05);
  }

  private getDrawnCardScale(): number {
    return window.innerWidth < 760 ? 1.36 : 1.58;
  }

  private resize = (): void => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.position.z = width < 760 ? 9.8 : 8.6;
    this.camera.updateProjectionMatrix();
  };
}

function createCardBackTexture(index: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is unavailable.");
  }

  const gradient = ctx.createLinearGradient(0, 0, 512, 768);
  gradient.addColorStop(0, "#1f1a37");
  gradient.addColorStop(0.46, "#0b1022");
  gradient.addColorStop(1, "#2b1731");
  ctx.fillStyle = gradient;
  roundRect(ctx, 24, 24, 464, 720, 34);
  ctx.fill();

  ctx.strokeStyle = "#e8bd63";
  ctx.lineWidth = 10;
  roundRect(ctx, 42, 42, 428, 684, 28);
  ctx.stroke();

  ctx.strokeStyle = "rgba(125, 231, 223, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(256, 384, 126, 196, (index % 12) * 0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4d177";
  ctx.font = "700 44px serif";
  ctx.textAlign = "center";
  ctx.fillText("✦", 256, 398);
  return new THREE.CanvasTexture(canvas);
}

function createCardFrontTexture(card: TarotCard): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is unavailable.");
  }

  const gradient = ctx.createLinearGradient(0, 0, 512, 768);
  gradient.addColorStop(0, "#f9e7b2");
  gradient.addColorStop(0.5, "#d3e7dc");
  gradient.addColorStop(1, "#8f789f");
  ctx.fillStyle = gradient;
  roundRect(ctx, 24, 24, 464, 720, 34);
  ctx.fill();

  ctx.strokeStyle = "#6d3d72";
  ctx.lineWidth = 8;
  roundRect(ctx, 42, 42, 428, 684, 28);
  ctx.stroke();

  ctx.fillStyle = "#21152d";
  ctx.font = "900 58px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(card.name, 256, 142);

  ctx.fillStyle = "rgba(33, 21, 45, 0.82)";
  ctx.font = "700 24px sans-serif";
  ctx.fillText(card.arcana === "major" ? "MAJOR ARCANA" : "MINOR ARCANA", 256, 186);

  ctx.strokeStyle = "rgba(109, 61, 114, 0.62)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 384, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 384, 78, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#31203c";
  ctx.font = "700 82px serif";
  ctx.fillText("☽", 230, 408);
  ctx.fillText("☉", 292, 408);

  ctx.fillStyle = "rgba(33, 21, 45, 0.86)";
  ctx.font = "700 28px sans-serif";
  wrapText(ctx, card.keywords.slice(0, 3).join(" / "), 256, 604, 360, 34);
  return new THREE.CanvasTexture(canvas);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, x, y);
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
