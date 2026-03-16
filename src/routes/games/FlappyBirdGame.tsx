import { useEffect, useRef, useCallback } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";

import CameraControlsImpl from "camera-controls";

import { useMiniGameStore, useAppStore, useViewStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";

import {
  CAMERA_HEIGHT,
  CAMERA_Y_POSITION,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";
import {
  FlappyRings,
  RING_HOLE_RADIUS_MAX,
  RING_HOLE_RADIUS_MIN,
  RING_TUBE_MAX,
  RING_TUBE_MIN,
} from "@/3d-objects/FlappyRings";
import { CharacterBall } from "@/components/CharacterBall";
import { playSound } from "@/utils/soundSystem";

const FLAP_FORCE = 4;
const BIRD_START_X = 1;
const BIRD_START_Y = 1;

export function FlappyBirdGame({ onExit }: { onExit: () => void }) {
  const birdApi = useRef<RapierRigidBody>(null!);

  const cameraControlsRef = useViewStore((s) => s.cameraControlsRef);
  const incrementScore = useMiniGameStore((s) => s.incrementScore);
  const resetScore = useMiniGameStore((s) => s.resetScore);
  const score = useMiniGameStore((s) => s.session.score);
  const isMobile = useAppStore((s) => s.isMobile);

  const obstacles = useRef<{ reset: () => void } | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    if (isMobile && cameraControlsRef?.current) {
      cameraControlsRef.current.touches.one = CameraControlsImpl.ACTION.NONE;
    }

    return () => {
      if (isMobile && cameraControlsRef?.current) {
        cameraControlsRef.current.touches.one =
          CameraControlsImpl.ACTION.TOUCH_ROTATE;
      }
    };
  }, [cameraControlsRef, isMobile]);

  const flap = useCallback(() => {
    const body = birdApi.current;
    if (!body) return;

    body.wakeUp();
    body.setLinvel({ x: 0, y: FLAP_FORCE, z: 0 }, true);

    const currentAng = body.angvel();
    body.setAngvel({ x: 0, y: 0, z: Math.max(currentAng.z, 2.2) }, true);

    playSound("pop");
  }, []);

  const reset = useCallback(() => {
    resetScore();

    const body = birdApi.current;
    if (!body) return;

    body.setTranslation({ x: BIRD_START_X, y: BIRD_START_Y, z: 0 }, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);

    obstacles.current?.reset();
  }, [resetScore]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (target as any)?.isContentEditable
      )
        return;

      e.preventDefault();
      flap();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap]);

  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (typeof e.button === "number" && e.button !== 0) return;
      flap();
    };

    el.addEventListener("pointerdown", onPointerDown);
    return () => el.removeEventListener("pointerdown", onPointerDown);
  }, [gl, flap]);

  useFrame((_, delta) => {
    const body = birdApi.current;
    if (!body) return;

    const pos = body.translation();
    const vel = body.linvel();

    if (pos.y < -6) reset();

    if (cameraControlsRef?.current) {
      const targetX = isMobile ? BIRD_START_X + 2 : BIRD_START_X;
      cameraControlsRef.current.setLookAt(
        0,
        CAMERA_HEIGHT,
        HIDDEN_OPTIONS_CAMERA_ZOOM,
        // Bird X is locked so use the constant — avoids camera drift.
        targetX,
        pos.y + CAMERA_Y_POSITION,
        0,
        true,
      );
    }

    // Light auto-tilt based on vertical velocity (2D around Z axis only).
    const targetZ = Math.max(-2.0, Math.min(2.0, -vel.y * 0.2));
    const ang = body.angvel();
    body.setAngvel(
      { x: 0, y: 0, z: ang.z + (targetZ - ang.z) * Math.min(1, delta * 6) },
      true,
    );
  });

  return (
    <group>
      <CharacterBall
        ref={birdApi}
        // X locked — prevents bird drifting away from the ring centre-line,
        // which was causing the geometric crossing check to mis-arm and
        // incorrectly fire a miss on every ring.
        enabledTranslations={[false, true, false]}
        angularDamping={2.2}
        position={[BIRD_START_X, BIRD_START_Y, 0]}
        scale={0.3}
      />

      <FlappyRings
        ref={obstacles}
        birdBody={birdApi}
        birdRadius={0.3}
        score={score}
        onScore={incrementScore}
        onMiss={reset}
      />
    </group>
  );
}

export function FlappyBirdArcade({ position = [0, 5, 0], ...props }: any) {
  const rigidRef = useRef<RapierRigidBody>(null);
  const arcadeTube = (RING_TUBE_MIN + RING_TUBE_MAX) * 0.5;
  const arcadeHole = (RING_HOLE_RADIUS_MIN + RING_HOLE_RADIUS_MAX) * 0.5;
  const arcadeRadius = arcadeHole + arcadeTube;

  return (
    <RigidBody
      {...props}
      ref={rigidRef}
      colliders="trimesh"
      restitution={0.3}
      friction={0.8}
      position={position}
    >
      <group>
        <mesh rotation={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
          <torusGeometry args={[arcadeRadius, arcadeTube, 12, 48]} />
          <meshToonMaterial color="#ffcc00" />
        </mesh>
      </group>
    </RigidBody>
  );
}
