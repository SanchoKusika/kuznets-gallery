import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { dof, K, Layer, Letters, sans, serif, Stage3D } from "../kit";

const NAIL = { x: 2700, y: -160 };
/** S3's words: x, y, z in the wall's world (the camera flies along z towards them). */
const WORDS = [
  { x: 2420, y: -430, z: 1500 },
  { x: 2990, y: -40, z: 900 },
  { x: 2700, y: 330, z: 250 },
] as const;
const DUST = Array.from({ length: 26 }, (_, i) => ({ x: -400 + random(`d${i}`) * 3600, y: -900 + random(`dy${i}`) * 1800, z: 200 + random(`dz${i}`) * 900, r: 2 + random(`dr${i}`) * 5 }));

/** Keyframed camera: piecewise interpolation with its own easing per segment. */
function track(frame: number, keys: [number, number][], easings: ((t: number) => number)[]) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame <= f1 || i === keys.length - 2) return interpolate(frame, [f0, f1], [v0, v1], { easing: easings[i] ?? ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return keys[keys.length - 1][1];
}

/**
 * Beats 0–8, one continuous shot on one wall. «СТЕНА» is the wall itself — giant relief letters the camera dollies
 * along at an angle; it turns to face an empty nail and pulls far back: tiny «молчит.» under it, in silence. Then
 * the camera flies forward through «пока» (hairline), «НЕ» (black, accent) and «появится» (italic, opening up),
 * each on its own depth, into the cut to S4. Frames relative to the start of the reel.
 */
export function WallWorld() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const B = t.b(1);
  const k = (b: number) => Math.round(b * B);
  const keys = (vals: number[]): [number, number][] => [k(0), k(2.5), k(3.5), k(5), k(8)].map((f, i) => [f, vals[i]]);
  const segs = [ease.inOut, ease.inOut, ease.out, ease.in];
  const cam = {
    x: track(frame, keys([720, 2000, NAIL.x, NAIL.x, NAIL.x]), segs),
    y: track(frame, keys([40, 0, NAIL.y + 140, NAIL.y + 160, 300]), segs),
    z: track(frame, keys([-2000, -500, -1300, -1700, 650]), segs),
    ry: track(frame, keys([6, 24, 0, 0, -4]), segs),
    rz: track(frame, keys([-2, 1, 0, 0, 3]), segs),
  };
  const lightX = cam.x + 260;
  const silentP = progress(frame, k(3.2), k(0.9), ease.out);
  // The word being read is in focus; the others fall out of it.
  const focusZ = frame < k(6.3) ? WORDS[0].z : frame < k(7.2) ? WORDS[1].z : WORDS[2].z;
  const opening = progress(frame, k(6.6), k(1.3), ease.out);
  return (
    <AbsoluteFill style={{ background: K.wall }}>
      <Stage3D cam={cam} perspective={1600}>
        {/* The wall: a huge plane with a moving spotlight. */}
        <Layer x={1500} y={0} z={0}>
          <div
            style={{
              width: 7000,
              height: 4000,
              background: `radial-gradient(900px 700px at ${lightX + 2000}px 1900px, #F6F4F0 0%, ${K.wall} 70%)`,
            }}
          />
        </Layer>
        {/* СТЕНА in relief. */}
        <Layer x={720} y={0} z={2}>
          <div style={{ ...sans(600, 900, "#D3CDC3", { textTransform: "uppercase", letterSpacing: "-0.03em", textShadow: "-6px -6px 8px rgba(255,255,255,.95), 12px 16px 20px rgba(0,0,0,.28)" }) }}>стена</div>
        </Layer>
        {/* The nail and its shadow. */}
        <Layer x={NAIL.x} y={NAIL.y} z={4}>
          <div style={{ position: "relative", width: 22, height: 22 }}>
            <div style={{ position: "absolute", left: 8, top: 10, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(4px)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#2A2724" }} />
          </div>
        </Layer>
        {/* «молчит.» whispered under the nail. */}
        <Layer x={NAIL.x} y={NAIL.y + 230} z={3}>
          <Letters text="молчит." style={serif(76, 300, "#7C776F")} letter={(i, n) => ({ opacity: Math.max(0, Math.min(1, silentP * (n + 2) - i)) })} />
        </Layer>
        {/* Words on their own depths, off the camera's axis so each leaves the frame before the camera reaches it. */}
        {frame >= k(4.6)
          ? WORDS.map((w, i) => {
              const d = w.z + cam.z;
              const op = progress(d, -2600, 700, ease.linear) * (d > 1300 ? 0 : 1);
              if (op <= 0) return null;
              const el =
                i === 0 ? (
                  <div style={sans(300, 200, K.ink)}>пока</div>
                ) : i === 1 ? (
                  <div style={sans(560, 900, K.accent, { textTransform: "uppercase" })}>не</div>
                ) : (
                  <Letters text="появится" style={serif(250, 800, K.ink)} letter={(j) => ({ marginRight: `${(opening * 0.08 - 0.03) * 250}px`, translate: `0 ${(1 - opening) * (j % 2 ? 12 : -12)}px` })} />
                );
              return (
                <Layer key={i} x={w.x} y={w.y} z={w.z} blur={dof(w.z, focusZ, 0.008, 14)} style={{ opacity: op }}>
                  {el}
                </Layer>
              );
            })
          : null}
        {/* Dust in the light, nearer than the wall. */}
        {DUST.map((d, i) => (
          <Layer key={`d${i}`} x={d.x + Math.sin(frame / 40 + i) * 20} y={d.y - frame * 0.15} z={d.z} blur={2}>
            <div style={{ width: d.r * 2, height: d.r * 2, borderRadius: "50%", background: "rgba(255,255,255,.7)" }} />
          </Layer>
        ))}
      </Stage3D>
    </AbsoluteFill>
  );
}
