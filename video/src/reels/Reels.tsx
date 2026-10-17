import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { color } from "../theme/tokens";

export const reelsSchema = z.object({
  /** Meta safe zone overlay (brief 5.7). */
  showGuides: z.boolean(),
});

export type ReelsProps = z.infer<typeof reelsSchema>;

/** Reels 1080×1920, 12 bars. Scenes R1–R8 arrive in stage 3. */
export const Reels: React.FC<ReelsProps> = () => <AbsoluteFill style={{ backgroundColor: color.paper }} />;
