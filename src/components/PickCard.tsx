import { useEffect, useState } from "react";
import { DRAFT_ORDER } from "../data/draftOrder";
import { REACTION_EMOJI, REACTION_LABELS } from "../types";
import type {
  ConfirmedPick,
  UserReaction,
  ReactionType,
} from "../types";
import { onReactions, submitReaction, onGuesses } from "../lib/storage";
import { BEARS_TIER_COMPS, getCompsByTier } from "../data/bearsTiers";

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
  const [showBearsTier, setShowBearsTier] = useState(false);

  const slot = DRAFT_ORDER.find((s) => s.pick === pick.pick);
  const isBears = pick.isBearsPick;
  const myReaction = reactions[userName];

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

  function handleBearsTier(compId: string) {
    submitReaction(roomCode, pick.pick, userName, {
      reaction: myReaction?.reaction || "love",
      bearsTierCompId: compId,
    });
    setShowBearsTier(false);
  }

  // Aggregate reactions
  const reactionCounts: Record<ReactionType, number> = {
    love: 0, like: 0, meh: 0, bad: 0, hate: 0,
  };
  Object.values(reactions).forEach((r) => {
    reactionCounts[r.reaction]++;
  });

  // Live guess results
  const correctGuessers = Object.entries(guesses)
    .filter(([, player]) => player === pick.playerName)
    .map(([name]) => name);

  return (
    <div
      className={`bg-surface border rounded-lg p-4 animate-fade-in-up ${
        isBears ? "border-bears-orange" : "border-border"
      }`}
    >
      {/* Pick header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted">#{pick.pick}</span>
          <span className="font-condensed font-bold text-white uppercase">
            {slot?.abbrev || "??"}
          </span>
          {isBears && (
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

      {/* Player name */}
      <p className="font-display text-2xl text-amber tracking-wide mb-2">
        {pick.playerName}
      </p>

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
          {/* Reaction buttons */}
          {!myReaction && (
            <div className="flex gap-2 mb-2">
              {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className="flex-1 bg-surface-elevated border border-border rounded py-2 text-center hover:border-amber transition-colors"
                >
                  <span className="text-lg">{REACTION_EMOJI[type]}</span>
                  <span className="block font-condensed text-xs text-muted uppercase mt-0.5">
                    {REACTION_LABELS[type]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Aggregate tallies */}
          {Object.values(reactions).length > 0 && (
            <div className="flex gap-3 mb-2">
              {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) =>
                reactionCounts[type] > 0 ? (
                  <span key={type} className="font-mono text-sm text-white">
                    {REACTION_EMOJI[type]} {reactionCounts[type]}
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Individual reactions */}
          {Object.entries(reactions).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(reactions).map(([name, r]) => (
                <span
                  key={name}
                  className="font-mono text-xs bg-surface-elevated px-2 py-0.5 rounded text-muted"
                >
                  {name} {REACTION_EMOJI[r.reaction]}
                  {r.bearsTierCompId && (
                    <> {BEARS_TIER_COMPS.find((c) => c.id === r.bearsTierCompId)?.emoji}{" "}
                    {BEARS_TIER_COMPS.find((c) => c.id === r.bearsTierCompId)?.name}</>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Bears tier comp selector */}
          {isBears && myReaction && !myReaction.bearsTierCompId && (
            <button
              onClick={() => setShowBearsTier(true)}
              className="mt-2 font-condensed text-xs text-bears-orange uppercase hover:underline"
            >
              Pick a Bears comp...
            </button>
          )}

          {showBearsTier && (
            <div className="mt-2 bg-surface-elevated border border-bears-orange rounded-lg p-3">
              <p className="font-condensed text-sm text-bears-orange uppercase mb-2 font-bold">
                Bears Tier Comp
              </p>
              {(["goat", "great", "cursed"] as const).map((tier) => (
                <div key={tier} className="mb-2">
                  <p className="font-mono text-xs text-muted uppercase mb-1">
                    {tier === "goat" ? "\u{1F43B} GOAT" : tier === "great" ? "\u{1F525} GREAT" : "\u{1F480} CURSED"}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {getCompsByTier()[tier].map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => handleBearsTier(comp.id)}
                        className="bg-bg border border-border rounded px-2 py-1 font-condensed text-xs text-white hover:border-bears-orange transition-colors"
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
