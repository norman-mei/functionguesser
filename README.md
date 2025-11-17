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

Open the printed localhost URL to play (Next.js app router).

### Environment
Create `.env.local` in the project root:
```
SOLUTION_PASSWORD=aaa123!
NEXT_PUBLIC_DESMOS_API_KEY=5780c33dee3c4b838f3badff005147b8
```
`SOLUTION_PASSWORD` is read server-side by the API route; the Desmos key is client-exposed (required by their script) but stays out of the repo via `.env.local`.

## Scripts
- `npm run dev` – start Next dev server.
- `npm run build` – production build.
- `npm run start` – run the production build locally.
- `npm run lint` – Next lint.
- `npm run typecheck` – type-check with `tsc --noEmit`.

## Developer Solution Reveal
- Clicking “Show solution (dev)” prompts for the password.
- The password is verified server-side at `/api/verify-solution`; it never ships to the client bundle.
- After a successful unlock, you can reveal solutions for subsequent puzzles without re-entering the password until you reload the tab.

## Notes
- `.env.local` and other env files are gitignored.
- Tech stack: React, TypeScript, Vite, Tailwind classes, mathjs, MathJax.
