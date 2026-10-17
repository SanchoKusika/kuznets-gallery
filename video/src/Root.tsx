import { Composition, Folder, Still } from "remotion";
import { Promo, promoSchema } from "./promo/Promo";
import { Reels, reelsSchema } from "./reels/Reels";
import { barAt } from "./theme/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reels"
        component={Reels}
        schema={reelsSchema}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={barAt(12, 60)}
        defaultProps={{ showGuides: false }}
      />
      <Composition
        id="Promo"
        component={Promo}
        schema={promoSchema}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={barAt(22, 60)}
        defaultProps={{ useShowroomFootage: false }}
      />
      <Folder name="Extra">
        <Still id="ReelsCover" component={Reels} schema={reelsSchema} width={1080} height={1920} defaultProps={{ showGuides: false }} />
        <Composition
          id="Promo50"
          component={Promo}
          schema={promoSchema}
          width={1920}
          height={1080}
          fps={50}
          durationInFrames={barAt(22, 50)}
          defaultProps={{ useShowroomFootage: false }}
        />
      </Folder>
    </>
  );
};
