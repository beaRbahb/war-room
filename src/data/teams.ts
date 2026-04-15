export interface TeamInfo {
  name: string;
  logo: string;
  color: string;
}

/** NFL team logos and names keyed by abbreviation */
export const TEAMS: Record<string, TeamInfo> = {
  ARI: { name: "Arizona Cardinals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", color: "#97233F" },
  ATL: { name: "Atlanta Falcons", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", color: "#A71930" },
  BAL: { name: "Baltimore Ravens", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", color: "#241773" },
  BUF: { name: "Buffalo Bills", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", color: "#00338D" },
  CAR: { name: "Carolina Panthers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", color: "#0085CA" },
  CHI: { name: "Chicago Bears", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", color: "#0B162A" },
  CIN: { name: "Cincinnati Bengals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", color: "#FB4F14" },
  CLE: { name: "Cleveland Browns", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", color: "#311D00" },
  DAL: { name: "Dallas Cowboys", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", color: "#003594" },
  DEN: { name: "Denver Broncos", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", color: "#FB4F14" },
  DET: { name: "Detroit Lions", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", color: "#0076B6" },
  GB: { name: "Green Bay Packers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", color: "#203731" },
  HOU: { name: "Houston Texans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", color: "#03202F" },
  IND: { name: "Indianapolis Colts", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", color: "#002C5F" },
  JAX: { name: "Jacksonville Jaguars", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", color: "#006778" },
  KC: { name: "Kansas City Chiefs", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", color: "#E31837" },
  LAC: { name: "Los Angeles Chargers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", color: "#0080C6" },
  LAR: { name: "Los Angeles Rams", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", color: "#003594" },
  LV: { name: "Las Vegas Raiders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", color: "#A5ACAF" },
  MIA: { name: "Miami Dolphins", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", color: "#008E97" },
  MIN: { name: "Minnesota Vikings", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", color: "#4F2683" },
  NE: { name: "New England Patriots", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", color: "#002244" },
  NO: { name: "New Orleans Saints", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", color: "#D3BC8D" },
  NYG: { name: "New York Giants", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", color: "#0B2265" },
  NYJ: { name: "New York Jets", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", color: "#125740" },
  PHI: { name: "Philadelphia Eagles", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", color: "#004C54" },
  PIT: { name: "Pittsburgh Steelers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", color: "#FFB612" },
  SEA: { name: "Seattle Seahawks", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", color: "#002244" },
  SF: { name: "San Francisco 49ers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", color: "#AA0000" },
  TB: { name: "Tampa Bay Buccaneers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", color: "#D50A0A" },
  TEN: { name: "Tennessee Titans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", color: "#0C2340" },
  WAS: { name: "Washington Commanders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/was.png", color: "#5A1414" },
};

/** Get team logo URL by abbreviation */
export function getTeamLogo(abbrev: string): string | undefined {
  return TEAMS[abbrev]?.logo;
}

/** Get team primary color by abbreviation */
export function getTeamColor(abbrev: string): string {
  return TEAMS[abbrev]?.color ?? "#555555";
}

/** Get team abbreviation from full team name */
export function getTeamAbbrev(name: string): string {
  for (const [abbrev, info] of Object.entries(TEAMS)) {
    if (info.name === name) return abbrev;
  }
  return name;
}
