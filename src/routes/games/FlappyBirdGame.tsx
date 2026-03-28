import { useEffect, useRef, useCallback, useMemo } from "react";
import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";

import CameraControlsImpl from "camera-controls";

import { useMiniGameStore, useAppStore, useViewStore } from "@/store";

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
import { FlappyClouds } from "@/3d-objects/FlappyClouds";
import { CharacterBall } from "@/components/CharacterBall";
import { useQuestActions } from "@/hooks/useQuestSystem";
import { playSound } from "@/utils/soundSystem";
import { BackSide } from "three";
import { GradientTexture } from "@react-three/drei";

const FLAP_FORCE = 5;
const BIRD_START_X = 1;
const BIRD_START_Y = 1;
const ARCADE_VISUAL_SCALE = 1.2;
const ARCADE_COLLIDER_SEGMENTS = 12;
const ARCADE_COLLIDER_DEPTH_FACTORS = [-1, 1] as const;

export function FlappyBirdGame({ onExit: _onExit }: { onExit: () => void }) {
  const birdApi = useRef<RapierRigidBody>(null!);

  const cameraControlsRef = useViewStore((s) => s.cameraControlsRef);
  const incrementScore = useMiniGameStore((s) => s.incrementScore);
  const resetScore = useMiniGameStore((s) => s.resetScore);
  const score = useMiniGameStore((s) => s.session.score);
  const isMobile = useAppStore((s) => s.isMobile);
  const { triggerQuest } = useQuestActions();

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

  const handleScore = useCallback(() => {
    incrementScore();
    triggerQuest("minigames_flappy_score", 1);
  }, [incrementScore, triggerQuest]);

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
      <FlappyClouds score={score} />

      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture
            stops={[0, 1]}
            colors={["#212c6e", "#a4addf"]}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>

      <CharacterBall
        ref={birdApi}
        enabledTranslations={[false, true, false]}
        angularDamping={1}
        position={[BIRD_START_X, BIRD_START_Y, 0]}
        scale={0.4}
      />

      <FlappyRings
        ref={obstacles}
        birdBody={birdApi}
        birdRadius={0.3}
        score={score}
        onScore={handleScore}
        onMiss={reset}
      />
    </group>
  );
}

export function FlappyBirdArcade({ position = [0, 5, 0], ...props }: any) {
  const arcadeTube = (RING_TUBE_MIN + RING_TUBE_MAX) * 0.5;
  const arcadeHole = (RING_HOLE_RADIUS_MIN + RING_HOLE_RADIUS_MAX) * 0.5;
  const arcadeRadius = arcadeHole + arcadeTube;
  const arcadeColliderAngles = useMemo(
    () =>
      new Array(ARCADE_COLLIDER_SEGMENTS).fill(0).map((_, index) => {
        const angle = (index / ARCADE_COLLIDER_SEGMENTS) * Math.PI * 2;
        return [Math.cos(angle), Math.sin(angle)] as const;
      }),
    [],
  );

  return (
    <RigidBody
      {...props}
      colliders={false}
      restitution={0.3}
      friction={0.8}
      position={position}
    >
      <group>
        {ARCADE_COLLIDER_DEPTH_FACTORS.map((depthFactor, depthIndex) => {
          const colliderRadius =
            Math.max(0.06, arcadeTube * 0.75) * ARCADE_VISUAL_SCALE;
          const colliderDepth =
            Math.max(0.03, arcadeTube * 0.6) *
            depthFactor *
            ARCADE_VISUAL_SCALE;
          const colliderRingRadius =
            Math.max(0.12, arcadeRadius - arcadeTube * 0.15) *
            ARCADE_VISUAL_SCALE;

          return arcadeColliderAngles.map(([cosA, sinA], angleIndex) => (
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

        <mesh
          rotation={[0, Math.PI / 2, 0]}
          scale={[
            ARCADE_VISUAL_SCALE,
            ARCADE_VISUAL_SCALE,
            ARCADE_VISUAL_SCALE,
          ]}
        >
          <torusGeometry args={[arcadeRadius, arcadeTube, 10, 32]} />
          <meshToonMaterial color="#ffcc00" />
        </mesh>

        {/* Pointer trigger: captures hover/click in the torus hole as well. */}
        <mesh>
          <sphereGeometry
            args={[arcadeHole * ARCADE_VISUAL_SCALE * 0.95, 16, 16]}
          />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
