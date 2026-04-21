import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calcChaosScore, type ChaosLevel } from "../../lib/chaos";
import { PROSPECTS } from "../../data/prospects";
import { TEAM_NEEDS } from "../../data/teamNeeds";
import { getPickProb, PICK_PROBS } from "../../data/prospectOdds";
import { getTeamLogo } from "../../data/teams";
import { isBlockbusterTrade } from "../../data/blockbusterTrades";
import { stopBlockbusterAudio } from "../bears/BlockbusterTradeOverlay";
import { stopBearsAudio } from "../bears/BearsMode";
import { getHeadshot } from "../../lib/headshots";
import {
  submitReaction,
  onReactions,
  submitRoastAnswer,
  getRoastAnswersForPick,
  submitRoastVote,
  getRoastVotesForPick,
} from "../../lib/storage";
import { chaosLevelToTag, getPromptForPick } from "../../data/roastPrompts";
import { LEADERBOARD_FLASH_MS } from "../../data/scoring";
import type { UserReaction, ReactionType, RoastAnswer, RoastResult } from "../../types";
import {
  GRADE_LABELS,
  type GradeType,
} from "../../types";
import RoastVoting from "./RoastVoting";
import RoastResults from "./RoastResults";

const ROAST_CHAR_LIMIT = 120;

type ReactionPhase =
  | { type: "grade" }
  | { type: "leaderboard" }
  | { type: "voting"; answers: Record<string, RoastAnswer> }
  | { type: "results"; ranked: RoastResult[] };

interface PickReactionScreenProps {
  slot: number;
  playerName: string;
  teamAbbrev: string;
  isBearsPick: boolean;
  priorPicks: { position: string }[];
  roomCode: string;
  userName: string;
  onComplete: () => void;
  totalUsers?: number;
  /** Current user's rank (1-indexed) */
  userRank?: number;
  /** Name of the current leader */
  leaderName?: string;
  /** Leader's total score */
  leaderScore?: number;
  /** Score delta for this pick */
  scoreDelta?: { bracket: number; live: number };
  /** Top 3 standings */
  top3?: { name: string; score: number }[];
}

const LEVEL_COLORS: Record<ChaosLevel, { text: string; bg: string; border: string }> = {
  CHALK: { text: "text-muted", bg: "bg-muted/15", border: "border-muted/30" },
  MILD: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/30" },
  SPICY: { text: "text-bears-orange", bg: "bg-bears-orange/15", border: "border-bears-orange/30" },
  CHAOS: { text: "text-red", bg: "bg-red/15", border: "border-red/30" },
};

const GRADE_OPTIONS: GradeType[] = ["a-plus", "a", "b", "c", "d", "f"];

/** Maps prospect positions → readable need match description */
function getNeedDescription(position: string | undefined, teamAbbrev: string): string {
  if (!position) return "Unknown position";
  const needs = TEAM_NEEDS[teamAbbrev] ?? [];
  if (needs.length === 0) return "No need data";

  const POSITION_NEED_MAP: Record<string, string[]> = {
    QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"],
    OT: ["OL", "OT"], IOL: ["OL", "OG", "C"],
    DL: ["DL", "DT"], EDGE: ["EDGE"],
    "EDGE/LB": ["EDGE", "LB"], LB: ["LB"], CB: ["CB"], S: ["S"],
  };
  const satisfies = POSITION_NEED_MAP[position] ?? [position];
  for (let i = 0; i < needs.length; i++) {
    if (satisfies.includes(needs[i])) {
      return `#${i + 1} need (${needs.join(", ")})`;
    }
  }
  return `Not a need (${needs.join(", ")})`;
}

