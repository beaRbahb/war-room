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

### Data (all in `src/data/`)
- `prospects.ts` — 71 consensus prospects. Top 32 enriched with height, weight, age, RAS, pro comp, scouting note.
- `prospectOdds.ts` — Vegas odds per slot (SLOT_ODDS) + ESPN Analytics pick probabilities per player per slot (PICK_PROBS, source: ESPN Draft Predictor April 2026). Name mapping: ESPN uses "Rueben Bain Jr." / "KC Concepcion" / "CJ Allen" / "DAngelo Ponds" / "Chris Brazzell II" → mapped to our names.
- `draftOrder.ts` — 2026 Round 1 draft order (Bears #25). Includes trade flags + trade notes for picks 12/13/15/16/20/26.
- `teamNeeds.ts` — Positional needs per team (keyed by abbrev). Sources: nfl.com (picks 1-7), espn (picks 8-32).
- `teams.ts` — NFL team logos from ESPN CDN, keyed by abbreviation (32 teams).
- `colleges.ts` — College logos from ESPN CDN (39 schools). Not yet wired into UI.
- `bearsTiers.ts` — Bears historical tier comps (not yet wired).
- `scoring.ts` — Scoring rules and constants.

### Lib (all in `src/lib/`)
- `firebase.ts` — Firebase init
- `storage.ts` — All Firebase RTDB read/write/subscribe functions
- `session.ts` — localStorage session management
- `headshots.ts` — Maps prospect names → webp images via import.meta.glob. ~49 headshots in `src/assets/images/`.
- `scoring.ts` — Score calculation logic

### Components (all in `src/components/`)
- `PlayerSelectionPanel.tsx` — Rich player picker (side panel desktop, full sheet mobile). Shows headshot, measurables, pro comp, scouting note, ESPN pick probability, reach/value badge, team needs match, chalk pick indicator. Search + position filter + sort (rank/value/need).
- `BearsMode.tsx`, `Confetti.tsx`, `CommissionerPanel.tsx`, `Leaderboard.tsx`, `PickCard.tsx`, `PickWindow.tsx` — placeholder/partial components for Phase 5-6.

### Screens (all in `src/screens/`)
- `JoinScreen.tsx` — Room create/join (functional wireframe)
- `BracketScreen.tsx` — 32-pick bracket grid with inline stats (consensus rank, ESPN prob, reach/value, need, pro comp, team logo, trade badge). Clicking a row opens PlayerSelectionPanel.
- `LiveDraftScreen.tsx` — Placeholder, not yet wireframed.
- `RoomRouter.tsx` — Routes between screens based on room status.

### Scripts
- `scripts/espn_fetch.py` — Python scraper for ESPN Draft Predictor probabilities.

## Types
- `src/types/index.ts` — All TypeScript types

## Conventions
- Screens in `src/screens/`, components in `src/components/`
- All storage keys scoped to room code: `rooms/{code}/...`
- Commissioner is whoever created the room (permanent)
- No auth — room code + name only
- Bears-centric: special Bears mode, confetti, tier comps

## Build Status
- **Phase 4 (Scaffold)**: Complete
- **Phase 5 (Wireframe)**:
  - Join/Create screen: Done
  - Bracket screen + PlayerSelectionPanel: Done
  - Live Draft screen: Done
  - Leaderboard, Reactions, Bears mode: Not started
- **Phase 6 (Styled Build)**: Complete
- **Phase 7 (Integration)**: Complete — Firebase project `war-room-f1fc5` connected
- **Phase 8 (Ship)**: Not started

## Firebase Schema
```
rooms/{code}/config     — RoomConfig
rooms/{code}/users/{id} — RoomUser
rooms/{code}/brackets/{userName} — UserBracket
rooms/{code}/live       — LiveState
rooms/{code}/live_guesses/pick{N}/{userName} — string (player name)
rooms/{code}/results/pick{N} — ConfirmedPick
rooms/{code}/reactions/pick{N}/{userName} — UserReaction
rooms/{code}/wagers/pick{N}/{userName} — Wager
rooms/{code}/scores/{userName} — UserScores
```
