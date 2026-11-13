# Chess Starter — Learn & Play

A beginner-friendly React chess app. It includes:
- A guided five-step opening lesson.
- A legal-move chessboard (powered by `chess.js`).
- Free Play for two people sharing one device.
- Legal destination highlights, undo, restart, check/checkmate status, and pawn promotion.
- A short visual guide to all six chess pieces.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Build for deployment

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Notes

- Free Play is local two-player mode (White and Black take turns on the same board); it does not include a computer opponent.
- In Guided Lesson, making a move other than the suggested move switches to Free Play so beginners can experiment without being blocked.
