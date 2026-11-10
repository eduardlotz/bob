import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { ABOUT_VINYL_SHELF_Y } from "@/store/config/aboutRoom";
import { BlenderRoomPart } from "./BlenderRoomPart";

export function SocialVinylCorner() {
  return <group>
    <BlenderRoomPart name="RecordShelf" local />
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[1.85, 0.045, 0.425]} position={[0, ABOUT_VINYL_SHELF_Y, 0.07]} />
    </RigidBody>
  </group>;
}
