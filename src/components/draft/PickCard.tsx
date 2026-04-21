import { useEffect, useState } from "react";
import { DRAFT_ORDER } from "../../data/draftOrder";
import {
  GRADE_LABELS, GRADE_COLORS,
} from "../../types";
import type {
  ConfirmedPick,
  UserReaction,
  ReactionType,
  GradeType,
} from "../../types";
import { onReactions, submitReaction, onGuesses } from "../../lib/storage";
import { getTeamLogo } from "../../data/teams";
import { getHeadshot } from "../../lib/headshots";
import ChaosMeter from "../chaos/ChaosMeter";

interface PickCardProps {
  pick: ConfirmedPick;
  roomCode: string;
  userName: string;
  /** All user brackets for scoring display */
  bracketHits: { name: string; points: number }[];
  /** Whether reactions are unlocked (after reveal pause) */
  reactionsUnlocked: boolean;
}

export default function PickCard({
  pick,
  roomCode,
  userName,
  bracketHits,
  reactionsUnlocked,
}: PickCardProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});
  const [guesses, setGuesses] = useState<Record<string, string>>({});

  const slot = DRAFT_ORDER.find((s) => s.pick === pick.pick);
  const myReaction = reactions[userName];
  const teamLogo = getTeamLogo(pick.teamAbbrev);
  const headshot = getHeadshot(pick.playerName);

  useEffect(() => {
    const unsub1 = onReactions(roomCode, pick.pick, setReactions);
    const unsub2 = onGuesses(roomCode, pick.pick, setGuesses);
    return () => { unsub1(); unsub2(); };
  }, [roomCode, pick.pick]);

  function handleReaction(type: ReactionType) {
    if (myReaction) return; // already reacted
    submitReaction(roomCode, pick.pick, userName, {
      reaction: type,
      bearsTierCompId: null,
    });
  }

  // Aggregate reactions
  const totalReactions = Object.values(reactions).length;

  const gradeCounts: Record<GradeType, number> = { "a-plus": 0, a: 0, b: 0, c: 0, d: 0, f: 0 };
  Object.values(reactions).forEach((r) => {
    if (r.reaction in gradeCounts) gradeCounts[r.reaction as GradeType]++;
  });

  // Live guess results
  const correctGuessers = Object.entries(guesses)
    .filter(([, player]) => player === pick.playerName)
    .map(([name]) => name);

  return (
    <div
      className={`bg-surface border rounded-lg p-4 animate-fade-in-up ${
        pick.isBearsPick ? "border-bears-orange" : "border-border"
      }`}
    >
      {/* Pick header + player */}
      <div className="flex gap-3 mb-2">
        {/* Headshot */}
        {headshot ? (
          <img
            src={headshot}
            alt={pick.playerName}
            className="w-14 h-14 rounded-lg object-cover bg-surface-elevated flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-surface-elevated flex-shrink-0 flex items-center justify-center">
            <span className="font-mono text-xs text-muted">?</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Team + pick number row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {teamLogo && (
                <img src={teamLogo} alt={slot?.abbrev} className="w-5 h-5 object-contain" />
              )}
              <span className="font-mono text-sm text-muted">#{pick.pick}</span>
              <span className="font-condensed font-bold text-white uppercase">
                {slot?.abbrev || "??"}
              </span>
              {pick.isBearsPick && (
                <span className="bg-bears-navy text-bears-orange font-condensed text-xs font-bold px-2 py-0.5 rounded uppercase">
                  DA BEARS
                </span>
              )}
            </div>
            {slot?.fromTeam && (
              <span className="font-mono text-xs text-muted">
                via {slot.fromTeam}
              </span>
            )}
          </div>

          {/* Player name + chaos */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-2xl text-amber tracking-wide">
              {pick.playerName}
            </p>
            <ChaosMeter slot={pick.pick} playerName={pick.playerName} />
          </div>
        </div>
      </div>

      {/* Correct guessers */}
      {correctGuessers.length > 0 && (
        <div className="mb-2">
          {correctGuessers.map((name) => (
            <span
              key={name}
              className="inline-block bg-green/10 text-green font-condensed font-bold text-xs uppercase px-2 py-0.5 rounded mr-1 mb-1"
            >
              {"\u{1F3AF}"} {name} NAILED IT
            </span>
          ))}
        </div>
      )}

      {/* Bracket hits */}
      {bracketHits.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {bracketHits.map((hit) => (
            <span
              key={hit.name}
              className="font-mono text-xs text-green bg-green/10 px-2 py-0.5 rounded"
            >
              {hit.name} +{hit.points}
            </span>
          ))}
        </div>
      )}

      {/* Live guesses summary */}
      {Object.keys(guesses).length > 0 && (
        <div className="mb-3 border-t border-border pt-2">
          <p className="font-condensed text-xs text-muted uppercase mb-1">
            Live Guesses
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(guesses).map(([name, player]) => (
              <span
                key={name}
                className={`font-mono text-xs px-2 py-0.5 rounded ${
                  player === pick.playerName
                    ? "bg-green/10 text-green"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                {name}: {player}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reactions */}
      {reactionsUnlocked && (
        <div className="border-t border-border pt-3">
          {/* Letter grade buttons */}
          {!myReaction && (
            <div className="flex gap-2 mb-2">
              {(Object.keys(GRADE_LABELS) as GradeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`flex-1 border rounded py-2 font-display text-lg tracking-wide text-center transition-colors hover:brightness-125 ${GRADE_COLORS[type]}`}
                >
                  {GRADE_LABELS[type]}
                </button>
              ))}
            </div>
          )}

          {/* Grade results */}
          {totalReactions > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {(Object.keys(GRADE_LABELS) as GradeType[]).map((type) => {
                if (gradeCounts[type] === 0) return null;
                const pct = Math.round((gradeCounts[type] / totalReactions) * 100);
                return (
                  <span
                    key={type}
                    className={`font-condensed text-sm font-bold border rounded px-2 py-0.5 ${GRADE_COLORS[type]} ${
                      myReaction?.reaction === type ? "ring-1 ring-white/30" : ""
                    }`}
                  >
                    {GRADE_LABELS[type]} {pct}%
                  </span>
                );
              })}
              <span className="font-mono text-xs text-muted self-center">
                {totalReactions} vote{totalReactions !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
