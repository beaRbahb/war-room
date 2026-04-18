import { useEffect, useState, useMemo } from "react";
import type { BearsLegend } from "../../data/bearsBusts";

interface BearsIcedOverlayProps {
  legend: BearsLegend;
  onComplete: () => void;
}

/** Snowflake characters for crystalline look */
const FLAKE_CHARS = ["❄", "❆", "❅", "✻", "❄", "❆", "❅"];

interface Snowflake {
  id: number;
  char: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  sway: number;
  swayDur: number;
  swayDelay: number;
  spin: number;
}

interface CrackLine {
  id: number;
  d: string;
  len: number;
  delay: number;
  className: string;
}

/** Build a crack path from (startX, startY) toward center */
function buildCrack(
  startX: number, startY: number,
  W: number, H: number,
  segments: number, reachFactor: number,
): { d: string; len: number; points: [number, number][] } {
  const points: [number, number][] = [[startX, startY]];
  const centerX = W / 2;
  const centerY = H / 2;
  let x = startX;
  let y = startY;
  const maxReach = Math.min(W, H) * reachFactor;
  const segLen = maxReach / segments;

  for (let i = 0; i < segments; i++) {
    const angle = Math.atan2(centerY - y, centerX - x) + (Math.random() - 0.5) * 1.8;
    const len = segLen * (0.5 + Math.random() * 0.8);
    x = Math.max(5, Math.min(W - 5, x + Math.cos(angle) * len));
    y = Math.max(5, Math.min(H - 5, y + Math.sin(angle) * len));
    points.push([x, y]);
  }

  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    totalLen += Math.sqrt(dx * dx + dy * dy);
  }

  const d = "M " + points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  return { d, len: Math.ceil(totalLen), points };
}

/** Generate all crack paths for the viewport */
function generateCracks(W: number, H: number): CrackLine[] {
  const lines: CrackLine[] = [];
  let id = 0;

  const origins = [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H },
    { x: W * 0.3, y: 0 }, { x: W * 0.7, y: 0 },
    { x: 0, y: H * 0.4 }, { x: W, y: H * 0.6 },
    { x: W * 0.5, y: H }, { x: W * 0.15, y: 0 },
    { x: W * 0.85, y: H }, { x: 0, y: H * 0.7 }, { x: W, y: H * 0.25 },
  ];

  origins.forEach((origin, oi) => {
    const delayBase = 0.1 + oi * 0.08;

    // Main crack
    const main = buildCrack(origin.x, origin.y, W, H, 3 + Math.floor(Math.random() * 4), 0.35);
    lines.push({ id: id++, d: main.d, len: main.len, delay: delayBase, className: "thick" });

    // Branches
    const branches = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < branches; b++) {
      const bp = main.points[1 + Math.floor(Math.random() * (main.points.length - 2))];
      if (!bp) continue;
      const branch = buildCrack(bp[0], bp[1], W, H, 2 + Math.floor(Math.random() * 3), 0.2);
      lines.push({ id: id++, d: branch.d, len: branch.len, delay: delayBase + 0.3 + b * 0.15, className: "" });

      // Sub-branch
      if (Math.random() > 0.4 && branch.points.length > 2) {
        const sp = branch.points[1 + Math.floor(Math.random() * (branch.points.length - 2))];
        if (sp) {
          const sub = buildCrack(sp[0], sp[1], W, H, 2, 0.12);
          lines.push({ id: id++, d: sub.d, len: sub.len, delay: delayBase + 0.6, className: Math.random() > 0.5 ? "thin" : "hairline" });
        }
      }
    }
  });

  return lines;
}

/**
 * Full-screen "Iced Out" Bears legend overlay.
 * Cracking ice + snowflakes + player reveal → auto-dismiss.
 */
