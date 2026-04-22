import { useEffect, useState } from "react";
import { TEAMS } from "../../data/teams";

interface ConfettiProps {
  /** Duration in ms before auto-remove */
  duration?: number;
  /** Extra-heavy Bears confetti for blockbuster moments */
  heavy?: boolean;
  /** Team abbreviation — uses that team's colors instead of Bears */
  teamAbbrev?: string;
  /** Called when confetti animation completes (after duration) */
  onComplete?: () => void;
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
  /** If set, render as a mini team logo instead of a colored shape */
  logoUrl?: string;
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

function generatePieces(heavy: boolean, colors: string[], logoUrl?: string): Piece[] {
  const count = heavy ? 2000 : 1000;
  return Array.from({ length: count }, (_, i) => {
    // ~8% of pieces become mini logos when a team logo is available
    const isLogo = logoUrl && Math.random() < 0.08;
    const size = isLogo ? 20 + Math.random() * 12 : undefined; // 20-32px logos
    return {
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * (heavy ? 2.5 : 1.5),
      width: size ?? (heavy ? 7 : 5) + Math.random() * (heavy ? 14 : 10),
      height: size ?? (heavy ? 6 : 4) + Math.random() * (heavy ? 18 : 14),
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: -40 + Math.random() * 80,
      speed: 2 + Math.random() * 2.5,
      spin: isLogo ? 30 + Math.random() * 60 : 360 + Math.random() * 720, // less spin for logos
      logoUrl: isLogo ? logoUrl : undefined,
    };
  });
}

/**
 * New Year's Eve confetti — 1000 pieces, lateral sway, varied shapes.
 * Fires on correct live guess.
 */
export default function Confetti({ duration, heavy = false, teamAbbrev, onComplete }: ConfettiProps) {
  const effectiveDuration = duration ?? (heavy ? 8000 : 5000);
  const [visible, setVisible] = useState(true);
  const [pieces] = useState<Piece[]>(() => {
    const colors = teamAbbrev
      ? getTeamColors(teamAbbrev)
      : heavy ? BEARS_HEAVY_COLORS : BEARS_COLORS;
    const logoUrl = teamAbbrev ? TEAMS[teamAbbrev]?.logo : undefined;
    return generatePieces(heavy, colors, logoUrl);
  });

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), effectiveDuration);
    return () => clearTimeout(t);
  }, [effectiveDuration]);

  // Fire onComplete callback after duration (with proper cleanup)
  useEffect(() => {
    if (!onComplete) return;
    const t = setTimeout(onComplete, effectiveDuration);
    return () => clearTimeout(t);
  }, [onComplete, effectiveDuration]);

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
            backgroundColor: p.logoUrl ? "transparent" : p.color,
            borderRadius: p.logoUrl ? 0 : p.width > 10 ? "50%" : "2px",
            opacity: 0,
            animation: `confetti-fall ${p.speed}s ease-in ${p.delay}s forwards`,
            ["--confetti-drift" as string]: `${p.drift}px`,
            ["--confetti-spin" as string]: `${p.spin}deg`,
          }}
        >
          {p.logoUrl && (
            <img
              src={p.logoUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          )}
        </div>
      ))}
    </div>
  );
}
