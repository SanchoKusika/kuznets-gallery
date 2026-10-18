import { useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { MaskRise } from "../../primitives/MaskRise";
import { display, label, serif } from "../../theme/fonts";
import { ease } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, type } from "../../theme/tokens";
import { cameraX, LAYER, sceneStarts } from "../layout";

/**
 * P2 (bars 3–4), on the text layer (0.6×): «картины» rises from its mask at +¼b (2b), the eyebrow over it at +1b,
 * the lede under it at +1.5b. Placed so the word is centred on screen in the middle of the scene; all three leave
 * up into their masks as the camera flies to the first hall (P3 +0). Absolute frames, text-layer px.
 */
export function P2Hero() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const S = sceneStarts(t);
  if (frame < S.P2 || frame > S.P3 + t.b(1)) return null;
  const cx = 960 + LAYER.text * cameraX(S.P2 + t.b(4), t);
  const exit = (k: number) => ({ from: S.P3 + k * t.s(0.5), duration: t.e(1), easing: ease.menuIn });
  const box = { position: "absolute", left: cx - 800, width: 1600, textAlign: "center" } as const;
  return (
    <>
      <div style={{ ...box, top: 300 }}>
        <MaskRise from={S.P2 + t.b(1)} duration={t.b(1)} exit={exit(0)}>
          <div style={{ ...label(type.promo.label), color: color.ink3 }}>{copy.promo.eyebrow}</div>
        </MaskRise>
      </div>
      <div style={{ ...box, top: 352 }}>
        {/* Room for the descender of «р» inside the mask. */}
        <MaskRise from={S.P2 + t.s(1)} duration={t.b(2)} exit={exit(1)} style={{ paddingBottom: 60, marginBottom: -60 }}>
          <div style={{ ...display(type.promo.hero, 600, -0.075, 0.86), color: color.ink }}>{copy.promo.hero}</div>
        </MaskRise>
      </div>
      <div style={{ ...box, left: cx - 560, width: 1120, top: 690 }}>
        <MaskRise from={S.P2 + t.b(1.5)} duration={t.b(1.5)} exit={exit(2)} style={{ paddingBottom: 12 }}>
          <div style={{ ...serif(type.promo.lede, 1.2), color: color.ink2 }}>{copy.promo.lede}</div>
        </MaskRise>
      </div>
    </>
  );
}
