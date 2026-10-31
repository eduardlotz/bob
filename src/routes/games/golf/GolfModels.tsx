import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useMemo, useRef } from 'react';
import * as T from 'three';
import { CharacterBallModel } from '@/components/CharacterBall';
import { gardenGolfModel } from './golfMaterials';
import { TILE_SIZE, tilePosition, type GolfAsset, type Tile } from './courses';

export function GolfModel({ asset, scale = 1 }: { asset: GolfAsset; scale?: number }) {
  const { scene } = useGLTF(`/golf/${asset}.glb`);
  const model = useMemo(() => gardenGolfModel(scene), [scene]);
  return <primitive object={model} scale={scale} dispose={null} />;
}
export function GolfTile({ tile }: { tile: Tile }) {
  const { scene } = useGLTF(`/golf/${tile.asset}.glb`);
  const rotation = (tile.turn ?? 0) * Math.PI / 2;
  const { model, blades, bladePosition } = useMemo(() => {
    const model = gardenGolfModel(scene);
    const blades = model.getObjectByName('blades');
    const bladePosition = blades?.position.clone();
    blades?.removeFromParent();
    if (blades) blades.position.set(0, 0, 0);
    return { model, blades, bladePosition };
  }, [scene]);
  const bladeBody = useRef<RapierRigidBody>(null);
  const q = useMemo(() => new T.Quaternion(), []);
  const spin = useMemo(() => new T.Quaternion(), []);
  const axis = useMemo(() => new T.Vector3(0, 0, 1), []);
  const turn = useMemo(() => new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotation), [rotation]);
  const position = tilePosition(tile);
  const bladeWorld = useMemo(() => bladePosition?.clone().multiplyScalar(TILE_SIZE).applyQuaternion(turn).add(new T.Vector3(...position)), [bladePosition, turn, ...position]);
  useFrame(({ clock }) => {
    if (bladeBody.current) bladeBody.current.setNextKinematicRotation(q.copy(turn).multiply(spin.setFromAxisAngle(axis, clock.elapsedTime * .85)));
  });
  return <>
    <RigidBody type="fixed" colliders="trimesh" position={position} rotation={[0, rotation, 0]} friction={.65} restitution={.45}>
      <primitive object={model} scale={TILE_SIZE} dispose={null} />
    </RigidBody>
    {blades && bladeWorld && <RigidBody ref={bladeBody} type="kinematicPosition" colliders="trimesh" position={bladeWorld} restitution={.35}>
      <primitive object={blades} scale={TILE_SIZE} dispose={null} />
    </RigidBody>}
  </>;
}
export function GolfLobbyPreview() {
  return <group scale={1.1} rotation={[.25, 0, 0]}>
    <GolfModel asset="hole-round" />
    <group position={[0, .063, 0]}><GolfModel asset="flag-red" scale={.7} /></group>
    <group position={[.15, .11, -.24]}><CharacterBallModel scale={.049} /></group>
  </group>;
}
