import trubiskyImg from "../assets/images/trubisky.jpg";
// Add headshots for other busts — drop files in src/assets/images/ and import here
// import kevinWhiteImg from "../assets/images/kevin-white.jpg";
// import cedricBensonImg from "../assets/images/cedric-benson.jpg";
// import cadeMcNownImg from "../assets/images/cade-mcnown.jpg";
// import curtisEnisImg from "../assets/images/curtis-enis.jpg";
// import sheaMcClellinImg from "../assets/images/shea-mcclellin.jpg";

export interface BearsBust {
  name: string;
  year: number;
  pick: number;
  passedOn: string;
  image: string | null;
}

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
    image: null, // replace with kevinWhiteImg
  },
  {
    name: "CEDRIC BENSON",
    year: 2005,
    pick: 4,
    passedOn: "DeMarcus Ware went #11 · Aaron Rodgers went #24",
    image: null, // replace with cedricBensonImg
  },
  {
    name: "CADE McNOWN",
    year: 1999,
    pick: 12,
    passedOn: "Jevon Kearse went #16 · Daunte Culpepper went #11",
    image: null, // replace with cadeMcNownImg
  },
  {
    name: "CURTIS ENIS",
    year: 1998,
    pick: 5,
    passedOn: "Randy Moss went #21 · Alan Faneca went #26",
    image: null, // replace with curtisEnisImg
  },
  {
    name: "SHEA McCLELLIN",
    year: 2012,
    pick: 19,
    passedOn: "Chandler Jones went #21 · Harrison Smith went #29",
    image: null, // replace with sheaMcClellinImg
  },
];

/** Pick a random bust */
export function getRandomBust(): BearsBust {
  return BEARS_BUSTS[Math.floor(Math.random() * BEARS_BUSTS.length)];
}
