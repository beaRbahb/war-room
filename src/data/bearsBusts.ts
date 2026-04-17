import trubiskyImg from "../assets/images/trubisky.jpg";
import kevinWhiteImg from "../assets/images/kevin-white.avif";
import cadeMcNownImg from "../assets/images/cade-mcnown.webp";
import curtisEnisImg from "../assets/images/curtis-enis.webp";
import sheaMcClellinImg from "../assets/images/shea-mcclellin.jpeg";
import calebWilliamsImg from "../assets/images/caleb-williams.jpeg";

export interface BearsBust {
  name: string;
  year: number;
  pick: number;
  passedOn: string;
  image: string | null;
}

export interface BearsLegend {
  name: string;
  year: number;
  pick: number;
  tagline: string;
  image: string;
}

export type BearsMoment =
  | { type: "bust"; data: BearsBust }
  | { type: "legend"; data: BearsLegend };

export const BEARS_BUSTS: BearsBust[] = [
  {
    name: "MITCHELL TRUBISKY",
    year: 2017,
    pick: 2,
    passedOn: "Mahomes went #10 · Watson went #12",
    image: trubiskyImg,
  },
  {
    name: "KEVIN WHITE",
    year: 2015,
    pick: 7,
    passedOn: "Todd Gurley went #10 · Marcus Peters went #18",
    image: kevinWhiteImg,
  },
  {
    name: "CADE McNOWN",
    year: 1999,
    pick: 12,
    passedOn: "Jevon Kearse went #16 · Daunte Culpepper went #11",
    image: cadeMcNownImg,
  },
  {
    name: "CURTIS ENIS",
    year: 1998,
    pick: 5,
    passedOn: "Randy Moss went #21 · Alan Faneca went #26",
    image: curtisEnisImg,
  },
  {
    name: "SHEA McCLELLIN",
    year: 2012,
    pick: 19,
    passedOn: "Chandler Jones went #21 · Harrison Smith went #29",
    image: sheaMcClellinImg,
  },
];

export const BEARS_LEGENDS: BearsLegend[] = [
  {
    name: "CALEB WILLIAMS",
    year: 2024,
    pick: 1,
    tagline: "ICEMAN",
    image: calebWilliamsImg,
  },
];

/** Pick a random bust */
export function getRandomBust(): BearsBust {
  return BEARS_BUSTS[Math.floor(Math.random() * BEARS_BUSTS.length)];
}

/** Pick a random Bears draft moment (bust or legend) */
export function getRandomBearsMoment(): BearsMoment {
  const all: BearsMoment[] = [
    ...BEARS_BUSTS.map((b) => ({ type: "bust" as const, data: b })),
    ...BEARS_LEGENDS.map((l) => ({ type: "legend" as const, data: l })),
  ];
  return all[Math.floor(Math.random() * all.length)];
}
