import { BlenderRoomPart } from "./BlenderRoomPart";
import { DeskSpeakersModel } from "../models/desk-speakers";
import { DjControllerMeters } from "../models/dj-controller";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import { ABOUT_ROOM, ABOUT_MUSIC_WALL_OFFSET, ABOUT_MUSIC_BACK_OFFSET } from "@/store/config/aboutRoom";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useViewStore } from "@/store";
import { getLocale } from "@/i18n";
import { deskMessages } from "../models/desk.messages";

export function MusicCorner() {
  const { setHoveredObject } = useFloatingBar();
  return <group>
    <group position={[0, ABOUT_ROOM.floorY, -1.5]}
      onPointerEnter={event => {
        event.stopPropagation();
        if (useViewStore.getState().currentView !== "desk") setHoveredObject({ title: deskMessages[getLocale()].floatingLabel });
      }} onPointerLeave={() => setHoveredObject(null)}>
      <BlenderRoomPart name="MusicDesk" />
    </group>
    <DeskSpeakersModel physicalLighting position={[-3.75 + ABOUT_MUSIC_WALL_OFFSET, FLOOR_Y_POSITION + 1, 0.95 + ABOUT_MUSIC_BACK_OFFSET]} rotation={[0, 0.3, 0]} />
    <DeskSpeakersModel physicalLighting position={[-3.75 + ABOUT_MUSIC_WALL_OFFSET, FLOOR_Y_POSITION + 1, -1.55 + ABOUT_MUSIC_BACK_OFFSET]} rotation={[0, -0.3, 0]} />
    <group position={[0, ABOUT_ROOM.floorY, -1.5]}><BlenderRoomPart name="DjController" /></group>
    <DjControllerMeters position={[-3 + ABOUT_MUSIC_WALL_OFFSET, FLOOR_Y_POSITION + 1, -.3 + ABOUT_MUSIC_BACK_OFFSET]} />
  </group>;
}
