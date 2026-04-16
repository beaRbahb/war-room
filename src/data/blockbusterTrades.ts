import crosbyImg from "../assets/images/blockbuster-crosby.jpg";
import lawrenceImg from "../assets/images/blockbuster-lawrence.webp";

export interface BlockbusterTradePlayer {
  /** Display name (used as playerName in ConfirmedPick) */
  name: string;
  /** Position */
  position: string;
  /** Current NFL team */
  currentTeam: string;
  /** Current team abbreviation */
  currentTeamAbbrev: string;
  /** Jersey swap / trade image (user-provided, null until available) */
  image: string | null;
  /** What the Bears gave up in the trade */
  tradePackage: string[];
  /** One-line headline for the overlay */
  headline: string;
  /** Stats / accolades line */
  accolades: string;
}

export const BLOCKBUSTER_TRADES: BlockbusterTradePlayer[] = [
  {
    name: "Maxx Crosby",
    position: "EDGE",
    currentTeam: "Las Vegas Raiders",
    currentTeamAbbrev: "LV",
    image: crosbyImg,
    tradePackage: [
      "#25 overall (1st round)",
      "2027 1st round pick",
      "2026 3rd round pick",
    ],
    headline: "THE MAD MAXX ERA BEGINS",
    accolades: "4x Pro Bowl · 2x All-Pro",
  },
  {
    name: "Dexter Lawrence",
    position: "DL",
    currentTeam: "New York Giants",
    currentTeamAbbrev: "NYG",
    image: lawrenceImg,
    tradePackage: [
      "#25 overall (1st round)",
      "2027 1st round pick",
      "2027 3rd round pick",
    ],
    headline: "SEXY DEXY IN THE WINDY CITY",
    accolades: "2x Pro Bowl · 1x All-Pro",
  },
];

/** Check if a player name is a blockbuster trade player */
export function isBlockbusterTrade(name: string): BlockbusterTradePlayer | undefined {
  return BLOCKBUSTER_TRADES.find((bt) => bt.name === name);
}
