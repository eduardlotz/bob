import { DeskModel } from "../models/desk";
import { DeskSpeakersModel } from "../models/desk-speakers";
import { DjControllerModel } from "../models/dj-controller";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import { ABOUT_ROOM } from "@/store/config/aboutRoom";

export function MusicCorner() {
  return <group>
    <DeskModel position={[-3.5, FLOOR_Y_POSITION + 0.7, 0]} rotation={[0, 0, 0]} scale={[2.5, 2.5, 2.5]} topColor={ABOUT_ROOM.walnut} />
    <DeskSpeakersModel position={[-3.75, FLOOR_Y_POSITION + 1, 1.25]} rotation={[0, 0.3, 0]} />
    <DeskSpeakersModel position={[-3.75, FLOOR_Y_POSITION + 1, -1.25]} rotation={[0, -0.3, 0]} />
    <DjControllerModel position={[-3, FLOOR_Y_POSITION + 1, 0]} />
  </group>;
}
