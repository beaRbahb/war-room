# War Room — NFL Draft Companion App

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4 (utility classes only, dark mode only)
- **Backend**: Firebase Realtime DB (real-time listeners, no polling)
- **Routing**: React Router v7
- **Deploy**: Netlify

## Dev Commands
```bash
npm run dev      # Start local dev server
npm run build    # Production build
npm run lint     # ESLint check
```

## Design System
- **Theme**: Bloomberg Terminal × Tecmo Bowl
- **Colors**: See `src/index.css` @theme block
- **Typography**: JetBrains Mono (scores), Bebas Neue (display), Barlow Condensed (labels), Inter (body)
- **Dark mode only** — no light mode toggle

## Key Files
- `src/data/prospects.ts` — 71 consensus prospects
- `src/data/draftOrder.ts` — 2026 Round 1 draft order (Bears #25)
- `src/data/bearsTiers.ts` — Bears historical tier comps
- `src/data/scoring.ts` — Scoring rules and constants
- `src/lib/firebase.ts` — Firebase init
- `src/lib/storage.ts` — All Firebase RTDB read/write/subscribe functions
- `src/lib/session.ts` — localStorage session management
- `src/types/index.ts` — All TypeScript types

## Conventions
- Screens in `src/screens/`, components in `src/components/`
- All storage keys scoped to room code: `rooms/{code}/...`
- Commissioner is whoever created the room (permanent)
- No auth — room code + name only
- Bears-centric: special Bears mode, confetti, tier comps

## Firebase Schema
```
rooms/{code}/config     — RoomConfig
rooms/{code}/users/{id} — RoomUser
rooms/{code}/brackets/{userName} — UserBracket
rooms/{code}/live       — LiveState
rooms/{code}/live_guesses/pick{N}/{userName} — string (player name)
rooms/{code}/results/pick{N} — ConfirmedPick
rooms/{code}/reactions/pick{N}/{userName} — UserReaction
rooms/{code}/scores/{userName} — UserScores
```
