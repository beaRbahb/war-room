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
  /* pick  1 — LV  */ { slot: 1,  team: "LV",  prompt: "Mark Davis's haircut reacted to Tom Brady's input on the Raiders pick by ___" },
  /* pick  2 — NYJ */ { slot: 2,  team: "NYJ", prompt: "Aaron Glenn's pitch to the new Jets pick: \"Year 2 under me will be different because ___\"" },
  /* pick  3 — ARI */ { slot: 3,  team: "ARI", prompt: "Michael Bidwill welcomed the new Cardinals pick by showing him the team's ___, which hasn't been upgraded since ___" },
  /* pick  4 — TEN */ { slot: 4,  team: "TEN", prompt: "Cam Ward welcomed the new Titans pick by showing him ___" },
  /* pick  5 — NYG */ { slot: 5,  team: "NYG", prompt: "John Harbaugh's first Giants pick celebration was noticeably less unhinged than ___" },
  /* pick  6 — CLE */ { slot: 6,  team: "CLE", prompt: "The Browns drafted this player specifically to distract from ___" },
  /* pick  7 — WAS */ { slot: 7,  team: "WAS", prompt: "Jayden Daniels's scouting report on the new Commanders pick: ___" },
  /* pick  8 — NO  */ { slot: 8,  team: "NO",  prompt: "To fit this pick under the cap, the Saints just restructured ___ through the year ___" },
  /* pick  9 — KC  */ { slot: 9,  team: "KC",  prompt: "The new Chiefs pick's first team meal with Andy Reid will be: ___" },
  /* pick 10 — NYG */ { slot: 10, team: "NYG", prompt: "The Giants traded Dexter Lawrence to get this pick. The voicemail he left them: ___" },
  /* pick 11 — MIA */ { slot: 11, team: "MIA", prompt: "With $175 million in dead cap, the Dolphins somehow still drafted ___ to replace ___" },
  /* pick 12 — DAL */ { slot: 12, team: "DAL", prompt: "Jerry Jones will sign a veteran free agent to pair with this pick in ___ (approximately 8 months too late)" },
  /* pick 13 — LAR */ { slot: 13, team: "LAR", prompt: "Les Snead, staring at his first-round pick like it's a foreign object, muttered ___" },
  /* pick 14 — BAL */ { slot: 14, team: "BAL", prompt: "Jesse Minter's pitch to Lamar Jackson about the new Ravens pick: ___" },
  /* pick 15 — TB  */ { slot: 15, team: "TB",  prompt: "Baker Mayfield, drunk on the podium at the welcome party, said \"___\"" },
  /* pick 16 — NYJ */ { slot: 16, team: "NYJ", prompt: "Aaron Glenn, with his SECOND first-round pick, just confidently announced ___" },
  /* pick 17 — DET */ { slot: 17, team: "DET", prompt: "Dan Campbell's welcome speech to the new Lion involved biting ___ and swallowing ___" },
  /* pick 18 — MIN */ { slot: 18, team: "MIN", prompt: "J.J. McCarthy has officially added ___ to his list of self-given nicknames" },
  /* pick 19 — CAR */ { slot: 19, team: "CAR", prompt: "David Tepper celebrated the pick by throwing ___ at ___" },
  /* pick 20 — DAL */ { slot: 20, team: "DAL", prompt: "With their second first-rounder, the Cowboys signaled they're serious about competing in ___" },
  /* pick 21 — PIT */ { slot: 21, team: "PIT", prompt: "Aaron Rodgers's official reason for not deciding on 2026 yet: ___" },
  /* pick 22 — LAC */ { slot: 22, team: "LAC", prompt: "Jim Harbaugh welcomed the new Charger with a firm handshake and the phrase \"___\"" },
  /* pick 23 — PHI */ { slot: 23, team: "PHI", prompt: "Howie Roseman nailed another pick. Nick Sirianni's first act with him was to ___" },
  /* pick 24 — CLE */ { slot: 24, team: "CLE", prompt: "The Jaguars, watching Cleveland use their pick, are currently ___" },
  /* pick 25 — CHI */ { slot: 25, team: "CHI", prompt: null }, // Bears Mode takeover
  /* pick 26 — BUF */ { slot: 26, team: "BUF", prompt: "The new Bills pick's orientation packet includes a mandatory viewing of ___" },
  /* pick 27 — SF  */ { slot: 27, team: "SF",  prompt: "Kyle Shanahan, who has publicly aged 10 years, reacted to this pick by aging ___" },
  /* pick 28 — HOU */ { slot: 28, team: "HOU", prompt: "C.J. Stroud's extension got ___ million more expensive the moment this pick was announced" },
  /* pick 29 — KC  */ { slot: 29, team: "KC",  prompt: "The new Chief's State Farm commercial, already filmed, features him doing \"___\"" },
  /* pick 30 — MIA */ { slot: 30, team: "MIA", prompt: "The Dolphins' second first-round pick will be listed as questionable with ___ by ___" },
  /* pick 31 — NE  */ { slot: 31, team: "NE",  prompt: "Mike Vrabel's message to the new Patriot, between hullabaloos: ___" },
  /* pick 32 — SEA */ { slot: 32, team: "SEA", prompt: null }, // Last pick, no dead time
];

/** Generic prompts used when a trade override changes the team for a slot */
const TRADE_WILDCARDS: string[] = [
  "The team that just traded up did it because they were scared ___ would draft ___ first",
  "Mel Kiper's reaction to this trade, in three words: ___, ___, ___",
  "The front office that just traded DOWN is cooking because ___",
  "ESPN's Adam Schefter broke this trade by tweeting \"___\" at ___ AM",
  "This trade only makes sense if you believe ___ is secretly ___",
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
