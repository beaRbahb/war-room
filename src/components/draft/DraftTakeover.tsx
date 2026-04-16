import { useEffect } from "react";

interface DraftTakeoverProps {
  onComplete: () => void;
}

export default function DraftTakeover({ onComplete }: DraftTakeoverProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[95] bg-bg flex flex-col items-center justify-center">
      <h1 className="font-display text-5xl sm:text-7xl text-amber tracking-wider animate-pulse war-room-title">
        THE DRAFT IS LIVE
      </h1>
      <p className="font-condensed text-lg text-muted uppercase tracking-wide mt-4">
        Brackets are locked — time to predict live picks
      </p>
    </div>
  );
}
