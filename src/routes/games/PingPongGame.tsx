import { useCallback, useEffect, useRef, useState } from "react";
import { RapierRigidBody } from "@react-three/rapier";

import { useActiveBobShape } from "@/hooks/useActiveBobShape";
import { useScaledGameCamera } from "@/hooks/useScaledGameCamera";
import { useScaledGameBody } from "@/hooks/useScaledGameBody";
import { CharacterBall } from "@/components/CharacterBall";
import { Paddle } from "@/3d-objects/PingPongPaddle";
import { useAppStore, useMiniGameStore } from "@/store";
import { useCursor } from "@/hooks/useCursor";
import { useFrame, useThree } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";

import {
  CAMERA_HEIGHT,
  CAMERA_Y_POSITION,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";
import { BackSide } from "three";
import { useCursorStore } from "@/store/core/cursor";
import { playSound } from "@/utils/soundSystem";
import { DEFAULT_PING_PONG_HIT_SOUND } from "@/utils/sound/defaults";
import { GradientTexture } from "@react-three/drei";
import { GameOverlay } from "./GameOverlay";
import { FlappyOverlay } from "./FlappyOverlay";
import styled from "styled-components";
import { usePaddleTilt } from "@/hooks/usePaddleTilt";
import { useI18n } from "@/i18n";
import { PointsCounter } from "@/molecules/PointsCounter";
import { PingPongInstructions } from "./PingPongInstructions";

const MIN_HIT_FORCE = 10;
const SCORE_FORCE_THRESHOLD = 50;
const SOUND_COOLDOWN_MS = 50;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function PingPongGame({ onExit: _onExit }: { onExit: () => void }) {
  const { sizeFactor } = useActiveBobShape();
  const startPosition = useRef<[number, number, number]>([0, 5 * sizeFactor, 0]);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const active = useRef(false);
  const lastScore = useRef(0);
  const lostAt = useRef(0);
  const ballApi = useRef<RapierRigidBody>(null!);
  const paddleApi = useRef<RapierRigidBody>(null!);
  useScaledGameBody(ballApi, sizeFactor);
  const lastHitSoundAtRef = useRef(0);
  const cursor = useCursorStore();
  const { isMobile } = useAppStore();
  const tilt = usePaddleTilt();
  const { locale, formatNumber } = useI18n();
  const { gl } = useThree();

  const mousePosition = useCursor({
    condition: () => !isMobile,
    positionFactor: 2.5,
  });

  const { incrementScore, resetScore } = useMiniGameStore();
  const highScore = useMiniGameStore((state) => state.highScores.PING_PONG);
  const score = useMiniGameStore((state) => state.session.score);
  const cameraControlsRef = useScaledGameCamera(sizeFactor);

  useEffect(() => {
    const controls = cameraControlsRef?.current;
    const previousTouchAction = controls?.touches.one;

    if (isMobile && cameraControlsRef?.current) {
      cameraControlsRef.current.touches.one = CameraControlsImpl.ACTION.NONE;
    }

    return () => {
      if (isMobile && controls && previousTouchAction !== undefined) {
        controls.touches.one = previousTouchAction;
      }
      cursor.show();
    };
  }, [cameraControlsRef, isMobile]);

  useEffect(() => {
    if (phase === "playing") cursor.hide();
    else cursor.show();
  }, [phase, cursor.hide, cursor.show]);

  const startRound = useCallback(() => {
    if (active.current || performance.now() - lostAt.current < 400) return;
    const body = ballApi.current;
    if (!body) return;
    resetScore();
    body.setTranslation({ x: 0, y: 5 * sizeFactor, z: 0 }, true);
    body.setLinvel({ x: 0, y: 10 * sizeFactor, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    body.setGravityScale(sizeFactor, true);
    lastHitSoundAtRef.current = 0;
    active.current = true;
    setPhase("playing");
  }, [resetScore, sizeFactor]);

  const finishRound = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    lastScore.current = useMiniGameStore.getState().session.score;
    lostAt.current = performance.now();
    resetScore();
    const body = ballApi.current;
    body?.setGravityScale(0, true);
    body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
    setPhase("over");
  }, [resetScore]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      startRound();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat ||
        (event.target as HTMLElement | null)?.closest("input,textarea,button,[contenteditable=true]")) return;
      event.preventDefault();
      startRound();
    };
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gl, startRound]);

  // camera follows cursor
  // TODO: export to shared or extend viewstore
  useFrame(({ clock }) => {
    // Check height regardless of how far sideways or backwards the ball flew.
    const body = ballApi.current;
    if (active.current && body && body.translation().y < -5 * sizeFactor) finishRound();
    if (!active.current && body) {
      body.setGravityScale(0, true);
      body.setTranslation({ x: 0, y: 5 * sizeFactor, z: 0 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    }
    const cursorX = mousePosition.current.x;
    const cursorY = mousePosition.current.y * 0.4;

    const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
    const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;

    if (cameraControlsRef) {
      cameraControlsRef.current?.setLookAt(
        0,
        CAMERA_HEIGHT * sizeFactor,
        HIDDEN_OPTIONS_CAMERA_ZOOM * sizeFactor,
        (cursorX + handCamSwayX) * sizeFactor,
        (cursorY + CAMERA_Y_POSITION + handCamSwayY) * sizeFactor,
        0,
        true,
      );
    }
  });

  const handleCollision = useCallback(
    (e: { totalForceMagnitude: number }) => {
      if (!active.current) return;
      const normalizedForce = e.totalForceMagnitude / sizeFactor;
      const impact = normalizedForce / 100;
      const now = performance.now();

      if (
        normalizedForce > MIN_HIT_FORCE &&
        now - lastHitSoundAtRef.current > SOUND_COOLDOWN_MS
      ) {
        lastHitSoundAtRef.current = now;
        playSound(DEFAULT_PING_PONG_HIT_SOUND.id, {
          volume: clamp(impact / 20, 0.12, 1),
        });
      }

      if (normalizedForce > SCORE_FORCE_THRESHOLD) {
        incrementScore();
      }
    },
    [incrementScore, sizeFactor],
  );

  return (
    <group>
      <GameOverlay><FlappyOverlay phase={phase}
        score={formatNumber(lastScore.current, { maximumFractionDigits: 0 })}
        highScore={formatNumber(Math.max(highScore, lastScore.current), { maximumFractionDigits: 0 })}
        scoreLabel={locale === "de" ? "Deine Punkte" : "your points"}
        instructions={isMobile
          ? (locale === "de" ? "Tippen zum Spielen" : "Tap to play")
          : (locale === "de" ? "Klicken oder Leertaste zum Spielen" : "Click or press space to play")}
        idleContent={<PingPongInstructions locale={locale} mode={isMobile ? (tilt.enabled ? "tilt" : "touch") : "mouse"} />}
      /></GameOverlay>
      {phase === "playing" && <PointsCounter number={score} />}
      <CharacterBall ref={ballApi} position={startPosition.current} scale={0.3}
        gravityScale={phase === "playing" ? sizeFactor : 0} />

      <Paddle ref={paddleApi} sizeFactor={sizeFactor} onCollide={handleCollision} tiltInput={tilt.enabled ? tilt.input : undefined} />

      {isMobile && phase !== "playing" && <GameOverlay>
        <TiltControl>
          <button type="button" aria-pressed={tilt.enabled} disabled={tilt.pending} onClick={tilt.toggle}
            aria-label={locale === "de" ? "Neigungssteuerung" : "Tilt controls"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(15 12 12)" />
              <path d="M3 8 1 12l2 4M21 8l2 4-2 4" />
            </svg>
          </button>
          {tilt.unavailable && <span role="status">{locale === "de" ? "Neigung nicht verfügbar. Touch bleibt aktiv." : "Tilt unavailable. Touch controls remain active."}</span>}
        </TiltControl></GameOverlay>}

      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture
            stops={[0, 1]}
            colors={["#8ca27f", "#d8d2b6"]}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

const TiltControl = styled.div`
  position: fixed;
  top: max(24px, env(safe-area-inset-top));
  right: 16px;
  z-index: 1001;
  pointer-events: auto;
  button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: white;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
  button[aria-pressed="true"] { background: #4178f7; }
  button:focus-visible { outline: 2px solid white; outline-offset: 3px; }
  span {
    position: absolute;
    right: 0;
    top: 52px;
    width: 210px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.65);
    color: white;
    font-size: 13px;
  }
`;
