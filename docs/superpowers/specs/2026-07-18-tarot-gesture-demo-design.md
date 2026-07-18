# Tarot Gesture Demo Design

## Context

This project starts as an empty repository for a tarot card demo. The goal is a visually striking browser experience where a user controls a 3D tarot card ring with real camera hand gestures.

The first version is a showcase demo, not a full product. It prioritizes visual impact, real camera recognition, and a clean interaction loop over accounts, persistence, or backend services.

## Goals

- Show a full-screen 3D tarot scene with cards arranged in a circular ring.
- Use the browser camera to recognize hand gestures.
- Let the user shuffle by extending one finger and offsetting it left or right.
- Let the user stop the spinning card ring by making a fist.
- Let the user draw a card by opening the palm after the ring has stopped.
- Display detailed tarot card information after drawing.
- Keep the app usable and stable when camera permission is missing or hand tracking is unavailable.
- Let the user return the revealed card and resume shuffling with an open-palm-then-fist gesture sequence.

## Non-Goals

- No user accounts.
- No backend API.
- No saved draw history.
- No paid readings, sharing, or social features.
- No custom gesture training in the first version.

## Recommended Approach

Build a browser-based app using Vite, TypeScript, Three.js, and MediaPipe Hands.

Three.js handles the 3D scene, tarot card ring, animation, lighting, and visual effects. MediaPipe Hands handles webcam-based hand landmark tracking. A gesture layer converts landmarks into simple domain events such as `point_left`, `point_right`, `point_center`, `open_palm`, and `fist`.

This approach gives the strongest balance between demo quality and implementation speed. It avoids native-app distribution while still enabling real camera interaction and rich 3D visuals.

## User Experience

### Initial Load

The app opens into a full-screen 3D scene. The tarot cards appear as a floating circular ring around the center of the screen. The camera permission prompt appears immediately or after a clear start action, depending on browser behavior.

A compact camera preview sits in a corner with a tracking status indicator:

- `等待授权`: camera permission has not been granted.
- `寻找手掌`: camera is active but no hand is currently tracked.
- `手势识别中`: hand tracking is active.
- `握拳停止`: a fist has been detected and the ring is stopping.

### Shuffle

When the user extends one finger, the app maps the fingertip's visible horizontal offset to the card ring's rotation direction.

If the fingertip appears left of center in the mirrored camera preview, the ring shuffles counterclockwise. If the fingertip appears right of center, the ring shuffles clockwise. A centered fingertip does not add acceleration, so the ring naturally slows through inertia. The cards may subtly reorder after sustained shuffle gestures so the draw is not visually predictable.

### Draw

When the user makes a fist, the app stops the ring and enters a ready-to-draw state. When the user then opens the palm while the ring is stopped, the app selects the currently front-facing or highlighted card. If the user extends one finger left or right instead, the app resumes directional shuffling and returns to shuffle mode. When a draw is triggered, the chosen card detaches from the ring, flies to the center, flips over, and reveals its information.

The drawn card detail panel shows:

- Card name.
- Arcana type.
- Upright or reversed orientation.
- Keywords.
- Upright meaning.
- Reversed meaning.
- A short reading-style interpretation.

### Reset

After a card has been drawn, normal shuffle and draw gestures are paused. The app only listens for a reshuffle sequence: the user opens the palm, then makes a fist. This starts a smooth return animation: the current card flies back to its ring position, flips to the card back, and scales down to normal size before shuffle mode resumes. The visible reset button starts the same animation.

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
- Current scene mode: `loading`, `shuffle`, `ready_to_draw`, `drawing`, `revealed`, `returning`, `camera_error`.
- Revealed-state reshuffle sequence state.
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
- Detects a single extended index finger.
- Tracks fingertip offset relative to the mirrored camera view.
- Converts left and right pointing offsets into clockwise and counterclockwise shuffle events.
- Applies debounce and cooldown rules so one fist only stops the ring once.
- Emits stable gesture events.

### 3D Scene Module

Responsible for rendering and animation:

- Creates the Three.js renderer, camera, lights, and scene.
- Builds the tarot card ring.
- Updates ring rotation based on gesture velocity.
- Highlights the front-facing card.
- Runs draw, return-to-ring, and reset animations.
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

### Single Finger

The hand is treated as a pointing gesture when the index finger is extended and most other fingers are folded. The visible fingertip position drives shuffle direction:

- Left offset: counterclockwise shuffle.
- Right offset: clockwise shuffle.
- Centered: no added acceleration.

Pointing gestures also work after a fist has stopped the ring. In that ready-to-draw state, pointing left or right resumes shuffle mode instead of drawing.

### Open Palm

The hand is treated as open when most fingertips are extended away from the palm. Open palm triggers the draw after a fist has stopped the ring. In the revealed state, open palm arms the reshuffle sequence.

### Fist

The hand is treated as a fist when most fingertips are folded toward the palm. Fist detection stops the ring and enters the ready-to-draw state. In the revealed state, a fist returns the card to the ring only if an open palm was detected first. Fist detection must be debounced so one held fist does not repeatedly restart the stop or reshuffle action.

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
- Extending one finger left rotates the ring counterclockwise.
- Extending one finger right rotates the ring clockwise.
- Fist stops the ring without drawing.
- After the ring stops, extending one finger left or right resumes shuffle mode.
- Opening the palm after the ring stops draws exactly one card.
- Drawn card details render without overlapping UI.
- After reveal, normal gestures do not shuffle or draw.
- After reveal, open palm followed by fist starts a smooth return-to-ring animation and then resumes shuffle mode.
- Camera denied or unavailable state does not crash the app.

Automated tests can focus on pure logic:

- Gesture recognition helpers for open palm and fist thresholds.
- Single-finger detection and left/right offset thresholds.
- Tarot data shape validation.
- State transitions between `shuffle`, `ready_to_draw`, `drawing`, `revealed`, and `returning`.
- Revealed-state reshuffle sequence handling.

## Acceptance Criteria

- A user can open the local web app and grant camera access.
- The app recognizes real hand gestures through the webcam.
- The tarot card ring rotates counterclockwise when the user extends one finger left.
- The tarot card ring rotates clockwise when the user extends one finger right.
- A fist gesture stops the spinning ring.
- An open-palm gesture after stopping triggers a polished draw animation.
- The selected card reveals readable tarot details.
- After reveal, open palm followed by fist returns the current card to the ring with a smooth animation and then resumes shuffle mode.
- The app handles camera errors gracefully.
- The implementation remains frontend-only for the first version.
