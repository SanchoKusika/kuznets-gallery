# Rules for agents working on the promo videos (read fully before coding)

You are one of several agents building parts of one Remotion project in parallel. A director (the main session)
owns the foundation, splits the work, assembles the compositions and reviews every frame. Stay inside your files.

## Project

- Repo: `C:\Users\Sancho\Documents\Projects\kuznets-gallery`. Video project: `video/` (own package.json).
- Brief: `VIDEO_BRIEF.md` in the repo root — read section 0, 5 (art direction) and the sections named in your task.
  Creative decisions there are final unless the director's task says otherwise (owner's changes and accepted
  deviations are listed in the Obsidian note `C:\Users\Sancho\Documents\Obsidian Storage\Проекты\Kuznets Gallery\12 Промо-видео.md`);
  if something is technically impossible pick the closest option and say so in your report.
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

## Foundation you can use (do not edit these files unless your task says so)

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
  `cheapest(code)`, `review(name)`, `WORKS_COUNT`. `src/data/typo.ts` — `typo()` (non-breaking spaces).
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
- Other primitives: `Wall` (paper wall, Reels window shadow), `Grain`, `SafeZone`, `Chip`/`Pill`, `useCounter`,
  `CircleReveal`/`coverRadius`, `Curtains`, `DotCursor`, `ArtFrame`/`ArtSwap`, `MuseumLabel`, `Nail`/`PictureWire`.
- Effects: `Pendulum`, `GridWall`, `CircleMontage`, `Canvas3D`, `WeaveTexture`, `Framing` (BagetFrame, GlassFrame),
  `LogoBuild` (+ `logoSchedule`, `logoGeometry`), `AvatarOutro`/`CollapseToDot`, `ReviewStack`.
- Line drawings: `src/lines/reels.ts`, `src/lines/promo.ts`, `src/lines/common.ts`; type `LineArt` in `src/lines/types.ts`.

If you need a change in a foundation file, do not edit it — describe the change in your report (or, if it is a small
thing you cannot work around, make a local variant in your own file).

## Style

- TypeScript, 2 spaces, double quotes, semicolons, lines ≤ ~140 chars, short English comments that explain *why*.
  Match the existing files. Inline `style` objects are fine in Remotion. **LF line endings.**
- Never run `npx prettier` (the repo has no formatter).
- Components take timing as **frames relative to their own Sequence** (scenes compute them with `useTiming()`); give
  sensible defaults from the brief via `useTiming()` when a prop is omitted.
- Colours only from `tokens.ts`. Lines: `stroke.reels` (3 px) / `stroke.promo` (2.5 px), round caps and joins, no fills
  except paper where something must cover the background.

## Scenes (several agents at once)

- A composition root (`src/reels/Reels.tsx`, `src/promo/Promo.tsx`) is owned by the director: the wall, Grain,
  Soundtrack and SafeZone are mounted there once — **do not** add them in your act. Each act is one component in its
  own `<Sequence>`; your frames are relative to your act's start. Nested `<Sequence name="R2 …">` per scene inside the
  act are welcome (they show in the Studio timeline).
- Positions shared between acts live in a layout module (`src/reels/layout.ts`; Promo gets its own). Import them —
  never copy the numbers. Only the act named as the owner of a value may change it.
- Other agents edit other files of the same project at the same time. If a bundle fails because of someone else's
  file, wait a minute and retry; `tsc` errors in files that are not yours are not your problem. Always write whole,
  compiling files. Do not edit files outside your list.

## Checking your work

- Typecheck: `npx tsc --noEmit -p .` in `video/` must pass for your files; `npx eslint <your files>` clean.
- Look at it through the real composition (absolute frames; 1 bar = 144 frames at 60 fps):
  `npx remotion still Reels out/dev/<you>/f<frame>.png --frame=<frame>`; several frames:
  `npx remotion render Reels out/dev/<you>/seq --sequence --frames=<a>-<b> --every-nth-frame=<k> --image-format=jpeg`,
  then `node scripts/sheet.mjs out/dev/<you>/seq out/dev/<you>/sheet.jpg 12 160` and view the JPG with the Read tool
  (`node scripts/sheet.mjs --files <out> <tileW> <cols> <files…>` puts stills side by side for close looks).
  Use your own folder under `out/dev/`. Check every beat of your act and the frames around its hand-offs.
  Iterate until it looks right — you are judged on the visual result.
- `ArtImage` must print no scale warnings. Reels safe zone: all text and the logo inside x 65–1015, y 270–1250
  (check with `--props=<file.json>` containing `{"showGuides":true}` — inline JSON loses its quotes on Windows).
- Remotion Studio runs on http://localhost:3100 for the owner — do not start or stop servers. Do not edit
  `src/Root.tsx`, do not commit.

## Report (your final message)

Short: files created; exported API (signatures + one-line usage); frames/stills you checked; deviations from the
brief and why; requests for foundation changes. No code dumps.
