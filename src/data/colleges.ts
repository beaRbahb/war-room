export interface CollegeInfo {
  espnId: number;
  logo: string;
}

/** College logos from ESPN, keyed by school name matching prospects.ts */
export const COLLEGES: Record<string, CollegeInfo> = {
  "Indiana": { espnId: 84, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/84.png" },
  "Ohio State": { espnId: 194, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/194.png" },
  "Texas Tech": { espnId: 2641, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png" },
  "Notre Dame": { espnId: 87, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/87.png" },
  "Miami (FL)": { espnId: 2390, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png" },
  "LSU": { espnId: 99, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/99.png" },
  "Utah": { espnId: 254, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/254.png" },
  "Georgia": { espnId: 61, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" },
  "USC": { espnId: 30, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/30.png" },
  "Tennessee": { espnId: 2633, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png" },
  "Penn State": { espnId: 213, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/213.png" },
  "Oregon": { espnId: 2483, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png" },
  "Alabama": { espnId: 333, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png" },
  "Auburn": { espnId: 2, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png" },
  "Clemson": { espnId: 228, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/228.png" },
  "Washington": { espnId: 264, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/264.png" },
  "Texas A&M": { espnId: 245, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/245.png" },
  "Arizona State": { espnId: 9, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/9.png" },
  "Toledo": { espnId: 2649, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2649.png" },
  "Missouri": { espnId: 142, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/142.png" },
  "Vanderbilt": { espnId: 238, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/238.png" },
  "Florida": { espnId: 57, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/57.png" },
  "UCF": { espnId: 2116, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2116.png" },
  "Michigan": { espnId: 130, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png" },
  "Northwestern": { espnId: 77, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/77.png" },
  "Georgia Tech": { espnId: 59, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/59.png" },
  "Oklahoma": { espnId: 201, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/201.png" },
  "Arkansas": { espnId: 8, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/8.png" },
  "Iowa": { espnId: 2294, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png" },
  "Cincinnati": { espnId: 2132, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2132.png" },
  "South Carolina": { espnId: 2579, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png" },
  "Maryland": { espnId: 120, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/120.png" },
  "Louisville": { espnId: 97, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/97.png" },
  "San Diego State": { espnId: 21, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/21.png" },
  "Arizona": { espnId: 12, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/12.png" },
  "Illinois": { espnId: 356, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png" },
  "Iowa State": { espnId: 66, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/66.png" },
  "Texas": { espnId: 251, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/251.png" },
};

/** Get college logo URL by school name */
export function getCollegeLogo(college: string): string | undefined {
  return COLLEGES[college]?.logo;
}
