# Function Guesser

Small React + Vite app where you try to reconstruct a hidden function from its graph. Build helper expressions, tweak them with the graphing UI, and submit your best guess.

## Features
- Multiple difficulties with auto-generated target functions.
- Helper expressions (Desmos-style) to compare against the target.
- Live graph preview with grid/axes/line-weight toggles.
- History sidebar to revisit past puzzles.
- Developer-only solution reveal protected by a server-side password check.

## Getting Started
```bash
npm install
npm run dev
```

Open the printed localhost URL to play.

### Environment
Create `.env.local` in the project root:
```
SOLUTION_PASSWORD=aaa123!
```
For convenience in local dev, the server middleware also falls back to `aaa123!` if the env var is missing, but set the variable for production.

## Scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – production build.
- `npm run preview` – preview the production build locally.
- `npm run lint` – type-check with `tsc --noEmit`.

## Developer Solution Reveal
- Clicking “Show solution (dev)” prompts for the password.
- The password is verified server-side at `/api/verify-solution`; it never ships to the client bundle.
- After a successful unlock, you can reveal solutions for subsequent puzzles without re-entering the password until you reload the tab.

## Notes
- `.env.local` and other env files are gitignored.
- Tech stack: React, TypeScript, Vite, Tailwind classes, mathjs, MathJax.
