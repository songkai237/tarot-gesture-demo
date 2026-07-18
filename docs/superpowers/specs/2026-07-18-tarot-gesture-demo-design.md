# Tarot Gesture Demo Design

## Context

This project starts as an empty repository for a tarot card demo. The goal is a visually striking browser experience where a user controls a 3D tarot card ring with real camera hand gestures.

The first version is a showcase demo, not a full product. It prioritizes visual impact, real camera recognition, and a clean interaction loop over accounts, persistence, or backend services.

## Goals

- Show a full-screen 3D tarot scene with cards arranged in a circular ring.
- Use the browser camera to recognize hand gestures.
- Let the user shuffle by moving an open palm left and right.
- Let the user draw a card by making a fist.
- Display detailed tarot card information after drawing.
- Keep the app usable and stable when camera permission is missing or hand tracking is unavailable.

## Non-Goals

- No user accounts.
- No backend API.
- No saved draw history.
- No paid readings, sharing, or social features.
- No custom gesture training in the first version.

## Recommended Approach

Build a browser-based app using Vite, TypeScript, Three.js, and MediaPipe Hands.

Three.js handles the 3D scene, tarot card ring, animation, lighting, and visual effects. MediaPipe Hands handles webcam-based hand landmark tracking. A gesture layer converts landmarks into simple domain events such as `open_palm`, `swipe_left`, `swipe_right`, and `fist`.

This approach gives the strongest balance between demo quality and implementation speed. It avoids native-app distribution while still enabling real camera interaction and rich 3D visuals.

## User Experience

### Initial Load

The app opens into a full-screen 3D scene. The tarot cards appear as a floating circular ring around the center of the screen. The camera permission prompt appears immediately or after a clear start action, depending on browser behavior.

A compact camera preview sits in a corner with a tracking status indicator:

- `等待授权`: camera permission has not been granted.
- `寻找手掌`: camera is active but no hand is currently tracked.
- `手势识别中`: hand tracking is active.
- `握拳抽牌`: a fist has been detected and a draw is triggering.

### Shuffle

When the user shows an open palm and moves it horizontally, the app maps hand movement velocity to the card ring's angular velocity.

Fast left or right movement makes the ring spin faster. The ring keeps moving with inertia after the hand slows down, creating a shuffle feeling. The cards may subtly reorder after strong shuffle gestures so the draw is not visually predictable.

### Draw

When the user makes a fist, the app selects the currently front-facing or highlighted card. That card detaches from the ring, flies to the center, flips over, and reveals its information.

The drawn card detail panel shows:

- Card name.
- Arcana type.
- Upright or reversed orientation.
- Keywords.
- Upright meaning.
- Reversed meaning.
- A short reading-style interpretation.

### Reset

After a card has been drawn, opening the palm again returns the scene to shuffle mode. The drawn card animates back or fades out, and the ring becomes interactive again.

## Visual Direction

The scene should feel mystical, dimensional, and energetic:

- Dark full-screen environment with atmospheric lighting.
- 3D tarot cards arranged in an orbital ring.
- Gold and jewel-tone accents rather than a single-color palette.
- Bloom-like glow, particles, and subtle depth effects.
- Current selectable card is slightly larger, brighter, or closer to camera.
- Draw animation should feel ceremonial: detach, arc forward, rotate, flip, reveal.

The first screen is the actual interactive experience, not a landing page.

## Architecture

### App Shell

Responsible for application state and high-level view transitions:

- Camera permission state.
- Gesture tracking state.
- Current scene mode: `loading`, `shuffle`, `drawing`, `revealed`, `camera_error`.
- Currently selected or drawn card.

### Hand Tracking Module

Responsible for webcam setup and MediaPipe Hands integration:

- Requests camera access.
- Sends video frames to MediaPipe.
- Emits raw hand landmark data.
- Reports camera and tracking errors.

### Gesture Recognition Module

Responsible for converting hand landmarks into app gestures:

- Detects open palm versus fist.
- Tracks horizontal palm movement over time.
- Calculates swipe velocity.
- Applies debounce and cooldown rules so one fist does not trigger multiple draws.
- Emits stable gesture events.

### 3D Scene Module

Responsible for rendering and animation:

- Creates the Three.js renderer, camera, lights, and scene.
- Builds the tarot card ring.
- Updates ring rotation based on gesture velocity.
- Highlights the front-facing card.
- Runs draw and reset animations.
- Adapts layout to desktop and mobile viewports.

### Tarot Data Module

Responsible for local card content:

- Stores tarot card metadata in JSON or TypeScript data.
- Provides random orientation selection.
- Provides display-ready card details.

## Data Model

Each tarot card should include:

```ts
type TarotCard = {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  number?: string;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  shortInterpretation: string;
};
```

## Gesture Rules

### Open Palm

The hand is treated as open when most fingertips are extended away from the palm. Open palm enables shuffle control and reset after reveal.

### Fist

The hand is treated as a fist when most fingertips are folded toward the palm. Fist detection must be debounced, with a short cooldown after a draw begins.

### Swipe

Swipe is based on normalized palm center movement across consecutive frames. It should use smoothing so small camera jitter does not spin the ring.

## Error Handling

- If camera permission is denied, show a visible message explaining that camera access is required for the first version.
- If MediaPipe fails to load, show a tracking unavailable state without crashing the 3D scene.
- If no hand is detected, keep the card ring gently idling.
- If performance is low, reduce particles or visual effects before degrading core interaction.

## Testing And Verification

Manual verification is required for the first version:

- App starts locally.
- 3D scene renders and is not blank on desktop and mobile viewport sizes.
- Camera permission flow works.
- Hand tracking status changes when a hand enters and leaves the frame.
- Open palm horizontal movement rotates the ring.
- Fist draws exactly one card per gesture.
- Drawn card details render without overlapping UI.
- Camera denied or unavailable state does not crash the app.

Automated tests can focus on pure logic:

- Gesture recognition helpers for open palm and fist thresholds.
- Swipe velocity smoothing.
- Tarot data shape validation.
- State transitions between `shuffle`, `drawing`, and `revealed`.

## Acceptance Criteria

- A user can open the local web app and grant camera access.
- The app recognizes real hand gestures through the webcam.
- The tarot card ring rotates when the user moves an open palm left or right.
- A fist gesture triggers a polished draw animation.
- The selected card reveals readable tarot details.
- The app handles camera errors gracefully.
- The implementation remains frontend-only for the first version.
