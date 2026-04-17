import { useEffect, useState } from "react";
import { TEAMS } from "../../data/teams";

interface ConfettiProps {
  /** Duration in ms before auto-remove */
  duration?: number;
  /** Extra-heavy Bears confetti for blockbuster moments */
  heavy?: boolean;
  /** Team abbreviation — uses that team's colors instead of Bears */
  teamAbbrev?: string;
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

const BEARS_COLORS = [
  "#0b1f4a", // Bears navy
  "#e87722", // Bears orange
  "#FFD700", // Gold
  "#FFFFFF", // White
  "#0b1f4a",
  "#e87722",
  "#e87722",
  "#FFD700",
];

const BEARS_HEAVY_COLORS = [
  "#0b1f4a", "#0b1f4a", "#0b1f4a",
  "#e87722", "#e87722", "#e87722",
  "#FFD700",
  "#FFFFFF",
];

/** Build a weighted palette from a team's primary + secondary colors */
function getTeamColors(abbrev: string): string[] {
  const team = TEAMS[abbrev];
  if (!team) return BEARS_COLORS;
  const { color, color2 } = team;
  // Weighted: primary heavy, secondary medium, white accent
  return [color, color, color, color2, color2, "#FFFFFF"];
}

function generatePieces(heavy: boolean, colors: string[]): Piece[] {
  const count = heavy ? 2000 : 1000;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * (heavy ? 2.5 : 1.5),
    width: (heavy ? 7 : 5) + Math.random() * (heavy ? 14 : 10),
    height: (heavy ? 6 : 4) + Math.random() * (heavy ? 18 : 14),
    color: colors[Math.floor(Math.random() * colors.length)],
    drift: -40 + Math.random() * 80,
    speed: 2 + Math.random() * 2.5,
    spin: 360 + Math.random() * 720,
  }));
}

/**
 * New Year's Eve confetti — 1000 pieces, lateral sway, varied shapes.
 * Fires on correct live guess.
 */
export default function Confetti({ duration, heavy = false, teamAbbrev }: ConfettiProps) {
  const effectiveDuration = duration ?? (heavy ? 8000 : 5000);
  const [visible, setVisible] = useState(true);
  const [pieces] = useState<Piece[]>(() => {
    const colors = teamAbbrev
      ? getTeamColors(teamAbbrev)
      : heavy ? BEARS_HEAVY_COLORS : BEARS_COLORS;
    return generatePieces(heavy, colors);
  });

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), effectiveDuration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none overflow-hidden">
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
