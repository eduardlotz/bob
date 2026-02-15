import { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html, Float, CameraControls } from "@react-three/drei";
import { motion } from "motion/react";
import { MotionVariants } from "@/styles/motion";
import { BlobHead } from "./BlobHead";
import { useBlobEmotions } from "@/hooks/useBlobEmotions";
import styled from "styled-components";
import { Route, useCoreStore } from "@/store/core/store";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { LockIcon } from "@/icons/lock";
import { useAppStore, useMiniGameStore } from "@/store";
import { useViewStore } from "@/store/viewStore";
import { Magnetic } from "@/layout/Magnetic";
import { useMessageStore } from "@/store/messageStore";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";

//#region constants
export const CAMERA_Y_POSITION = 1;
export const CAMERA_HEIGHT = 2;
export const CAMERA_FOLLOW_OFFSET = 5;
export const OPTIONS_Y_OFFSET = -1.5;

export const VISIBLE_OPTIONS_CAMERA_ZOOM = 8;
export const HIDDEN_OPTIONS_CAMERA_ZOOM = 4;
export const FUNNY_FISHEYE_ZOOM = 1.15;
export const CAMERA_ZOOM_ON_TAP = -1.5;

export const OPTION_RADIUS_OFFSET = 0.005;
export const OPTIONS_BASE_RADIUS_MULTIPLIER = 1.3;

export const MOTION_VARIANTS = {
  slideInDown: {
    initial: {
      y: -40,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
    animate: {
      y: 0,
      opacity: 1,

      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
    exit: {
      y: -40,
      opacity: 0,

      transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
    },
  },
  slideUp: {
    initial: {
      y: 20,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        type: "spring" as const,
        duration: 0.8,
        bounce: 0.3,
        layout: {
          type: "spring" as const,
          duration: 0.2,
          bounce: 0.4,
        },
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        type: "spring" as const,
        duration: 0.5,
        bounce: 0.3,
        layout: {
          type: "spring" as const,
          duration: 0.2,
          bounce: 0.4,
        },
      },
    },
    animate: (custom = 0) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.3,
        delay: custom * 0.02,
        layout: {
          type: "spring" as const,
          duration: 0.2,
          bounce: 0.4,
        },
      },
    }),
  },
  springScale: {
    initial: {
      scale: 1.2,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    animate: (custom?: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        duration: 0.4,
        bounce: 0.4,
        delay: custom ?? 0 * 0.02,
      },
    }),
  },
  springScaleReversed: MotionVariants.OptionButton,
};

//#endregion

export function HeadNavigation({
  cameraControlsRef,
  permissionGranted,
}: {
  cameraControlsRef: React.RefObject<CameraControls>;
  permissionGranted: boolean;
}) {
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);
  const { emotionState, handleTap, triggerEmotion } = useBlobEmotions();
  const { isNavigationView, resetToDefaultView, currentView } = useViewStore();

  const {
    isMobile,
    toggleOptions,
    showOptions,
    isOptionsClosing,
    closeOptionsWithAnimation,
  } = useAppStore();

  // close options menu when entering a custom view
  useEffect(() => {
    if (!isNavigationView() && showOptions) {
      closeOptionsWithAnimation();
    }
  }, [currentView, showOptions]);

  useKeyPress("Escape", () => {
    if (showOptions) {
      toggleOptions();
      resetToDefaultView();
      playUISound("ui-tap-close");
    }
  });

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // listen for global emotion requests
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { emotion: any; durationMs?: number }
        | undefined;
      if (detail && detail.emotion) {
        triggerEmotion(detail.emotion, detail.durationMs);
      }
    };
    window.addEventListener("bob-emotion", handler as EventListener);
    return () =>
      window.removeEventListener("bob-emotion", handler as EventListener);
  }, []);

  return (
    <>
      <BlobHead
        onHeadClick={handleTap}
        motionPermissionGranted={permissionGranted}
        isMobile={isMobile}
        cameraControlsRef={cameraControlsRef}
        showOptions={showOptions}
        isClosing={isOptionsClosing}
        emotionState={emotionState}
        onCameraZoomAnimation={setCameraZoomAnimation}
      />

      {showOptions && (
        <OptionsGroup
          windowWidth={windowSize.width}
          windowHeight={windowSize.height}
          hideOptions={closeOptionsWithAnimation}
          isClosing={isOptionsClosing}
        />
      )}
    </>
  );
}

