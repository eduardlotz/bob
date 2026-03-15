import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider } from "@react-three/rapier";
import { Group } from "three";

const PIPE_SPEED = 4;
const PIPE_DISTANCE = 6;
const GAP = 2.6;

type Props = {
  onScore: () => void;
  onHit: () => void;
};

export const FlappyPipes = forwardRef<any, Props>(function FlappyPipes(
  { onScore, onHit },
  ref,
) {
  const pipes = useRef<Group[]>([]);

  const configs = useMemo(
    () =>
      new Array(4).fill(0).map((_, i) => ({
        x: i * PIPE_DISTANCE,
        gapY: Math.random() * 3,
      })),
    [],
  );

  useImperativeHandle(ref, () => ({
    reset() {
      pipes.current.forEach((p, i) => {
        p.position.x = i * PIPE_DISTANCE;
      });
    },
  }));

  useFrame((_, delta) => {
    pipes.current.forEach((p) => {
      p.position.x -= PIPE_SPEED * delta;

      if (p.position.x < -6) {
        p.position.x += PIPE_DISTANCE * pipes.current.length;
        p.position.y = Math.random() * 3;
      }
    });
  });

  return (
    <>
      {configs.map((cfg, i) => (
        <group
          key={i}
          ref={(el) => el && (pipes.current[i] = el)}
          position={[cfg.x, cfg.gapY, 0]}
        >
          {/* top pipe */}
          <mesh position={[0, GAP, 0]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshToonMaterial color="#2ecc71" />
          </mesh>

          <CuboidCollider
            args={[0.5, 3, 0.5]}
            position={[0, GAP, 0]}
            onCollisionEnter={onHit}
          />

          {/* bottom pipe */}
          <mesh position={[0, -GAP, 0]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshToonMaterial color="#2ecc71" />
          </mesh>

          <CuboidCollider
            args={[0.5, 3, 0.5]}
            position={[0, -GAP, 0]}
            onCollisionEnter={onHit}
          />

          {/* score sensor */}
          <CuboidCollider
            sensor
            args={[0.1, 2, 1]}
            onIntersectionEnter={onScore}
          />
        </group>
      ))}
    </>
  );
});
