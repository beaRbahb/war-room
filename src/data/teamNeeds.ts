/**
 * Team positional needs for the 2026 NFL Draft.
 * Keyed by team abbreviation → ordered list of need positions.
 * Sources: nfl.com (picks 1-7), espn (picks 8-32).
 */
export const TEAM_NEEDS: Record<string, string[]> = {
  LV: ["QB", "WR", "OL"],
  NYJ: ["QB", "EDGE", "WR", "CB"],
  ARI: ["QB", "OL", "EDGE"],
  TEN: ["OL", "EDGE", "WR"],
  NYG: ["DL", "CB", "OL"],
  CLE: ["QB", "OL", "WR", "EDGE"],
  WAS: ["WR", "CB", "EDGE"],
  NO: ["WR", "CB", "DT", "EDGE"],
  KC: ["CB", "EDGE", "DT", "WR"],
  CIN: ["DT", "EDGE", "LB", "OT"],
  MIA: ["CB", "OG", "WR", "EDGE"],
  DAL: ["LB", "CB", "EDGE", "DT"],
  LAR: ["OT", "WR", "LB", "CB"],
  BAL: ["C", "OG", "DT", "WR"],
  TB: ["EDGE", "LB", "TE", "CB"],
  DET: ["OT", "EDGE", "CB", "LB"],
  MIN: ["DT", "C", "S", "CB"],
  CAR: ["S", "C", "WR", "CB"],
  PIT: ["QB", "WR", "OG", "CB"],
  LAC: ["OG", "EDGE", "DT", "WR"],
  PHI: ["EDGE", "OT", "TE", "WR"],
  CHI: ["EDGE", "S", "C", "DT"],
  BUF: ["EDGE", "LB", "OG", "WR"],
  SF: ["EDGE", "OG", "WR", "OT"],
  HOU: ["DT", "OG", "C", "LB"],
  NE: ["EDGE", "OT", "DT", "WR"],
  SEA: ["RB", "EDGE", "OG", "CB"],
};
