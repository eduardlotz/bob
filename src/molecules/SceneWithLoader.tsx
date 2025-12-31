import { FillColumn, FillRow, HugColumn, HugRow } from "@/layout";
import { Logo, MotionIconWrapper } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, Suspense } from "react";
import { useProgress } from "@react-three/drei";
import Scene from "@/molecules/Scene";
import { UILayer } from "@/components/UILayer";
import { useAppStore, useGameStore } from "@/store";
import { initializeSoundSystem } from "@/utils/soundSystem";
import { Cursor } from "./Cursor";
import { format } from "date-fns/format";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";
import { StatusPill, Blinking, StatusPillButton } from "./BobPhone";
import { AppInfo } from "@/apps/options";

export const SCENE_REVEAL_DURATION = 0.8;

export const CustomLoader = ({
  onFadeOutComplete,
  onEnter,
}: {
  onFadeOutComplete: () => void;
  onEnter: () => void;
}) => {
  const { active, progress } = useProgress();
  const [percentage, setPercentage] = useState(0);
  const [finished, setFinished] = useState(false);
  const [exit, setExit] = useState(false);
  const { isReady, setGameReady, setSoundEnabled } = useGameStore();
  const { toggle, isMuted, isEnabled } = useSoundSystem();

  useEffect(() => {
    setPercentage((prev) => Math.max(prev, progress));

    if (!active && progress === 100 && !finished) {
      setFinished(true);
    }
  }, [active, progress, finished]);

  const handleEnter = () => {
    onEnter();
    setExit(true);
  };

  const currentHour = format(new Date(), "HH");
  const currentMinutes = format(new Date(), "mm");

  const handleAudioButtonClick = () => {
    toggle();
    setSoundEnabled(isEnabled);
  };

  return (
    <AnimatePresence onExitComplete={onFadeOutComplete}>
      {!exit && (
        <LoadingWrapper
          key="loader"
          initial={{
            clipPath: "circle(150% at 50% 50%)",
            opacity: 1,
          }}
          exit={{
            clipPath: "circle(0% at 50% 50%)",
            transition: {
              duration: SCENE_REVEAL_DURATION,
              ease: [0.26, 0.6, 0.4, 1],
            },
          }}
        >
          <FillColumn
            $align="center"
            $justify="center"
            $gap={"4rem"}
            style={{ width: "400px" }}
          >
            <AnimatePresence mode="popLayout">
              {!isReady && (
                <FillRow
                  key="loading-screen-infos"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  $gap={"4rem"}
                >
                  <StatusPill layout="position">
                    {currentHour}
                    <Blinking
                      style={{
                        paddingLeft: "0.1ch",
                        paddingRight: "0.05ch",
                      }}
                    >
                      :
                    </Blinking>
                    {currentMinutes}
                  </StatusPill>

                  <MotionIconWrapper
                    variants={MotionVariants.Pulse}
                    animate={!finished ? "animate" : "initial"}
                    initial="initial"
                    layoutId="page-logo"
                    layout="position"
                  >
                    <Logo />
                  </MotionIconWrapper>

                  <StatusPillButton
                    $active={!isMuted}
                    onClick={handleAudioButtonClick}
                    layout="position"
                  >
                    <motion.div
                      key={!isMuted ? "on" : "off"}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        bounce: 0.7,
                      }}
                    >
                      <SpeakerIcon muted={isMuted} />
                    </motion.div>
                  </StatusPillButton>
                </FillRow>
              )}
            </AnimatePresence>

            <ProgressContainer>
              <AnimatePresence mode="popLayout">
                {!finished && (
                  <HugColumn
                    key="game-loading-progress"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <ProgressBar>
                      <ProgressFill style={{ width: `${percentage}%` }} />
                    </ProgressBar>
                    <ProgressText>{Math.round(percentage)}%</ProgressText>
                  </HugColumn>
                )}

                {finished && !isReady && (
                  <StartButton
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    key="start-button"
                    onClick={handleEnter}
                  >
                    Starten
                  </StartButton>
                )}
              </AnimatePresence>
            </ProgressContainer>
          </FillColumn>
        </LoadingWrapper>
      )}
    </AnimatePresence>
  );
};

export const SceneWithLoader = ({
  permissionGranted,
  onEmotionUpdate,
  onLoaded,
  ...rest
}: {
  permissionGranted: boolean;
  onEmotionUpdate?: (data: {
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  }) => void;
  onLoaded?: () => void;
}) => {
  const [sceneReady, setSceneReady] = useState(false);
  const [mountLoader, setMountLoader] = useState(true);
  const { isMobile, emotionData, setPermissionGranted } = useAppStore();
  const { isReady, setGameReady } = useGameStore();

  const handleEnter = async () => {
    try {
      await initializeSoundSystem();
    } catch (error) {
      console.error("failed to initialize sound system:", error);
    }

    setGameReady(true);

    setSceneReady(true);
    onLoaded?.();
  };

  const handleLoaderExit = () => {
    setMountLoader(false);
  };

  return (
    <>
      {mountLoader && (
        <CustomLoader
          onEnter={handleEnter}
          onFadeOutComplete={handleLoaderExit}
        />
      )}

      <Suspense fallback={null}>
        <Scene
          permissionGranted={permissionGranted}
          onEmotionUpdate={onEmotionUpdate}
          {...rest}
        />
      </Suspense>

      {!isMobile && <Cursor attachToParent />}

      {isReady && (
        <UILayer
          permissionGranted={permissionGranted}
          isMobile={isMobile}
          sceneLoaded={isReady}
          setPermissionGranted={setPermissionGranted}
          emotionState={emotionData?.emotionState || "normal"}
        />
      )}
    </>
  );
};

const StartButton = styled(motion.button)`
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;

  background-color: #fff;
  color: #212121;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
  }
`;

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99998; //cursor - 1

  width: 100dvw;
  height: 100dvh;
  padding: 40px 16px 0 16px;
  background-color: #000000;

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: #ffffff !important;
  }
`;

const ProgressContainer = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #333333;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #ffffff;
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
`;
