import { SOCIAL_LINKS } from "../socials/contentData";
import type { SocialLink } from "../socials/types";
import { useSocialCorner } from "./useSocialCorner";
import { useViewStore } from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";
import { aboutSocialPosterPose } from "@/store/config/aboutRoom";
import { BlenderRoomPart } from "./BlenderRoomPart";

function Poster({ link, index, relativeToFrontWall }: {
  link: SocialLink; index: number; relativeToFrontWall: boolean;
}) {
  const enterCorner = useSocialCorner("lounge");
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const pose = aboutSocialPosterPose(index, relativeToFrontWall);
  const leave = () => {
    setHoveredObject(null);
    useCursorStore.getState().setHoveringClickable(false);
  };
  return <group position={pose.position} rotation={pose.rotation}
    onPointerEnter={event => {
      event.stopPropagation();
      useCursorStore.getState().setHoveringClickable(true);
      setHoveredObject({ title: useViewStore.getState().currentView === "lounge"
        ? link.label : viewControlsMessages[locale].viewTitles.lounge });
    }} onPointerLeave={leave}
    onClick={event => {
      event.stopPropagation(); leave();
      if (event.delta > 5 || !enterCorner()) return;
      window.open(link.href, "_blank", "noopener,noreferrer");
    }}>
    <BlenderRoomPart name={`Social_${index}`} local />
  </group>;
}

/** The printed paper and its room lighting are baked into the model. */
export function SocialPosters({ wall, relativeToFrontWall = false }: {
  wall: "right" | "front"; relativeToFrontWall?: boolean;
}) {
  return <>{SOCIAL_LINKS.map((link, index) => (index < 3) === (wall === "right")
    ? <Poster key={link.id} link={link} index={index} relativeToFrontWall={relativeToFrontWall} />
    : null)}</>;
}
