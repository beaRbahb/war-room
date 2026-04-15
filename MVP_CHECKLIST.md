# War Room — MVP Checklist

## Phase 4: Scaffold ✅
- [x] Vite + React + TS project
- [x] Tailwind CSS v4 configured
- [x] Firebase SDK installed
- [x] React Router configured
- [x] Design system tokens in CSS
- [x] Google Fonts loaded (JetBrains Mono, Bebas Neue, Barlow Condensed, Inter)
- [x] Data constants (71 prospects, 32-slot draft order, Bears tiers, scoring rules)
- [x] TypeScript types for all data models
- [x] Firebase storage layer (all CRUD + real-time listeners)
- [x] Session management (localStorage)
- [x] Placeholder screens with routing
- [x] Build passes

## Phase 5: Wireframe Pass
- [x] Join/Create Room screen (functional)
- [x] Bracket screen (functional: select players, submit, countdown, reference panel)
- [ ] Live Draft screen — pick feed layout
- [ ] Live Draft screen — pick window popup (60s countdown)
- [ ] Live Draft screen — commissioner overlay
- [ ] Leaderboard panel (sidebar desktop, bottom sheet mobile)
- [ ] Reactions UI (5 reaction buttons per pick)
- [ ] Bears mode trigger detection

## Phase 6: Styled Build
- [ ] Join screen — Tecmo Bowl title treatment
- [ ] Bracket screen — polished select dropdowns, mobile drawer
- [ ] Live pick feed — card design with reactions + scores
- [ ] Pick window popup — pulsing border, countdown, flash-red at 10s
- [ ] Commissioner panel — amber-bordered floating panel
- [ ] Leaderboard — score flip animation, toggle bracket/live
- [ ] Reaction buttons — styled with emoji + labels
- [ ] Bears mode — full-screen navy/orange flash + "DA BEARS" animation
- [ ] Confetti — navy + orange confetti on correct pick
- [ ] Pick reveal — 1.5s dramatic pause animation

## Phase 7: Integration
- [ ] Firebase Realtime DB connected (needs Firebase project + .env.local)
- [ ] Room create/join flow end-to-end
- [ ] Bracket save/load/lock
- [ ] Commissioner: open window → all users see popup
- [ ] Commissioner: enter pick → reveal + scoring
- [ ] Commissioner: mark trade → freeze slot
- [ ] Live guess submission (blind, count only shown)
- [ ] Bracket scoring on each confirmed pick
- [ ] Live scoring on each confirmed pick
- [ ] Reactions save + aggregate display
- [ ] Bears tier comps (on Bears picks)
- [ ] CSV export from leaderboard
- [ ] Rejoin flow (name + room code match)

## Phase 8: Ship
- [ ] Netlify deployment
- [ ] Firebase security rules
- [ ] Mobile responsive testing
- [ ] Edge case testing (full room, late joiner, trade limbo, etc.)
