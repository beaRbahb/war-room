import { useState, useEffect, useRef } from "react";
import { BRACKET_LOCK_TIME } from "../../data/scoring";

interface RoomWelcomeProps {
  roomCode: string;
  isCommissioner: boolean;
  onDismiss: () => void;
}

/** Format draft date: "April 24 · 8:00 PM ET" */
function formatDraftDate(d: Date): string {
  const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "America/New_York" });
  const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: "America/New_York" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  return `${month} ${day} · ${time} ET`;
}

/** Draw filled position marker with label */
function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, label: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f5a623";
  ctx.fill();
  if (label) {
    ctx.globalAlpha = alpha + 0.2;
    ctx.font = `bold ${Math.round(r * 0.95)}px "Barlow Condensed", sans-serif`;
    ctx.fillStyle = "#0a0a0a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 0.5);
  }
  ctx.globalAlpha = 1;
}

function drawCenter(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.globalAlpha = 1;
}

function drawDefender(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 11px "Barlow Condensed", sans-serif';
  ctx.fillStyle = "#f5a623";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.globalAlpha = 1;
}

function drawRoute(ctx: CanvasRenderingContext2D, points: [number, number][], alpha: number, width: number) {
  if (points.length < 2) return;
  ctx.strokeStyle = "#f5a623";
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
  const last = points[points.length - 1], prev = points[points.length - 2];
  const a = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  ctx.beginPath();
  ctx.moveTo(last[0], last[1]);
  ctx.lineTo(last[0] - 10 * Math.cos(a - 0.4), last[1] - 10 * Math.sin(a - 0.4));
  ctx.moveTo(last[0], last[1]);
  ctx.lineTo(last[0] - 10 * Math.cos(a + 0.4), last[1] - 10 * Math.sin(a + 0.4));
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLOS(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, alpha: number) {
  ctx.strokeStyle = "#f5a623";
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawYardLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, alpha: number) {
  ctx.strokeStyle = "#f5a623";
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  const cx = (x1 + x2) / 2;
  for (const off of [-60, -30, 30, 60]) {
    const hx = cx + off;
    if (hx >= x1 && hx <= x2) {
      ctx.beginPath();
      ctx.moveTo(hx, y - 5);
      ctx.lineTo(hx, y + 5);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, size: number, alpha: number) {
  ctx.font = `${size}px "Barlow Condensed", sans-serif`;
  ctx.fillStyle = "#f5a623";
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

/** Draw Dagger play: Y go + Z 20yd in (strong side), X outside release go (weak), F flat */
function drawDagger(ctx: CanvasRenderingContext2D, cx: number, losY: number, scale: number, alpha: number) {
  const s = scale;
  const a = alpha;
  const aD = a * 0.55;

  drawLOS(ctx, cx - 110 * s, cx + 110 * s, losY, a * 0.4);

  // O-line
  drawPlayer(ctx, cx - 28 * s, losY + 12 * s, 7 * s, "T", a * 0.85);
  drawPlayer(ctx, cx - 14 * s, losY + 12 * s, 7 * s, "G", a * 0.85);
  drawCenter(ctx, cx, losY + 12 * s, 6 * s, a * 0.85);
  drawPlayer(ctx, cx + 14 * s, losY + 12 * s, 7 * s, "G", a * 0.85);
  drawPlayer(ctx, cx + 28 * s, losY + 12 * s, 7 * s, "T", a * 0.85);

  drawPlayer(ctx, cx, losY + 34 * s, 8 * s, "QB", a);
  drawPlayer(ctx, cx - 16 * s, losY + 48 * s, 6 * s, "F", a * 0.8);

  // Strong side: Y inside go, Z outside 20yd in
  drawPlayer(ctx, cx + 50 * s, losY - 6 * s, 7 * s, "Y", a);
  drawPlayer(ctx, cx + 80 * s, losY - 6 * s, 7 * s, "Z", a);
  // Weak side: X outside release go
  drawPlayer(ctx, cx - 90 * s, losY - 6 * s, 7 * s, "X", a);

  // Routes
  drawRoute(ctx, [[cx + 50 * s, losY - 6 * s], [cx + 50 * s, losY - 65 * s]], a, 3 * s);
  drawRoute(ctx, [[cx + 80 * s, losY - 6 * s], [cx + 80 * s, losY - 50 * s], [cx + 40 * s, losY - 50 * s]], a, 3 * s);
  drawRoute(ctx, [[cx - 90 * s, losY - 6 * s], [cx - 96 * s, losY - 20 * s], [cx - 96 * s, losY - 60 * s]], a, 3 * s);
  drawRoute(ctx, [[cx - 16 * s, losY + 48 * s], [cx - 16 * s, losY + 38 * s], [cx - 55 * s, losY + 32 * s]], a * 0.7, 2.5 * s);

  // Defenders
  drawDefender(ctx, cx + 70 * s, losY - 22 * s, "C", aD);
  drawDefender(ctx, cx - 80 * s, losY - 22 * s, "C", aD);
  drawDefender(ctx, cx + 20 * s, losY - 8 * s, "S", aD);
  drawDefender(ctx, cx - 30 * s, losY - 8 * s, "W", aD);
  drawDefender(ctx, cx - 50 * s, losY - 4 * s, "E", aD * 0.8);
  drawDefender(ctx, cx + 40 * s, losY - 4 * s, "E", aD * 0.8);
  drawDefender(ctx, cx, losY - 18 * s, "M", aD);
  drawDefender(ctx, cx + 10 * s, losY - 45 * s, "FS", aD * 0.8);
}

function renderFormation(canvas: HTMLCanvasElement) {
  const W = canvas.parentElement!.offsetWidth;
  const H = canvas.parentElement!.offsetHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const cx = W / 2;
  const losY = H * 0.62;
  drawYardLine(ctx, cx - 200, cx + 200, losY - 50, 0.04);
  drawYardLine(ctx, cx - 200, cx + 200, losY + 50, 0.04);
  drawDagger(ctx, cx, losY, 1.15, 0.35);
  drawLabel(ctx, cx, losY - 75, "DAGGER", 14, 0.22);
}

/**
 * Full-page onboarding shown on first visit to a room.
 * Commissioner sees 3 cards (share → bracket → draft night).
 * Non-commissioner sees 2 cards (bracket → draft night).
 */
export default function RoomWelcome({ roomCode, isCommissioner, onDismiss }: RoomWelcomeProps) {
  const [copied, setCopied] = useState(false);
  const [draftSoon] = useState(() => BRACKET_LOCK_TIME.getTime() - Date.now() <= 30 * 60 * 1000);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = `${window.location.origin}/join/${roomCode}`;
  const draftDateStr = formatDraftDate(BRACKET_LOCK_TIME);

  // Draw formation canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    renderFormation(canvasRef.current);
    const onResize = () => canvasRef.current && renderFormation(canvasRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleShare() {
    const shareData = {
      title: "Join my War Room draft!",
      text: `Predict Round 1 of the NFL Draft. Room code: ${roomCode}`,
      url: shareUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Grid columns: commissioner gets 3 cards, joiner gets 2
  const gridCols = isCommissioner
    ? "grid-cols-1 md:grid-cols-[1fr_48px_1fr_48px_1fr]"
    : "grid-cols-1 md:grid-cols-[1fr_48px_1fr]";

  return (
    <div className="fixed inset-0 z-50 bg-bg/98 overflow-auto px-4">
      <div className="w-full max-w-[1060px] mx-auto py-8 md:py-12 md:min-h-full md:flex md:flex-col md:justify-center">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-display text-4xl sm:text-5xl text-amber tracking-wide war-room-title mb-2">
            WAR ROOM
          </h1>
          <p className="font-condensed text-sm text-muted uppercase tracking-widest">
            {isCommissioner ? "Your room is ready" : "You're in"}
          </p>
        </div>

        {/* Dagger formation — desktop only */}
        <div className="hidden md:block relative w-full h-[130px] mb-2">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Cards */}
        <div className={`grid ${gridCols} gap-4 md:gap-0 max-w-[1000px] mx-auto items-stretch`}>

          {/* ═══ SHARE YOUR ROOM (commissioner only) ═══ */}
          {isCommissioner && (
            <>
              <div
                className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
                style={{ animation: "fade-in-up 0.6s ease-out 0.2s forwards" }}
              >
                <h2 className="font-display text-xl text-white tracking-wide mb-3.5">
                  SHARE YOUR ROOM
                </h2>

                {/* Black box: Room code */}
                <div className="bg-bg border border-border rounded-md px-3.5 py-3.5 text-center mb-3.5 min-h-[138px] flex flex-col justify-center">
                  <p className="font-condensed text-[9px] text-muted uppercase tracking-[0.15em] mb-0.5">Room Code</p>
                  <p className="font-mono text-[26px] text-amber font-bold tracking-[0.12em] leading-tight">{roomCode}</p>
                </div>

                <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
                  No app. Just your group chat.
                </p>
                <p className="font-condensed text-[13px] text-muted leading-relaxed mb-4">
                  Send the invite — they tap the link, enter their name, and they're in.
                </p>

                <button
                  onClick={handleShare}
                  className="w-full mt-auto bg-surface-elevated text-white font-condensed font-bold uppercase tracking-wide text-xs border border-border-bright py-2.5 rounded-md hover:border-amber hover:text-amber transition-colors"
                >
                  {copied ? "LINK COPIED!" : "SHARE INVITE"}
                </button>
              </div>

              {/* Gap */}
              <div className="hidden md:block" />
            </>
          )}

          {/* ═══ FILL YOUR BRACKET ═══ */}
          <div
            className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
            style={{ animation: `fade-in-up 0.6s ease-out ${isCommissioner ? "0.55s" : "0.2s"} forwards` }}
          >
            <h2 className="font-display text-xl text-white tracking-wide mb-3.5">
              FILL YOUR BRACKET
            </h2>

            {/* Black box: Mini bracket preview */}
            <div className="bg-bg border border-border rounded-md overflow-hidden mb-3.5 min-h-[138px] flex flex-col justify-center">
              {[
                { pick: 1, team: "LV", player: "Fernando Mendoza", need: "QB" },
                { pick: 2, team: "NYJ", player: "Arvell Reese", need: "EDGE" },
                { pick: 3, team: "ARI", player: null, need: null },
                { pick: 4, team: "TEN", player: null, need: null },
              ].map((row) => (
                <div
                  key={row.pick}
                  className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60 last:border-b-0"
                >
                  <span className="font-mono text-[10px] text-muted w-3.5 text-right shrink-0">{row.pick}</span>
                  <span className="font-condensed text-xs text-white uppercase font-semibold w-8">{row.team}</span>
                  <span className={`font-mono text-[11px] flex-1 ${row.player ? "text-white font-semibold" : "text-muted"}`}>
                    {row.player ?? "— Select player —"}
                  </span>
                  {row.need && (
                    <span className="font-condensed text-[9px] font-bold uppercase px-1 py-px rounded-sm bg-amber/12 text-amber border border-amber/20">
                      {row.need}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
              Call your shot on all 32 picks.
            </p>
            <p className="font-condensed text-[13px] text-muted leading-relaxed mb-4">
              Real draft odds, team needs, and scouting intel to guide you. Lock in your predictions before draft night — then we find out who knows ball.
            </p>

            <button
              onClick={onDismiss}
              className="w-full mt-auto bg-amber text-bg font-condensed font-bold uppercase tracking-wide text-sm py-3 rounded-md hover:brightness-110 transition-all"
            >
              FILL YOUR BRACKET →
            </button>
          </div>

          {/* Gap */}
          <div className="hidden md:block" />

          {/* ═══ DRAFT NIGHT ═══ */}
          <div
            className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
            style={{ animation: `fade-in-up 0.6s ease-out ${isCommissioner ? "0.9s" : "0.55s"} forwards` }}
          >
            <h2 className="font-display text-xl text-white tracking-wide mb-3.5">
              DRAFT NIGHT
            </h2>

            {/* Black box: Date + On the Clock preview */}
            <div className="bg-bg border border-border rounded-md overflow-hidden mb-3.5 min-h-[138px] flex flex-col">
              {/* Date strip */}
              <div className="px-3.5 py-2 border-b border-border text-center">
                <p className="font-condensed text-[10px] text-muted uppercase tracking-[0.12em]">{draftDateStr}</p>
              </div>
              {/* On the Clock moment */}
              <div className="px-3.5 py-3 text-center flex-1 flex flex-col justify-center">
                <p className="font-condensed text-[10px] text-amber uppercase tracking-[0.15em] font-bold mb-1.5">On The Clock</p>
                <p className="font-display text-xl sm:text-2xl text-white tracking-wide leading-none">ARIZONA CARDINALS</p>
                <p className="font-condensed text-[11px] text-muted mt-1">Pick #3 · Round 1</p>
                {/* Timer bar */}
                <div className="mt-2.5 bg-border rounded-sm h-1.5 overflow-hidden">
                  <div className="w-[65%] h-full bg-amber rounded-sm" />
                </div>
                <p className="font-mono text-[10px] text-amber mt-1">6:32 remaining</p>
              </div>
            </div>

            <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
              Every pick is a fresh chance.
            </p>
            <p className="font-condensed text-[13px] text-muted leading-relaxed mb-4">
              Unlike a mock draft that falls apart after pick 3 — here you guess each selection live as it happens. The board updates in real time. 32 picks, 32 chances to be right.
            </p>

            {draftSoon ? (
              <button
                onClick={onDismiss}
                className="w-full mt-auto bg-green text-bg font-condensed font-bold uppercase tracking-wide text-xs py-2.5 rounded-md hover:brightness-110 transition-all"
              >
                ENTER THE DRAFT
              </button>
            ) : (
              <button
                disabled
                className="w-full mt-auto bg-bg text-muted font-condensed font-bold uppercase tracking-wide text-xs border border-border py-2.5 rounded-md cursor-not-allowed opacity-45"
              >
                AVAILABLE DRAFT NIGHT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
