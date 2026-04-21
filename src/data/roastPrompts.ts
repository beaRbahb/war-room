import type { PickTag } from "../types";
import { TEAMS } from "./teams";

interface PromptTemplate {
  text: string;
  tag: PickTag;
}

const ROAST_PROMPTS: PromptTemplate[] = [
  // ── Chalk (predictable energy — could be relief or boredom) ──
  { tag: "chalk", text: "{player} to {team}. One word reaction:" },
  { tag: "chalk", text: "{player} at #{pick} — {team}'s GM press conference opener:" },
  { tag: "chalk", text: "Your face when {player}'s name was called for {team}:" },
  { tag: "chalk", text: "{team} did exactly what the mocks said. Group chat text:" },
  { tag: "chalk", text: "ESPN ticker for {player} to {team}:" },
  { tag: "chalk", text: "{player}'s first thought crossing the stage to {team}:" },
  { tag: "chalk", text: "Mel Kiper on {player} at #{pick} — one sentence:" },
  { tag: "chalk", text: "Rate {player} to {team} as a meal. What did they order?" },
  { tag: "chalk", text: "Orlovsky draws {player} to {team} on the whiteboard. What's on it?" },
  { tag: "chalk", text: "Kyle and Travis react to {player} at #{pick}. The Skodcast take:" },
  { tag: "chalk", text: "WalterFootball had this mocked for months. His victory lap:" },
  { tag: "chalk", text: "Camera cuts to {player}'s living room. They knew. Describe the scene:" },
  { tag: "chalk", text: "{player}'s hug with Goodell — rate it 1-10 and describe:" },

  // ── Regular (general energy — no surprise factor implied) ──
  { tag: "regular", text: "{player}'s first tweet after going #{pick} to {team}:" },
  { tag: "regular", text: "{player} to {team} as a movie title:" },
  { tag: "regular", text: "{player}'s leaked scouting report that {team} doesn't want you to see:" },
  { tag: "regular", text: "{player}'s {team} nickname by Week 3:" },
  { tag: "regular", text: "{team} subreddit, one sentence, right now:" },
  { tag: "regular", text: "{player} to {team} as a Yelp review:" },
  { tag: "regular", text: "{player}'s Instagram caption tonight:" },
  { tag: "regular", text: "Goodell's whisper handing {player} the {team} hat:" },
  { tag: "regular", text: "{player} to {team} as a dating app bio:" },
  { tag: "regular", text: "Orlovsky stands up at the ESPN desk. About {player} to {team} he yells:" },
  { tag: "regular", text: "Kyle and Travis on {player} to {team}. Who's more fired up and why?" },
  { tag: "regular", text: "WalterFootball's grade for {player} to {team}:" },
  { tag: "regular", text: "Describe {player}'s Goodell handshake in three words:" },
  { tag: "regular", text: "What did {player}'s mom just yell from the living room?" },

  // ── Shocking (WTF energy — could be genius or madness) ──
  { tag: "shocking", text: "{player} at #{pick}?! First reply on X:" },
  { tag: "shocking", text: "{team}'s GM right now, one honest sentence:" },
  { tag: "shocking", text: "Other 31 GMs group chat after {player} at #{pick}:" },
  { tag: "shocking", text: "ESPN cuts to {team}'s war room. Describe the scene:" },
  { tag: "shocking", text: "Breaking news chyron for {player} to {team} at #{pick}:" },
  { tag: "shocking", text: "{player} to {team} — steal of the draft or bust of the decade?" },
  { tag: "shocking", text: "{team}'s owner's face as an emoji. Explain:" },
  { tag: "shocking", text: "In 3 years, {team} fans will call this pick:" },
  { tag: "shocking", text: "{player} at #{pick}. Genius or chaos? One sentence:" },
  { tag: "shocking", text: "Orlovsky runs out the back of the studio. His {player} at #{pick} take:" },
  { tag: "shocking", text: "Kyle and Travis on {player} at #{pick}. Who's screaming louder?" },
  { tag: "shocking", text: "WalterFootball didn't have {player} in his top 50. Site update:" },
  { tag: "shocking", text: "How many of those high fives in {team}'s draft room were real?" },
  { tag: "shocking", text: "{player}'s girlfriend on the split screen right now:" },
];

/** Map chaos level to pick tag */
export function chaosLevelToTag(level: string): PickTag {
  if (level === "CHALK") return "chalk";
  if (level === "SPICY" || level === "CHAOS") return "shocking";
  return "regular"; // MILD
}

/** Get a random prompt for the given tag, excluding a specific index */
export function getRandomPrompt(tag: PickTag, excludeIndex?: number): { text: string; index: number } {
  const matching = ROAST_PROMPTS
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.tag === tag && p.index !== excludeIndex);
  const pick = matching[Math.floor(Math.random() * matching.length)];
  return { text: pick.text, index: pick.index };
}

/** Get short team name from abbreviation (e.g., "CHI" → "Bears") */
function getTeamName(abbrev: string): string {
  const full = TEAMS[abbrev]?.name;
  if (!full) return abbrev;
  // "Chicago Bears" → "Bears", "New York Giants" → "Giants"
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