export default function BearsIcedOverlay({ legend, onComplete }: BearsIcedOverlayProps) {
  const [phase, setPhase] = useState<"frost" | "reveal" | "done">("frost");

  // Generate snowflakes once
  const snowflakes = useMemo<Snowflake[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      char: FLAKE_CHARS[Math.floor(Math.random() * FLAKE_CHARS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 7,
      size: 10 + Math.random() * 18,
      opacity: 0.25 + Math.random() * 0.55,
      sway: 8 + Math.random() * 25,
      swayDur: 2 + Math.random() * 3,
      swayDelay: Math.random() * 3,
      spin: 180 + Math.random() * 540,
    })),
  []);

  // Generate crack lines once
  const cracks = useMemo<CrackLine[]>(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    return generateCracks(W, H);
  }, []);

  // Phase timers
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1000);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" style={{ background: "#0b1f4a" }}>
      {/* Thin ice edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: "2px solid rgba(180, 220, 255, 0.15)",
          opacity: 0,
          animation: "iced-sheen-in 0.5s ease-out 0.2s forwards",
        }}
      />

      {/* Cracking ice SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        preserveAspectRatio="none"
        style={{ zIndex: 5 }}
      >
        {cracks.map((crack) => (
          <path
            key={crack.id}
            d={crack.d}
            fill="none"
            stroke={
              crack.className === "thick" ? "rgba(200, 235, 255, 0.7)"
              : crack.className === "thin" ? "rgba(180, 220, 255, 0.35)"
              : crack.className === "hairline" ? "rgba(180, 220, 255, 0.2)"
              : "rgba(180, 220, 255, 0.6)"
            }
            strokeWidth={
              crack.className === "thick" ? 2.5
              : crack.className === "thin" ? 0.8
              : crack.className === "hairline" ? 0.5
              : 1.5
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={crack.len}
            strokeDashoffset={crack.len}
            style={{
              animation: `iced-crack-draw ${0.3 + crack.len / 600}s ease-out ${crack.delay}s forwards`,
              filter: crack.className === "thick"
                ? "drop-shadow(0 0 6px rgba(180, 220, 255, 0.6))"
                : crack.className === "" ? "drop-shadow(0 0 3px rgba(180, 220, 255, 0.5))" : "none",
            }}
          />
        ))}
      </svg>

      {/* Snowflakes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 8 }}>
        {snowflakes.map((sf) => (
          <div
            key={sf.id}
            className="absolute"
            style={{
              left: `${sf.left}%`,
              animation: `iced-sway ${sf.swayDur}s ease-in-out ${sf.swayDelay}s infinite alternate`,
              ["--sway" as string]: `${sf.sway}px`,
            }}
          >
            <div
              className="absolute"
              style={{
                top: "-40px",
                fontSize: `${sf.size}px`,
                color: "rgba(200, 230, 255, 0.7)",
                opacity: 0,
                animation: `iced-snowfall ${sf.duration}s linear ${sf.delay}s forwards`,
                filter: "drop-shadow(0 0 3px rgba(180, 220, 255, 0.3))",
                ["--spin" as string]: `${sf.spin}deg`,
              }}
            >
              {sf.char}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {phase === "frost" && (
        <div className="relative z-10 animate-pulse">
          <p
            className="font-display text-3xl tracking-[0.3em]"
            style={{ color: "#b4dcff", textShadow: "0 0 20px rgba(180, 220, 255, 0.5)" }}
          >
            {legend.tagline}
          </p>
        </div>
      )}

      {phase === "reveal" && (
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
          <img
            src={legend.image}
            alt={legend.name}
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover mx-auto mb-4"
            style={{
              border: "3px solid rgba(180, 220, 255, 0.5)",
              boxShadow: "0 0 30px rgba(180, 220, 255, 0.25)",
            }}
          />
          <p
            className="font-display text-5xl sm:text-8xl tracking-wider leading-none"
            style={{ color: "#b4dcff", textShadow: "0 0 20px rgba(180, 220, 255, 0.4)" }}
          >
            {legend.name}
          </p>
          <p className="font-condensed text-xl sm:text-2xl text-white mt-3 uppercase tracking-wide">
            {legend.year} NFL Draft &middot; Pick #{legend.pick}
          </p>
          <div
            className="inline-block font-display text-2xl tracking-[0.2em] mt-5 px-6 py-1 rounded border-2"
            style={{
              color: "#b4dcff",
              borderColor: "rgba(180, 220, 255, 0.4)",
              textShadow: "0 0 12px rgba(180, 220, 255, 0.4)",
              animation: "iced-tag-pulse 1.5s ease-in-out infinite",
            }}
          >
            {legend.tagline}
          </div>
        </div>
      )}
    </div>
  );
}
