import { Composition, Folder, Still } from "remotion";
import { Promo, promoSchema } from "./promo/Promo";
import { Reels, reelsSchema } from "./reels/Reels";
import { ReelsCover } from "./reels/ReelsCover";
import { barAt } from "./theme/timing";
import { Canvas3DPreview } from "./dev/Canvas3DPreview";
import { GridCirclesPreview } from "./dev/GridCirclesPreview";
import { LinesPromoPreview } from "./dev/LinesPromoPreview";
import { LinesReelsPreview } from "./dev/LinesReelsPreview";
import { LogoPreview } from "./dev/LogoPreview";
import { SfPromoFraming, SfPromoHall, SfReelsHook, SfReelsKids, SfReelsLogo, SfReelsWall } from "./stills/Styleframes";

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
        <Still id="ReelsCover" component={ReelsCover} width={1080} height={1920} />
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
      <Folder name="Styleframes">
        <Composition id="Sf1ReelsHook" component={SfReelsHook} width={1080} height={1920} fps={60} durationInFrames={1} />
        <Composition id="Sf2ReelsKids" component={SfReelsKids} width={1080} height={1920} fps={60} durationInFrames={1} />
        <Composition id="Sf3ReelsWall" component={SfReelsWall} width={1080} height={1920} fps={60} durationInFrames={1} />
        <Composition id="Sf4ReelsLogo" component={SfReelsLogo} width={1080} height={1920} fps={60} durationInFrames={1} />
        <Composition id="Sf5PromoHall" component={SfPromoHall} width={1920} height={1080} fps={60} durationInFrames={1} />
        <Composition id="Sf6PromoFraming" component={SfPromoFraming} width={1920} height={1080} fps={60} durationInFrames={1} />
      </Folder>
      <Folder name="Dev">
        <Composition id="DevLinesReels" component={LinesReelsPreview} width={1080} height={1920} fps={60} durationInFrames={barAt(4, 60)} />
        <Composition id="DevLinesPromo" component={LinesPromoPreview} width={1920} height={1080} fps={60} durationInFrames={barAt(4, 60)} />
        <Composition id="DevLogo" component={LogoPreview} width={1080} height={1920} fps={60} durationInFrames={barAt(3, 60)} />
        <Composition id="DevCanvas3D" component={Canvas3DPreview} width={1920} height={1080} fps={60} durationInFrames={barAt(3, 60)} />
        <Composition id="DevGridCircles" component={GridCirclesPreview} width={1080} height={1920} fps={60} durationInFrames={barAt(2, 60)} />
      </Folder>
    </>
  );
};
