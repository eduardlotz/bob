import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as T from 'three';
import { BALL_RADIUS, MIN_SHOT_POWER } from './courses';

export type GolfAimState = {
  pointer: number; start: T.Vector2; right: T.Vector3; forward: T.Vector3;
  maxPixels: number; x: number; z: number; power: number;
};
export function GolfAim({ ball, aim }: {
  ball: RefObject<RapierRigidBody | null>; aim: RefObject<GolfAimState | null>;
}) {
  const root = useRef<T.Group>(null);
  const arrow = useRef<T.Group>(null);
  const stem = useRef<T.Mesh>(null);
  const head = useRef<T.Mesh>(null);
  const pull = useRef<T.Mesh>(null);
  const handle = useRef<T.Mesh>(null);
  const power = useRef<T.Group>(null);
  const fill = useRef<T.Mesh>(null);
  const arrowhead = useMemo(() => {
    const shape = new T.Shape();
    shape.moveTo(0, .065); shape.lineTo(-.05, -.035); shape.lineTo(.05, -.035); shape.closePath();
    return new T.ShapeGeometry(shape);
  }, []);
  useEffect(() => () => arrowhead.dispose(), [arrowhead]);
  const right = useMemo(() => new T.Vector3(), []);
  const up = useMemo(() => new T.Vector3(), []);
  useFrame(({ camera }) => {
    const drag = aim.current, p = ball.current?.translation();
    if (root.current) root.current.visible = Boolean(drag && p);
    if (!drag || !p || !root.current) return;
    root.current.position.set(p.x, p.y - BALL_RADIUS + .008, p.z);
    const active = drag.power >= MIN_SHOT_POWER;
    const length = .18 + drag.power * 1.15;
    if (arrow.current) {
      arrow.current.visible = active;
      arrow.current.rotation.y = Math.atan2(-drag.x, -drag.z);
    }
    if (stem.current) { stem.current.scale.y = length; stem.current.position.z = -BALL_RADIUS - length / 2; }
    if (head.current) head.current.position.z = -BALL_RADIUS - length;
    if (pull.current) { pull.current.scale.y = drag.power * .7; pull.current.position.z = BALL_RADIUS + drag.power * .35; }
    if (handle.current) handle.current.position.z = BALL_RADIUS + drag.power * .7;
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    if (power.current) {
      power.current.position.copy(right).multiplyScalar(.095).addScaledVector(up, .075);
      power.current.position.y += BALL_RADIUS;
      power.current.quaternion.copy(camera.quaternion);
    }
    if (fill.current) { fill.current.scale.y = drag.power; fill.current.position.y = -.04 + .04 * drag.power; }
  });
  return <group ref={root} visible={false} name="golf-aim">
    <group ref={arrow} name="golf-ground-arrow">
      <mesh ref={stem} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[.022, 1]} /><meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh ref={head} geometry={arrowhead} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={-2} side={T.DoubleSide} />
      </mesh>
      <mesh ref={pull} rotation={[-Math.PI / 2, 0, 0]} name="golf-pull-line" renderOrder={3}>
        <planeGeometry args={[.012, 1]} /><meshBasicMaterial color="#f2c75c" transparent opacity={.8} />
      </mesh>
      <mesh ref={handle} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[.028, .04, 32]} /><meshBasicMaterial color="#f2c75c" side={T.DoubleSide} />
      </mesh>
    </group>
    <group ref={power} name="golf-power-line">
      <mesh renderOrder={12}><planeGeometry args={[.006, .086]} /><meshBasicMaterial color="#202630" depthTest={false} depthWrite={false} /></mesh>
      <mesh renderOrder={13}><planeGeometry args={[.003, .08]} /><meshBasicMaterial color="white" transparent opacity={.3} depthTest={false} depthWrite={false} /></mesh>
      <mesh ref={fill} renderOrder={14}><planeGeometry args={[.003, .08]} /><meshBasicMaterial color="white" depthTest={false} depthWrite={false} /></mesh>
    </group>
  </group>;
}
