# Function Guesser

Guess the hidden function from its graph. Use helper expressions to dissect the shape, tune coefficients, and submit your final equation.

## Stack
- Next.js (App Router), React, TypeScript, Tailwind classes
- MathJax for rendering LaTeX; mathjs for evaluation
- Desmos graphing embed (via loaded script)

## Quick Start
```
npm install
npm run dev
```
Open the printed localhost URL.

## Environment
Create `.env.local`:
```
SOLUTION_PASSWORD=aaa123!
NEXT_PUBLIC_DESMOS_API_KEY=5780c33dee3c4b838f3badff005147b8
```
- `SOLUTION_PASSWORD` is read server-side by `/api/verify-solution`.
- The Desmos key must be client-exposed (required by their script) but is kept out of the repo via env.

## Scripts
- `npm run dev` – Next dev server
- `npm run build` – production build
- `npm run start` – run built app
- `npm run lint` – Next lint
- `npm run typecheck` – `tsc --noEmit`

## Gameplay Highlights
- Multiple difficulty buckets with auto-generated targets
- Helper expressions (Desmos-style) to compare and tune shapes
- Grid/axes/line-weight toggles; history to reload past puzzles

## Developer Solution Reveal
- “Show solution (dev)” prompts for the password.
- Verification happens server-side at `/api/verify-solution`.
- After a successful unlock, subsequent puzzles can be revealed without re-entering the password until the tab is reloaded.

## Notes
- `.env.local` is gitignored; set env vars in Vercel for deploys.
