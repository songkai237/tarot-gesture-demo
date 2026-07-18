import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { GestureRecognizer } from "./gesture";
import type { CameraStatus, GestureFrame } from "./types";

type HandTrackingCallbacks = {
  onStatus: (status: CameraStatus) => void;
  onGesture: (gesture: GestureFrame) => void;
  onError: (message: string) => void;
};

export class HandTracking {
  private video: HTMLVideoElement;
  private callbacks: HandTrackingCallbacks;
  private recognizer = new GestureRecognizer();
  private handLandmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private animationFrame = 0;
  private active = false;

  constructor(video: HTMLVideoElement, callbacks: HandTrackingCallbacks) {
    this.video = video;
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    try {
      this.callbacks.onStatus("加载模型");
      await this.loadModel();

      this.callbacks.onStatus("等待授权");
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      await this.video.play();

      this.active = true;
      this.callbacks.onStatus("寻找手掌");
      this.tick();
    } catch (error) {
      this.callbacks.onStatus("摄像头不可用");
      this.callbacks.onError(error instanceof Error ? error.message : "无法启动摄像头或手势模型。");
    }
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.animationFrame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  private async loadModel(): Promise<void> {
    if (this.handLandmarker) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.58,
      minHandPresenceConfidence: 0.58,
      minTrackingConfidence: 0.55
    });
  }

  private tick = (): void => {
    if (!this.active || !this.handLandmarker) {
      return;
    }

    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const results = this.handLandmarker.detectForVideo(this.video, performance.now());
      const landmarks = results.landmarks[0];

      if (landmarks) {
        this.callbacks.onStatus("手势识别中");
        this.callbacks.onGesture(this.recognizer.update(landmarks));
      } else {
        this.callbacks.onStatus("寻找手掌");
        this.callbacks.onGesture({
          name: "none",
          palmX: 0.5,
          velocityX: 0,
          confidence: 0
        });
      }
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  };
}
