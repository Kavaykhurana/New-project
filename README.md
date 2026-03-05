# Snake

Minimal classic Snake game built with Next.js 14, React, and Tailwind CSS.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If `3000` is already busy, Next.js will print the fallback port in the terminal.

## Scripts

- `npm run dev` starts the development server.
- `npm run test` runs the Snake logic tests.
- `npm run lint` runs the Next.js lint pass.
- `npm run build` creates a production build.

## Controls

- Arrow keys or `WASD`: move
- `Space`: start, pause, resume
- `R`: restart
- On-screen buttons: mobile/touch controls

## Behavior

- Fixed grid movement
- Food spawning away from the snake body
- Score and length tracking
- Wall and self-collision game-over
- Restart and pause/resume support
