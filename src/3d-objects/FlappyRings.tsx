import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, RigidBody, TrimeshCollider } from "@react-three/rapier";
import * as THREE from "three";
import { ringCrossing } from "./flappyCollision";

export const BASE_RING_SPEED = 3.6;
export const RING_SPEED_SCORE_FACTOR = 0.035;
export const RING_RADIAL_SEGMENTS = 6;
export const RING_TUBULAR_SEGMENTS = 20;
export const RING_TUBE_MIN = 0.12;
export const RING_TUBE_MAX = 0.24;
export const RING_HOLE_RADIUS_MIN = 0.6;
export const RING_HOLE_RADIUS_MAX = 1.5;
const RING_COUNT = 7;
const RING_DISTANCE = 6.5;

type Props = {
  birdBody: React.RefObject<RapierRigidBody>;
  birdRadius: number;
  score: number;
  active: React.MutableRefObject<boolean>;
  onScore: () => void;
  onMiss: () => void;
};
export type FlappyRingsHandle = { reset: () => void };

export const FlappyRings = forwardRef<FlappyRingsHandle, Props>(function FlappyRings(
  { birdBody, birdRadius, score, active, onScore, onMiss }, ref,
) {
  const bodies = useRef<Array<RapierRigidBody | null>>([]);
  const previousBird = useRef<{ x: number; y: number } | null>(null);
  const time = useRef(0);
  const rings = useMemo(() => Array.from({ length: RING_COUNT }, (_, i) => {
    const tube = THREE.MathUtils.randFloat(RING_TUBE_MIN, RING_TUBE_MAX);
    const hole = THREE.MathUtils.randFloat(RING_HOLE_RADIUS_MIN, RING_HOLE_RADIUS_MAX);
    const radius = hole + tube;
    // The visual mesh and solid collider share the exact same torus geometry.
    const geometry = new THREE.TorusGeometry(radius, tube, RING_RADIAL_SEGMENTS, RING_TUBULAR_SEGMENTS);
    geometry.rotateY(Math.PI / 2);
    return { x: 8 + i * RING_DISTANCE, y: 1.2, baseY: 1.2, radius, tube,
      passed: false, crossed: false, phase: Math.random() * Math.PI * 2, geometry,
      vertices: new Float32Array(geometry.attributes.position.array),
      indices: new Uint32Array(geometry.index!.array) };
  }), []);
  useEffect(() => () => rings.forEach((ring) => ring.geometry.dispose()), [rings]);

  useImperativeHandle(ref, () => ({ reset() {
    previousBird.current = null;
    time.current = 0;
    let y = 1.2;
    rings.forEach((ring, i) => {
      if (i > 0) y = THREE.MathUtils.clamp(y + (Math.random() - 0.5) * 1.4, -0.1, 3.2);
      Object.assign(ring, { x: 8 + i * RING_DISTANCE, y, baseY: y, passed: false, crossed: false });
      bodies.current[i]?.setTranslation({ x: ring.x, y, z: 0 }, true);
      bodies.current[i]?.setNextKinematicTranslation({ x: ring.x, y, z: 0 });
    });
  } }), [rings]);

  useFrame((_, rawDelta) => {
    const bird = birdBody.current;
    if (!bird || !active.current) return;
    const delta = Math.min(rawDelta, 0.05);
    time.current += delta;
    const position = bird.translation();
    const before = previousBird.current ?? position;
    const speed = BASE_RING_SPEED + Math.min(score, 60) * RING_SPEED_SCORE_FACTOR;
    let furthest = Math.max(...rings.map((ring) => ring.x));
    let lastY = rings.reduce((a, b) => a.x > b.x ? a : b).baseY;

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const nextX = ring.x - speed * delta;
      const nextY = ring.baseY + Math.sin(time.current * 0.65 + ring.phase) * 0.12;
      const x0 = ring.x - before.x;
      const x1 = nextX - position.x;
      if (!ring.passed) {
        const crossing = ringCrossing(x0, before.y - ring.y, x1, position.y - nextY, ring.radius);
        if (crossing === "outside") { onMiss(); break; }
        if (crossing === "inside") ring.crossed = true;
        if (ring.crossed && x1 < -ring.tube - birdRadius) {
          ring.passed = true;
          onScore();
        }
      }
      ring.x = nextX;
      ring.y = nextY;
      const body = bodies.current[i];
      if (ring.x < -18) {
        ring.x = furthest + RING_DISTANCE;
        furthest = ring.x;
        lastY = THREE.MathUtils.clamp(lastY + (Math.random() - 0.5) * 1.6, -0.1, 3.2);
        ring.y = ring.baseY = lastY;
        ring.passed = ring.crossed = false;
        body?.setTranslation({ x: ring.x, y: ring.y, z: 0 }, true);
      }
      body?.setNextKinematicTranslation({ x: ring.x, y: ring.y, z: 0 });
    }
    previousBird.current = { x: position.x, y: position.y };
  });

  return <group name="flappy-rings">
    {rings.map((ring, i) => <RigidBody key={i} ref={(body) => { bodies.current[i] = body; }}
      type="kinematicPosition" colliders={false} position={[ring.x, ring.y, 0]} restitution={0.2} friction={0}>
      <TrimeshCollider args={[ring.vertices, ring.indices]} />
      <mesh geometry={ring.geometry} castShadow>
        <meshToonMaterial color="#ffcc00" />
      </mesh>
    </RigidBody>)}
  </group>;
});
