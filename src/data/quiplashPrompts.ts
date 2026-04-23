/** Quiplash prompts — one per draft slot, keyed by team.
 *  During the ~4-minute finalize dead time, users write answers
 *  to a team-specific prompt, then vote on the best one.
 *  Updated for 2026 NFL Draft (April 23, 2026). */

interface QuiplashPrompt {
  slot: number;
  team: string;
  prompt: string | null; // null = skip this slot
}

const TEAM_PROMPTS: QuiplashPrompt[] = [
  /* pick  1 — LV  */ { slot: 1,  team: "LV",  prompt: "Fernando Mendoza's first linkedin post is: \"___\"" },
  /* pick  2 — NYJ */ { slot: 2,  team: "NYJ", prompt: "Aaron Glenn's pitch to the new Jets pick: \"Year 2 under me will be different because ___\"" },
  /* pick  3 — ARI */ { slot: 3,  team: "ARI", prompt: "Michael Bidwill welcomed the new Cardinals pick by showing him the team's ___, which hasn't been upgraded since ___" },
  /* pick  4 — TEN */ { slot: 4,  team: "TEN", prompt: "The new Titans pick tried on the Oilers-throwback jersey and asked \"___\"" },
  /* pick  5 — NYG */ { slot: 5,  team: "NYG", prompt: "Jaxon Dart — or was it Cam Skattebo — freshly concussed, welcomed the new Giants pick by shouting \"___\"" },
  /* pick  6 — CLE */ { slot: 6,  team: "CLE", prompt: "The Browns drafted this player specifically to distract from ___" },
  /* pick  7 — WAS */ { slot: 7,  team: "WAS", prompt: "Dan Snyder, from his exile yacht, reacted to the Commanders pick with \"___\"" },
  /* pick  8 — NO  */ { slot: 8,  team: "NO",  prompt: "The new Saint's first Louisiana meal was explained to him as \"it's basically ___ but wit___\"" },
  /* pick  9 — KC  */ { slot: 9,  team: "KC",  prompt: "The new Chiefs pick's first team meal with Andy Reid will be: ___" },
  /* pick 10 — NYG */ { slot: 10, team: "NYG", prompt: "Dexter Lawrence's voicemail to his old Giants teammates after seeing the Bengals pick: \"___\"" },
  /* pick 11 — MIA */ { slot: 11, team: "MIA", prompt: "The new Dolphin walked into an empty Dolphins locker room. The only thing left from the previous era was ___" },
  /* pick 12 — DAL */ { slot: 12, team: "DAL", prompt: "What Jerry Jones scribbled in his notebook right before making this pick: ___" },
  /* pick 13 — LAR */ { slot: 13, team: "LAR", prompt: "Les Snead, staring at his first-round pick like it's a foreign object, muttered ___" },
  /* pick 14 — BAL */ { slot: 14, team: "BAL", prompt: "Jesse Minter's pitch to Lamar Jackson about the new Ravens pick: ___" },
  /* pick 15 — TB  */ { slot: 15, team: "TB",  prompt: "Baker Mayfield, drunk on the podium at the welcome party, said \"___\"" },
  /* pick 16 — NYJ */ { slot: 16, team: "NYJ", prompt: "Aaron Glenn, with his SECOND first-round pick, just confidently announced ___" },
  /* pick 17 — DET */ { slot: 17, team: "DET", prompt: "Dan Campbell's introduction speech to the new Lion: \"___\"" },
  /* pick 18 — MIN */ { slot: 18, team: "MIN", prompt: "Kyler Murray, mid-Call-of-Duty match, reacted to the Vikings pick by yelling \"___\"" },
  /* pick 19 — CAR */ { slot: 19, team: "CAR", prompt: "David Tepper celebrated the pick by throwing ___ at ___" },
  /* pick 20 — DAL */ { slot: 20, team: "DAL", prompt: "With their second first-rounder, the Cowboys are one step closer to their decades-long goal of ___" },
  /* pick 21 — PIT */ { slot: 21, team: "PIT", prompt: "Aaron Rodgers's official reason for not deciding on 2026 yet: ___" },
  /* pick 22 — LAC */ { slot: 22, team: "LAC", prompt: "Jim Harbaugh welcomed the new Charger with a firm handshake and the phrase \"___\"" },
  /* pick 23 — PHI */ { slot: 23, team: "PHI", prompt: "Howie Roseman nailed another pick. Nick Sirianni's first act with him was to ___" },
  /* pick 24 — CLE */ { slot: 24, team: "CLE", prompt: "The Jaguars, watching Cleveland use their pick, are currently ___" },
  /* pick 25 — CHI */ { slot: 25, team: "CHI", prompt: null }, // Bears Mode takeover
  /* pick 26 — BUF */ { slot: 26, team: "BUF", prompt: "The Bills front office swears THIS first-rounder will be the one that finally beats the Chiefs because ___" },
  /* pick 27 — SF  */ { slot: 27, team: "SF",  prompt: "Kyle Shanahan, who has publicly aged 10 years, reacted to this pick by aging ___" },
  /* pick 28 — HOU */ { slot: 28, team: "HOU", prompt: "The new Texan's welcome letter from Cal McNair ended with the bold promise: \"Together we will ___\"" },
  /* pick 29 — KC  */ { slot: 29, team: "KC",  prompt: "The new Chief's State Farm commercial, already filmed, features him doing \"___\"" },
  /* pick 30 — MIA */ { slot: 30, team: "MIA", prompt: "The Dolphins' second first-round pick will be listed as questionable with ___ by ___" },
  /* pick 31 — NE  */ { slot: 31, team: "NE",  prompt: "When cameras zoomed in on Mike Vrabel's phone during the draft, his lockscreen photo was ___" },
  /* pick 32 — SEA */ { slot: 32, team: "SEA", prompt: null }, // Last pick, no dead time
];

/** Generic prompts used when a trade override changes the team for a slot */
const TRADE_WILDCARDS: string[] = [
  "The phone call that started this trade began with \"___\"",
  "Mel Kiper's reaction to this trade, in three words: ___, ___, ___",
  "In 5 years, this trade will be called \"The ___ Trade\" and someone will have been fired over it",
  "Ian Rapoport's tweet announcing this trade: \"___\"",
];

/** Get the quiplash prompt for a pick slot.
 *  Returns null for skipped slots (pick 25 Bears).
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
