import { useCallback, useEffect, useRef } from "react";
import { CuboidCollider, RapierRigidBody } from "@react-three/rapier";

import { CharacterBall } from "@/components/CharacterBall";
import { Paddle } from "@/3d-objects/PingPongPaddle";
import { useAppStore, useMiniGameStore, useViewStore } from "@/store";
import { useCursor } from "@/hooks/useCursor";
import { useFrame } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";

import {
  CAMERA_HEIGHT,
  CAMERA_Y_POSITION,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
} from "@/molecules/HeadNavigation";
import { Vector3 } from "three";
import { useCursorStore } from "@/store/core/cursor";
import { playSound } from "@/utils/soundSystem";
import { DEFAULT_PING_PONG_HIT_SOUND } from "@/utils/sound/defaults";

const MIN_HIT_FORCE = 10;
const SCORE_FORCE_THRESHOLD = 50;
const SOUND_COOLDOWN_MS = 50;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function PingPongGame({ onExit }: { onExit: () => void }) {
  const ballApi = useRef<RapierRigidBody>(null!);
  const paddleApi = useRef<RapierRigidBody>(null!);
  const lastHitSoundAtRef = useRef(0);
  const cursor = useCursorStore();
  const { isMobile } = useAppStore();

  const mousePosition = useCursor({
    condition: () => !isMobile,
    positionFactor: 2.5,
  });

  const { incrementScore, resetScore } = useMiniGameStore();
  const { cameraControlsRef } = useViewStore();

  useEffect(() => {
    cursor.hide();

    if (isMobile && cameraControlsRef?.current) {
      cameraControlsRef.current.touches.one = CameraControlsImpl.ACTION.NONE;
    }

    () => {
      if (isMobile && cameraControlsRef?.current) {
        cameraControlsRef.current.touches.one =
          CameraControlsImpl.ACTION.TOUCH_ROTATE;
      }
      cursor.show();
    };
  }, [cameraControlsRef, isMobile]);

  // camera follows cursor
  // TODO: export to shared or extend viewstore
  useFrame(({ clock }, delta) => {
    const cursorPos = new Vector3(mousePosition.x, mousePosition.y * 0.4, 0);

    const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
    const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;

    if (cameraControlsRef) {
      cameraControlsRef.current?.setLookAt(
        0,
        CAMERA_HEIGHT,
        HIDDEN_OPTIONS_CAMERA_ZOOM,
        cursorPos.x + handCamSwayX,
        cursorPos.y + CAMERA_Y_POSITION + handCamSwayY,
        cursorPos.z,
        true,
      );
    }
  });

  const handleCollision = useCallback((e: { totalForceMagnitude: number }) => {
    const impact = e.totalForceMagnitude / 100;
    const now = performance.now();

    if (
      e.totalForceMagnitude > MIN_HIT_FORCE &&
      now - lastHitSoundAtRef.current > SOUND_COOLDOWN_MS
    ) {
      lastHitSoundAtRef.current = now;
      playSound(DEFAULT_PING_PONG_HIT_SOUND.id, {
        volume: clamp(impact / 20, 0.12, 1),
      });
    }

    if (e.totalForceMagnitude > SCORE_FORCE_THRESHOLD) {
      incrementScore();
    }
  }, [incrementScore]);

  const resetBall = () => {
    resetScore();
    ballApi.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
    ballApi.current.setLinvel({ x: 0, y: 10, z: 0 }, true);
  };

  return (
    <group>
      <CharacterBall ref={ballApi} position={[0, 5, 0]} scale={0.3} />

      <Paddle ref={paddleApi} onCollide={handleCollision} />

      <CuboidCollider
        position={[0, -5, 0]}
        args={[20, 1, 2]}
        sensor
        onIntersectionEnter={resetBall}
      />
    </group>
  );
}
