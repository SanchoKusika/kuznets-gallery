import { Composition, Folder, Still } from "remotion";
import { Promo } from "./promo/Promo";
import { RoomReel, roomFrames } from "./room/RoomReel";
import { Showreel, showreelFrames } from "./showreel/Showreel";
import { Reels, reelsSchema } from "./reels/Reels";
import { ReelsCover } from "./reels/ReelsCover";
import { barAt } from "./theme/timing";
import { PROMO_BARS, REELS_BARS } from "./timeline";
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
        durationInFrames={barAt(REELS_BARS, 60)}
        defaultProps={{ showGuides: false }}
      />
      <Composition
        id="Promo"
        component={Promo}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={barAt(PROMO_BARS, 60)}
      />
      <Folder name="Short">
        <Composition id="Room" component={RoomReel} width={1080} height={1920} fps={60} durationInFrames={roomFrames(60)} />
        <Composition id="Showreel" component={Showreel} width={1080} height={1920} fps={60} durationInFrames={showreelFrames(60)} />
      </Folder>
      <Folder name="Extra">
        <Still id="ReelsCover" component={ReelsCover} width={1080} height={1920} />
        <Composition
          id="Promo50"
          component={Promo}
          width={1920}
          height={1080}
          fps={50}
          durationInFrames={barAt(PROMO_BARS, 50)}
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
    </>
  );
};
