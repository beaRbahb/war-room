import { useRef, useEffect } from "react";

/**
 * Tecmo Bowl canvas animation — Bears offense (Dagger) vs Packers defense (Fire Zone 3).
 * Ported from SKODcast Intelligence. Renders as a full-screen background canvas.
 */
export default function TecmoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // -- TIMING --
    const LOOP = 8.5;
    const SNAP = 1.8;
    const THROW_T = 2.4;
    const CATCH_T = 3.3;
    const FADE = 0.7;

    // -- SPRITES --
    const PX = 3;
    // 5w x 6h, 0=clear 1=helmet 2=jersey 3=pants 4=skin
    const SP_R = [
      [[0,0,1,1,0],[0,2,2,2,2],[0,2,2,2,0],[0,0,3,3,0],[0,4,0,0,4],[0,0,0,0,0]],
      [[0,0,1,1,0],[0,2,2,2,2],[0,2,2,2,0],[0,0,3,3,0],[0,0,4,4,0],[0,0,0,0,0]],
      [[0,0,1,1,0],[0,2,2,2,2],[0,2,2,2,0],[0,0,3,3,0],[0,4,0,4,0],[0,0,0,0,0]],
    ];
    const SP_L = SP_R.map(f => f.map(r => [...r].reverse()));
    const SP_D = [
      [[0,1,1,1,0],[0,2,2,2,0],[0,2,2,2,0],[0,3,0,3,0],[0,4,0,4,0],[0,0,0,0,0]],
      [[0,1,1,1,0],[0,2,2,2,0],[0,2,2,2,0],[0,0,3,0,0],[4,0,0,0,4],[0,0,0,0,0]],
    ];
    const SP_U = [
      [[0,1,1,1,0],[0,2,2,2,0],[0,2,2,2,0],[0,3,0,3,0],[0,4,0,4,0],[0,0,0,0,0]],
      [[0,1,1,1,0],[0,2,2,2,0],[0,2,2,2,0],[0,0,3,0,0],[4,0,0,0,4],[0,0,0,0,0]],
    ];

    // Bears: orange helmet, navy jersey, white pants, skin
    const TEAM_OFF = ["#E64100", "#0B162A", "#e8e8e8", "#c8956c"];
    // Packers: gold helmet, green jersey, gold pants, skin
    const TEAM_DEF = ["#FFB612", "#203731", "#FFB612", "#c8956c"];

    function drawSprite(
      x: number, y: number,
      spriteFrames: number[][][], frame: number,
      colors: string[], alpha: number,
    ) {
      const sp = spriteFrames[frame % spriteFrames.length];
      ctx!.globalAlpha = alpha;
      for (let r = 0; r < sp.length; r++)
        for (let c = 0; c < sp[r].length; c++) {
          const v = sp[r][c];
          if (!v) continue;
          ctx!.fillStyle = colors[v - 1];
          ctx!.fillRect(Math.round(x + c * PX), Math.round(y + r * PX), PX, PX);
        }
    }

    // -- FIELD --
    function drawField(alpha: number) {
      const w = window.innerWidth, h = window.innerHeight;
      ctx!.globalAlpha = alpha;
      ctx!.strokeStyle = "#fff";
      const top = h * 0.13;
      const bot = h * 0.87;
      const yardW = w / 12;

      ctx!.lineWidth = 1.5;
      for (let i = 1; i < 12; i++) {
        const x = i * yardW;
        ctx!.beginPath(); ctx!.moveTo(x, top); ctx!.lineTo(x, bot); ctx!.stroke();
      }
      ctx!.lineWidth = 2;
      ctx!.beginPath(); ctx!.moveTo(0, top); ctx!.lineTo(w, top); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(0, bot); ctx!.lineTo(w, bot); ctx!.stroke();

      const h1 = h * 0.38, h2 = h * 0.62, hl = 6;
      ctx!.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const bx = i * yardW;
        for (let j = 1; j <= 4; j++) {
          const x = bx + j * (yardW / 5);
          ctx!.beginPath(); ctx!.moveTo(x, h1 - hl); ctx!.lineTo(x, h1 + hl); ctx!.stroke();
          ctx!.beginPath(); ctx!.moveTo(x, h2 - hl); ctx!.lineTo(x, h2 + hl); ctx!.stroke();
        }
      }
      ctx!.font = 'bold 12px "JetBrains Mono", monospace';
      ctx!.fillStyle = "#fff";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      const nums = ["G","10","20","30","40","50","40","30","20","10","G"];
      for (let i = 1; i < 12; i++) {
        ctx!.fillText(nums[(i - 1) % nums.length], i * yardW, top + h * 0.07);
        ctx!.fillText(nums[(i - 1) % nums.length], i * yardW, bot - h * 0.07);
      }
    }

    // -- BALL --
    function drawBall(x: number, y: number, alpha: number) {
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = "#8B4513";
      ctx!.fillRect(Math.round(x), Math.round(y), PX * 2, PX);
      ctx!.fillRect(Math.round(x - 1), Math.round(y + PX), PX * 2 + 2, PX);
      ctx!.fillRect(Math.round(x), Math.round(y + PX * 2), PX * 2, PX);
      ctx!.fillStyle = "#fff";
      ctx!.fillRect(Math.round(x + 1), Math.round(y + PX), PX * 2 - 1, 1);
    }

    // -- PLAY DATA --
    type Pt = [number, number, number]; // [t, x, y]
    type Player = { team: "off" | "def"; pts: Pt[] };

    function buildPlay(): Player[] {
      const p: Player[] = [];
      const off = (pts: Pt[]) => p.push({ team: "off", pts });
      const def = (pts: Pt[]) => p.push({ team: "def", pts });

      // Offense (Shotgun Trips — Dagger)
      off([[0,0,-60],[.4,18,-62],[5,20,-62]]);
      off([[0,0,-30],[.4,18,-30],[5,20,-30]]);
      off([[0,0,0],[.4,18,0],[5,20,0]]);
      off([[0,0,30],[.4,18,30],[5,20,30]]);
      off([[0,0,60],[.4,18,62],[5,20,62]]);
      // QB
      off([[0,-75,0],[.5,-115,0],[THROW_T,-110,0],[THROW_T+.3,-95,5],[5,-95,5]]);
      // RB
      off([[0,-65,35],[.3,-45,38],[.8,-20,50],[1.8,40,85],[3,120,115],[5,200,130]]);
      // X WR — go route
      off([[0,0,-200],[.4,30,-200],[1,110,-200],[2,230,-200],[3,360,-200],[5,500,-200]]);
      // H Slot — go route
      off([[0,0,120],[.3,25,118],[1,110,115],[2,230,110],[3,360,105],[5,500,100]]);
      // Z WR — 20-yd in route (primary read, ball goes here)
      off([[0,0,200],[.4,30,200],[1.5,200,200],[2,240,195],[2.4,270,150],[CATCH_T,300,80],[3.8,360,40],[5,430,20]]);
      // Y TE — flat
      off([[0,-10,78],[.3,15,78],[.8,50,82],[1.5,100,100],[2.5,150,125],[5,200,135]]);

      // Defense (Fire Zone 3)
      def([[0,22,-52],[.4,0,-56],[1,-35,-62],[2,-70,-68],[3.5,-95,-70],[5,-95,-70]]);
      def([[0,22,-18],[.4,5,-18],[1,-20,-14],[2,-55,-8],[3.5,-78,-5],[5,-78,-5]]);
      def([[0,22,18],[.4,5,18],[1,-20,14],[2,-55,8],[3.5,-75,5],[5,-75,5]]);
      def([[0,22,52],[.4,0,56],[1,-30,62],[2,-65,68],[3.5,-90,70],[5,-90,70]]);
      // WLB blitz
      def([[0,55,-42],[.3,40,-40],[.7,15,-35],[1.2,-15,-28],[2,-55,-15],[3,-85,-8],[5,-100,-5]]);
      // MLB hook zone
      def([[0,55,0],[.3,60,0],[.8,80,-5],[1.5,120,-10],[2.5,170,0],[3.5,200,5],[5,200,5]]);
      // SLB flat zone
      def([[0,55,48],[.3,60,55],[.8,75,70],[1.5,95,90],[2.5,120,105],[5,140,110]]);
      // CB1 deep third
      def([[0,25,-200],[.3,45,-200],[1,120,-200],[2,230,-200],[3,360,-200],[5,480,-200]]);
      // CB2 deep third
      def([[0,25,200],[.3,45,200],[1,140,200],[1.8,200,200],[2.4,260,175],[3,310,120],[5,400,60]]);
      // FS deep middle
      def([[0,145,0],[.3,150,10],[1,175,40],[1.8,220,65],[2.5,280,80],[3.5,350,90],[5,420,95]]);
      // SS flat dropper
      def([[0,100,70],[.3,105,75],[.8,115,85],[1.5,130,98],[2.5,150,108],[5,165,115]]);

      return p;
    }

    // -- INTERPOLATION --
    function smooth(t: number) { return t * t * (3 - 2 * t); }

    function lerp(pts: Pt[], t: number) {
      if (t <= pts[0][0]) return { x: pts[0][1], y: pts[0][2] };
      const last = pts[pts.length - 1];
      if (t >= last[0]) return { x: last[1], y: last[2] };
      for (let i = 0; i < pts.length - 1; i++) {
        if (t >= pts[i][0] && t <= pts[i + 1][0]) {
          const s = smooth((t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
          return {
            x: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * s,
            y: pts[i][2] + (pts[i + 1][2] - pts[i][2]) * s,
          };
        }
      }
      return { x: pts[0][1], y: pts[0][2] };
    }

    function facing(pts: Pt[], t: number) {
      const a = lerp(pts, t), b = lerp(pts, t + 0.06);
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return "r";
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "d" : "u");
    }

    function getFrames(dir: string) {
      switch (dir) {
        case "l": return SP_L;
        case "u": return SP_U;
        case "d": return SP_D;
        default: return SP_R;
      }
    }

    function ballPos(players: Player[], t: number, scale: number, cx: number, cy: number) {
      const qb = players[5], receiver = players[9];
      if (t < THROW_T) {
        const p = lerp(qb.pts, t);
        return { x: cx + p.x * scale + PX * 3, y: cy + p.y * scale + PX, visible: t > 0, inFlight: false };
      }
      if (t < CATCH_T) {
        const qbPos = lerp(qb.pts, THROW_T);
        const recPos = lerp(receiver.pts, CATCH_T);
        const frac = (t - THROW_T) / (CATCH_T - THROW_T);
        const s = smooth(frac);
        const bx = qbPos.x + (recPos.x - qbPos.x) * s;
        const by = qbPos.y + (recPos.y - qbPos.y) * s;
        const arc = -40 * Math.sin(frac * Math.PI);
        return { x: cx + bx * scale + PX, y: cy + by * scale + arc * scale * 0.5, visible: true, inFlight: true };
      }
      const p = lerp(receiver.pts, t);
      return { x: cx + p.x * scale + PX * 2, y: cy + p.y * scale + PX, visible: true, inFlight: false };
    }

    // -- MAIN LOOP --
    let raf: number | null = null;
    const startTime = performance.now();
    const players = buildPlay();

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000;
      const loopT = elapsed % LOOP;
      const w = window.innerWidth, h = window.innerHeight;
      ctx!.clearRect(0, 0, w, h);

      let ma = 1;
      if (loopT < FADE) ma = loopT / FADE;
      else if (loopT > LOOP - FADE) ma = (LOOP - loopT) / FADE;
      ma = smooth(ma);

      drawField(0.06 * ma);

      const playT = loopT - SNAP;
      const scale = Math.min(w, h) / 620;
      const cx = w > 768 ? w * 0.52 : w * 0.5;
      const cy = h * 0.48;
      const spa = 0.35 * ma;
      const fi = Math.floor(elapsed * 5.5);

      for (const p of players) {
        const pos = lerp(p.pts, playT);
        const sx = cx + pos.x * scale;
        const sy = cy + pos.y * scale;
        if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;

        const dir = playT > 0 ? facing(p.pts, playT) : (p.team === "off" ? "r" : "l");
        const cols = p.team === "off" ? TEAM_OFF : TEAM_DEF;
        const a = lerp(p.pts, playT), b = lerp(p.pts, playT + 0.06);
        const moving = playT > 0 && (Math.abs(b.x - a.x) > 0.2 || Math.abs(b.y - a.y) > 0.2);

        drawSprite(sx, sy, getFrames(dir), moving ? fi : 0, cols, spa);
      }

      if (playT > -0.1) {
        const ball = ballPos(players, Math.max(playT, 0), scale, cx, cy);
        if (ball.visible) {
          drawBall(ball.x, ball.y, (ball.inFlight ? 0.6 : 0.45) * ma);
        }
      }

      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