/** Convert number to ordinal string: 1 → "1st", 2 → "2nd", etc. */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function PickReactionScreen({
  slot, playerName, teamAbbrev, priorPicks,
  roomCode, userName, onComplete, userRank, leaderName, leaderScore,
  scoreDelta, top3,
}: PickReactionScreenProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});
  const [phase, setPhase] = useState<ReactionPhase>({ type: "grade" });
  const [selectedGrade, setSelectedGrade] = useState<ReactionType | null>(null);
  const [roastText, setRoastText] = useState("");

  // Guards to prevent double-transitions
  const submittedLocally = useRef(false);
  const leaderboardAdvancedRef = useRef(false);
  const votingCompletedRef = useRef(false);
  const answersRef = useRef<Record<string, RoastAnswer>>({});

  // If user already reacted before this mount (e.g., page refresh), skip straight out.
  useEffect(() => {
    if (phase.type === "grade" && !submittedLocally.current && reactions[userName]) {
      onComplete();
    }
  }, [reactions, userName, phase.type, onComplete]);

  const prospect = PROSPECTS.find((p) => p.name === playerName);
  const { level, tags } = calcChaosScore(slot, playerName, teamAbbrev, priorPicks);
  const espnProb = getPickProb(slot, playerName);

  const slotProbs = PICK_PROBS[slot] ?? {};
  const topProb = Math.max(0, ...Object.values(slotProbs));
  const isTopExpected = espnProb > 0 && espnProb >= topProb;
  const headshot = getHeadshot(playerName);
  const teamLogo = getTeamLogo(teamAbbrev);
  const colors = LEVEL_COLORS[level];

  const rankDrift = prospect ? slot - prospect.rank : 0;
  const bt = isBlockbusterTrade(playerName);
  const playerPosition = prospect?.position ?? bt?.position;
  const needDesc = getNeedDescription(playerPosition, teamAbbrev);

  // Deterministic roast prompt — same for every client on the same pick
  const roastPrompt = useMemo(() => {
    const tag = chaosLevelToTag(level);
    return getPromptForPick(slot, tag, {
      team: teamAbbrev,
      player: playerName,
      pick: slot,
      position: playerPosition,
    });
  }, [level, teamAbbrev, playerName, slot, playerPosition]);

  // Listen for reactions (to detect already-submitted on mount)
  useEffect(() => {
    return onReactions(roomCode, slot, setReactions);
  }, [roomCode, slot]);

  /** Transition: leaderboard → voting (if 2+ answers) or onComplete */
  const advanceFromLeaderboard = useCallback(async () => {
    if (leaderboardAdvancedRef.current) return;
    leaderboardAdvancedRef.current = true;

    const answers = await getRoastAnswersForPick(roomCode, slot);
    if (Object.keys(answers).length >= 2) {
      answersRef.current = answers;
      setPhase({ type: "voting", answers });
    } else {
      onComplete();
    }
  }, [roomCode, slot, onComplete]);

  // ── Leaderboard auto-advance (3s) ──
  useEffect(() => {
    if (phase.type !== "leaderboard") return;
    const timer = setTimeout(advanceFromLeaderboard, LEADERBOARD_FLASH_MS);
    return () => clearTimeout(timer);
  }, [phase.type, advanceFromLeaderboard]);

  /** Transition: voting → results (if votes exist) or onComplete */
  async function transitionToResults() {
    if (votingCompletedRef.current) return;
    votingCompletedRef.current = true;

    const votes = await getRoastVotesForPick(roomCode, slot);
    const voteValues = Object.values(votes);

    // No votes at all → skip results
    if (voteValues.length === 0) {
      onComplete();
      return;
    }

    // Tally votes per answerer
    const counts: Record<string, number> = {};
    for (const answerer of voteValues) {
      counts[answerer] = (counts[answerer] ?? 0) + 1;
    }

    // Build sorted results (descending votes, alphabetical tiebreak)
    const answers = answersRef.current;
    const sorted: RoastResult[] = Object.entries(counts)
      .map(([name, count]) => ({
        answererName: name,
        text: answers[name]?.text ?? "",
        voteCount: count,
      }))
      .sort((a, b) => b.voteCount - a.voteCount || a.answererName.localeCompare(b.answererName))
      .slice(0, 3);

    // Reverse for reveal order: 3rd → 2nd → 1st
    setPhase({ type: "results", ranked: [...sorted].reverse() });
  }

  // ── Grade submit handler ──
  async function handleSubmit() {
    if (!selectedGrade || phase.type !== "grade") return;
    stopBlockbusterAudio();
    stopBearsAudio();

    try {
      const promises: Promise<void>[] = [
        submitReaction(roomCode, slot, userName, {
          reaction: selectedGrade,
          bearsTierCompId: null,
        }),
      ];

      if (roastText.trim()) {
        promises.push(
          submitRoastAnswer(roomCode, slot, userName, {
            text: roastText.trim(),
            submittedAt: new Date().toISOString(),
            prompt: roastPrompt,
          }),
        );
      }

      await Promise.all(promises);
      submittedLocally.current = true;
      setPhase({ type: "leaderboard" });
    } catch {
      console.error("Failed to submit reaction");
    }
  }

  // ── Voting callbacks ──
  async function handleVoteSubmit(answererName: string) {
    await submitRoastVote(roomCode, slot, userName, answererName);
    // Brief delay lets other users' votes sync before tallying
    await new Promise((r) => setTimeout(r, 500));
    await transitionToResults();
  }

  async function handleVoteSkip() {
    await transitionToResults();
  }

  const hasPoints = scoreDelta && (scoreDelta.bracket > 0 || scoreDelta.live > 0);
  const isGradePhase = phase.type === "grade";

  return (
    <div className={`fixed inset-0 z-[70] bg-bg/95 flex flex-col items-center justify-start overflow-y-auto p-4 animate-fade-in-up ${isGradePhase ? "pb-80" : "pb-4"}`}>

      {/* ── Grade phase: pick info + chaos breakdown ── */}
      {phase.type === "grade" && (
        <>
          {/* Team + Pick header */}
          <div className="flex items-center gap-3 mb-4 mt-4">
            <img src={teamLogo} alt={teamAbbrev} className="w-10 h-10 object-contain" />
            <div>
              <p className="font-display text-2xl text-white tracking-wide">
                PICK #{slot}
              </p>
              <p className="font-condensed text-sm text-muted uppercase">{teamAbbrev}</p>
            </div>
          </div>

          {/* Player */}
          <div className="flex flex-col items-center mb-6">
            {headshot && (
              <img
                src={headshot}
                alt={playerName}
                className="w-24 h-24 rounded-full object-cover border-2 border-border mb-3"
              />
            )}
            <p className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              {playerName}
            </p>
            {prospect ? (
              <p className="font-condensed text-sm text-muted uppercase mt-1">
                {prospect.position} · {prospect.college}
              </p>
            ) : bt ? (
              <p className="font-condensed text-sm text-bears-orange uppercase mt-1">
                {bt.position} · TRADE from {bt.currentTeamAbbrev}
              </p>
            ) : null}
          </div>

          {/* Chaos description — skip if this was the top expected pick */}
          {!isTopExpected && (
            <div className="text-center mb-4">
              <p className={`font-display text-2xl sm:text-3xl tracking-wider ${colors.text}`}>
                {level === "MILD" ? "SLIGHT SURPRISE"
                  : level === "SPICY" ? "BIG SURPRISE"
                  : "NOBODY SAW THIS COMING"}
              </p>
              {tags.length > 0 && (
                <div className="flex gap-2 justify-center mt-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`font-condensed text-sm font-bold uppercase px-3 py-1 rounded border ${colors.text} ${colors.border}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full breakdown */}
          <div className={`rounded border ${colors.border} ${colors.bg} px-4 py-3 mb-6 w-full max-w-sm`}>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <span className="font-condensed text-muted uppercase text-xs">Odds</span>
              <span className={`font-mono text-right ${espnProb === 0 ? "text-red" : espnProb >= 50 ? "text-green" : "text-white"}`}>
                {espnProb > 0 ? `${espnProb}%` : "0%"}
              </span>

              <span className="font-condensed text-muted uppercase text-xs">Consensus</span>
              <span className="font-mono text-right text-white">
                {prospect ? `#${prospect.rank}` : "—"}
                {prospect && (
                  <span className={`ml-1 ${
                    rankDrift > 3 ? "text-red" : rankDrift < -3 ? "text-green" : "text-muted"
                  }`}>
                    ({rankDrift > 0 ? `+${rankDrift}` : rankDrift < 0 ? `${rankDrift}` : "exact"})
                  </span>
                )}
              </span>

              <span className="font-condensed text-muted uppercase text-xs">Need</span>
              <span className={`font-mono text-right text-xs ${
                needDesc.startsWith("Not") ? "text-red" : needDesc.startsWith("#1") ? "text-green" : "text-white"
              }`}>
                {needDesc}
              </span>
            </div>
          </div>

          {/* Score flash — current standing */}
          {userRank != null && leaderName && (
            <p className="font-condensed text-sm text-muted text-center mb-4">
              You're <span className="text-white font-bold">{ordinal(userRank)}</span>
              {userRank === 1
                ? ` (${leaderScore}pts)`
                : <>{" · "}Leader: <span className="text-amber font-bold">{leaderName}</span> ({leaderScore}pts)</>}
            </p>
          )}
        </>
      )}

      {/* ── Leaderboard flash (3s, dismissable) ── */}
      {phase.type === "leaderboard" && (
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-[280px] relative">
          <button
            onClick={advanceFromLeaderboard}
            className="absolute top-0 right-0 text-muted hover:text-white text-xl leading-none px-2 py-1 transition-colors"
            aria-label="Skip leaderboard"
          >
            ✕
          </button>
          {/* Big rank */}
          <p className={`font-display text-[96px] leading-none ${userRank === 1 ? "text-amber" : "text-muted"}`}>
            {userRank ? ordinal(userRank) : "—"}
          </p>
          <p className="font-condensed text-lg text-muted uppercase tracking-[4px] mb-7">
            YOUR RANK
          </p>

          {/* Score delta boxes */}
          <div className="flex gap-4 w-full mb-3">
            <div className={`flex-1 text-center py-3.5 rounded-lg border ${
              scoreDelta && scoreDelta.bracket > 0
                ? "bg-[#4a9eff]/10 border-[#4a9eff]/30"
                : "bg-surface-elevated border-border"
            }`}>
              <p className={`font-mono text-[32px] font-bold leading-none ${
                scoreDelta && scoreDelta.bracket > 0 ? "text-[#4a9eff]" : "text-muted"
              }`}>
                {scoreDelta && scoreDelta.bracket > 0 ? `+${scoreDelta.bracket}` : "--"}
              </p>
              <p className="font-condensed text-sm text-muted uppercase tracking-[2px] mt-1">BRACKET</p>
            </div>
            <div className={`flex-1 text-center py-3.5 rounded-lg border ${
              scoreDelta && scoreDelta.live > 0
                ? "bg-green/[0.08] border-green/25"
                : "bg-surface-elevated border-border"
            }`}>
              <p className={`font-mono text-[32px] font-bold leading-none ${
                scoreDelta && scoreDelta.live > 0 ? "text-green" : "text-muted"
              }`}>
                {scoreDelta && scoreDelta.live > 0 ? `+${scoreDelta.live}` : "--"}
              </p>
              <p className="font-condensed text-sm text-muted uppercase tracking-[2px] mt-1">LIVE</p>
            </div>
          </div>

          {/* Movement text */}
          {!hasPoints && (
            <p className="font-condensed text-lg font-bold text-muted uppercase tracking-[2px] mb-7">
              No points this pick
            </p>
          )}
          {hasPoints && <div className="mb-7" />}

          {/* Top 3 standings */}
          {top3 && top3.length > 0 && (
            <div className="w-full border border-border rounded-lg overflow-hidden">
              {top3.map((entry, i) => {
                const isYou = entry.name === userName;
                return (
                  <div
                    key={entry.name}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 ${
                      isYou ? "bg-amber/[0.06]" : ""
                    }`}
                  >
                    <span className={`font-mono text-base font-bold w-7 text-center ${
                      i === 0 ? "text-amber" : "text-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`font-condensed text-lg font-bold flex-1 ${
                      isYou ? "text-amber" : "text-white"
                    }`}>
                      {isYou ? "You" : entry.name}
                    </span>
                    <span className="font-mono text-lg font-bold text-amber">
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Voting phase ── */}
      {phase.type === "voting" && (
        <RoastVoting
          answers={phase.answers}
          userName={userName}
          onVote={handleVoteSubmit}
          onSkip={handleVoteSkip}
        />
      )}

      {/* ── Results reveal ── */}
      {phase.type === "results" && (
        <RoastResults
          ranked={phase.ranked}
          onComplete={onComplete}
        />
      )}

      {/* Pinned bottom: Roast + Grade + Submit (grade phase only) */}
      {phase.type === "grade" && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 pt-3.5 pb-4 z-[71]">
          {/* Roast prompt + input */}
          <div className="mb-3 max-w-sm mx-auto">
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="font-condensed text-sm text-amber uppercase tracking-wide font-bold">GM Roast</span>
              <span className="font-condensed text-xs text-muted">optional</span>
            </div>
            <p className="font-condensed text-lg text-white leading-snug mb-2">
              {roastPrompt}
            </p>
            <div className="relative">
              <textarea
                value={roastText}
                onChange={(e) => setRoastText(e.target.value.slice(0, ROAST_CHAR_LIMIT))}
                placeholder="Type your answer..."
                maxLength={ROAST_CHAR_LIMIT}
                rows={2}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                data-form-type="other"
                className={`w-full bg-bg border rounded-lg px-3.5 py-2.5 pr-16 text-white font-mono text-sm outline-none resize-none ${
                  roastText ? "border-amber" : "border-border-bright"
                } focus:border-amber`}
              />
              <span className={`absolute right-3 bottom-2.5 font-mono text-xs ${
                roastText ? "text-amber" : "text-muted"
              }`}>
                {roastText.length}/{ROAST_CHAR_LIMIT}
              </span>
            </div>
          </div>

          {/* Grade buttons */}
          <p className="font-condensed text-xs text-muted uppercase tracking-wider text-center mb-2">
            GRADE THIS PICK
          </p>
          <div className="flex gap-1.5 justify-center max-w-sm mx-auto flex-wrap mb-2.5">
            {GRADE_OPTIONS.map((opt) => {
              const isSelected = selectedGrade === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setSelectedGrade(opt)}
                  className={`flex-1 font-condensed text-xl font-bold uppercase py-2.5 rounded border transition-all ${
                    isSelected
                      ? "text-amber bg-amber/10 border-amber scale-105"
                      : "text-white bg-surface-elevated border-border-bright hover:border-white active:scale-95"
                  }`}
                >
                  {GRADE_LABELS[opt]}
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedGrade}
            className={`w-full max-w-sm mx-auto block font-condensed text-base font-bold uppercase tracking-wide py-3 rounded-lg transition-all ${
              selectedGrade
                ? "bg-green text-bg cursor-pointer hover:brightness-110"
                : "bg-border text-muted cursor-not-allowed opacity-50"
            }`}
          >
            SUBMIT
          </button>
        </div>
      )}
    </div>
  );
}
