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
  { pick: 10, team: "Cincinnati Bengals", abbrev: "CIN" },
  { pick: 11, team: "Miami Dolphins", abbrev: "MIA" },
  {
    pick: 12, team: "New York Jets", abbrev: "NYJ",
    fromTeam: "Dallas Cowboys", trade: true,
    tradeNote: "NYJ trade #16 + #103 to DAL for #12",
  },
  {
    pick: 13, team: "Tampa Bay Buccaneers", abbrev: "TB",
    fromTeam: "Los Angeles Rams", trade: true,
    tradeNote: "TB trade #15 + #155 to LAR for #13",
  },
  { pick: 14, team: "Baltimore Ravens", abbrev: "BAL" },
  {
    pick: 15, team: "Los Angeles Rams", abbrev: "LAR",
    fromTeam: "Tampa Bay Buccaneers", trade: true,
    tradeNote: "LAR trade #13 to TB for #15 + #155",
  },
  {
    pick: 16, team: "Dallas Cowboys", abbrev: "DAL",
    fromTeam: "New York Jets", trade: true,
    tradeNote: "DAL trade #12 to NYJ for #16 + #103",
  },
  { pick: 17, team: "Detroit Lions", abbrev: "DET" },
  { pick: 18, team: "Minnesota Vikings", abbrev: "MIN" },
  { pick: 19, team: "Carolina Panthers", abbrev: "CAR" },
  {
    pick: 20, team: "Buffalo Bills", abbrev: "BUF",
    fromTeam: "Dallas Cowboys", trade: true,
    tradeNote: "BUF trade #26 + #126 to DAL for #20",
  },
  { pick: 21, team: "Pittsburgh Steelers", abbrev: "PIT" },
  { pick: 22, team: "Los Angeles Chargers", abbrev: "LAC" },
  { pick: 23, team: "Philadelphia Eagles", abbrev: "PHI" },
  {
    pick: 24, team: "Cleveland Browns", abbrev: "CLE",
    fromTeam: "Jacksonville Jaguars",
  },
  { pick: 25, team: "Chicago Bears", abbrev: "CHI" },
  {
    pick: 26, team: "Dallas Cowboys", abbrev: "DAL",
    fromTeam: "Buffalo Bills", trade: true,
    tradeNote: "DAL trade #20 to BUF for #26 + #126",
  },
  { pick: 27, team: "San Francisco 49ers", abbrev: "SF" },
  { pick: 28, team: "Houston Texans", abbrev: "HOU" },
  {
    pick: 29, team: "Kansas City Chiefs", abbrev: "KC",
    fromTeam: "Los Angeles Rams",
  },
  {
    pick: 30, team: "Miami Dolphins", abbrev: "MIA",
    fromTeam: "Denver Broncos",
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
