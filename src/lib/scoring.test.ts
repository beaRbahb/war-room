import { describe, it, expect } from "vitest";
import { calcBracketScore, getBracketHitsForPick, calcLiveScore } from "./scoring";
import type { ConfirmedPick, UserBracket } from "../types";

const pick = (num: number, player: string): ConfirmedPick => ({
  pick: num,
  playerName: player,
  teamAbbrev: "CHI",
  confirmedAt: new Date().toISOString(),
  isBearsPick: false,
});

const bracket = (picks: { slot: number; playerName: string }[]): UserBracket => ({
  userName: "TestUser",
  picks,
  submittedAt: new Date().toISOString(),
});

describe("calcBracketScore", () => {
  it("returns zeroes for null bracket", () => {
    expect(calcBracketScore(null, [pick(1, "A")])).toEqual({
      score: 0,
      exact: 0,
      partial: 0,
    });
  });

  it("returns zeroes for empty picks", () => {
    expect(calcBracketScore(bracket([]), [pick(1, "A")])).toEqual({
      score: 0,
      exact: 0,
      partial: 0,
    });
  });

  it("scores exact match in Chalk tier (pick 1) at 5 points", () => {
    const b = bracket([{ slot: 1, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result).toEqual({ score: 5, exact: 1, partial: 0 });
  });

  it("scores exact match in Mid-Round tier (pick 10) at 10 points", () => {
    const b = bracket([{ slot: 10, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(10, "A")]);
    expect(result).toEqual({ score: 10, exact: 1, partial: 0 });
  });

  it("scores exact match in Deep Cut tier (pick 20) at 15 points", () => {
    const b = bracket([{ slot: 20, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(20, "A")]);
    expect(result).toEqual({ score: 15, exact: 1, partial: 0 });
  });

  it("scores exact match in Crystal Ball tier (pick 30) at 20 points", () => {
    const b = bracket([{ slot: 30, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(30, "A")]);
    expect(result).toEqual({ score: 20, exact: 1, partial: 0 });
  });

  it("scores partial match at flat 3 points regardless of tier", () => {
    const b = bracket([{ slot: 5, playerName: "A" }]);
    // Player A predicted at slot 5 but actually went at slot 1 → partial
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result).toEqual({ score: 3, exact: 0, partial: 1 });
  });

  it("partial score uses actual pick tier, not bracket slot", () => {
    const b = bracket([{ slot: 1, playerName: "A" }]);
    // Player A predicted at slot 1 but actually went at slot 25 → partial at tier 4
    const result = calcBracketScore(b, [pick(25, "A")]);
    expect(result).toEqual({ score: 3, exact: 0, partial: 1 });
  });

  it("prefers exact over partial for same player", () => {
    const b = bracket([{ slot: 1, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result.exact).toBe(1);
    expect(result.partial).toBe(0);
  });

  it("accumulates across multiple picks with different tiers", () => {
    const b = bracket([
      { slot: 1, playerName: "A" },
      { slot: 5, playerName: "B" },
      { slot: 20, playerName: "C" },
    ]);
    const confirmed = [pick(1, "A"), pick(2, "B"), pick(20, "C")];
    // A: exact at pick 1 (Chalk, 5pts), B: partial at pick 2 (3pts), C: exact at pick 20 (Deep Cut, 15pts)
    expect(calcBracketScore(b, confirmed)).toEqual({
      score: 23,
      exact: 2,
      partial: 1,
    });
  });

  it("gives zero for no matches", () => {
    const b = bracket([{ slot: 1, playerName: "X" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result).toEqual({ score: 0, exact: 0, partial: 0 });
  });
});

describe("getBracketHitsForPick", () => {
  it("returns tiered hits across multiple users", () => {
    const allBrackets: Record<string, UserBracket> = {
      Alice: bracket([{ slot: 1, playerName: "A" }]),
      Bob: bracket([{ slot: 5, playerName: "A" }]),
      Carol: bracket([{ slot: 1, playerName: "Z" }]),
    };
    const hits = getBracketHitsForPick(pick(1, "A"), allBrackets);
    // Alice: exact at pick 1 (Chalk, 5pts), Bob: partial at pick 1 (3pts)
    expect(hits).toEqual([
      { name: "Alice", points: 5 },
      { name: "Bob", points: 3 },
    ]);
  });

  it("returns higher points for later-pick exact matches", () => {
    const allBrackets: Record<string, UserBracket> = {
      Alice: bracket([{ slot: 28, playerName: "A" }]),
    };
    const hits = getBracketHitsForPick(pick(28, "A"), allBrackets);
    // Exact at pick 28 (Crystal Ball, 20pts)
    expect(hits).toEqual([{ name: "Alice", points: 20 }]);
  });

  it("returns empty array when no one matched", () => {
    const allBrackets: Record<string, UserBracket> = {
      Alice: bracket([{ slot: 1, playerName: "Z" }]),
    };
    expect(getBracketHitsForPick(pick(1, "A"), allBrackets)).toEqual([]);
  });
});

describe("calcLiveScore", () => {
  it("scores correct guess in Chalk tier at 3 points", () => {
    const confirmed = [pick(1, "A")];
    const guesses = { pick1: { TestUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 3, hits: 1 });
  });

  it("scores correct guess in Crystal Ball tier at 10 points", () => {
    const confirmed = [pick(30, "A")];
    const guesses = { pick30: { TestUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 10, hits: 1 });
  });

  it("accumulates across tiers", () => {
    const confirmed = [pick(1, "A"), pick(20, "B")];
    const guesses = {
      pick1: { TestUser: "A" },
      pick20: { TestUser: "B" },
    };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    // pick 1 (Chalk, 3pts) + pick 20 (Deep Cut, 7pts) = 10
    expect(result).toEqual({ score: 10, hits: 2 });
  });

  it("does not score incorrect guesses", () => {
    const confirmed = [pick(1, "A")];
    const guesses = { pick1: { TestUser: "WRONG" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 0, hits: 0 });
  });

  it("doubles tiered points for Bears double picks", () => {
    const confirmed = [pick(25, "A")];
    const guesses = { pick25: { TestUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set([25]));
    // pick 25 (Crystal Ball, 10pts × 2 = 20)
    expect(result).toEqual({ score: 20, hits: 1 });
  });

  it("doubles Chalk tier for Bears double picks", () => {
    const confirmed = [pick(5, "A")];
    const guesses = { pick5: { TestUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set([5]));
    // pick 5 (Chalk, 3pts × 2 = 6)
    expect(result).toEqual({ score: 6, hits: 1 });
  });

  it("handles missing guesses gracefully", () => {
    const confirmed = [pick(1, "A")];
    const result = calcLiveScore("TestUser", confirmed, {}, new Set());
    expect(result).toEqual({ score: 0, hits: 0 });
  });

  it("only counts the named user's guesses", () => {
    const confirmed = [pick(1, "A")];
    const guesses = { pick1: { OtherUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 0, hits: 0 });
  });
});
