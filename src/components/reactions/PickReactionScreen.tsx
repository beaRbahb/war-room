import { useEffect, useMemo, useRef, useState } from "react";
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
} from "../../lib/storage";
import { chaosLevelToTag, getPromptForPick } from "../../data/roastPrompts";
import type { UserReaction, ReactionType } from "../../types";
import {
  GRADE_LABELS,
  type GradeType,
} from "../../types";

const ROAST_CHAR_LIMIT = 120;

interface PickReactionScreenProps {
  slot: number;
  playerName: string;
  teamAbbrev: string;
  priorPicks: { position: string }[];
  roomCode: string;
  userName: string;
  onComplete: () => void;
}

const LEVEL_COLORS: Record<ChaosLevel, { text: string; border: string }> = {
  CHALK: { text: "text-muted", border: "border-muted/30" },
  MILD: { text: "text-amber", border: "border-amber/30" },
  SPICY: { text: "text-bears-orange", border: "border-bears-orange/30" },
  CHAOS: { text: "text-red", border: "border-red/30" },
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

export default function PickReactionScreen({
  slot, playerName, teamAbbrev, priorPicks,
  roomCode, userName, onComplete,
}: PickReactionScreenProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});
  const [selectedGrade, setSelectedGrade] = useState<ReactionType | null>(null);
  const [roastText, setRoastText] = useState("");

  // Guard to prevent double-submit race with onReactions listener
  const submittedLocally = useRef(false);

  // If user already reacted before this mount (e.g., page refresh), skip straight out.
  useEffect(() => {
    if (!submittedLocally.current && reactions[userName]) {
      console.log("[Roast] already-reacted guard fired — dismissing");
      onComplete();
    }
  }, [reactions, userName, onComplete]);

  const prospect = PROSPECTS.find((p) => p.name === playerName);
  const { level, tags } = calcChaosScore(slot, playerName, teamAbbrev, priorPicks);
  const espnProb = getPickProb(slot, playerName);

  const slotProbs = PICK_PROBS[slot] ?? {};
  const topProb = Math.max(0, ...Object.values(slotProbs));
  const isTopExpected = espnProb > 0 && espnProb >= topProb;
  const headshot = getHeadshot(playerName);
  const teamLogo = getTeamLogo(teamAbbrev);
  const colors = LEVEL_COLORS[level];

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

  // ── Grade submit handler ──
  async function handleSubmit() {
    if (!selectedGrade) return;
    submittedLocally.current = true;
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
    } catch {
      console.error("Failed to submit reaction");
    }
    onComplete();
  }

  /** Short need label for the stats strip */
  const shortNeed = needDesc.startsWith("#")
    ? needDesc.replace(/\s*\(.*\)/, "")
    : needDesc.startsWith("Not") ? "No" : "—";
  const needPosition = playerPosition ?? "";

  return (
    <div className="fixed inset-0 z-[70] bg-bg/95 flex flex-col items-center justify-start overflow-y-auto animate-fade-in-up pb-[220px]">

      {/* ── Grade phase: single card layout ── */}
      <div className="w-full px-3 pt-2">
        <div className="w-full bg-surface border border-border-bright rounded-xl overflow-hidden">
          {/* Card header: team + pick */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-surface-elevated border-b border-border">
            <img src={teamLogo} alt={teamAbbrev} className="w-9 h-9 object-contain" />
            <div className="flex-1">
              <p className="font-display text-2xl text-white tracking-wide leading-none">
                PICK #{slot}
              </p>
              <p className="font-condensed text-sm text-muted uppercase">{teamAbbrev}</p>
            </div>
          </div>

          {/* Player row */}
          <div className="flex gap-3.5 px-3.5 py-3.5 items-center">
            {headshot ? (
              <img
                src={headshot}
                alt={playerName}
                className="w-[68px] h-[68px] rounded-full object-cover border-2 border-border flex-shrink-0"
              />
            ) : (
              <div className="w-[68px] h-[68px] rounded-full bg-bg border-2 border-border flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display text-[26px] text-white tracking-wide leading-tight truncate">
                {playerName}
              </p>
              {prospect ? (
                <p className="font-condensed text-[15px] text-muted uppercase mt-0.5">
                  {prospect.position} · {prospect.college}
                  {prospect.height ? ` · ${prospect.height}` : ""}
                  {prospect.weight ? ` · ${prospect.weight} lbs` : ""}
                </p>
              ) : bt ? (
                <p className="font-condensed text-[15px] text-bears-orange uppercase mt-0.5">
                  {bt.position} · TRADE from {bt.currentTeamAbbrev}
                </p>
              ) : null}
              {prospect?.proComp && (
                <p className="font-condensed text-sm text-amber mt-0.5">
                  Comp: {prospect.proComp}
                </p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex border-t border-b border-border">
            <div className="flex-1 text-center py-2.5 border-r border-border">
              <p className="font-condensed text-[11px] text-muted uppercase tracking-wide">Odds</p>
              <p className={`font-mono text-lg font-bold ${espnProb === 0 ? "text-red" : espnProb >= 50 ? "text-green" : "text-white"}`}>
                {espnProb > 0 ? `${espnProb}%` : "0%"}
              </p>
            </div>
            <div className="flex-1 text-center py-2.5 border-r border-border">
              <p className="font-condensed text-[11px] text-muted uppercase tracking-wide">Rank</p>
              <p className="font-mono text-lg font-bold text-white">
                {prospect ? `#${prospect.rank}` : "—"}
              </p>
            </div>
            <div className="flex-[1.3] text-center py-2.5">
              <p className="font-condensed text-[11px] text-muted uppercase tracking-wide">Need</p>
              <p className={`font-mono text-base font-bold ${
                needDesc.startsWith("Not") ? "text-red" : needDesc.startsWith("#1") ? "text-green" : "text-white"
              }`}>
                {shortNeed}{needPosition ? ` (${needPosition})` : ""}
              </p>
            </div>
          </div>

          {/* Chaos tags — only for surprising picks (skip chalk + top-expected) */}
          {!isTopExpected && level !== "CHALK" && (
            <div className="px-3.5 py-2.5 border-b border-border">
              <p className={`font-display text-xl tracking-wider text-center ${colors.text}`}>
                {level === "MILD" ? "SLIGHT SURPRISE"
                  : level === "SPICY" ? "BIG SURPRISE"
                  : "NOBODY SAW THIS COMING"}
              </p>
              {tags.length > 0 && (
                <div className="flex gap-1.5 justify-center mt-1.5 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`font-condensed text-xs font-bold uppercase px-2.5 py-0.5 rounded border ${colors.text} ${colors.border}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grade buttons inside card */}
          <div className="px-3.5 py-3">
            <p className="font-condensed text-xs text-muted uppercase tracking-widest text-center mb-1.5">
              GRADE THIS PICK
            </p>
            <div className="flex gap-1.5">
              {GRADE_OPTIONS.map((opt) => {
                const isSelected = selectedGrade === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedGrade(opt)}
                    className={`flex-1 font-condensed text-xl font-bold uppercase py-2.5 rounded-md border transition-all ${
                      isSelected
                        ? "text-amber bg-amber/10 border-amber scale-105"
                        : "text-white bg-bg border-border-bright hover:border-white active:scale-95"
                    }`}
                  >
                    {GRADE_LABELS[opt]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned bottom: Roast + Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 pt-2.5 pb-4 z-[71]">
        <div className="max-w-sm mx-auto">
          {/* Roast prompt + input */}
          <div className="mb-2.5">
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="font-condensed text-[15px] text-amber uppercase tracking-wide font-bold">GM Roast</span>
              <span className="font-condensed text-xs text-muted">optional</span>
            </div>
            <p className="font-condensed text-[17px] text-white leading-snug mb-2">
              {roastPrompt}
            </p>
            <div className="relative">
              <input
                type="text"
                value={roastText}
                onChange={(e) => setRoastText(e.target.value.slice(0, ROAST_CHAR_LIMIT))}
                placeholder="Type your answer..."
                maxLength={ROAST_CHAR_LIMIT}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                data-form-type="other"
                className={`w-full bg-bg border rounded-lg px-3.5 py-3 pr-14 text-white font-mono text-sm outline-none ${
                  roastText ? "border-amber" : "border-border-bright"
                } focus:border-amber`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs ${
                roastText ? "text-amber" : "text-muted"
              }`}>
                {roastText.length}/{ROAST_CHAR_LIMIT}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedGrade}
            className={`w-full font-condensed text-[15px] font-bold uppercase tracking-widest py-3 rounded-lg transition-all ${
              selectedGrade
                ? "bg-green text-bg cursor-pointer hover:brightness-110"
                : "bg-border text-muted cursor-not-allowed opacity-50"
            }`}
          >
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
}
