# Rules for working on the promo videos (read fully before coding)

Since 18.10.2026 the main session builds everything itself, from the foundation to the final renders — no parallel
agents (owner's decision). These are the project's working rules: Remotion version, determinism, the foundation's API,
style and how to check the result.

## Project

- Repo: `C:\Users\Sancho\Documents\Projects\kuznets-gallery`. Video project: `video/` (own package.json).
- Brief: `VIDEO_BRIEF.md` in the repo root — read section 0, 5 (art direction) and the sections of the scenes at hand.
  Creative decisions there are final unless the owner says otherwise (owner's changes and accepted
  deviations are listed in the Obsidian note `C:\Users\Sancho\Documents\Obsidian Storage\Проекты\Kuznets Gallery\12 Промо-видео.md`);
  if something is technically impossible pick the closest option and tell the owner at the next stop.
- Remotion **4.0.532** (exact). The Remotion skills are written for 4.0.536: **do not use** `Interactive.create`,
  `Track`, `Interactive.*` wrappers or `effects=` props — they do not exist in 4.0.532. Use `AbsoluteFill`, `Sequence`,
  `Series`, `Img`, `staticFile`, `interpolate`, `spring`, `Easing`, `random`, `useCurrentFrame`, `useVideoConfig`,
  `delayRender/continueRender` from `remotion`.
- Skills (load the relevant ones): `remotion-best-practices` (timing, sequencing, 3d, images, motion-blur),
  `threejs-fundamentals`, `threejs-textures`, `threejs-materials` (3D tasks only).

## Determinism (mandatory)

No `Math.random`, `Date`, CSS transitions/animations, `requestAnimationFrame`, r3f `useFrame`. Everything is a pure
function of `useCurrentFrame()`. Randomness: `random(seed)` from remotion. Accumulating physics: precompute an array
for all frames with `useMemo` (fixed 1/60 s step) and sample it by time.

## Foundation (shared by both videos — a change here affects every scene that uses it)

- `src/theme/tokens.ts` — `color` (paper, paper2, paper3, paperRaised, ink…ink4, accent, onAccent, logoDot, logoWave,
  logoInk, logoGrey, avatarLeft/Right/Line), `dark`, `shadow.float(k)`, `stroke` ({reels: 3, promo: 2.5}), `type`
  (font sizes per format), `ART_SCALE_LIMIT(_FAST)`, `REELS_SAFE` {x0 65, x1 1015, y0 270, y1 1250}, `PROMO_MARGIN` 96.
- `src/theme/easing.ts` — `ease.{out,rise,inOut,menuIn,menuOut,in,linear}` (the site's curves),
  `progress(frame, from, duration, easing = ease.out)` → clamped 0..1, `mix(a, b, t)`.
- `src/theme/timing.ts` — `useTiming()` → `{ fps, b(n), e(n), s(n), bar(n) }` frames for n beats / eighths /
  sixteenths / bars (100 BPM: 1 beat = 36 frames at 60 fps). **Never hardcode frames or seconds**: all durations come
  from these (the 50 fps Promo master and a BPM change must work).
- `src/theme/fonts.ts` — `fonts.sans` (Onest), `fonts.serif` (Piazzolla Italic 300); style helpers
  `display(size, weight, trackingEm, lh)`, `label(size)`, `serif(size)`, `text(size, weight)`, `tabular`.
- `src/data/art.ts` — `art(code)` → `{ code, title, file, w, h }` (throws on excluded works), `ALLOWED`, `CATALOG`,
  `cheapest(code)`, `WORKS_COUNT`. `src/data/typo.ts` — `typo()` (non-breaking spaces).
- `src/data/selection.ts` — which works go where (`reels.*`, `promo.*`, `CIRCLES`). `src/data/copy.ts` — all texts.
  `src/data/site.ts` — CONTACTS, FRAMES, CLIENTS, STEPS from the site.
- `src/primitives/ArtImage.tsx` — `<ArtImage code width height crop? parentScale? zoom? fast? shadow? filter? style?>`:
  the only way to show a picture. It enforces "≤ 1.1× natural size" (1.25× with `fast`), outlines violations red in
  Studio and `console.warn`s with the work's code. `coverCrop(w, h, aspect)`, `artScale(...)` helpers.
- `src/primitives/LinePath.tsx` — `<LineDrawing art progress x y thread? color width>` draws a `LineArt` like a pencil
  (parts in order, by length, starting with a wave from the frame edge); `<MorphLines from to t x y>` morphs two
  drawings part by part; `<LinePath d progress>` (inside your own `<svg>`); `pencil(t)`; `threadPath(...)`.
- `src/primitives/MaskRise.tsx` — `<MaskRise from duration easing? exit? offset? exitOffset?>` (rise from a mask; the
  exit travels 160% so glyph tails leave the mask), `<FadeRise …>`.
- Other primitives: `Wall` (paper wall, Reels window shadow), `SafeZone`, `Chip`/`Pill`, `useCounter`,
  `CircleReveal`/`coverRadius`, `Curtains`, `DotCursor`, `ArtFrame`/`ArtSwap`, `MuseumLabel`, `Nail`/`WireLine`/`PictureWire`. No grain or noise
  over the frame (the owner removed it).
- Effects: `Pendulum`, `GridWall`, `CircleMontage`, `Canvas3D`, `WeaveTexture`, `Framing` (BagetFrame, GlassFrame),
  `LogoBuild` (+ `logoSchedule`, `logoGeometry`), `AvatarOutro`/`CollapseToDot`.
- Line drawings: `src/lines/interiors.ts` (Reels rooms: elements drawn in a sweep, with idle `motion`), `src/lines/promo.ts`,
  `src/lines/common.ts`; type `LineArt` in `src/lines/types.ts`.
- Sound: `npm run music` (`scripts/make-music.mjs`) and `npm run sfx` (`scripts/make-sfx.mjs`) synthesise the track and the
  effects (`scripts/audio/dsp.mjs`); cues in `src/audio/cues.ts`, the bar edit in `src/audio/music-edit.ts`.

## Style

- TypeScript, 2 spaces, double quotes, semicolons, lines ≤ ~140 chars, short English comments that explain *why*.
  Match the existing files. Inline `style` objects are fine in Remotion. **LF line endings.**
- Never run `npx prettier` (the repo has no formatter).
- Components take timing as **frames relative to their own Sequence** (scenes compute them with `useTiming()`); give
  sensible defaults from the brief via `useTiming()` when a prop is omitted.
- Colours only from `tokens.ts`. Lines: `stroke.reels` (3 px) / `stroke.promo` (2.5 px), round caps and joins, no fills
  except paper where something must cover the background.

## Scenes

- A composition root (`src/reels/Reels.tsx`, `src/promo/Promo.tsx`) mounts the wall, Soundtrack and SafeZone
  once — not in the acts. Each act is one component in its own `<Sequence>`; its frames are relative to the act's
  start. Nested `<Sequence name="R2 …">` per scene inside the act show in the Studio timeline.
- Positions shared between acts live in a layout module (`src/reels/layout.ts`; Promo gets its own). Import them —
  never copy the numbers.

## Checking the work

- `npm run lint` in `video/` (eslint + tsc) must pass.
- Look at it through the real composition (absolute frames; 1 bar = 144 frames at 60 fps):
  `npx remotion still Reels out/dev/f<frame>.png --frame=<frame>`; several frames:
  `REMOTION_SILENT=1 npx remotion render Reels out/dev/seq --sequence --frames=<a>-<b> --every-nth-frame=<k> --image-format=jpeg`
  (without the soundtrack: with a sound in the range `--every-nth-frame` fails in the audio mixer),
  then `node scripts/sheet.mjs out/dev/seq out/dev/sheet.jpg 12 160` and view the JPG with the Read tool
  (`node scripts/sheet.mjs --files <out> <tileW> <cols> <files…>` puts stills side by side for close looks).
  Check every beat of the act and the frames around its hand-offs. Iterate until it looks right.
- `ArtImage` must print no scale warnings. Reels safe zone: all text and the logo inside x 65–1015, y 270–1250
  (check with `--props=<file.json>` containing `{"showGuides":true}` — inline JSON loses its quotes on Windows).
- Remotion Studio runs on http://localhost:3100 for the owner (`npm run studio` in the background if it is down).
