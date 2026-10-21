import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { BallCollider, RapierRigidBody, RigidBody, useAfterPhysicsStep } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { Group } from "three";

import CameraControlsImpl from "camera-controls";

import { useMiniGameStore, useAppStore } from "@/store";

import {
  CAMERA_HEIGHT,
  CAMERA_Y_POSITION,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/store/config/camera";
import {
  FlappyRings,
  BASE_RING_SPEED,
  RING_SPEED_SCORE_FACTOR,
  RING_HOLE_RADIUS_MAX,
  RING_HOLE_RADIUS_MIN,
  RING_RADIAL_SEGMENTS,
  RING_TUBULAR_SEGMENTS,
  RING_TUBE_MAX,
  RING_TUBE_MIN,
} from "@/3d-objects/FlappyRings";
import { FlappyAtmosphere } from "@/3d-objects/FlappyAtmosphere";
import { GameOverlay } from "./GameOverlay";
import { FlappyOverlay } from "./FlappyOverlay";
import { useI18n } from "@/i18n";
import { PointsCounter } from "@/molecules/PointsCounter";
import { useActiveBobShape } from "@/hooks/useActiveBobShape";
import { useScaledGameCamera } from "@/hooks/useScaledGameCamera";
import { useScaledGameBody } from "@/hooks/useScaledGameBody";
import { getGameBallPhysics, scaleGameCoordinate } from "@/utils/gameSizing";
import { CharacterBall } from "@/components/CharacterBall";
import { useQuestStore } from "@/store/core/quests";
import { playSound, stopSoundsById } from "@/utils/soundSystem";

const FLAP_FORCE = 5;
const BIRD_START_X = 1;
const BIRD_START_Y = 1;
const BIRD_SCALE = 0.4;
const BIRD_ORIGIN = { x: BIRD_START_X, y: BIRD_START_Y, z: 0 };
const ARCADE_VISUAL_SCALE = 1.2;
const ARCADE_COLLIDER_SEGMENTS = 12;
const ARCADE_COLLIDER_DEPTH_FACTORS = [-1, 1] as const;

export function FlappyBirdGame({ onExit: _onExit }: { onExit: () => void }) {
  const { locale, formatNumber } = useI18n();
  const { sizeFactor } = useActiveBobShape();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const active = useRef(false);
  const lastScore = useRef(0);
  const lostAt = useRef(0);
  const birdApi = useRef<RapierRigidBody>(null!);
  const tilt = useRef({ angle: 0, velocity: 0 });
  const birdVisual = useRef<Group>(null);
  useScaledGameBody(birdApi, sizeFactor, BIRD_ORIGIN);

  const cameraControlsRef = useScaledGameCamera(sizeFactor);
  const incrementScore = useMiniGameStore((s) => s.incrementScore);
  const resetScore = useMiniGameStore((s) => s.resetScore);
  const score = useMiniGameStore((s) => s.session.score);
  const highScore = useMiniGameStore((s) => s.highScores.FLAPPY_BIRD);
  const isMobile = useAppStore((s) => s.isMobile);
  const questStoreHydrated = useQuestStore((state) => state.isHydrated);
  const syncQuestProgressFromMetric = useQuestStore(
    (state) => state.syncQuestProgressFromMetric,
  );

  const obstacles = useRef<{ reset: () => void } | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    const controls = cameraControlsRef?.current;
    const previousTouchAction = controls?.touches.one;
    if (isMobile && controls) {
      controls.touches.one = CameraControlsImpl.ACTION.NONE;
    }

    return () => {
      if (isMobile && controls && previousTouchAction !== undefined) {
        controls.touches.one = previousTouchAction;
      }
      stopSoundsById("flappy-flap");
      stopSoundsById("flappy-point");
      stopSoundsById("flappy-lose");
    };
  }, [cameraControlsRef, isMobile]);

  const flap = useCallback(() => {
    if (!active.current) {
      if (performance.now() - lostAt.current < 400) return;
      stopSoundsById("flappy-lose");
      resetScore();
      obstacles.current?.reset();
      birdApi.current?.setTranslation({ x: BIRD_START_X, y: BIRD_START_Y, z: 0 }, true);
      birdApi.current?.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      birdApi.current?.setEnabled(true);
      tilt.current = { angle: 0, velocity: 0 };
      birdApi.current?.setGravityScale(sizeFactor, true);
      active.current = true;
      setPhase("playing");
    }
    const body = birdApi.current;
    if (!body) return;

    body.wakeUp();
    body.setLinvel({ x: 0, y: FLAP_FORCE * sizeFactor, z: 0 }, true);
    const currentAng = body.angvel();
    body.setAngvel({ x: 0, y: 0, z: Math.max(currentAng.z, 2.2) }, true);

    playSound("flappy-flap");
  }, [resetScore, sizeFactor]);

  const reset = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    lastScore.current = useMiniGameStore.getState().session.score;
    lostAt.current = performance.now();
    resetScore();
    playSound("flappy-lose");
    setPhase("over");
    const body = birdApi.current;
    if (!body) return;
    body.setGravityScale(0, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    body.setTranslation({ x: BIRD_START_X, y: BIRD_START_Y, z: 0 }, true);
    body.setEnabled(false);
    tilt.current = { angle: 0, velocity: 0 };
  }, [resetScore]);

  useEffect(() => {
    if (!active.current) birdApi.current?.setEnabled(false);
  }, []);

  useAfterPhysicsStep(() => {
    if (!active.current || !birdApi.current) return;
    const y = birdApi.current.translation().y;
    if (y < scaleGameCoordinate(-6, sizeFactor, BIRD_START_Y) ||
      y > scaleGameCoordinate(12, sizeFactor, BIRD_START_Y)) reset();
  });

  const handleScore = useCallback(() => {
    incrementScore();
    playSound("flappy-point");
  }, [incrementScore]);

  useEffect(() => {
    if (!questStoreHydrated) return;
    syncQuestProgressFromMetric("minigames_flappy_score", score);
  }, [questStoreHydrated, score, syncQuestProgressFromMetric]);

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

  useFrame(({ clock }, delta) => {
    const body = birdApi.current;
    if (!body) return;

    const pos = body.translation();
    const vel = body.linvel();

    if (birdVisual.current) {
      birdVisual.current.position.y = active.current ? 0 : Math.sin(clock.elapsedTime * 2) * 0.15 * sizeFactor;
      if (!active.current) birdVisual.current.quaternion.identity();
    }

    if (cameraControlsRef?.current) {
      const targetX = isMobile ? BIRD_START_X + 2 * sizeFactor : BIRD_START_X;
      cameraControlsRef.current.setLookAt(
        scaleGameCoordinate(0, sizeFactor, BIRD_START_X),
        scaleGameCoordinate(CAMERA_HEIGHT, sizeFactor, BIRD_START_Y),
        HIDDEN_OPTIONS_CAMERA_ZOOM * sizeFactor,
        // Bird X is locked so use the constant — avoids camera drift.
        targetX,
        (active.current ? pos.y : BIRD_START_Y) + CAMERA_Y_POSITION * sizeFactor,
        0,
        true,
      );
    }

    if (!active.current) return;

    // Restore the original physical rotation control so rim contact can redirect Bob.
    const targetZ = Math.max(-2, Math.min(2, -vel.y / sizeFactor * 0.2));
    const ang = body.angvel();
    body.setAngvel(
      { x: 0, y: 0, z: ang.z + (targetZ - ang.z) * Math.min(1, delta * 6) },
      true,
    );

    // Pitch follows the flight path: upward on a flap, level at the apex,
    // downward while falling. A damped spring carries momentum across taps.
    const forwardSpeed = (BASE_RING_SPEED + Math.min(score, 60) * RING_SPEED_SCORE_FACTOR) * sizeFactor;
    const targetAngle = Math.max(-1.1, Math.min(0.65, Math.atan2(vel.y, forwardSpeed) * 0.7));
    const frameDelta = Math.min(delta, 0.05);
    const steps = Math.max(1, Math.ceil(frameDelta / (1 / 120)));
    const step = frameDelta / steps;
    for (let i = 0; i < steps; i++) {
      tilt.current.velocity += ((targetAngle - tilt.current.angle) * 100 - tilt.current.velocity * 16) * step;
      tilt.current.angle += tilt.current.velocity * step;
    }
    if (birdVisual.current) {
      // Keep the current visual pitch independent of the body's collision rotation.
      const rotation = birdVisual.current.parent?.quaternion;
      if (rotation) birdVisual.current.quaternion.copy(rotation).invert();
      else birdVisual.current.quaternion.identity();
      birdVisual.current.rotateZ(tilt.current.angle);
    }
  });

  return (
    <group>
      <FlappyAtmosphere score={phase === "over" ? lastScore.current : score} active={active} />
      <GameOverlay><FlappyOverlay phase={phase}
        score={formatNumber(lastScore.current, { maximumFractionDigits: 0 })}
        highScore={formatNumber(Math.max(highScore, lastScore.current), { maximumFractionDigits: 0 })}
        scoreLabel={locale === "de" ? "Deine Punkte" : "your points"}
        instructions={isMobile
          ? (locale === "de" ? "Tippen zum Spielen" : "Tap to play")
          : (locale === "de" ? "Klicken oder Leertaste zum Spielen" : "Click or press space to play")}
      /></GameOverlay>

      {phase === "playing" && <PointsCounter number={score} />}
      <CharacterBall
        ref={birdApi}
        visualRef={birdVisual}
        enabledTranslations={[false, true, false]}
        angularDamping={1}
        enabledRotations={[true, true, true]}
        position={[BIRD_START_X, BIRD_START_Y, 0]}
        scale={BIRD_SCALE}
        gravityScale={phase === "playing" ? sizeFactor : 0}
      />

      <FlappyRings
        ref={obstacles}
        birdBody={birdApi}
        birdRadius={getGameBallPhysics(BIRD_SCALE, sizeFactor).radius}
        sizeFactor={sizeFactor}
        origin={BIRD_ORIGIN}
        active={active}
        score={score}
        onScore={handleScore}
        onMiss={reset}
      />
    </group>
  );
}

export function FlappyBirdRingPreview(props: JSX.IntrinsicElements["group"]) {
  const arcadeTube = (RING_TUBE_MIN + RING_TUBE_MAX) * 0.5;
  const arcadeHole = (RING_HOLE_RADIUS_MIN + RING_HOLE_RADIUS_MAX) * 0.5;
  const arcadeRadius = arcadeHole + arcadeTube;

  return (
    <group {...props}>
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        scale={[
          ARCADE_VISUAL_SCALE,
          ARCADE_VISUAL_SCALE,
          ARCADE_VISUAL_SCALE,
        ]}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[arcadeRadius, arcadeTube, RING_RADIAL_SEGMENTS, RING_TUBULAR_SEGMENTS]} />
        <meshToonMaterial color="#ffcc00" />
      </mesh>
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
          <torusGeometry args={[arcadeRadius, arcadeTube, RING_RADIAL_SEGMENTS, RING_TUBULAR_SEGMENTS]} />
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
