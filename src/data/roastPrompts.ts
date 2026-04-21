import type { PickTag } from "../types";
import { TEAMS } from "./teams";

interface PromptTemplate {
  text: string;
  tag: PickTag;
}

const ROAST_PROMPTS: PromptTemplate[] = [
  // ── Chalk (predictable/boring energy) ──
  { tag: "chalk", text: "Everyone saw {player} to {team}. Write the most boring press conference quote." },
  { tag: "chalk", text: "{player} at #{pick} — even your dog saw this coming. The real shock was:" },
  { tag: "chalk", text: "As {team}'s GM, give the most corporate non-answer about drafting {player}." },
  { tag: "chalk", text: "{team} did exactly what everyone expected. How does the GM celebrate?" },
  { tag: "chalk", text: "Write {player}'s first text to his agent after going #{pick} to {team}." },
  { tag: "chalk", text: "This pick was so predictable that:" },
  { tag: "chalk", text: "Mel Kiper saw {player} to {team} coming from a mile away. His real hot take:" },
  { tag: "chalk", text: "{team} went chalk with {player}. What did the war room whiteboard say?" },
  { tag: "chalk", text: "Zero surprises. Write the ESPN bottom line scroll for {player} to {team}." },
  { tag: "chalk", text: "Draft {player}'s Wikipedia edit after going #{pick} to {team}." },

  // ── Regular (general roast energy) ──
  { tag: "regular", text: "Draft {player}'s first tweet after being picked #{pick} by {team}." },
  { tag: "regular", text: "One sentence: why will {team} regret this pick in 3 years?" },
  { tag: "regular", text: "Describe this pick using only a movie title." },
  { tag: "regular", text: "Write the text {team}'s GM just sent to his wife about {player}." },
  { tag: "regular", text: "{player} to {team}. What's the one thing Goodell whispered at the podium?" },
  { tag: "regular", text: "Give {player} a nickname that {team} fans will use by Week 3." },
  { tag: "regular", text: "Write the honest scouting report on {player} that {team} doesn't want leaked." },
  { tag: "regular", text: "{team} picks {player} at #{pick}. One-sentence fan reaction from the subreddit." },
  { tag: "regular", text: "If this pick was a restaurant review, it would say:" },
  { tag: "regular", text: "Write {team}'s honest Glassdoor review after drafting {player}." },

  // ── Shocking (WTF energy) ──
  { tag: "shocking", text: "{team} just shocked the world. What is the GM actually thinking right now?" },
  { tag: "shocking", text: "Write the text {team}'s GM just sent after picking {player} at #{pick}." },
  { tag: "shocking", text: "ESPN just cut to {team}'s draft room. Describe the scene in one sentence." },
  { tag: "shocking", text: "{player} at #{pick}?! Write the 911 call from a {team} fan." },
  { tag: "shocking", text: "What is {team}'s GM going to tell the owner tomorrow morning?" },
  { tag: "shocking", text: "Write the headline ESPN is running right now about {player} to {team}." },
  { tag: "shocking", text: "{team} went full chaos. Describe the GM's browser history from last night." },
  { tag: "shocking", text: "The other 31 GMs just saw {player} go #{pick}. Group chat message:" },
  { tag: "shocking", text: "Write the apology letter {team}'s GM owes the fan base." },
  { tag: "shocking", text: "Breaking: {team} takes {player} at #{pick}. Write the first reply on X." },
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
