import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Float, CameraControls } from "@react-three/drei";
import { motion } from "motion/react";
import { MotionVariants } from "@/styles/motion";
import { BlobHead } from "./BlobHead";
import { useBlobEmotions } from "@/hooks/useBlobEmotions";
import { toast } from "sonner";
import styled from "styled-components";
import { Route, useGameStore } from "@/store/gameStore";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { LockIcon } from "@/icons/lock";
import { useAppStore } from "@/store";
import { useViewStore } from "@/store/viewStore";
import { Magnetic } from "@/layout/Magnetic";
import { useMessageStore } from "@/store/messageStore";

//#region constants
export const CAMERA_Y_POSITION = 1;
export const CAMERA_HEIGHT = 2;
export const CAMERA_FOLLOW_OFFSET = 2.5;
export const OPTIONS_Y_OFFSET = -1.5;

export const VISIBLE_OPTIONS_CAMERA_ZOOM = 8;
export const HIDDEN_OPTIONS_CAMERA_ZOOM = 4;
export const FUNNY_FISHEYE_ZOOM = 1.15;

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
  showOptions,
  setShowOptions,
  cameraControlsRef,
  permissionGranted,
  onEmotionUpdate,
}: {
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  cameraControlsRef: React.RefObject<CameraControls>;
  permissionGranted: boolean;
  onEmotionUpdate?: (data: {
    emotionState: any;
    tapCount: number;
    getEmotionIcon: any;
  }) => void;
}) {
  const {
    currentView,
    isDefaultView,
    isBlobView,
    isTransitioning,
    resetToDefaultView,
  } = useViewStore();

  // close options menu when entering a custom view
  useEffect(() => {
    if (!isDefaultView() && showOptions) {
      setShowOptions(false);
    }
  }, [currentView, isDefaultView, showOptions, setShowOptions]);

  // return to default view when options menu is opened (if not already in default view)
  useEffect(() => {
    if (showOptions && !isDefaultView()) {
      // small delay to ensure smooth transition
      setTimeout(() => {
        resetToDefaultView();
      }, 100);
    }
  }, [showOptions, isDefaultView, resetToDefaultView]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isMobile = typeof screen.orientation !== "undefined";

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

  // mouse position tracking on desktop
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isBlobView()) {
        setMousePosition({
          x: event.clientX / window.innerWidth,
          y: event.clientY / window.innerHeight,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isBlobView]);

  const { isOptionsClosing, closeOptionsWithAnimation } = useAppStore();
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);

  const { emotionState, tapCount, handleTap, getEmotionIcon, triggerEmotion } =
    useBlobEmotions();

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
    window.addEventListener("vg-request-emotion", handler as EventListener);
    return () =>
      window.removeEventListener(
        "vg-request-emotion",
        handler as EventListener
      );
  }, [triggerEmotion]);

  useEffect(() => {
    if (onEmotionUpdate) {
      onEmotionUpdate({ emotionState, tapCount, getEmotionIcon });
    }
  }, [emotionState, tapCount, getEmotionIcon, onEmotionUpdate]);

  useFrame(() => {
    // don't override camera during view transitions
    if (isTransitioning) {
      return;
    }

    // if we're in object view mode, let the view store handle the camera
    if (!isBlobView()) {
      return;
    }

    // default view behavior (home/menu)
    const baseZoom =
      showOptions && !isOptionsClosing
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation ? 1 : 0;

    const finalZoom = baseZoom + zoomOffset;

    // only follow cursor on desktop
    if (!isMobile) {
      const cursorPos = new THREE.Vector3(
        (mousePosition.x - 0.5) * CAMERA_FOLLOW_OFFSET * 0.1,
        -(mousePosition.y - 0.5) * CAMERA_FOLLOW_OFFSET * 0.2,
        0
      );
      cameraControlsRef.current?.setLookAt(
        0,
        showOptions && !isOptionsClosing ? 2 : CAMERA_HEIGHT,
        finalZoom,
        cursorPos.x,
        cursorPos.y + CAMERA_Y_POSITION,
        cursorPos.z,
        true
      );
    } else {
      cameraControlsRef.current?.setLookAt(
        0,
        showOptions && !isOptionsClosing ? 2 : CAMERA_HEIGHT,
        finalZoom,
        0,
        CAMERA_Y_POSITION,
        0,
        true
      );
    }
  });

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
          cameraControlsRef={cameraControlsRef}
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
  cameraControlsRef,
  hideOptions,
  isClosing,
}: {
  windowWidth: number;
  windowHeight: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const routes = useGameStore((state) => state.routes);
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

      x = Math.max(-halfSafeWidth, Math.min(halfSafeWidth, x));
      y = Math.max(
        -halfSafeHeight + effectiveBottomOffset,
        Math.min(halfSafeHeight, y)
      );

      return new THREE.Vector3(x, y, 0).add(screenCenter);
    });
  }, [routes, count, windowWidth, windowHeight]);

  return (
    <group>
      {routes.map((route, index) => {
        const position = routePositions[index];

        return (
          <Float
            floatIntensity={3}
            floatingRange={[0.2, 0.1]}
            speed={1.5}
            key={route.id}
          >
            <Option
              initialPosition={position}
              route={route}
              index={index}
              cameraControlsRef={cameraControlsRef}
              hideOptions={hideOptions}
              isClosing={isClosing}
            />
          </Float>
        );
      })}
    </group>
  );
}

function Option({
  initialPosition,
  route,
  index,
  cameraControlsRef,
  hideOptions,
  isClosing,
}: {
  initialPosition: THREE.Vector3;
  route: Route;
  index: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const navigate = useNavigate();
  const { currentRoute } = useAppStore();
  const { canAfford, purchaseRoute } = useGameStore();
  const { showMessage } = useMessageStore();

  const isActive = currentRoute === route.path;

  const position = initialPosition;

  const resetCamAndNavigate = useCallback(() => {
    cameraControlsRef.current?.setLookAt(
      0,
      CAMERA_Y_POSITION,
      VISIBLE_OPTIONS_CAMERA_ZOOM,
      position.x,
      position.y + 2,
      position.z,
      true
    );

    navigate(route.path);
    hideOptions();
  }, [route.path]);

  const handleOptionClick = () => {
    match({ ...route, canPurchase: canAfford(route.cost) })
      .with({ isLocked: false, purchased: false, canPurchase: true }, () => {
        purchaseRoute(route.id);
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
        <Magnetic distance={1} active={route.purchased}>
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
            data-ui-sound-id="ui-tap-2"
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
        </Magnetic>
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
  border-radius: 50px;
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
    p.$active ? "var(--text-color)" : "var(--background-color)"};
  z-index: 0;
  border-color: ${(p) => (p.$active ? "var(--text-color)" : "transparent")};
  border: 2px solid transparent;
`;

const RouteName = styled.p`
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.5px;
  z-index: 1;
`;

const NavigationBubble = styled(motion.button)<{
  $active: boolean;
  $locked?: boolean;
}>`
  color: ${(p) =>
    p.$active ? "var(--background-color)" : "var(--text-color)"};
  background-color: ${(p) =>
    p.$active ? "var(--text-color)" : "var(--background-color)"};

  opacity: ${(p) => (p.$locked ? 1 : 0.25)};

  &:not(:disabled) {
    cursor: pointer;
  }

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
