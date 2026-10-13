import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { RapierRigidBody, RigidBody, TrimeshCollider, useBeforePhysicsStep, useAfterPhysicsStep } from "@react-three/rapier";
import * as THREE from "three";
import { ringCrossing } from "./flappyCollision";

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
  const moving = useRef(false);
  const rings = useMemo(() => Array.from({ length: RING_COUNT }, (_, i) => {
    const tube = THREE.MathUtils.randFloat(RING_TUBE_MIN, RING_TUBE_MAX);
    const hole = THREE.MathUtils.randFloat(RING_HOLE_RADIUS_MIN, RING_HOLE_RADIUS_MAX);
    const radius = hole + tube;
    // The visual mesh and solid collider share the exact same torus geometry.
    const geometry = new THREE.TorusGeometry(radius, tube, RING_RADIAL_SEGMENTS, RING_TUBULAR_SEGMENTS);
    geometry.rotateY(Math.PI / 2);
    return { x: 8 + i * RING_DISTANCE, y: 1.2, previousX: 8 + i * RING_DISTANCE, previousY: 1.2, baseY: 1.2, radius, tube,
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

  useBeforePhysicsStep((world) => {
    const bird = birdBody.current;
    if (!bird) return;
    if (!active.current) {
      if (!moving.current) return;
      moving.current = false;
      // Clear the last kinematic velocity, including catch-up steps after a loss.
      bodies.current.forEach((body) => {
        if (body) body.setNextKinematicTranslation(body.translation());
      });
      return;
    }
    moving.current = true;
    const delta = world.timestep;
    time.current += delta;
    previousBird.current = bird.translation();
    const speed = BASE_RING_SPEED + Math.min(score, 60) * RING_SPEED_SCORE_FACTOR;
    let furthest = Math.max(...rings.map((ring) => ring.x));
    let lastY = rings.reduce((a, b) => a.x > b.x ? a : b).baseY;

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const nextX = ring.x - speed * delta;
      const nextY = ring.baseY + Math.sin(time.current * 0.65 + ring.phase) * 0.12;
      ring.previousX = ring.x;
      ring.previousY = ring.y;
      ring.x = nextX;
      ring.y = nextY;
      const body = bodies.current[i];
      if (ring.x < -18) {
        ring.x = furthest + RING_DISTANCE;
        furthest = ring.x;
        lastY = THREE.MathUtils.clamp(lastY + (Math.random() - 0.5) * 1.6, -0.1, 3.2);
        ring.y = ring.baseY = lastY;
        ring.previousX = ring.x;
        ring.previousY = ring.y;
        ring.passed = ring.crossed = false;
        body?.setTranslation({ x: ring.x, y: ring.y, z: 0 }, true);
      }
      body?.setNextKinematicTranslation({ x: ring.x, y: ring.y, z: 0 });
    }
  });

  useAfterPhysicsStep(() => {
    const bird = birdBody.current;
    const before = previousBird.current;
    if (!bird || !before || !active.current) return;
    const position = bird.translation();
    for (const ring of rings) {
      if (ring.passed) continue;
      const x0 = ring.previousX - before.x;
      const x1 = ring.x - position.x;
      const crossing = ringCrossing(x0, before.y - ring.previousY, x1, position.y - ring.y, ring.radius);
      if (crossing === "outside") { onMiss(); break; }
      if (crossing === "inside") ring.crossed = true;
      if (ring.crossed && x1 < -ring.tube - birdRadius) {
        ring.passed = true;
        onScore();
      }
    }
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
