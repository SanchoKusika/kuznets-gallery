import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { BrushStroke } from "../../primitives/Brush";
import { useCounter } from "../../primitives/Counter";
import { MaskRise } from "../../primitives/MaskRise";
import { WORKS_COUNT } from "../../data/art";
import { ease, mix, progress } from "../../theme/easing";
import { tabular } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { COLS, GAP, GRID_Y0, heavy, HERO, ROWS, SMALLS, STAGE, TEXT_X, TEXT_Y, TILE, tileCentre, ZOOM_TILE } from "../layout";

// Tiles in reading order (col, row); the hero and A1's smalls sit where their own entries say.
const CODES = [
  "KZ-010", "KZ-061", "KZ-097",
  "KZ-032", HERO.code, "KZ-134",
  "KZ-121", ZOOM_TILE.code, "KZ-069",
  "KZ-143", "KZ-091", "KZ-025",
];
/** Beat 6: the columns slide one row like reels of a slot machine — the middle one up, the outer ones down —
 * and the tile pushed out of the window comes back in from its other edge. KZ-012 rises into the centre tile. */
const SLIDE = [1, -1, 1];
const PITCH = TILE + GAP;
/** The window the wall lives in (the rows above belong to the counter). */
const WINDOW_TOP = GRID_Y0 - GAP / 2;

const slot = (k: number) => tileCentre(k % COLS, Math.floor(k / COLS));
/** Tile k's centre after `p` of the slide, wrapped round the 4-row column. */
const slid = (k: number, p: number) => {
  const col = k % COLS;
  let row = Math.floor(k / COLS) + SLIDE[col] * p;
  if (row > ROWS - 0.5) row -= ROWS;
  if (row < -0.5) row += ROWS;
  return { x: tileCentre(col, 0).x, y: GRID_Y0 + row * PITCH + TILE / 2 };
};
/** The centre tile after the slide. */
const DIVE_INDEX = CODES.indexOf(ZOOM_TILE.code);

/**
 * A2 (beats 4–8): the hero shrinks into its tile, the smalls straighten into theirs and the rest of the wall flies in
 * from the centre; «159 авторских работ» counts up above it with paint. On beat 6 the columns slide, on beat 7
 * the camera dives into the centre tile (KZ-012), which A3 holds on STAGE. Frames relative to A2.
 */
export function A2Wall() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const settle = progress(frame, 0, t.e(1), ease.inOut);
  const shuffleFrom = t.b(2);
  const diveFrom = t.b(3);
  const dive = progress(frame, diveFrom, t.b(1), ease.inOut);
  // Camera: scale about the centre tile so that it lands exactly on STAGE.
  const z = mix(1, STAGE.size / TILE, dive);
  const c = slot(4);
  const camX = mix(0, STAGE.x - c.x, dive);
  const camY = mix(0, STAGE.y - c.y, dive);
  const n = useCounter(WORKS_COUNT, t.e(1), t.b(1.25));
  const exit = { from: t.b(2.75), duration: t.e(1), easing: ease.menuOut };

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(${settle < 1 ? 0 : WINDOW_TOP}px 0 0 0)` }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${c.x}px ${c.y}px`, transform: `translate(${camX}px, ${camY}px) scale(${z})` }}>
        {CODES.map((code, k) => {
          const to = slot(k);
          const sh = progress(frame, shuffleFrom + (k % COLS) * 2, t.e(1) + t.s(1), ease.inOut);
          const at = slid(k, sh);
          let x = at.x;
          let y = at.y;
          let size = TILE;
          let rot = 0;
          let scale = 1;
          const small = SMALLS.find((s) => s.code === code);
          if (code === HERO.code) {
            x = mix(HERO.x, x, settle);
            y = mix(HERO.y, y, settle);
            size = mix(HERO.size, TILE, settle);
          } else if (small) {
            x = mix(small.x, x, settle);
            y = mix(small.y, y, settle);
            size = mix(small.size, TILE, settle);
            rot = mix(small.rot, 0, settle);
          } else {
            // Fly in from the centre, nearest first.
            const d = Math.hypot(to.x - HERO.x, to.y - HERO.y) / 324;
            const p = progress(frame, 2 + d * 3, t.e(1) + t.s(1), ease.out);
            if (p <= 0) return null;
            x = mix(HERO.x, x, p);
            y = mix(HERO.y, y, p);
            scale = mix(0.2, 1, p);
            rot = mix(d % 2 ? 12 : -12, 0, p);
          }
          // On the dive every tile but the centre one leaves.
          const isDive = k === DIVE_INDEX;
          // Gone by mid-dive, before the zoom would blow them up past their size.
          const away = isDive ? 0 : progress(frame, diveFrom, t.e(1), ease.out);
          const op = 1 - away;
          if (op <= 0) return null;
          return (
            <div
              key={code}
              style={{ position: "absolute", left: x - size / 2, top: y - size / 2, scale: String(scale * (1 - 0.15 * away)), rotate: `${rot}deg`, opacity: op }}
            >
              <ArtImage code={code} width={size} height={size} parentScale={z * scale} />
            </div>
          );
        })}
      </div>
      </div>

      {/* Counter and its paint. */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - progress(frame, exit.from, exit.duration, ease.linear) }}>
        <BrushStroke
          points={[[TEXT_X + 540, TEXT_Y + 112], [TEXT_X + 760, TEXT_Y + 104], [TEXT_X + 950, TEXT_Y + 110]]}
          progress={progress(frame, t.b(1) + t.e(1), t.s(1) + 4, ease.out)}
          width={64}
          color={bold.yellow}
          seed="a2-hi"
          rough={0.25}
        />
        <BrushStroke
          points={[[TEXT_X + 470, TEXT_Y + 40], [TEXT_X + 250, TEXT_Y - 20], [TEXT_X - 10, TEXT_Y + 60], [TEXT_X - 20, TEXT_Y + 220], [TEXT_X + 230, TEXT_Y + 300], [TEXT_X + 480, TEXT_Y + 210], [TEXT_X + 470, TEXT_Y + 60], [TEXT_X + 360, TEXT_Y + 0]]}
          progress={progress(frame, t.b(1.5), t.e(1) + t.s(1), ease.inOut)}
          width={14}
          color={bold.accent}
          seed="a2-ring"
          bands={3}
        />
      </svg>
      <div style={{ position: "absolute", left: TEXT_X - 8, top: TEXT_Y - 10 }}>
        <MaskRise from={t.s(1)} duration={t.e(1)} exit={exit}>
          <div style={{ ...heavy(300, bold.accent), ...tabular, fontWeight: 800, letterSpacing: "-0.06em" }}>{n}</div>
        </MaskRise>
      </div>
      <div style={{ position: "absolute", left: TEXT_X + 550, top: TEXT_Y + 40 }}>
        {["авторских", "работ"].map((w, i) => (
          <MaskRise key={w} from={t.e(1) + i * 3} duration={t.e(1)} exit={{ ...exit, from: exit.from + i * 2 }} style={{ paddingBottom: 4 }}>
            <div style={heavy(76)}>{w}</div>
          </MaskRise>
        ))}
      </div>
    </AbsoluteFill>
  );
}
