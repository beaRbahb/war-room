# War Room Design System

## Theme: Bloomberg Terminal × Tecmo Bowl

## Colors
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0a0a0a` | Near-black background |
| `surface` | `#111111` | Card/panel background |
| `surface-elevated` | `#1a1a1a` | Elevated surfaces (modals, dropdowns) |
| `border` | `#222222` | Subtle borders |
| `border-bright` | `#333333` | Highlighted borders |
| `amber` | `#f5a623` | Primary accent, scoreboard energy |
| `amber-dim` | `#7a5010` | Muted amber |
| `bears-navy` | `#0b1f4a` | Bears navy |
| `bears-orange` | `#e87722` | Bears orange |
| `green` | `#00ff41` | Correct pick (matrix energy) |
| `red` | `#ff2233` | Wrong / danger / countdown flash |
| `white` | `#e8e8e8` | Primary text |
| `muted` | `#555555` | Secondary text |

## Typography
| Role | Font | Tailwind Class |
|---|---|---|
| Scores/numbers | JetBrains Mono | `font-mono` |
| Display/titles | Bebas Neue | `font-display` |
| Labels/UI | Barlow Condensed | `font-condensed` |
| Body | Inter | `font-body` |

## Font Loading
Google Fonts loaded in `index.html`:
- JetBrains Mono (400, 700)
- Bebas Neue (400)
- Barlow Condensed (400, 600, 700)
- Inter (400, 500, 600)

## Animations
| Class | Effect | Duration |
|---|---|---|
| `animate-pulse-border` | Pulsing amber border | 1.5s loop |
| `animate-flash-red` | Red background flash | 0.5s loop |
| `animate-bears-flash` | Navy→orange→navy flash | 0.6s × 3 |
| `animate-score-flip` | Scoreboard number flip | 0.4s |
| `animate-fade-in-up` | Fade in + slide up | 0.3s |

## Component Patterns
- **Cards**: `bg-surface border border-border rounded-lg p-4`
- **Inputs**: `bg-bg border border-border rounded px-3 py-2 text-white font-mono text-sm focus:border-amber focus:outline-none`
- **Primary button**: `bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-2.5 rounded`
- **Secondary button**: `bg-surface-elevated border border-border text-white font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:border-amber`

## Layout
- **Desktop**: Side panel (leaderboard/reference) on right, 288px wide
- **Mobile**: Single column, bottom sheets for panels
- **Header**: Sticky, `bg-surface border-b border-border`
- **Max content width**: None (full bleed for draft experience)

## Spacing
- Use Tailwind's default scale
- Cards: `p-4` or `p-6`
- Section gaps: `gap-4` or `space-y-4`
- Tight lists: `space-y-1` or `space-y-0.5`
