import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ringCrossing } from "./flappyCollision";
import { getFlappyRingColliders } from "./flappyRingGeometry";
import { scaleGameCoordinate } from "@/utils/gameSizing";

export const BASE_RING_SPEED = 3.8;
export const RING_SPEED_SCORE_FACTOR = 0.035;
export const RING_RADIAL_SEGMENTS = 6;
export const RING_TUBULAR_SEGMENTS = 20;
export const RING_TUBE_MIN = 0.12;
export const RING_TUBE_MAX = 0.24;
export const RING_HOLE_RADIUS_MIN = 0.6;
export const RING_HOLE_RADIUS_MAX = 1.5;
const RING_COUNT = 7;
const RING_DISTANCE = 6.5;
const RECYCLE_X = -18;
const FADE_IN_START = RING_DISTANCE * 4;
const FADE_IN_END = RING_DISTANCE * 2;
const FADE_OUT_START = -RING_DISTANCE;
const FADE_OUT_END = RECYCLE_X + 2;

type Props = {
  birdBody: React.RefObject<RapierRigidBody>;
  birdRadius: number;
  sizeFactor: number;
  origin: Readonly<{ x: number; y: number; z: number }>;
  score: number;
  active: React.MutableRefObject<boolean>;
  onScore: () => void;
  onMiss: () => void;
};
export type FlappyRingsHandle = { reset: () => void };

