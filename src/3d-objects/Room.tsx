import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { ABOUT_ROOM } from "@/store/config/aboutRoom";
import { HIDDEN_OPTIONS_CAMERA_ZOOM } from "@/store/config/camera";
import { AboutWindow } from "./about/AboutWindow";
import { SocialPosters } from "./about/SocialPosters";
import { CornerTrigger } from "./about/CornerTrigger";
import { InteractiveObject } from "@/molecules/InteractiveObject";
import { BlenderRoomPart } from "./about/BlenderRoomPart";

export function Room() {
  const { depth, floorY } = ABOUT_ROOM;
  const rearWall = useRef<Group>(null);
  const cameraPosition = useMemo(() => new Vector3(), []);
  const clearance = depth / 2 - HIDDEN_OPTIONS_CAMERA_ZOOM;
  useFrame(({ camera }) => {
    if (!rearWall.current) return;
    camera.getWorldPosition(cameraPosition);
    // Use the resolved camera movement, including its easing and interrupted exits.
    rearWall.current.position.z = Math.max(depth / 2, cameraPosition.z + clearance);
  });
  return <group position-y={floorY}>
    <BlenderRoomPart name="RoomShell" />
    <BlenderRoomPart name="Window" />
    <AboutWindow />
    <BlenderRoomPart name="Exterior" />
    <BlenderRoomPart name="ExteriorTree" />
    <BlenderRoomPart name="ExteriorTreeSecond" />
    <BlenderRoomPart name="ExteriorBackdrop" />
    <BlenderRoomPart name="ExteriorMoon" />
    <InteractiveObject questAction="click_socials" mode="view" viewId="lounge">
      <BlenderRoomPart name="Armchair" />
    </InteractiveObject>
    <BlenderRoomPart name="FloorLamp" />
    <BlenderRoomPart name="CoffeeTable" />
    <BlenderRoomPart name="ShelfLights" />
    <group ref={rearWall} position-z={depth / 2}>
      <BlenderRoomPart name="FrontWall" local />
      <SocialPosters wall="front" relativeToFrontWall />
      <CornerTrigger viewId="lounge" questAction="click_socials" surfaces={[
        { position: [3.65, 2.9, -.101], rotation: [0, Math.PI, 0], size: [2.8, 5.15] },
      ]} />
    </group>
  </group>;
}
