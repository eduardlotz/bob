import { GrassShader } from "@/3d-objects/GrassShader";
import { FootballModel } from "@/3d-objects/models/football";
import { FootBallKeeper } from "@/3d-objects/models/footballKeeper";
import { GoalPost } from "@/3d-objects/models/goalPost";
import { CloudEffect } from "@/3d-objects/ParticleEffects";
import { useCursor } from "@/hooks/useCursor";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import {
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  CAMERA_Y_POSITION,
} from "@/molecules/HeadNavigation";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { BasketBox } from "@/physics/BasketBox";
import { useMiniGameStore, useViewStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider } from "@react-three/rapier";
import { useState, useRef, useCallback } from "react";
import { Vector3 } from "three";

export const FootballGame = ({ onExit }: { onExit: () => void }) => {
  const { incrementScore } = useMiniGameStore();

  const [ballKey, setBallKey] = useState(0);
  const isResetting = useRef(false);

  const mousePosition = useCursor({
    condition: () => true,
    positionFactor: 2.5,
  });

  const { showMessage } = useMessageStore();
  const { cameraControlsRef } = useViewStore();
  const { triggerQuest } = useQuestSystem();

  const createParticles = useCallback((x = 0, y = 2, z = 0, count = 50) => {
    if ((window as any).createTapParticles) {
      (window as any).createTapParticles(x, y, z, count);
    }
  }, []);

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

  const onGoalScored = () => {
    if (isResetting.current) return;
    isResetting.current = true;

    createParticles();
    // showMessage("minigames_home_goal_scored");
    triggerQuest("minigames_goal_scored");

    incrementScore();

    setTimeout(() => {
      setBallKey((prev) => prev + 1);
      isResetting.current = false;
    }, 1000);
  };

  return (
    <>
      <mesh position={[-8, 0, 0]} onClick={onExit}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <CloudEffect preview={false} />

      <FootBallKeeper position={[0, 0.5, -3]} />
      <FootballModel position={[-1, 2, 0]} key={ballKey} />
      <GrassShader position={[0, -0.8, 0]} preview={false} />

      <CuboidCollider args={[7 / 2, 0.02, 7 / 2]} position={[0, 4.5, 0]} />
      <BasketBox
        position={[0, 3.3 + FLOOR_Y_POSITION, -1]}
        width={7.5}
        depth={7}
        height={6}
        wallThickness={0.02}
      />

      <GoalPost
        position={[0, -1.2, -3]}
        scale={2}
        onEnter={onGoalScored}
        onLeave={() => {
          // console.log("left goal");
        }}
      />
    </>
  );
};
