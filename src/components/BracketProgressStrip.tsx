interface BracketProgressStripProps {
  filled: number;
  total: number;
}

export default function BracketProgressStrip({ filled, total }: BracketProgressStripProps) {
  const pct = Math.round((filled / total) * 100);
  const isComplete = filled >= total;

  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-2">
      <span className="font-condensed text-xs text-muted uppercase tracking-wide shrink-0">
        Bracket
      </span>
      <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? "bg-green" : "bg-amber"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`font-mono text-xs shrink-0 ${
          isComplete ? "text-green" : "text-muted"
        }`}
      >
        {filled}/{total}
      </span>
    </div>
  );
}
