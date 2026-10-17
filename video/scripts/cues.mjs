// Every SFX cue of both videos with its timecode (brief 9.2): out/CUES.md — the list to look for sounds by.
// Cues come from src/audio/cues.ts (beats from the scene start), scenes from src/timeline.ts.
//
//   npm run cues

import fs from "node:fs";
import path from "node:path";
import { PROMO_CUES, REELS_CUES } from "../src/audio/cues.ts";
import { PROMO_SCENES, REELS_SCENES } from "../src/timeline.ts";

const root = path.resolve(import.meta.dirname, "..");
const BPM = Number(fs.readFileSync(path.join(root, "src/theme/timing.ts"), "utf8").match(/BPM = (\d+(?:\.\d+)?)/)[1]);
const FPS = 60;
const beatSec = 60 / BPM;

const has = (id) => fs.existsSync(path.join(root, "public/sfx", `${id}.wav`));
const sec = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
// «такт.доля» counted from 1, as musicians do: beat 0 of bar 0 = 1.1; fractions stay (1.2½ → 1.2.5).
const barBeat = (beats) => `${Math.floor(beats / 4) + 1}.${+((beats % 4) + 1).toFixed(2)}`;

function table(title, scenes, cues) {
  const rows = scenes.flatMap((scene) =>
    (cues[scene.id] ?? []).map((c) => {
      const beats = scene.fromBar * 4 + c.at;
      return { beats, scene, c };
    }),
  );
  rows.sort((a, b) => a.beats - b.beats);
  const lines = [
    `## ${title}`,
    "",
    "| Кадр (60 fps) | Время | Такт.доля | Сцена | Звук | dB | Что происходит | Файл |",
    "|---:|---:|---:|---|---|---:|---|:---:|",
    ...rows.map(({ beats, scene, c }) => {
      const s = beats * beatSec;
      return `| ${Math.round(s * FPS)} | ${sec(s)} | ${barBeat(beats)} | ${scene.id} ${scene.name} | \`${c.id}\` | ${c.gainDb} | ${c.note ?? ""} | ${has(c.id) ? "✓" : "—"} |`;
    }),
    "",
  ];
  return { lines, ids: rows.map((r) => r.c.id) };
}

const reels = table("Reels", REELS_SCENES, REELS_CUES);
const promo = table("Promo", PROMO_SCENES, PROMO_CUES);
const ids = [...new Set([...reels.ids, ...promo.ids])].sort();
const missing = ids.filter((id) => !has(id));

const md = [
  "# Звуковые реплики промо-роликов",
  "",
  `Сгенерировано \`npm run cues\` из \`src/audio/cues.ts\`. Темп ${BPM} BPM, доля = ${beatSec.toFixed(2)} с = ${Math.round(beatSec * FPS)} кадров при ${FPS} fps.`,
  "Громкость — относительно шины эффектов (она на 18–24 дБ тише музыки). Файлы — `public/sfx/<id>.wav`; реплика без файла молчит.",
  "",
  ...reels.lines,
  ...promo.lines,
  "## Файлы",
  "",
  `Нужно ${ids.length}: ${ids.map((id) => `\`${id}\``).join(", ")}.`,
  missing.length ? `Нет файла: ${missing.map((id) => `\`${id}\``).join(", ")}.` : "Все файлы на месте.",
  "",
].join("\n");

fs.mkdirSync(path.join(root, "out"), { recursive: true });
fs.writeFileSync(path.join(root, "out/CUES.md"), md);
console.log(`out/CUES.md: ${reels.ids.length} + ${promo.ids.length} cues, ${missing.length} of ${ids.length} files missing`);
