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

export function PingPongGame({ onExit }: { onExit: () => void }) {
  const ballApi = useRef<RapierRigidBody>(null!);
  const paddleApi = useRef<RapierRigidBody>(null!);
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
  }, []);

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

  const handleCollision = (e: any) => {
    if (e.totalForceMagnitude > 50) {
      incrementScore();
    }
  };

  const resetBall = () => {
    resetScore();
    ballApi.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
    ballApi.current.setLinvel({ x: 0, y: 10, z: 0 }, true);
  };

  return (
    <group>
      <CharacterBall ref={ballApi} position={[0, 5, 0]} />

      <Paddle ref={paddleApi} onCollide={handleCollision} />

      <CuboidCollider
        position={[0, -5, 0]}
        args={[20, 1, 2]}
        sensor
        onIntersectionEnter={resetBall}
      />

      <mesh position={[-8, 0, 0]} onClick={onExit}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </group>
  );
}
