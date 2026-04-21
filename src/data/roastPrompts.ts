import type { PickTag } from "../types";
import { TEAMS } from "./teams";

/** Per-pick prompt assignments — one prompt per chaos level per pick.
 *  Edit these to tailor prompts to each team's draft slot.
 *  Placeholders: {player}, {team}, {pick}, {position} */
interface PickPrompts {
  chalk: string;
  regular: string;
  shocking: string;
}

const PICK_PROMPTS: PickPrompts[] = [
  /* pick  1 — LV  */ {
    chalk: "{player} at #{pick} — {team}'s GM press conference opener:",
    regular: "{player}'s first tweet after going #{pick} to {team}:",
    shocking: "{player} at #{pick}?! First reply on X:",
  },
  /* pick  2 — NYJ */ {
    chalk: "Mel Kiper on {player} at #{pick} — one sentence:",
    regular: "{player} to {team} as a movie title:",
    shocking: "{team}'s GM right now, one honest sentence:",
  },
  /* pick  3 — ARI */ {
    chalk: "Camera cuts to {player}'s living room. They knew. Describe the scene:",
    regular: "{player}'s leaked scouting report that {team} doesn't want you to see:",
    shocking: "Other 31 GMs group chat after {player} at #{pick}:",
  },
  /* pick  4 — TEN */ {
    chalk: "{player}'s hug with Goodell — rate it 1-10 and describe:",
    regular: "{player}'s {team} nickname by Week 3:",
    shocking: "ESPN cuts to {team}'s war room. Describe the scene:",
  },
  /* pick  5 — NYG */ {
    chalk: "{player}'s first thought crossing the stage to {team}:",
    regular: "{team} subreddit, one sentence, right now:",
    shocking: "Breaking news chyron for {player} to {team} at #{pick}:",
  },
  /* pick  6 — CLE */ {
    chalk: "ESPN ticker for {player} to {team}:",
    regular: "{player} to {team} as a Yelp review:",
    shocking: "{player} to {team} — steal of the draft or bust of the decade?",
  },
  /* pick  7 — WAS */ {
    chalk: "{team} did exactly what the mocks said. Group chat text:",
    regular: "{player}'s Instagram caption tonight:",
    shocking: "{team}'s owner's face as an emoji. Explain:",
  },
  /* pick  8 — NO  */ {
    chalk: "Your face when {player}'s name was called for {team}:",
    regular: "Goodell's whisper handing {player} the {team} hat:",
    shocking: "In 3 years, {team} fans will call this pick:",
  },
  /* pick  9 — KC  */ {
    chalk: "Rate {player} to {team} as a meal. What did they order?",
    regular: "{player} to {team} as a dating app bio:",
    shocking: "{player} at #{pick}. Genius or chaos? One sentence:",
  },
  /* pick 10 — NYG (via CIN) */ {
    chalk: "Orlovsky draws {player} to {team} on the whiteboard. What's on it?",
    regular: "Orlovsky stands up at the ESPN desk. About {player} to {team} he yells:",
    shocking: "Orlovsky runs out the back of the studio. His {player} at #{pick} take:",
  },
  /* pick 11 — MIA */ {
    chalk: "Kyle and Travis react to {player} at #{pick}. The Skodcast take:",
    regular: "Kyle and Travis on {player} to {team}. Who's more fired up and why?",
    shocking: "Kyle and Travis on {player} at #{pick}. Who's screaming louder?",
  },
  /* pick 12 — DAL */ {
    chalk: "WalterFootball had this mocked for months. His victory lap:",
    regular: "WalterFootball's grade for {player} to {team}:",
    shocking: "WalterFootball didn't have {player} in his top 50. Site update:",
  },
  /* pick 13 — LAR (via ATL) */ {
    chalk: "{player} to {team}. One word reaction:",
    regular: "Describe {player}'s Goodell handshake in three words:",
    shocking: "How many of those high fives in {team}'s draft room were real?",
  },
  /* pick 14 — BAL */ {
    chalk: "{player} at #{pick} — {team}'s GM press conference opener:",
    regular: "What did {player}'s mom just yell from the living room?",
    shocking: "{player}'s girlfriend on the split screen right now:",
  },
  /* pick 15 — TB  */ {
    chalk: "Mel Kiper on {player} at #{pick} — one sentence:",
    regular: "{player}'s first tweet after going #{pick} to {team}:",
    shocking: "{player} at #{pick}?! First reply on X:",
  },
  /* pick 16 — NYJ (via IND) */ {
    chalk: "Camera cuts to {player}'s living room. They knew. Describe the scene:",
    regular: "{player} to {team} as a movie title:",
    shocking: "{team}'s GM right now, one honest sentence:",
  },
  /* pick 17 — DET */ {
    chalk: "{player}'s hug with Goodell — rate it 1-10 and describe:",
    regular: "{player}'s leaked scouting report that {team} doesn't want you to see:",
    shocking: "Other 31 GMs group chat after {player} at #{pick}:",
  },
  /* pick 18 — MIN */ {
    chalk: "{player}'s first thought crossing the stage to {team}:",
    regular: "{player}'s {team} nickname by Week 3:",
    shocking: "ESPN cuts to {team}'s war room. Describe the scene:",
  },
  /* pick 19 — CAR */ {
    chalk: "ESPN ticker for {player} to {team}:",
    regular: "{team} subreddit, one sentence, right now:",
    shocking: "Breaking news chyron for {player} to {team} at #{pick}:",
  },
  /* pick 20 — DAL (via GB) */ {
    chalk: "{team} did exactly what the mocks said. Group chat text:",
    regular: "{player} to {team} as a Yelp review:",
    shocking: "{player} to {team} — steal of the draft or bust of the decade?",
  },
  /* pick 21 — PIT */ {
    chalk: "Your face when {player}'s name was called for {team}:",
    regular: "{player}'s Instagram caption tonight:",
    shocking: "{team}'s owner's face as an emoji. Explain:",
  },
  /* pick 22 — LAC */ {
    chalk: "Rate {player} to {team} as a meal. What did they order?",
    regular: "Goodell's whisper handing {player} the {team} hat:",
    shocking: "In 3 years, {team} fans will call this pick:",
  },
  /* pick 23 — PHI */ {
    chalk: "Orlovsky draws {player} to {team} on the whiteboard. What's on it?",
    regular: "{player} to {team} as a dating app bio:",
    shocking: "{player} at #{pick}. Genius or chaos? One sentence:",
  },
  /* pick 24 — CLE (via JAX) */ {
    chalk: "Kyle and Travis react to {player} at #{pick}. The Skodcast take:",
    regular: "Orlovsky stands up at the ESPN desk. About {player} to {team} he yells:",
    shocking: "Orlovsky runs out the back of the studio. His {player} at #{pick} take:",
  },
  /* pick 25 — CHI (Bears-specific prompt handled separately) */ {
    chalk: "Which Ryan Poles are you right now?",
    regular: "Which Ryan Poles are you right now?",
    shocking: "Which Ryan Poles are you right now?",
  },
  /* pick 26 — BUF */ {
    chalk: "WalterFootball had this mocked for months. His victory lap:",
    regular: "WalterFootball's grade for {player} to {team}:",
    shocking: "WalterFootball didn't have {player} in his top 50. Site update:",
  },
  /* pick 27 — SF  */ {
    chalk: "{player} to {team}. One word reaction:",
    regular: "Describe {player}'s Goodell handshake in three words:",
    shocking: "How many of those high fives in {team}'s draft room were real?",
  },
  /* pick 28 — HOU */ {
    chalk: "{player} at #{pick} — {team}'s GM press conference opener:",
    regular: "What did {player}'s mom just yell from the living room?",
    shocking: "{player}'s girlfriend on the split screen right now:",
  },
  /* pick 29 — KC (via LAR) */ {
    chalk: "Mel Kiper on {player} at #{pick} — one sentence:",
    regular: "{player}'s first tweet after going #{pick} to {team}:",
    shocking: "{player} at #{pick}?! First reply on X:",
  },
  /* pick 30 — MIA (via DEN) */ {
    chalk: "Camera cuts to {player}'s living room. They knew. Describe the scene:",
    regular: "{player} to {team} as a movie title:",
    shocking: "{team}'s GM right now, one honest sentence:",
  },
  /* pick 31 — NE  */ {
    chalk: "{player}'s hug with Goodell — rate it 1-10 and describe:",
    regular: "{player}'s leaked scouting report that {team} doesn't want you to see:",
    shocking: "Other 31 GMs group chat after {player} at #{pick}:",
  },
  /* pick 32 — SEA */ {
    chalk: "{player}'s first thought crossing the stage to {team}:",
    regular: "{player}'s {team} nickname by Week 3:",
    shocking: "ESPN cuts to {team}'s war room. Describe the scene:",
  },
];

