import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";

export const BASE_RING_SPEED = 2.5;
export const RING_SPEED_SCORE_FACTOR = 0.06;
const RING_DISTANCE = 7;
const RING_COUNT = 8;
const RING_START_X = 8;
const RECYCLE_X = -14;
const RING_COLLIDER_SEGMENTS = 12;
const RING_COLLIDER_DEPTH_FACTORS = [-1, 1] as const;

export const RING_TUBE_MIN = 0.12;
export const RING_TUBE_MAX = 0.24;
export const RING_HOLE_RADIUS_MIN = 0.6;
export const RING_HOLE_RADIUS_MAX = 1.5;

type Props = {
  birdBody: React.RefObject<RapierRigidBody>;
  birdRadius: number;
  score: number;
  onScore: () => void;
  onMiss: () => void;
};

type RingConfig = {
  startX: number;
  x: number;
  baseY: number;
  radius: number;
  tube: number;
  passed: boolean;
  wobbleAmp: number;
  wobbleSpeed: number;
  wobblePhase: number;
};

export const FlappyRings = forwardRef<any, Props>(function FlappyRings(
  { birdBody, birdRadius, score, onScore, onMiss },
  ref,
) {
  const bodies = useRef<RapierRigidBody[]>([]);
  const colliderAngles = useMemo(
    () =>
      new Array(RING_COLLIDER_SEGMENTS).fill(0).map((_, index) => {
        const angle = (index / RING_COLLIDER_SEGMENTS) * Math.PI * 2;
        return [Math.cos(angle), Math.sin(angle)] as const;
      }),
    [],
  );

  const configs = useMemo<RingConfig[]>(
    () =>
      new Array(RING_COUNT).fill(0).map((_, i) => {
        const tube =
          RING_TUBE_MIN + Math.random() * (RING_TUBE_MAX - RING_TUBE_MIN);
        const holeRadius =
          RING_HOLE_RADIUS_MIN +
          Math.random() * (RING_HOLE_RADIUS_MAX - RING_HOLE_RADIUS_MIN);
        const radius = holeRadius + tube;
        const baseY = Math.random() * 3;

        return {
          startX: i * RING_DISTANCE + RING_START_X,
          x: i * RING_DISTANCE + RING_START_X,
          baseY,
          radius,
          tube,
          passed: false,
          wobbleAmp: 0.12 + Math.random() * 0.22,
          wobbleSpeed: 0.5 + Math.random() * 0.7,
          wobblePhase: Math.random() * Math.PI * 2,
        };
      }),
    [],
  );

  const cfgRef = useRef(configs);
  const missLock = useRef(false);
  const scoreRef = useRef(score);
  const t = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useImperativeHandle(ref, () => ({
    reset() {
      missLock.current = false;
      cfgRef.current.forEach((cfg, i) => {
        cfg.passed = false;
        cfg.x = cfg.startX;
        cfg.baseY = Math.random() * 3;

        const body = bodies.current[i];
        if (!body) return;

        body.setTranslation({ x: cfg.x, y: cfg.baseY, z: 0 }, true);
        body.setNextKinematicTranslation({ x: cfg.x, y: cfg.baseY, z: 0 });
      });
    },
  }));

  useFrame((_, delta) => {
    if (missLock.current) return;

    t.current += delta;

    const bird = birdBody.current;
    if (!bird) return;
    const birdPos = bird.translation();

    const speed =
      BASE_RING_SPEED + Math.min(scoreRef.current, 80) * RING_SPEED_SCORE_FACTOR;
    let recycleAnchor = Number.NEGATIVE_INFINITY;

    cfgRef.current.forEach((cfg) => {
      const nextX = cfg.x - speed * delta;
      recycleAnchor = Math.max(recycleAnchor, nextX);
    });

    if (!Number.isFinite(recycleAnchor)) return;

    cfgRef.current.forEach((cfg, i) => {
      const body = bodies.current[i];
      if (!body) return;

      const currentX = cfg.x;
      const nextX = currentX - speed * delta;
      const wobble =
        Math.sin(t.current * cfg.wobbleSpeed + cfg.wobblePhase) * cfg.wobbleAmp;
      const nextY = cfg.baseY + wobble;

      if (!cfg.passed && currentX > birdPos.x && nextX <= birdPos.x) {
        // The ring's centre crosses the bird's X plane this frame.
        // This is the single authoritative scoring / miss decision point.
        const holeRadius = Math.max(0.1, cfg.radius - cfg.tube);
        const scoreRadius = Math.min(cfg.radius, holeRadius + 0.1);
        const dy = birdPos.y - nextY;
        const dz = birdPos.z; // rings always live at z=0
        const dist = Math.hypot(dy, dz);

        if (dist + birdRadius < scoreRadius) {
          // Bird centre + radius fits cleanly inside the hole → score.
          cfg.passed = true;
          onScore();
        } else {
          // Bird was outside the hole at the moment of crossing → miss.
          missLock.current = true;
          onMiss();
          return;
        }
      }

      // Recycle ring to the far right once it leaves the left edge.
      if (nextX < RECYCLE_X) {
        cfg.baseY = Math.random() * 3;
        cfg.passed = false;
        const resetY =
          cfg.baseY +
          Math.sin(t.current * cfg.wobbleSpeed + cfg.wobblePhase) *
            cfg.wobbleAmp;
        const newX = recycleAnchor + RING_DISTANCE;
        recycleAnchor = newX;
        cfg.x = newX;
        // Teleport the ring so it doesn't visibly sweep across the screen.
        body.setTranslation({ x: newX, y: resetY, z: 0 }, true);
        body.setNextKinematicTranslation({
          x: newX,
          y: resetY,
          z: 0,
        });
        return;
      }

      cfg.x = nextX;
      body.setNextKinematicTranslation({ x: nextX, y: nextY, z: 0 });
    });
  });

  return (
    <>
      {cfgRef.current.map((cfg, i) => (
        <RigidBody
          key={i}
          ref={(rb) => {
            if (!rb) return;
            bodies.current[i] = rb;
            const cfgNow = cfgRef.current[i];
            if (!cfgNow) return;
            rb.setTranslation({ x: cfgNow.x, y: cfgNow.baseY, z: 0 }, true);
            rb.setNextKinematicTranslation({
              x: cfgNow.x,
              y: cfgNow.baseY,
              z: 0,
            });
          }}
          type="kinematicPosition"
          colliders={false}
          position={[cfg.startX, cfg.baseY, 0]}
        >
          {/* Rotate so the hole faces the bird along +X */}
          {RING_COLLIDER_DEPTH_FACTORS.map((depthFactor, depthIndex) => {
            const colliderRadius = Math.max(0.06, cfg.tube * 0.75);
            const colliderDepth = Math.max(0.03, cfg.tube * 0.6) * depthFactor;
            const colliderRingRadius = Math.max(0.12, cfg.radius - cfg.tube * 0.15);

            return colliderAngles.map(([cosA, sinA], angleIndex) => (
              <BallCollider
                key={`${depthIndex}-${angleIndex}`}
                args={[colliderRadius]}
                position={[
                  colliderDepth,
                  cosA * colliderRingRadius,
                  sinA * colliderRingRadius,
                ]}
              />
            ));
          })}

          <group rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <torusGeometry args={[cfg.radius, cfg.tube, 10, 32]} />
              <meshToonMaterial color="#ffcc00" />
            </mesh>
          </group>
        </RigidBody>
      ))}
    </>
  );
});
