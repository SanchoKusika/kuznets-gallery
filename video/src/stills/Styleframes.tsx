import { AbsoluteFill } from "remotion";
import { copy } from "../data/copy";
import { FRAMES } from "../data/site";
import { art, WORKS_COUNT } from "../data/art";
import { promo, reels } from "../data/selection";
import { GRID_REELS, GridWall } from "../effects/GridWall";
import { LogoBuild, logoSchedule } from "../effects/LogoBuild";
import { Canvas3D } from "../effects/Canvas3D";
import { BagetFrame, GlassFrame } from "../effects/Framing";
import { ArtImage } from "../primitives/ArtImage";
import { DotCursor } from "../primitives/DotCursor";
import { LineDrawing } from "../primitives/LinePath";
import { HALL, hallLabel, hallWorkRect, promoHome } from "../lines/promo";
import { Nail, PictureWire } from "../primitives/PictureWire";
import { ArtFrame } from "../primitives/ArtFrame";
import { Chip, Pill } from "../primitives/Chip";
import { RoomStill } from "../reels/scenes/R3Interiors";
import { pendulumSteps } from "../effects/Pendulum";
import { MuseumLabel } from "../primitives/MuseumLabel";
import { Wall } from "../primitives/Wall";
import { display, label, serif, tabular, text } from "../theme/fonts";
import { color, stroke } from "../theme/tokens";

// Static versions of six key frames (brief 11) — the look to approve before the scenes move.

/** 1 · Reels R1, the hook (frame 100): the dot has become the nail head, the wire is not there yet. */
export function SfReelsHook() {
  return (
    <AbsoluteFill>
      <Wall windowShadow phase={100 / 1728} />
      <div style={{ position: "absolute", left: 65, right: 65, top: 300, textAlign: "center", ...display(84, 600, -0.04), color: color.ink }}>
        чего не хватает
        <br />
        этой стене?
      </div>
      <Nail x={540} y={540} />
    </AbsoluteFill>
  );
}

/** 2 · Reels R3, «для детской» (frame 430): the frame is 420×830, the wire recomputed, the kids' room drawn. */
export function SfReelsKids() {
  const kids = reels.interiors[1];
  const nail = { x: 540, y: 540 };
  const frame = { x: 540 - kids.frame.w / 2, y: 600, w: kids.frame.w, h: kids.frame.h };
  // Pendulum released at R2 +0 from −16°: at R3 +3.94b it has all but settled.
  const angle = pendulumSteps(-16, 300)[Math.round(7.94 * 36)];
  return (
    <AbsoluteFill>
      <Wall windowShadow phase={430 / 1728} />
      <RoomStill index={1} />
      <div style={{ position: "absolute", left: 65, right: 65, top: 318, textAlign: "center", ...label(26), color: color.ink2 }}>
        {copy.reels.labels.kids}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 386, display: "flex", justifyContent: "center" }}>
        <Chip>{art(kids.code).title}</Chip>
      </div>
      <PictureWire nail={nail} frame={frame} angle={angle} />
      <ArtFrame x={frame.x} y={frame.y} w={frame.w} h={frame.h} rotate={angle} origin={{ x: nail.x - frame.x, y: nail.y - frame.y }}>
        <ArtImage code={kids.code} width={frame.w} height={frame.h} />
      </ArtFrame>
      <Nail x={nail.x} y={nail.y} />
    </AbsoluteFill>
  );
}

/** 3 · Reels R5, the showroom wall with the counter plate (frame 820). */
export function SfReelsWall() {
  return (
    <AbsoluteFill>
      <Wall />
      <GridWall codes={reels.wall} layout={GRID_REELS} fillFrom={-136} settleFrom={-136} settleDuration={180} />
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 750,
          translate: "-50% -50%",
          background: color.paper,
          padding: 40,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ ...display(84, 600, -0.04), ...tabular, color: color.ink }}>{copy.reels.wallTitle(WORKS_COUNT)}</div>
        <div style={{ ...serif(40), color: color.ink2, marginTop: 14 }}>{copy.reels.wallSub}</div>
      </div>
    </AbsoluteFill>
  );
}

/** 4 · Reels R8, the logo with the call to action (frame 1570, before the avatar gradient). */
export function SfReelsLogo() {
  const c = copy.reels;
  const center = { position: "absolute", left: 65, right: 65, textAlign: "center" } as const;
  return (
    <AbsoluteFill>
      <Wall windowShadow phase={1570 / 1728} />
      <LogoBuild width={820} x={540} y={700} schedule={logoSchedule.still()} />
      <div style={{ ...center, top: 905, ...text(30), color: color.ink }}>{c.ctaLine1}</div>
      <div style={{ ...center, top: 950, ...text(30), color: color.ink }}>{c.ctaLine2}</div>
      <div style={{ ...center, top: 1012 }}>
        <Pill>{c.ctaPhones.join("  ")}</Pill>
      </div>
      <div style={{ ...center, top: 1116, ...label(26), color: color.ink2 }}>{c.ctaSite}</div>
    </AbsoluteFill>
  );
}

/** 5 · Promo P3, hall «для дома» with museum labels, hover on «Тихий Паттерн» (frame 700). */
export function SfPromoHall() {
  const hall = promo.halls[0];
  return (
    <AbsoluteFill>
      <Wall />
      <LineDrawing art={promoHome} progress={1} x={HALL.interior.x} y={HALL.interior.y} width={stroke.promo} />
      <div style={{ position: "absolute", left: 160, top: 64, ...display(96, 500, -0.05), color: color.ink }}>{copy.promo.halls[0]}</div>
      {hall.codes.map((code, i) => {
        const r = hallWorkRect(i);
        const l = hallLabel(i);
        const hover = code === hall.hover;
        return (
          <div key={code}>
            <div style={{ position: "absolute", left: r.x, top: r.y, scale: hover ? "1.05" : undefined }}>
              <ArtImage code={code} width={r.w} height={r.h} shadow parentScale={hover ? 1.05 : 1} />
            </div>
            <MuseumLabel code={code} from={-100} step={2} x={l.x} y={l.y} style={{ width: l.w }} />
            {hover ? <DotCursor x={r.x + r.w / 2 + 30} y={r.y + r.h / 2 + 20} d={150} label={copy.promo.hover} /> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/** 6 · Promo P7, three ways to frame (frame 2150). */
export function SfPromoFraming() {
  const code = promo.craft;
  const size = 420;
  const gap = 80;
  const x0 = (1920 - (3 * size + 2 * gap)) / 2;
  const top = 300;
  return (
    <AbsoluteFill>
      <Wall />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...display(56, 500, -0.04, 1), color: color.ink }}>
        {copy.promo.framingTitle}
      </div>
      <Canvas3D code={code} faceWidth={size} faceHeight={size} x={x0 + size / 2} y={top + size / 2} rotY={-16} rotX={3} />
      <div style={{ position: "absolute", left: x0 + size + gap - 28, top: top - 28 }}>
        <BagetFrame code={code} w={size} h={size} />
      </div>
      <div style={{ position: "absolute", left: x0 + 2 * (size + gap), top }}>
        <GlassFrame code={code} w={size} h={size} glint={0} />
      </div>
      {FRAMES.map((f, i) => (
        <div key={f.n} style={{ position: "absolute", left: x0 + i * (size + gap), top: top + size + 64, width: size }}>
          <div style={{ ...text(22, 500), color: color.ink }}>{f.n}</div>
          <div style={{ ...label(16), color: i === 0 ? color.accent : color.ink3, marginTop: 8 }}>{f.note}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
}
