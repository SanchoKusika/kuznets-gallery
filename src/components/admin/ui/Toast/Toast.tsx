import { bem } from "@/lib/bem";
import s from "./Toast.module.scss";

const b = bem(s, "toast");

type Props = { text: string; on: boolean; onUndo?: () => void; raised?: boolean };

/** Bottom-centre ink pill with an optional «Вернуть» (prototype toast, 6s). */
export function Toast({ text, on, onUndo, raised }: Props) {
  return (
    <div className={b(null, { on, raised, action: !!onUndo })} role="status" aria-live="polite">
      <span>{text}</span>
      {onUndo && (
        <button type="button" className={b("undo")} onClick={onUndo}>
          Вернуть
        </button>
      )}
    </div>
  );
}
