import { PROSPECTS } from "../data/prospects";

const ESPN_DRAFT_URL =
  "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/draft?season=2026&region=us&lang=en";

/** ESPN displayName → prospects.ts name for known mismatches */
const ESPN_NAME_OVERRIDES: Record<string, string> = {
  "Rueben Bain Jr.": "Rueben Bain",
  "KC Concepcion": "Kevin Concepcion",
  "CJ Allen": "C.J. Allen",
  "DAngelo Ponds": "D'angelo Ponds",
  "Chris Brazzell II": "Chris Brazzell",
};

/** Map ESPN displayName to our prospect name. Tries override, then exact match. */
export function resolveESPNName(espnName: string): string | null {
  if (ESPN_NAME_OVERRIDES[espnName]) return ESPN_NAME_OVERRIDES[espnName];
  if (PROSPECTS.find((p) => p.name === espnName)) return espnName;
  return null;
}

export interface ESPNPick {
  overall: number;
  playerName: string;
  teamAbbrev: string;
}

interface ESPNResponse {
  picks?: Array<{
    status: string;
    overall: number;
    pick: number;
    round: number;
    teamId: string;
    athlete?: { displayName: string };
  }>;
  teams?: Array<{ id: string; abbreviation: string }>;
}

/** Fetch latest confirmed pick from ESPN. Returns null if no new pick or on error. */
export async function fetchLatestESPNPick(
  lastSeenOverall: number,
): Promise<ESPNPick | null> {
  try {
    const res = await fetch(ESPN_DRAFT_URL);
    if (!res.ok) return null;
    const data: ESPNResponse = await res.json();
    if (!data.picks || !data.teams) return null;

    const teamMap = new Map(data.teams.map((t) => [t.id, t.abbreviation]));

    // Find the latest SELECTION_MADE pick beyond what we've seen
    const newPick = data.picks
      .filter((p) => p.status === "SELECTION_MADE" && p.round === 1 && p.overall > lastSeenOverall)
      .sort((a, b) => a.overall - b.overall)[0];

    if (!newPick?.athlete?.displayName) return null;

    const playerName = resolveESPNName(newPick.athlete.displayName);
    const teamAbbrev = teamMap.get(newPick.teamId);
    if (!teamAbbrev) return null;

    return {
      overall: newPick.overall,
      playerName: playerName ?? newPick.athlete.displayName,
      teamAbbrev,
    };
  } catch {
    return null;
  }
}
