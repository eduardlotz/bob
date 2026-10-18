import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html, CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { createNavigationPositionCalculator, getNavigationPositions } from "./navigationLayout";
import { motion } from "motion/react";
import { MotionVariants } from "@/styles/motion";
import { BlobHead } from "./BlobHead";
import { useBlobEmotions } from "@/hooks/useBlobEmotions";
import styled from "styled-components";
import { Route, useCoreStore } from "@/store/core/store";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { LockIcon } from "@/icons/lock";
import { useAppStore } from "@/store";
import { useMessageStore } from "@/store/messageStore";
import { useI18n } from "@/i18n";
import { getRouteCopyByPath } from "@/store/config/routes";

//#region constants
export * from "@/store/config/camera";
export { OPTIONS_Y_OFFSET } from "./navigationLayout";

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
  const { emotionState, handleTap, triggerEmotion } = useBlobEmotions();

  const {
    isMobile,
    showOptions,
    isOptionsClosing,
    closeOptionsWithAnimation,
  } = useAppStore();

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
        emotionState={emotionState}
      />

      {showOptions && (
        <OptionsGroup
          hideOptions={closeOptionsWithAnimation}
          isClosing={isOptionsClosing}
        />
      )}
    </>
  );
}

function OptionsGroup({
  hideOptions,
  isClosing,
}: {
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const routes = useCoreStore((state) => state.routes);
  const { width, height } = useThree((state) => state.size);
  const isMobileLayout = width < 768;
  const routePositions = useMemo(
    () => getNavigationPositions(routes.length, width, height),
    [routes.length, width, height],
  );
  const calculatePosition = useMemo(createNavigationPositionCalculator, []);

  if (routePositions.length === 0) return null;

  return (
    <group>
      {routes.map((route, index) => {
        const position = routePositions[index];

        return (
          <Option
            key={route.id}
            initialPosition={position}
            calculatePosition={calculatePosition}
            route={route}
            index={index}
            hideOptions={hideOptions}
            isClosing={isClosing}
            isMobileLayout={isMobileLayout}
          />
        );
      })}
    </group>
  );
}

function Option({
  initialPosition,
  calculatePosition,
  route,
  index,
  hideOptions,
  isClosing,
  isMobileLayout,
}: {
  initialPosition: THREE.Vector3;
  calculatePosition: ReturnType<typeof createNavigationPositionCalculator>;
  route: Route;
  index: number;
  hideOptions: () => void;
  isClosing: boolean;
  isMobileLayout: boolean;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { currentRoute } = useAppStore();
  const { canAfford, purchaseRoute } = useCoreStore();
  const { showMessage } = useMessageStore();
  const variants = useMemo(
    () => ({
      hidden: MotionVariants.OptionButton.initial,
      open: MotionVariants.OptionButton.animate({
        delay: index,
        isDisabled: !route.purchased,
        isLocked: route.isLocked,
      }),
      closed: MotionVariants.OptionButton.exit,
    }),
    [index, route.purchased, route.isLocked],
  );

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
      {/* Keep mobile centering separate from the button's animated transform. */}
      <Html
        center={isMobileLayout}
        position={[0, 1.5, 0]}
        calculatePosition={calculatePosition}
      >
        <NavigationBubble
          key={route.id}
          variants={variants}
          initial="hidden"
          animate={isClosing ? "closed" : "open"}
          $active={isActive}
          $locked={!route.isLocked}
          exit="closed"
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
          <RouteName>{getRouteCopyByPath(route.path, locale).name}</RouteName>
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
    p.$active ? "var(--text-color)" : "var(--secondary-color)"};
  z-index: 0;
  box-shadow: ${(p) => (p.$active ? "none" : "inset 0 -6px 0 #066ed6")};
`;

const RouteName = styled.p`
  font-size: 22px;
  font-weight: 800;
  z-index: 1;
`;

const NavigationBubble = styled(motion.button)<{
  $active: boolean;
  $locked?: boolean;
}>`
  color: ${(p) => (p.$active ? "var(--secondary-color)" : "var(--text-color)")};
  /*background-color: ${(p) =>
    p.$active ? "var(--text-color)" : "var(--primary-color)"}; */

  background: var(--secondary-color);
  /* border: 3px solid transparent; */
  border-color: ${(p) => (p.$active ? "#066ed6" : "transparent")};
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
