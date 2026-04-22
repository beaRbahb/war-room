/** Quiplash prompts — one per draft slot, keyed by team.
 *  During the ~5-minute finalize dead time, users write answers
 *  to a team-specific prompt, then vote on the best one. */

interface QuiplashPrompt {
  slot: number;
  team: string;
  prompt: string | null; // null = skip this slot
}

const TEAM_PROMPTS: QuiplashPrompt[] = [
  /* pick  1 — LV  */ { slot: 1,  team: "LV",  prompt: "The Raiders' GM press conference opener in one sentence:" },
  /* pick  2 — NYJ */ { slot: 2,  team: "NYJ", prompt: "Write a Jets fan's first text to the group chat:" },
  /* pick  3 — ARI */ { slot: 3,  team: "ARI", prompt: "The Cardinals' leaked scouting report they don't want you to see:" },
  /* pick  4 — TEN */ { slot: 4,  team: "TEN", prompt: "Rate the Goodell handshake 1-10 and describe it:" },
  /* pick  5 — NYG */ { slot: 5,  team: "NYG", prompt: "The Giants subreddit, one sentence, right now:" },
  /* pick  6 — CLE */ { slot: 6,  team: "CLE", prompt: "This pick as a Yelp review of the Browns:" },
  /* pick  7 — WAS */ { slot: 7,  team: "WAS", prompt: "The Commanders did exactly what the mocks said. Group chat text:" },
  /* pick  8 — NO  */ { slot: 8,  team: "NO",  prompt: "Goodell's whisper handing over the Saints hat:" },
  /* pick  9 — KC  */ { slot: 9,  team: "KC",  prompt: "This pick as a Chiefs dating app bio:" },
  /* pick 10 — NYG */ { slot: 10, team: "NYG", prompt: "Orlovsky draws this pick on the whiteboard. What's on it?" },
  /* pick 11 — MIA */ { slot: 11, team: "MIA", prompt: "Kyle and Travis react to this pick. The Skodcast take:" },
  /* pick 12 — DAL */ { slot: 12, team: "DAL", prompt: "WalterFootball's grade for this pick in one sentence:" },
  /* pick 13 — LAR */ { slot: 13, team: "LAR", prompt: "How many of those high fives in the Rams' draft room were real?" },
  /* pick 14 — BAL */ { slot: 14, team: "BAL", prompt: "What did this player's mom just yell from the living room?" },
  /* pick 15 — TB  */ { slot: 15, team: "TB",  prompt: "This player's first tweet after going to Tampa:" },
  /* pick 16 — NYJ */ { slot: 16, team: "NYJ", prompt: "The Jets' GM right now, one honest sentence:" },
  /* pick 17 — DET */ { slot: 17, team: "DET", prompt: "This player's leaked scouting report the Lions don't want you to see:" },
  /* pick 18 — MIN */ { slot: 18, team: "MIN", prompt: "ESPN cuts to the Vikings' war room. Describe the scene:" },
  /* pick 19 — CAR */ { slot: 19, team: "CAR", prompt: "Breaking news chyron for this Panthers pick:" },
  /* pick 20 — DAL */ { slot: 20, team: "DAL", prompt: "The Cowboys — steal of the draft or bust of the decade?" },
  /* pick 21 — PIT */ { slot: 21, team: "PIT", prompt: "This player's Instagram caption tonight after going to Pittsburgh:" },
  /* pick 22 — LAC */ { slot: 22, team: "LAC", prompt: "Rate this Chargers pick as a meal. What did they order?" },
  /* pick 23 — PHI */ { slot: 23, team: "PHI", prompt: "Describe this Eagles pick as a dating app bio:" },
  /* pick 24 — CLE */ { slot: 24, team: "CLE", prompt: "Orlovsky stands up at the ESPN desk about this pick. He yells:" },
  /* pick 25 — CHI */ { slot: 25, team: "CHI", prompt: null }, // Bears Mode takeover
  /* pick 26 — BUF */ { slot: 26, team: "BUF", prompt: "WalterFootball didn't have this player in his top 50. Site update:" },
  /* pick 27 — SF  */ { slot: 27, team: "SF",  prompt: "Describe this 49ers handshake with Goodell in three words:" },
  /* pick 28 — HOU */ { slot: 28, team: "HOU", prompt: "This player's girlfriend on the split screen right now:" },
  /* pick 29 — KC  */ { slot: 29, team: "KC",  prompt: "Camera cuts to this player's living room. They knew. Describe the scene:" },
  /* pick 30 — MIA */ { slot: 30, team: "MIA", prompt: "Other 31 GMs group chat after this Dolphins pick:" },
  /* pick 31 — NE  */ { slot: 31, team: "NE",  prompt: "In 3 years, Patriots fans will call this pick:" },
  /* pick 32 — SEA */ { slot: 32, team: "SEA", prompt: null }, // Last pick, no dead time
];

/** Generic prompts used when a trade override changes the team for a slot */
const TRADE_WILDCARDS: string[] = [
  "The trade just went through. Write the ESPN breaking news alert:",
  "Both war rooms right now — describe the scene in one sentence:",
  "This trade as a movie tagline:",
  "Write the GM's honest text to his wife about this trade:",
  "The other 30 GMs' group chat reaction to this trade:",
];

/** Get the quiplash prompt for a pick slot.
 *  Returns null for skipped slots (pick 25 Bears, pick 32 last).
 *  Uses a random trade wildcard when the slot has a trade override. */
export function getQuiplashPrompt(
  slot: number,
  isTraded: boolean,
): string | null {
  const entry = TEAM_PROMPTS[slot - 1];
  if (!entry || entry.prompt === null) return null;

  if (isTraded) {
    // Deterministic per-slot: use slot number to pick a wildcard
    return TRADE_WILDCARDS[slot % TRADE_WILDCARDS.length];
  }

  return entry.prompt;
}
