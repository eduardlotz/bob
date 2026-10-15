import { GrassShader } from "@/3d-objects/GrassShader";
import { FootBallKeeper } from "@/3d-objects/models/footballKeeper";
import { GoalPost } from "@/3d-objects/models/goalPost";
import { CloudEffect } from "@/3d-objects/ParticleEffects";
import { useActiveBobShape } from "@/hooks/useActiveBobShape";
import { useScaledGameCamera } from "@/hooks/useScaledGameCamera";
import { useScaledGameBody } from "@/hooks/useScaledGameBody";
import { CharacterBall } from "@/components/CharacterBall";
import { useCursor } from "@/hooks/useCursor";
import { useQuestActions } from "@/hooks/useQuestSystem";
import {
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  CAMERA_Y_POSITION,
} from "@/molecules/HeadNavigation";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { useAppStore, useMiniGameStore } from "@/store";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import { useState, useRef, useCallback } from "react";

export const FootballGame = ({ onExit }: { onExit: () => void }) => {
  const { sizeFactor } = useActiveBobShape();
  const startPosition = useRef<[number, number, number]>([0, 3 * sizeFactor, 0]);
  const { incrementScore } = useMiniGameStore();
  const { isMobile } = useAppStore();

  const [ballKey, setBallKey] = useState(0);
  const ballApi = useRef<RapierRigidBody>(null!);
  useScaledGameBody(ballApi, sizeFactor);

  const isResetting = useRef(false);

  const mousePosition = useCursor({
    condition: () => !isMobile,
    positionFactor: 2.5,
  });

  const cameraControlsRef = useScaledGameCamera(sizeFactor);
  const { triggerQuest } = useQuestActions();

  const createParticles = useCallback((x = 0, y = 2, z = 0, count = 50) => {
    if ((window as any).createTapParticles) {
      (window as any).createTapParticles(x, y, z, count);
    }
  }, []);

  useFrame(({ clock }) => {
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

  const resetBall = () => {
    ballApi.current.setTranslation({ x: 0, y: 3 * sizeFactor, z: 0 }, true);
    ballApi.current.setLinvel({ x: 0, y: 3 * sizeFactor, z: 0 }, true);
    isResetting.current = false;
  };

  const onGoalScored = () => {
    if (isResetting.current) return;
    isResetting.current = true;

    createParticles();
    // showMessage("minigames_home_goal_scored");
    triggerQuest("minigames_goal_scored");

    incrementScore();

    setTimeout(() => {
      resetBall();
    }, 1000);
  };

  return (
    <>
      <CloudEffect preview={false} />

      <FootBallKeeper position={[0, 0.5 * sizeFactor, -3 * sizeFactor]}
        scale={sizeFactor} amplitudeX={2 * sizeFactor} amplitudeY={sizeFactor} />

      <CharacterBall
        ref={ballApi}
        position={startPosition.current}
        ccd={false}
        enabledTranslations={[true, true, true]}
        key={ballKey}
        scale={0.3}
        gravityScale={sizeFactor}
      />
      <GrassShader position={[0, -0.8 * sizeFactor, 0]} scale={[sizeFactor, sizeFactor, sizeFactor]} preview={false} />

      <CuboidCollider args={[3.5 * sizeFactor, 0.02 * sizeFactor, 3.5 * sizeFactor]} position={[0, 4.5 * sizeFactor, 0]} />
      <BasketBox
        position={[0, (3.3 + FLOOR_Y_POSITION) * sizeFactor, -sizeFactor]}
        width={6.6 * sizeFactor}
        depth={7 * sizeFactor}
        height={6 * sizeFactor}
        wallThickness={0.2 * sizeFactor}
      />

      <CuboidCollider
        args={[3 * sizeFactor, 1.2 * sizeFactor, 0.5 * sizeFactor]}
        position={[0, 3.8 * sizeFactor, -3.8 * sizeFactor]}
        sensor
        onIntersectionEnter={resetBall}
      />

      <GoalPost
        position={[0, -1.2 * sizeFactor, -3 * sizeFactor]}
        scale={2 * sizeFactor}
        onEnter={onGoalScored}
        onLeave={() => {
          // console.log("left goal");
        }}
      />
    </>
  );
};
