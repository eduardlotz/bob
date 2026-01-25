import { FillColumn, HugColumn } from "@/layout";
import { Logo, MotionIconWrapper } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useProgress } from "@react-three/drei";
import Scene from "@/molecules/Scene";
import { UILayer } from "@/components/UILayer";
import { useAppStore, useCoreStore } from "@/store";
import { initializeSoundSystem } from "@/utils/soundSystem";
import { Cursor } from "./Cursor";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";
import { StatusPillButton } from "@/apps/ui";

export const SCENE_REVEAL_DURATION = 0.5;

export const CustomLoader = ({
  onFadeOutComplete,
  onEnter,
  isInitialLoad,
}: {
  onFadeOutComplete: () => void;
  onEnter: () => void;
  isInitialLoad: boolean;
}) => {
  const { active, progress } = useProgress();
  const [percentage, setPercentage] = useState(0);
  const [finished, setFinished] = useState(false);
  const [exit, setExit] = useState(false);
  const { setGameReady, setSoundEnabled } = useCoreStore();
  const { toggle, isMuted, isEnabled } = useSoundSystem();

  // Track if this is monitoring initial scene load only
  const initialLoadCompleteRef = useRef(false);

  useEffect(() => {
    // Only update progress during initial load
    if (isInitialLoad && !initialLoadCompleteRef.current) {
      setPercentage((prev) => Math.max(prev, progress));

      if (!active && progress === 100) {
        setFinished(true);
        initialLoadCompleteRef.current = true;
      }
    }
  }, [active, progress, isInitialLoad]);

  const handleEnter = () => {
    onEnter();
    setExit(true);

    const timer = setTimeout(() => setGameReady(true), SCENE_REVEAL_DURATION);
    return () => clearTimeout(timer);
  };

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
            clipPath: "circle(100% at 50% 50%)",
            opacity: 1,
          }}
          exit={{
            clipPath: "circle(0% at 50% 50%)",
            transition: {
              duration: SCENE_REVEAL_DURATION,
              ease: [0.26, 0, 0.24, 1],
            },
          }}
        >
          <FillColumn
            $align="center"
            $justify="center"
            $gap={"2rem"}
            style={{ width: "400px" }}
          >
            <HugColumn
              $align="center"
              $justify="center"
              key="loading-screen-infos"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              $gap={"2rem"}
            >
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
            </HugColumn>

            <AnimatePresence mode="popLayout" initial={false}>
              <ProgressContainer>
                {!finished ? (
                  <>
                    <ProgressBar
                      key="progress"
                      layoutId="transition-element"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ borderRadius: "50px", opacity: 1 }}
                    >
                      <ProgressFill style={{ width: `${percentage}%` }} />
                    </ProgressBar>
                    <ProgressText
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        bounce: 0.7,
                      }}
                    >
                      {Math.round(percentage)}%
                    </ProgressText>
                  </>
                ) : (
                  <StartButton
                    key="button"
                    layoutId="transition-element"
                    onClick={handleEnter}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderRadius: "50px", overflow: "hidden" }}
                  >
                    <motion.span>Start</motion.span>
                  </StartButton>
                )}
              </ProgressContainer>
            </AnimatePresence>
          </FillColumn>
        </LoadingWrapper>
      )}
    </AnimatePresence>
  );
};

export const SceneWithLoader = ({
  permissionGranted,
  onLoaded,
  ...rest
}: {
  permissionGranted: boolean;
  onLoaded?: () => void;
}) => {
  const { isMobile, emotionData, setPermissionGranted } = useAppStore();
  const { isReady, setGameReady } = useCoreStore();
  const [hasEntered, setHasEntered] = useState(false);
  const [mountLoader, setMountLoader] = useState(true);

  // Only show loader on first load - ignore runtime texture loading
  const showLoader = !hasEntered;

  const handleEnter = async () => {
    try {
      await initializeSoundSystem();
    } catch (error) {
      console.error("failed to initialize sound system:", error);
    }

    setGameReady(true);
    setHasEntered(true);
    onLoaded?.();
  };

  const handleLoaderExit = () => {
    setMountLoader(false);
  };

  return (
    <>
      {showLoader && mountLoader && (
        <CustomLoader
          onEnter={handleEnter}
          onFadeOutComplete={handleLoaderExit}
          isInitialLoad={!hasEntered}
        />
      )}

      <Suspense fallback={null}>
        <Scene permissionGranted={permissionGranted} {...rest} />
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

  padding: 1rem 1.75rem;
  border-radius: 50px;

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
  z-index: 99998;

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

const ProgressBar = styled(motion.div)`
  width: 64px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background-color: #ffffff;
  border-radius: 2px;
  transition: width 0.3s ease;
  overflow: hidden;
`;

const ProgressText = styled(motion.div)`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
`;
