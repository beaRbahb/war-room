import { TEAMS } from "./teams";

export interface DraftSlot {
  pick: number;
  team: string;
  abbrev: string;
  /** If acquired via trade, the original team */
  fromTeam?: string;
  /** Whether this pick was traded */
  trade?: boolean;
  /** Trade details */
  tradeNote?: string;
}

/** 2026 NFL Draft Round 1 order */
export const DRAFT_ORDER: DraftSlot[] = [
  { pick: 1, team: "Las Vegas Raiders", abbrev: "LV" },
  { pick: 2, team: "New York Jets", abbrev: "NYJ" },
  { pick: 3, team: "Arizona Cardinals", abbrev: "ARI" },
  { pick: 4, team: "Tennessee Titans", abbrev: "TEN" },
  { pick: 5, team: "New York Giants", abbrev: "NYG" },
  { pick: 6, team: "Cleveland Browns", abbrev: "CLE" },
  { pick: 7, team: "Washington Commanders", abbrev: "WAS" },
  { pick: 8, team: "New Orleans Saints", abbrev: "NO" },
  { pick: 9, team: "Kansas City Chiefs", abbrev: "KC" },
  {
    pick: 10, team: "New York Giants", abbrev: "NYG",
    fromTeam: "Cincinnati Bengals", trade: true,
  },
  { pick: 11, team: "Miami Dolphins", abbrev: "MIA" },
  { pick: 12, team: "Dallas Cowboys", abbrev: "DAL" },
  {
    pick: 13, team: "Los Angeles Rams", abbrev: "LAR",
    fromTeam: "Atlanta Falcons", trade: true,
  },
  { pick: 14, team: "Baltimore Ravens", abbrev: "BAL" },
  { pick: 15, team: "Tampa Bay Buccaneers", abbrev: "TB" },
  {
    pick: 16, team: "New York Jets", abbrev: "NYJ",
    fromTeam: "Indianapolis Colts", trade: true,
  },
  { pick: 17, team: "Detroit Lions", abbrev: "DET" },
  { pick: 18, team: "Minnesota Vikings", abbrev: "MIN" },
  { pick: 19, team: "Carolina Panthers", abbrev: "CAR" },
  {
    pick: 20, team: "Dallas Cowboys", abbrev: "DAL",
    fromTeam: "Green Bay Packers", trade: true,
  },
  { pick: 21, team: "Pittsburgh Steelers", abbrev: "PIT" },
  { pick: 22, team: "Los Angeles Chargers", abbrev: "LAC" },
  { pick: 23, team: "Philadelphia Eagles", abbrev: "PHI" },
  {
    pick: 24, team: "Cleveland Browns", abbrev: "CLE",
    fromTeam: "Jacksonville Jaguars", trade: true,
  },
  { pick: 25, team: "Chicago Bears", abbrev: "CHI" },
  { pick: 26, team: "Buffalo Bills", abbrev: "BUF" },
  { pick: 27, team: "San Francisco 49ers", abbrev: "SF" },
  { pick: 28, team: "Houston Texans", abbrev: "HOU" },
  {
    pick: 29, team: "Kansas City Chiefs", abbrev: "KC",
    fromTeam: "Los Angeles Rams", trade: true,
  },
  {
    pick: 30, team: "Miami Dolphins", abbrev: "MIA",
    fromTeam: "Denver Broncos", trade: true,
  },
  { pick: 31, team: "New England Patriots", abbrev: "NE" },
  { pick: 32, team: "Seattle Seahawks", abbrev: "SEA" },
];

/**
 * Returns a new DraftSlot[] with team overrides applied.
 * Each override maps a pick number to a new team abbreviation.
 * The original team is stored in `fromTeam` for "via" display.
 */
export function getEffectiveDraftOrder(
  overrides: Record<string, string>
): DraftSlot[] {
  const order = DRAFT_ORDER.map((slot) => ({ ...slot }));
  for (const [pickStr, newAbbrev] of Object.entries(overrides)) {
    const idx = Number(pickStr) - 1;
    if (idx < 0 || idx >= order.length) continue;
    const slot = order[idx];
    const teamInfo = TEAMS[newAbbrev];
    if (!teamInfo) continue;
    slot.fromTeam = slot.team; // original team for "via" display
    slot.team = teamInfo.name;
    slot.abbrev = newAbbrev;
  }
  return order;
}

/** Pick number where Bears are on the clock */
export const BEARS_PICK = 25;

/** Check if a team abbreviation is the Bears */
export function isBearsPick(abbrev: string): boolean {
  return abbrev === "CHI";
}
