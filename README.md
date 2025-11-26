# Function Guesser

Guess the hidden function from its graph. Use helper expressions to dissect the shape, tune coefficients, and submit your final equation.

## Stack
- Next.js (App Router), React, TypeScript, Tailwind classes
- MathJax for rendering LaTeX; mathjs for evaluation
- Desmos graphing embed (via loaded script)

## Quick Start
```
npm install
npm run dev   # uses Turbopack by default for faster refresh (experimental)
```
Open the printed localhost URL.

## Environment
Create `.env.local`:
```
SOLUTION_PASSWORD=aaa123!
NEXT_PUBLIC_DESMOS_API_KEY=5780c33dee3c4b838f3badff005147b8
DATABASE_URL="file:./prisma/dev.db"
APP_BASE_URL=http://localhost:3000
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=your-brevo-username
BREVO_PASS=your-brevo-password
MAIL_FROM_NAME="Function Guesser"
MAIL_FROM_EMAIL=no-reply@functionguesser.app
```
- `SOLUTION_PASSWORD` is read server-side by `/api/verify-solution`.
- `DATABASE_URL` points Prisma to the SQLite database used for accounts/sessions.
- `APP_BASE_URL` is used when generating email verification links.
- SMTP creds (`BREVO_*` / `MAIL_FROM_*`) are required to send verification emails for new accounts and email changes.
- The Desmos key must be client-exposed (required by their script) but is kept out of the repo via env.
- After updating env, run `npx prisma migrate dev --name init_auth && npx prisma generate` to create the database and Prisma client.

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
- Daily, weekly, and monthly challenge pages with fixed puzzles that reset on their schedule
- Leaderboard tab showing cumulative clears and streaks (daily/weekly/monthly/regular) for signed-in players

## Developer Solution Reveal
- “Show solution” prompts for the password.
- Verification happens server-side at `/api/verify-solution`.
- After a successful unlock, subsequent puzzles can be revealed without re-entering the password until the tab is reloaded.

## Notes
- `.env.local` is gitignored; set env vars in Vercel for deploys.
