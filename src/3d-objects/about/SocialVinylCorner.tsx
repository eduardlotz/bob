import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { BlenderRoomPart } from "./BlenderRoomPart";

export function SocialVinylCorner() {
  return <group>
    <BlenderRoomPart name="RecordShelf" local />
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[1.85, 0.045, 0.425]} position={[0, 2.1, 0.075]} />
    </RigidBody>
  </group>;
}
