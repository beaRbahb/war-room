# War Room

**Real-time NFL Draft companion app for your group chat.**

Create a room, share the code, and compete with friends as the picks roll in on draft night. Fill out your mock draft bracket before the clock starts, then predict each live pick in real time. Bloomberg Terminal meets Tecmo Bowl.

## How It Works

**Pre-Draft: Fill Your Bracket**
Lock in your Round 1 mock draft before the first pick. The player selection panel shows ESPN pick probabilities, reach/value analysis, team needs, pro comps, and scouting notes — everything you need to make your call.

**Live Draft: Predict Each Pick**
Once the draft goes live, brackets lock and you switch to pick-by-pick predictions with a 60-second guess window. Correct live picks score 10 points (20 for Bears picks, obviously).

**React & Compete**
After each pick, rate the selection and see where you stack up on the live leaderboard. A chaos meter tracks how wild the draft is getting — from CHALK to full CHAOS. At the end, everyone gets a draft persona based on their prediction patterns.

## Features

- Real-time sync across all players (Firebase RTDB — no polling, no refresh)
- 71 consensus prospects with headshots, measurables, pro comps, and scouting notes
- ESPN Draft Predictor probabilities for every player × slot
- Vegas odds and team needs (sourced from NFL.com + ESPN)
- Chaos meter that scores how surprising each pick was
- Pick reactions and grading after every selection
- Draft personas assigned based on your prediction style
- Commissioner controls for advancing picks and managing the room
- Bears mode (confetti, double points, special overlays)
- Mobile-first, dark mode only

## Scoring

| Event | Points |
|---|---|
| Bracket: exact player + slot | 10 |
| Bracket: right player, wrong slot | 4 |
| Live pick: correct guess | 10 |
| Live pick: correct Bears guess | 20 |

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Firebase Realtime DB · React Router v7

## Setup

```bash
npm install
npm run dev
```

## License

MIT