/** Map chaos level to pick tag */
export function chaosLevelToTag(level: string): PickTag {
  if (level === "CHALK") return "chalk";
  if (level === "SPICY" || level === "CHAOS") return "shocking";
  return "regular"; // MILD
}

/** Get the assigned prompt for a specific pick and chaos level */
export function getPromptForPick(
  pick: number,
  tag: PickTag,
  ctx: { team: string; player: string; pick: number; position?: string },
): string {
  const prompts = PICK_PROMPTS[pick - 1];
  if (!prompts) return `${ctx.player} to ${ctx.team}. React:`;
  const template = prompts[tag];
  return interpolatePrompt(template, ctx);
}

/** Get short team name from abbreviation (e.g., "CHI" → "Bears") */
function getTeamName(abbrev: string): string {
  const full = TEAMS[abbrev]?.name;
  if (!full) return abbrev;
  const parts = full.split(" ");
  return parts[parts.length - 1];
}

/** Replace {team}, {player}, {pick}, {position} in a template */
export function interpolatePrompt(
  template: string,
  ctx: { team: string; player: string; pick: number; position?: string },
): string {
  return template
    .replace(/\{team\}/g, getTeamName(ctx.team))
    .replace(/\{player\}/g, ctx.player)
    .replace(/\{pick\}/g, String(ctx.pick))
    .replace(/\{position\}/g, ctx.position ?? "");
}