export const FlappyRings = forwardRef<FlappyRingsHandle, Props>(function FlappyRings(
  { birdBody, birdRadius, sizeFactor, origin, score, active, onScore, onMiss }, ref,
) {
  const bodies = useRef<Array<RapierRigidBody | null>>([]);
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  const time = useRef(0);
  const moving = useRef(false);
  const rings = useMemo(() => Array.from({ length: RING_COUNT }, (_, i) => {
    const tube = THREE.MathUtils.randFloat(RING_TUBE_MIN, RING_TUBE_MAX);
    const hole = THREE.MathUtils.randFloat(RING_HOLE_RADIUS_MIN, RING_HOLE_RADIUS_MAX);
    const radius = hole + tube;
    const geometry = new THREE.TorusGeometry(radius, tube, RING_RADIAL_SEGMENTS, RING_TUBULAR_SEGMENTS);
    geometry.rotateY(Math.PI / 2);
    return { x: 8 + i * RING_DISTANCE, y: 1.2, baseY: 1.2, radius, tube,
      passed: false, phase: Math.random() * Math.PI * 2, geometry,
      recycled: false };
  }), []);
  const colliders = useMemo(
    () => rings.map((ring) => getFlappyRingColliders(ring.radius, ring.tube, sizeFactor)),
    [rings, sizeFactor],
  );
  // Ring paths stay in reference units; only the rendering/physics boundary
  // converts to world coordinates. Resizing preserves every ring's progress.
  const worldX = (x: number) => scaleGameCoordinate(x, sizeFactor, origin.x);
  const worldY = (y: number) => scaleGameCoordinate(y, sizeFactor, origin.y);
  const initialPositions = useRef(rings.map((ring): [number, number, number] =>
    [worldX(ring.x), worldY(ring.y), origin.z],
  ));

  useEffect(() => {
    // Resize in place rather than sweeping a kinematic body from its old size
    // or resetting it to the start of the course through a position prop.
    rings.forEach((ring, index) => {
      const position = {
        x: scaleGameCoordinate(ring.x, sizeFactor, origin.x),
        y: scaleGameCoordinate(ring.y, sizeFactor, origin.y),
        z: origin.z,
      };
      bodies.current[index]?.setTranslation(position, true);
      bodies.current[index]?.setNextKinematicTranslation(position);
    });
  }, [rings, sizeFactor, origin]);

  useEffect(() => () => rings.forEach((ring) => ring.geometry.dispose()), [rings]);

  useImperativeHandle(ref, () => ({ reset() {
    time.current = 0;
    let y = 1.2;
    rings.forEach((ring, i) => {
      if (i > 0) y = THREE.MathUtils.clamp(y + (Math.random() - 0.5) * 1.4, -0.1, 3.2);
      Object.assign(ring, { x: 8 + i * RING_DISTANCE, y, baseY: y, passed: false, recycled: true });
      const body = bodies.current[i];
      body?.setTranslation({ x: worldX(ring.x), y: worldY(y), z: origin.z }, true);
      body?.setNextKinematicTranslation({ x: worldX(ring.x), y: worldY(y), z: origin.z });
    });
  } }), [rings, sizeFactor, origin]);

  useFrame((_, delta) => {
    const bird = birdBody.current;
    if (!bird) return;
    if (!active.current) {
      if (!moving.current) return;
      moving.current = false;
      // Clear the last kinematic velocity, including catch-up steps after a loss.
      bodies.current.forEach((body) => {
        if (!body) return;
        body.setNextKinematicTranslation(body.translation());
      });
      return;
    }
    moving.current = true;
    time.current += delta;
    const worldBirdPos = bird.translation();
    const birdPos = {
      x: scaleGameCoordinate(worldBirdPos.x, 1 / sizeFactor, origin.x),
      y: scaleGameCoordinate(worldBirdPos.y, 1 / sizeFactor, origin.y),
      z: (worldBirdPos.z - origin.z) / sizeFactor,
    };
    const speed = BASE_RING_SPEED + Math.min(score, 60) * RING_SPEED_SCORE_FACTOR;
    let furthest = Math.max(...rings.map((ring) => ring.x - speed * delta));
    let lastY = rings.reduce((a, b) => a.x > b.x ? a : b).baseY;

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const body = bodies.current[i];
      if (!body) continue;
      const nextX = ring.x - speed * delta;
      const nextY = ring.baseY + Math.sin(time.current * 0.65 + ring.phase) * 0.12;
      ring.recycled = false;
      if (!ring.passed) {
        // Original decision point: the ring centre crosses Bob during this frame.
        const crossing = ringCrossing(
          ring.x - birdPos.x, nextX - birdPos.x,
          birdPos.y - nextY, birdPos.z, ring.radius, ring.tube, birdRadius / sizeFactor,
        );
        if (crossing === "outside") { onMiss(); break; }
        if (crossing === "inside") {
          ring.passed = true;
          onScore();
        }
      }
      ring.x = nextX;
      ring.y = nextY;
      if (ring.x < RECYCLE_X) {
        ring.x = furthest + RING_DISTANCE;
        furthest = ring.x;
        lastY = THREE.MathUtils.clamp(lastY + (Math.random() - 0.5) * 1.6, -0.1, 3.2);
        ring.y = ring.baseY = lastY;
        ring.passed = false;
        ring.recycled = true;
        body?.setTranslation({ x: worldX(ring.x), y: worldY(ring.y), z: origin.z }, true);
      }
      body?.setNextKinematicTranslation({ x: worldX(ring.x), y: worldY(ring.y), z: origin.z });
    }
  });

  useFrame(() => {
    const birdX = birdBody.current?.translation().x;
    if (birdX === undefined) return;
    for (let i = 0; i < rings.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      // Follow Rapier's interpolated visual position for a smooth frame-by-frame fade.
      const distance = ((mesh.parent?.position.x ?? worldX(rings[i].x)) - birdX) / sizeFactor;
      const opacity = rings[i].recycled ? 0
        : (1 - THREE.MathUtils.smoothstep(distance, FADE_IN_END, FADE_IN_START))
          * THREE.MathUtils.smoothstep(distance, FADE_OUT_END, FADE_OUT_START);
      const material = mesh.material as THREE.MeshToonMaterial;
      material.opacity = opacity;
      material.depthWrite = opacity === 1;
      // Recycled rings stay hidden through the teleport's interpolation frame.
      mesh.visible = opacity > 0;
    }
  });

  return <group name="flappy-rings">
    {rings.map((ring, i) => <RigidBody key={i} ref={(body) => { bodies.current[i] = body; }}
      type="kinematicPosition" colliders={false} position={initialPositions.current[i]}>
      {colliders[i].positions.map((position, index) => <BallCollider key={index}
        args={[colliders[i].radius]} position={position} />)}
      <mesh ref={(mesh) => { meshes.current[i] = mesh; }} geometry={ring.geometry} scale={sizeFactor} castShadow>
        <meshToonMaterial color="#ffcc00" transparent opacity={0} depthWrite={false} />
      </mesh>
    </RigidBody>)}
  </group>;
});
