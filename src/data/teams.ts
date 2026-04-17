export interface TeamInfo {
  name: string;
  logo: string;
  color: string;
  color2: string;
}

/** NFL team logos and names keyed by abbreviation */
export const TEAMS: Record<string, TeamInfo> = {
  ARI: { name: "Arizona Cardinals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", color: "#97233F", color2: "#000000" },
  ATL: { name: "Atlanta Falcons", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", color: "#A71930", color2: "#000000" },
  BAL: { name: "Baltimore Ravens", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", color: "#241773", color2: "#9E7C0C" },
  BUF: { name: "Buffalo Bills", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", color: "#00338D", color2: "#C60C30" },
  CAR: { name: "Carolina Panthers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", color: "#0085CA", color2: "#101820" },
  CHI: { name: "Chicago Bears", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", color: "#0B162A", color2: "#E87722" },
  CIN: { name: "Cincinnati Bengals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", color: "#FB4F14", color2: "#000000" },
  CLE: { name: "Cleveland Browns", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", color: "#311D00", color2: "#FF3C00" },
  DAL: { name: "Dallas Cowboys", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", color: "#003594", color2: "#869397" },
  DEN: { name: "Denver Broncos", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", color: "#FB4F14", color2: "#002244" },
  DET: { name: "Detroit Lions", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", color: "#0076B6", color2: "#B0B7BC" },
  GB: { name: "Green Bay Packers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", color: "#203731", color2: "#FFB612" },
  HOU: { name: "Houston Texans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", color: "#03202F", color2: "#A71930" },
  IND: { name: "Indianapolis Colts", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", color: "#002C5F", color2: "#A2AAAD" },
  JAX: { name: "Jacksonville Jaguars", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", color: "#006778", color2: "#D7A22A" },
  KC: { name: "Kansas City Chiefs", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", color: "#E31837", color2: "#FFB81C" },
  LAC: { name: "Los Angeles Chargers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", color: "#0080C6", color2: "#FFC20E" },
  LAR: { name: "Los Angeles Rams", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", color: "#003594", color2: "#FFD100" },
  LV: { name: "Las Vegas Raiders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", color: "#A5ACAF", color2: "#000000" },
  MIA: { name: "Miami Dolphins", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", color: "#008E97", color2: "#FC4C02" },
  MIN: { name: "Minnesota Vikings", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", color: "#4F2683", color2: "#FFC62F" },
  NE: { name: "New England Patriots", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", color: "#002244", color2: "#C60C30" },
  NO: { name: "New Orleans Saints", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", color: "#D3BC8D", color2: "#101820" },
  NYG: { name: "New York Giants", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", color: "#0B2265", color2: "#A71930" },
  NYJ: { name: "New York Jets", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", color: "#125740", color2: "#FFFFFF" },
  PHI: { name: "Philadelphia Eagles", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", color: "#004C54", color2: "#A5ACAF" },
  PIT: { name: "Pittsburgh Steelers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", color: "#FFB612", color2: "#101820" },
  SEA: { name: "Seattle Seahawks", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", color: "#002244", color2: "#69BE28" },
  SF: { name: "San Francisco 49ers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", color: "#AA0000", color2: "#B3995D" },
  TB: { name: "Tampa Bay Buccaneers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", color: "#D50A0A", color2: "#34302B" },
  TEN: { name: "Tennessee Titans", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", color: "#0C2340", color2: "#4B92DB" },
  WAS: { name: "Washington Commanders", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/was.png", color: "#5A1414", color2: "#FFB612" },
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
