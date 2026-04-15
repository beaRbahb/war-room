import { useEffect, useState, useMemo } from "react";

interface ConfettiProps {
  /** Duration in ms before auto-remove */
  duration?: number;
}

interface Piece {
  id: number;
  x: number;
  delay: number;
  width: number;
  height: number;
  color: string;
  drift: number;
  speed: number;
  spin: number;
}

const COLORS = [
  "#0b1f4a", // Bears navy
  "#e87722", // Bears orange
  "#FFD700", // Gold
  "#FFFFFF", // White
  "#0b1f4a",
  "#e87722",
  "#e87722",
  "#FFD700",
];

/**
 * New Year's Eve confetti — 200 pieces, lateral sway, varied shapes.
 * Fires on correct live guess.
 */
export default function Confetti({ duration = 5000 }: ConfettiProps) {
  const [visible, setVisible] = useState(true);

  const pieces: Piece[] = useMemo(
    () =>
      Array.from({ length: 200 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        width: 5 + Math.random() * 10,
        height: 4 + Math.random() * 14,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        drift: -40 + Math.random() * 80, // px lateral drift
        speed: 2 + Math.random() * 2.5, // seconds to fall
        spin: 360 + Math.random() * 720,
      })),
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.color,
            borderRadius: p.width > 10 ? "50%" : "2px",
            opacity: 0,
            animation: `confetti-fall ${p.speed}s ease-in ${p.delay}s forwards`,
            // CSS custom properties for per-piece drift and spin
            ["--confetti-drift" as string]: `${p.drift}px`,
            ["--confetti-spin" as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