function OptionsGroup({
  windowWidth,
  windowHeight,
  hideOptions,
  isClosing,
}: {
  windowWidth: number;
  windowHeight: number;
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const routes = useCoreStore((state) => state.routes);
  const count = routes.length;

  if (count === 0) {
    return <group />;
  }

  const screenCenter = new THREE.Vector3(-0.5, OPTIONS_Y_OFFSET, 0);

  const routePositions = useMemo(() => {
    if (!routes.length || !windowWidth || !windowHeight) {
      return [];
    }

    const aspect = windowWidth / windowHeight;
    const fov = 50;
    const distance = 7;

    const vFOV = (fov * Math.PI) / 180;
    const worldHeight = 2 * Math.tan(vFOV / 2) * distance;
    const worldWidth = worldHeight * aspect;

    const marginPercent = 0.1; // 10% margin from edges
    const bottomNavPercent = 0.15;

    const safeWidth = worldWidth * (1 - 2 * marginPercent);
    const safeHeight = worldHeight * (1 - marginPercent - bottomNavPercent);

    const maxXRadius = safeWidth / 2;
    const maxYRadius = safeHeight / 2;

    // radius based on number of items
    const baseRadiusMultiplier = Math.min(1, Math.sqrt(count / 6));
    const xRadius = maxXRadius * baseRadiusMultiplier;
    const yRadius = maxYRadius * baseRadiusMultiplier;

    return routes.map((route, index) => {
      // calculate angle for even distribution
      const angle = (index / count) * Math.PI * 2;
      const adjustedAngle = angle - Math.PI / 2;

      // calculate ellipse position
      let x = Math.cos(adjustedAngle) * xRadius;
      let y = Math.sin(adjustedAngle) * yRadius;

      // safety margin for bottom button and edges
      const halfSafeWidth = safeWidth / 2;
      const halfSafeHeight = safeHeight / 2;
      const bottomOffset = worldHeight * bottomNavPercent;

      const extraBottomMargin = worldHeight * 0.05; // 5% extra margin
      const effectiveBottomOffset = bottomOffset + extraBottomMargin;

      x = Math.max(-halfSafeWidth - 40, Math.min(halfSafeWidth, x));
      y = Math.max(
        -halfSafeHeight + effectiveBottomOffset,
        Math.min(halfSafeHeight, y),
      );

      return new THREE.Vector3(x, y, 0).add(screenCenter);
    });
  }, [routes, count, windowWidth, windowHeight]);

  return (
    <group>
      {routes.map((route, index) => {
        const position = routePositions[index];

        return (
          // <Float
          //   floatIntensity={3}
          //   floatingRange={[0.2, 0.1]}
          //   speed={1.5}
          //   >
          <Option
            key={route.id}
            initialPosition={position}
            route={route}
            index={index}
            hideOptions={hideOptions}
            isClosing={isClosing}
          />
          // </Float>
        );
      })}
    </group>
  );
}

function Option({
  initialPosition,
  route,
  index,
  hideOptions,
  isClosing,
}: {
  initialPosition: THREE.Vector3;
  route: Route;
  index: number;
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const navigate = useNavigate();
  const { currentRoute } = useAppStore();
  const { triggerQuest } = useQuestSystem();
  const { canAfford, purchaseRoute } = useCoreStore();
  const { showMessage } = useMessageStore();

  const isActive = currentRoute === route.path;

  const position = initialPosition;

  const resetCamAndNavigate = () => {
    navigate(route.path);
    hideOptions();
  };

  const handleOptionClick = () => {
    match({ ...route, canPurchase: canAfford(route.cost) })
      .with({ isLocked: false, purchased: false, canPurchase: true }, () => {
        purchaseRoute(route.id);
        triggerQuest(`purchase_${route.id}`);
        resetCamAndNavigate();
      })
      .with({ purchased: true }, () => {
        resetCamAndNavigate();
      })
      .with({ isLocked: true }, () => {
        showMessage("route_locked");
      })
      .otherwise(() => {
        showMessage("cannot_afford");
      });
  };

  return (
    <group ref={optionRef} position={position}>
      <Html position={[0, 1.5, 0]}>
        <NavigationBubble
          key={route.id}
          initial={MotionVariants.OptionButton.initial}
          animate={
            isClosing
              ? MotionVariants.OptionButton.exit
              : MotionVariants.OptionButton.animate({
                  delay: index,
                  isDisabled: !route.purchased,
                  isLocked: route.isLocked,
                })
          }
          $active={isActive}
          $locked={!route.isLocked}
          exit={MotionVariants.OptionButton.exit}
          whileHover={MotionVariants.OptionButton.hover({
            isDisabled: !route.purchased,
            isLocked: route.isLocked,
          })}
          whileTap={MotionVariants.OptionButton.tap}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleOptionClick}
          data-ui-sound-id="ui-tap-close"
        >
          {!route.purchased && <PriceChip>{route.cost} 🫵</PriceChip>}
          {route.isLocked && (
            <PriceChip>
              <LockIcon />
            </PriceChip>
          )}
          <RouteName>{route.name}</RouteName>
          <BackgroundColor $active={isActive} />
        </NavigationBubble>
      </Html>
    </group>
  );
}

const PriceChip = styled.span`
  position: absolute;
  bottom: calc(100% - 16px);
  left: 0;
  right: 0;
  z-index: 10000;
  width: fit-content;

  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  background: #ffff54;
  color: #010101;
  font-size: 0.875rem;
  font-weight: 900;

  padding: 6px 8px;
  border-radius: 12px;
`;

const BackgroundColor = styled.div<{ $active: boolean }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;

  border-radius: 50px;

  background-color: ${(p) =>
    p.$active ? "var(--text-color)" : "var(--primary-color)"};
  z-index: 0;
  /* border-color: ${(p) => (p.$active ? "var(--text-color)" : "transparent")};
  border: 2px solid transparent; */
`;

const RouteName = styled.p`
  font-size: 22px;
  font-weight: 500;
  z-index: 1;
`;

const NavigationBubble = styled(motion.button)<{
  $active: boolean;
  $locked?: boolean;
}>`
  color: ${(p) => (p.$active ? "var(--primary-color)" : "var(--text-color)")};
  background-color: ${(p) =>
    p.$active ? "var(--text-color)" : "var(--primary-color)"};

  opacity: ${(p) => (p.$locked ? 1 : 0.25)};

  /* &:not(:disabled) {
    cursor: pointer;
  } */

  padding: 16px 20px;
  border-radius: 50px;
  white-space: nowrap;
  gap: 8px;
  text-decoration: none;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
`;
