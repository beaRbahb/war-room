export interface TeamInfo {
  name: string;
  logo: string;
}

/** NFL team logos and names keyed by abbreviation */
export const TEAMS: Record<string, TeamInfo> = {
  ARI: { name: "Arizona Cardinals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png" },
  ATL: { name: "Atlanta Falcons", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png" },
  BAL: { name: "Baltimore Ravens", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
  BUF: { name: "Buffalo Bills", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
  CAR: { name: "Carolina Panthers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png" },
  CHI: { name: "Chicago Bears", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png" },
  CIN: { name: "Cincinnati Bengals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png" },
  CLE: { name: "Cleveland Browns", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png" },
  DAL: { name: "Dallas Cowboys", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  DEN: { name: "Denver Broncos", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png" },
  DET: { name: "Detroit Lions", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png" },
  GB: { name: "Green Bay Packers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png" },
  HOU: { name: "Houston Texans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png" },
  IND: { name: "Indianapolis Colts", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png" },
  JAX: { name: "Jacksonville Jaguars", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png" },
  KC: { name: "Kansas City Chiefs", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  LAC: { name: "Los Angeles Chargers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png" },
  LAR: { name: "Los Angeles Rams", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png" },
  LV: { name: "Las Vegas Raiders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png" },
  MIA: { name: "Miami Dolphins", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
  MIN: { name: "Minnesota Vikings", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png" },
  NE: { name: "New England Patriots", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png" },
  NO: { name: "New Orleans Saints", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png" },
  NYG: { name: "New York Giants", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png" },
  NYJ: { name: "New York Jets", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png" },
  PHI: { name: "Philadelphia Eagles", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" },
  PIT: { name: "Pittsburgh Steelers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png" },
  SEA: { name: "Seattle Seahawks", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png" },
  SF: { name: "San Francisco 49ers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" },
  TB: { name: "Tampa Bay Buccaneers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png" },
  TEN: { name: "Tennessee Titans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png" },
  WAS: { name: "Washington Commanders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/was.png" },
};

/** Get team logo URL by abbreviation */
export function getTeamLogo(abbrev: string): string | undefined {
  return TEAMS[abbrev]?.logo;
}

/** Get team abbreviation from full team name */
export function getTeamAbbrev(name: string): string {
  for (const [abbrev, info] of Object.entries(TEAMS)) {
    if (info.name === name) return abbrev;
  }
  return name;
}
