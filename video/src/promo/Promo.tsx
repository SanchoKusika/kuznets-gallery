import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { color } from "../theme/tokens";

export const promoSchema = z.object({
  /** Live showroom footage in P6 instead of the line drawing (public/footage/showroom-wall.mp4). */
  useShowroomFootage: z.boolean(),
});

export type PromoProps = z.infer<typeof promoSchema>;

/** Promo 1920×1080, 22 bars. Scenes P1–P11 arrive in stage 4. */
export const Promo: React.FC<PromoProps> = () => <AbsoluteFill style={{ backgroundColor: color.paper }} />;
