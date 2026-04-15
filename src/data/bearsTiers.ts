export type BearsTier = "goat" | "great" | "cursed";

export interface BearsTierComp {
  id: string;
  name: string;
  tier: BearsTier;
  emoji: string;
}

export const BEARS_TIER_COMPS: BearsTierComp[] = [
  { id: "urlacher", name: "Brian Urlacher", tier: "goat", emoji: "\u{1F43B}" },
  { id: "hester", name: "Devin Hester", tier: "goat", emoji: "\u{1F43B}" },
  { id: "payton", name: "Walter Payton", tier: "goat", emoji: "\u{1F43B}" },
  { id: "kyle-long", name: "Kyle Long", tier: "great", emoji: "\u{1F525}" },
  { id: "jalen-johnson", name: "Jalen Johnson", tier: "great", emoji: "\u{1F525}" },
  { id: "colston-loveland", name: "Colston Loveland", tier: "great", emoji: "\u{1F525}" },
  { id: "trubisky", name: "Mitchell Trubisky", tier: "cursed", emoji: "\u{1F480}" },
  { id: "hyppolite", name: "Ruben Hyppolite II", tier: "cursed", emoji: "\u{1F480}" },
];

/** Group comps by tier for display */
export function getCompsByTier(): Record<BearsTier, BearsTierComp[]> {
  return {
    goat: BEARS_TIER_COMPS.filter((c) => c.tier === "goat"),
    great: BEARS_TIER_COMPS.filter((c) => c.tier === "great"),
    cursed: BEARS_TIER_COMPS.filter((c) => c.tier === "cursed"),
  };
}
