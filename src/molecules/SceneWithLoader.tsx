import { FillRow } from "@/layout";
import { Logo, MotionIconWrapper } from "@/layout/atoms";
import { MotionVariants } from "@/styles/motion";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

// Create a loading component with animated bounce effect
const LoadingComponent = ({
  permissionGranted,
  onEmotionUpdate,
  debugInfo,
  setDebugInfo,
  debugCircles,
  setDebugCircles,
  debugOptions,
  setDebugOptions,
  magneticEnabled,
  setMagneticEnabled,
  debugCirclesEnabled,
  setDebugCirclesEnabled,
  ...rest
}: any) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add delay before starting the exit animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingWrapper
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.8,
                ease: "easeInOut",
              },
            }}
          >
            <FillRow $align="center" $justify="center">
              <MotionIconWrapper
                variants={MotionVariants.Pulse}
                animate="animate"
                exit={{
                  scale: [1, 1.3, 0.8, 1.1, 0],
                  transition: {
                    duration: 0.8,
                    times: [0, 0.3, 0.5, 0.7, 1],
                    ease: "easeInOut",
                  },
                }}
                initial="initial"
              >
                <Logo />
              </MotionIconWrapper>
            </FillRow>
          </LoadingWrapper>
        )}
      </AnimatePresence>

      {/* Scene component always rendered but hidden initially */}
      <SceneWrapper
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{
          duration: 0.8,
          delay: 0.4, // Start fading in halfway through loader exit
          ease: "easeInOut",
        }}
      >
        <SceneComponent
          permissionGranted={permissionGranted}
          onEmotionUpdate={onEmotionUpdate}
          {...rest}
        />
      </SceneWrapper>
    </>
  );
};

// Separate scene component
const SceneComponent = dynamic(
  () =>
    import("@/molecules/Scene").then((mod) => {
      return { default: (props: any) => <mod.Scene {...props} /> };
    }),
  {
    ssr: false,
  }
);

export const SceneWithLoader = ({
  permissionGranted,
  onEmotionUpdate,

  ...rest
}: any) => {
  return (
    <LoadingComponent
      permissionGranted={permissionGranted}
      onEmotionUpdate={onEmotionUpdate}
      {...rest}
    />
  );
};

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

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

const SceneWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
`;
