import { BlenderRoomPart } from "./BlenderRoomPart";
import { DeskSpeakersModel } from "../models/desk-speakers";
import { DjControllerMeters } from "../models/dj-controller";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import { ABOUT_ROOM, ABOUT_MUSIC } from "@/store/config/aboutRoom";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useViewStore } from "@/store";
import { getLocale } from "@/i18n";
import { deskMessages } from "../models/desk.messages";

export function MusicCorner() {
  const { setHoveredObject } = useFloatingBar();
  return <group>
    <group position={[0, ABOUT_ROOM.floorY, 0]}
      onPointerEnter={event => {
        event.stopPropagation();
        if (useViewStore.getState().currentView !== "desk") setHoveredObject({ title: deskMessages[getLocale()].floatingLabel });
      }} onPointerLeave={() => setHoveredObject(null)}>
      <BlenderRoomPart name="MusicDesk" />
    </group>
    <DeskSpeakersModel physicalLighting position={[ABOUT_MUSIC.speakerX, FLOOR_Y_POSITION + 1, ABOUT_MUSIC.speakerZ[0]]} rotation={[0, 0.3, 0]} />
    <DeskSpeakersModel physicalLighting position={[ABOUT_MUSIC.speakerX, FLOOR_Y_POSITION + 1, ABOUT_MUSIC.speakerZ[1]]} rotation={[0, -0.3, 0]} />
    <group position={[0, ABOUT_ROOM.floorY, 0]}><BlenderRoomPart name="DjController" /></group>
    <DjControllerMeters position={ABOUT_MUSIC.controller} />
  </group>;
}
