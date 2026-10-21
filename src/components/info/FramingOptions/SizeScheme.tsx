import { bem } from "@/lib/bem";
import s from "./SizeScheme.module.scss";

const b = bem(s, "size-scheme");

/** Standard frames of the scheme: position and size in viewBox units (1 cm = 1.8). */
const FRAMES = [
  { id: "50x70", x: 52, y: 124, w: 90, h: 126, width: "50 см", height: "70 см" },
  { id: "70x100", x: 178, y: 70, w: 126, h: 180, width: "70 см", height: "100 см" },
] as const;

const BASE = 250;
const CUSTOM = { x: 336, w: 54, h: 144 };

type DimensionProps = { x: number; y: number; length: number; label: string; vertical?: boolean };

/** Decorative dimension line with end ticks and a cm label. */
function Dimension({ x, y, length, label, vertical }: DimensionProps) {
  const mid = length / 2;
  return (
    <g className={b("dimension")}>
      {vertical ? (
        <>
          <line x1={x} y1={y} x2={x} y2={y + length} />
          <line x1={x - 4} y1={y} x2={x + 4} y2={y} />
          <line x1={x - 4} y1={y + length} x2={x + 4} y2={y + length} />
          <text className={b("label")} transform={`translate(${x - 6} ${y + mid}) rotate(-90)`} textAnchor="middle">
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x} y1={y} x2={x + length} y2={y} />
          <line x1={x} y1={y - 4} x2={x} y2={y + 4} />
          <line x1={x + length} y1={y - 4} x2={x + length} y2={y + 4} />
          <text className={b("label")} x={x + mid} y={y + 16} textAnchor="middle">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

/** Blueprint-style scheme of standard frame sizes and a dashed custom one; fills the banner's media slot. */
export function SizeScheme({ className }: { className?: string }) {
  return (
    <svg
      className={b(null, null, className)}
      viewBox="0 0 400 300"
      role="img"
      aria-label="Схема размеров рам: 50×70, 70×100 и размер на заказ"
    >
      <line className={b("floor")} x1="24" y1={BASE} x2="376" y2={BASE} />
      {FRAMES.map((f) => (
        <g key={f.id}>
          <rect className={b("frame")} x={f.x} y={f.y} width={f.w} height={f.h} />
          <rect className={b("mat")} x={f.x + 7} y={f.y + 7} width={f.w - 14} height={f.h - 14} />
          <Dimension x={f.x} y={BASE + 14} length={f.w} label={f.width} />
          <Dimension x={f.x - 14} y={f.y} length={f.h} label={f.height} vertical />
        </g>
      ))}
      <rect className={b("custom")} x={CUSTOM.x} y={BASE - CUSTOM.h} width={CUSTOM.w} height={CUSTOM.h} />
      <text className={b("custom-mark")} x={CUSTOM.x + CUSTOM.w / 2} y={BASE - 10} textAnchor="middle">
        ?
      </text>
      <Dimension x={CUSTOM.x} y={BASE + 14} length={CUSTOM.w} label="ваш" />
    </svg>
  );
}
