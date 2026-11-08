import { useEffect } from "react";
import { useViewStore } from "@/store";
import { useVinylStore } from "@/store/vinyls";
import { ABOUT_CORNERS, ABOUT_ROOM, aboutCornerPose } from "@/store/config/aboutRoom";
import { ABOUT_VINYLS, ABOUT_PICTURES } from "./roomConfig";
import { RoomDisplayObject } from "./RoomDisplayObject";
import { BlenderRoomPart } from "./BlenderRoomPart";

const PHOTO_WIDTH = 0.49 * 0.75;
const PHOTO_HEIGHT = 0.64 * 0.75;

export function VinylCollection() {
  const selected = useVinylStore(state => state.selected);
  const navigate = useVinylStore(state => state.navigate);
  const setCameraEnabled = useViewStore(state => state.setCameraEnabled);
  useEffect(() => {
    setCameraEnabled(selected === null);
    return () => setCameraEnabled(true);
  }, [selected, setCameraEnabled]);
  useEffect(() => {
    if (selected === null) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      navigate(event.key === "ArrowLeft" ? -1 : 1);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      useVinylStore.getState().select(null);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", escape, true);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", escape, true);
    };
  }, [selected, navigate]);
  const [x, y] = ABOUT_CORNERS.socials.position;
  return <>
    {ABOUT_VINYLS.map((album, index) => <RoomDisplayObject key={album.id} id={album.id} title={`${album.artist} · ${album.title}`}
      position={[x + (index - (ABOUT_VINYLS.length - 1) / 2) * 0.94, y + 3.55, -ABOUT_ROOM.depth / 2 + 0.08]}
      rotation={[0, 0, 0]} width={0.84} height={0.84}>
      {focused => <BlenderRoomPart name={`Record_${index}`} local focused={focused} />}
    </RoomDisplayObject>)}
    {ABOUT_PICTURES.map((picture, index) => <RoomDisplayObject key={picture.id} id={picture.id} title={picture.title}
      position={aboutCornerPose("socials", [(index - 1.5) * 0.9, 2.145 + PHOTO_HEIGHT / 2, 0.28], [0, 0, 0]).position}
      rotation={[-0.13, ABOUT_CORNERS.socials.yaw + (index - 1.5) * -0.08, 0]} width={PHOTO_WIDTH} height={PHOTO_HEIGHT}>
      {focused => <BlenderRoomPart name={`Photo_${index}`} local focused={focused} />}
    </RoomDisplayObject>)}
  </>;
}
