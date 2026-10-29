/** Specks of dust drifting through the lamp's light, for the meditation mode. Pure canvas, no state outside. */

type Speck = { x: number; y: number; r: number; vx: number; vy: number; phase: number; depth: number };

const COUNT = 48;
const RGB = "255, 226, 180";

const random = (min: number, max: number) => min + Math.random() * (max - min);

export type Dust = {
  /** Draws one frame; `time` in ms, `mx` / `my` — the pointer in −1…1, which shifts nearer specks more. */
  frame(time: number, mx: number, my: number): void;
  resize(width: number, height: number): void;
};

export function createDust(canvas: HTMLCanvasElement): Dust {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let last = 0;
  const specks: Speck[] = Array.from({ length: COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: random(0.6, 2.1),
    vx: random(-0.01, 0.018),
    vy: random(-0.045, -0.012),
    phase: random(0, Math.PI * 2),
    depth: random(0.3, 1),
  }));

  return {
    resize(w, h) {
      width = canvas.width = w;
      height = canvas.height = h;
    },
    frame(time, mx, my) {
      if (!ctx) return;
      // Seconds since the last frame, capped so a long pause doesn't throw the specks across the screen.
      const dt = Math.min(0.05, (time - last) / 1000 || 0);
      last = time;
      ctx.clearRect(0, 0, width, height);
      // The pool of light the specks catch: centred where the lamp is.
      const lx = width / 2;
      const ly = height * 0.38;
      const sigma = Math.min(width, height) * 0.42;
      for (const p of specks) {
        p.x += p.vx * dt + Math.sin(time / 3000 + p.phase) * 0.00012;
        p.y += p.vy * dt;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        else if (p.x > 1.02) p.x = -0.02;
        const x = p.x * width - mx * 26 * p.depth;
        const y = p.y * height - my * 18 * p.depth;
        const near = Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (2 * sigma * sigma));
        const twinkle = 0.6 + 0.4 * Math.sin(time / 900 + p.phase * 3);
        ctx.fillStyle = `rgba(${RGB}, ${(0.1 + 0.4 * near) * twinkle * p.depth})`;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (0.8 + 0.4 * p.depth), 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
