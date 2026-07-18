# Tarot Gesture Demo

A browser-based tarot card demo controlled by real hand gestures through the webcam. The scene renders a 3D tarot card ring, lets the user shuffle with one finger, stop with a fist, draw with an open palm, and return the revealed card with a reshuffle gesture.

## Features

- Full-screen 3D tarot card ring built with Three.js.
- Webcam hand tracking powered by MediaPipe Hand Landmarker.
- 78-card tarot deck with Chinese card details and upright/reversed meanings.
- Gesture-driven flow:
  - One finger left: counterclockwise shuffle.
  - One finger right: clockwise shuffle.
  - Fist: stop the ring.
  - Open palm after stopping: draw the selected card.
  - Open palm then fist after reveal: return the card to the ring and resume shuffling.
- Smooth draw and return-to-ring animations.
- Camera status panel and graceful camera error handling.

## Tech Stack

- Vite
- TypeScript
- Three.js
- MediaPipe Tasks Vision

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173/
```

Then click `启动摄像头` and allow camera access in the browser.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Gesture Guide

| State | Gesture | Action |
| --- | --- | --- |
| Shuffling | One finger left | Shuffle counterclockwise |
| Shuffling | One finger right | Shuffle clockwise |
| Shuffling | Fist | Stop the ring |
| Stopped | Open palm | Draw the selected card |
| Stopped | One finger left/right | Resume shuffling |
| Revealed | Open palm, then fist | Return the card and reshuffle |

## Notes

- Camera access requires a secure browser context. `localhost` works for development.
- Hand tracking quality depends on lighting, camera position, and keeping the hand clearly inside the camera frame.
- The first MediaPipe model load may take a moment depending on network conditions.
