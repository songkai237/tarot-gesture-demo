export type Arcana = "major" | "minor";

export type Suit = "wands" | "cups" | "swords" | "pentacles";

export type CardOrientation = "upright" | "reversed";

export type TarotCard = {
  id: string;
  name: string;
  arcana: Arcana;
  suit?: Suit;
  number?: string;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  shortInterpretation: string;
};

export type DrawnCard = {
  card: TarotCard;
  orientation: CardOrientation;
};

export type SceneMode =
  | "loading"
  | "shuffle"
  | "ready_to_draw"
  | "drawing"
  | "revealed"
  | "returning"
  | "camera_error";

export type CameraStatus = "等待授权" | "加载模型" | "寻找手掌" | "手势识别中" | "摄像头不可用";

export type GestureName =
  | "none"
  | "open_palm"
  | "fist"
  | "point_left"
  | "point_right"
  | "point_center";

export type GestureFrame = {
  name: GestureName;
  palmX: number;
  velocityX: number;
  confidence: number;
};
