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

  it("scores exact match (player + slot) at 10 points", () => {
    const b = bracket([{ slot: 1, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result).toEqual({ score: 10, exact: 1, partial: 0 });
  });

  it("scores player-only match (wrong slot) at 4 points", () => {
    const b = bracket([{ slot: 5, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result).toEqual({ score: 4, exact: 0, partial: 1 });
  });

  it("prefers exact over partial for same player", () => {
    const b = bracket([{ slot: 1, playerName: "A" }]);
    const result = calcBracketScore(b, [pick(1, "A")]);
    expect(result.exact).toBe(1);
    expect(result.partial).toBe(0);
  });

  it("accumulates across multiple picks", () => {
    const b = bracket([
      { slot: 1, playerName: "A" },
      { slot: 5, playerName: "B" },
      { slot: 3, playerName: "C" },
    ]);
    const confirmed = [pick(1, "A"), pick(2, "B"), pick(3, "C")];
    // A: exact (10), B: partial (4), C: exact (10)
    expect(calcBracketScore(b, confirmed)).toEqual({
      score: 24,
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
  it("returns hits across multiple users", () => {
    const allBrackets: Record<string, UserBracket> = {
      Alice: bracket([{ slot: 1, playerName: "A" }]),
      Bob: bracket([{ slot: 5, playerName: "A" }]),
      Carol: bracket([{ slot: 1, playerName: "Z" }]),
    };
    const hits = getBracketHitsForPick(pick(1, "A"), allBrackets);
    expect(hits).toEqual([
      { name: "Alice", points: 10 },
      { name: "Bob", points: 4 },
    ]);
  });

  it("returns empty array when no one matched", () => {
    const allBrackets: Record<string, UserBracket> = {
      Alice: bracket([{ slot: 1, playerName: "Z" }]),
    };
    expect(getBracketHitsForPick(pick(1, "A"), allBrackets)).toEqual([]);
  });
});

describe("calcLiveScore", () => {
  it("scores correct guesses at 10 points each", () => {
    const confirmed = [pick(1, "A"), pick(2, "B")];
    const guesses = {
      pick1: { TestUser: "A" },
      pick2: { TestUser: "B" },
    };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 20, hits: 2 });
  });

  it("does not score incorrect guesses", () => {
    const confirmed = [pick(1, "A")];
    const guesses = { pick1: { TestUser: "WRONG" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set());
    expect(result).toEqual({ score: 0, hits: 0 });
  });

  it("doubles points for Bears double picks", () => {
    const confirmed = [pick(25, "A")];
    const guesses = { pick25: { TestUser: "A" } };
    const result = calcLiveScore("TestUser", confirmed, guesses, new Set([25]));
    expect(result).toEqual({ score: 20, hits: 1 });
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
