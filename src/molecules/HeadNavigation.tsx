import { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Float, CameraControls } from "@react-three/drei";
import { motion } from "motion/react";
import { BlobHead } from "./BlobHead";
import {
  useDeviceOrientation,
  DeviceOrientation,
} from "@/hooks/useDeviceOrientation";
import { calculateAcceleratedRotation, resetCalibration } from "@/utils/math";
import { useBlobEmotions } from "@/hooks/useBlobEmotions";
// Magnet functionality removed for now
// import { useMagneticAttraction, MagneticConfig } from "@/hooks/useMagnets";
import { toast } from "sonner";
import styled from "styled-components";
import { useGameStore } from "@/store/gameStore";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { LockIcon } from "@/icons/lock";

//#region constants
export const CAMERA_Y_POSITION = 1;
export const CAMERA_HEIGHT = 2; // New constant for camera height only
export const CAMERA_FOLLOW_OFFSET = 2.5;
export const OPTIONS_Y_OFFSET = -1.5; // Y offset for options positioning

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
  springScaleReversed: {
    initial: {
      scale: 0.8,
      opacity: 0,
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      border: "2px solid transparent",
      transition: { type: "spring" as const, duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    hover: {
      scale: 1.1,
      zIndex: 1000,
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    },
    tap: {
      scale: 0.9,
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    },
    animate: (custom?: {
      delay?: number;
      hovered?: boolean;
      attractionStrength?: number;
      isAttracted?: boolean;
      isDisabled?: boolean;
    }) => ({
      scale: custom?.isDisabled
        ? 1
        : 1 + (custom?.attractionStrength || 0) * 0.15,
      opacity: custom?.isDisabled ? 0.5 : 1,
      boxShadow:
        custom?.isAttracted && !custom?.isDisabled
          ? `0 8px 16px rgba(66, 133, 244, ${
              0.3 + (custom?.attractionStrength || 0) * 0.4
            })`
          : "0 4px 8px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.6,
        delay: custom?.delay ? custom.delay * 0.05 : 0,
      },
    }),
  },
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
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { orientation, acceleration, sensorsAvailable } =
    useDeviceOrientation();
  const isMobile =
    typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  // Auto-calibration state
  const [lastPermissionState, setLastPermissionState] =
    useState(permissionGranted);
  const [lastOrientationValues, setLastOrientationValues] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [calibrationResetCount, setCalibrationResetCount] = useState(0);
  const [lastSensorsAvailable, setLastSensorsAvailable] = useState(false);
  const [calibrationFeedback, setCalibrationFeedback] = useState(false);

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

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [isClosing, setIsClosing] = useState(false);
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);

  // Blob emotion system
  const { emotionState, tapCount, handleTap, getEmotionIcon } =
    useBlobEmotions();

  // Pass emotion data up to parent
  useEffect(() => {
    if (onEmotionUpdate) {
      onEmotionUpdate({ emotionState, tapCount, getEmotionIcon });
    }
  }, [emotionState, tapCount, getEmotionIcon, onEmotionUpdate]);

  const showCalibrationResetToast = () => {
    toast.custom((id) => <CustomToast>Calibration reset</CustomToast>);
  };

  const handleHeadClick = () => {
    // Always call handleTap for animation, but tap counting is handled by the hook
    handleTap();
  };

  useFrame(() => {
    // Add camera zoom animation on tap
    const baseZoom =
      showOptions && !isClosing
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation ? 1 : 0;

    // Add calibration feedback animation
    const calibrationOffset = calibrationFeedback
      ? Math.sin(Date.now() * 0.01) * 0.3
      : 0;

    const finalZoom = baseZoom + zoomOffset + calibrationOffset;

    if (orientation && acceleration && permissionGranted) {
      const { targetRotX, targetRotY, targetRotZ } =
        calculateAcceleratedRotation(acceleration, orientation);
      cameraControlsRef.current.setLookAt(
        0,
        showOptions && !isClosing ? 2 : CAMERA_HEIGHT,
        finalZoom,
        -targetRotX,
        targetRotY + CAMERA_Y_POSITION,
        -targetRotZ,
        true
      );
    } else {
      // Only follow cursor on desktop, not on mobile
      if (!isMobile) {
        // Fix camera Y-axis inversion to match head movement
        const cursorPos = new THREE.Vector3(
          (mousePosition.x - 0.5) * CAMERA_FOLLOW_OFFSET * 0.1,
          -(mousePosition.y - 0.5) * CAMERA_FOLLOW_OFFSET * 0.2, // Invert Y and center around 0.5
          0
        );
        cameraControlsRef.current.setLookAt(
          0,
          showOptions && !isClosing ? 2 : CAMERA_HEIGHT,
          finalZoom,
          cursorPos.x,
          cursorPos.y + CAMERA_Y_POSITION,
          cursorPos.z,
          true
        );
      } else {
        // On mobile, just set the camera position without following cursor
        cameraControlsRef.current.setLookAt(
          0,
          showOptions && !isClosing ? 2 : CAMERA_HEIGHT,
          finalZoom,
          0,
          CAMERA_Y_POSITION,
          0,
          true
        );
      }
    }
  });

  // Auto-calibration logic
  useEffect(() => {
    // Reset calibration when permission is first granted
    if (permissionGranted && !lastPermissionState && isMobile) {
      resetCalibration();
      setCalibrationResetCount((prev) => prev + 1);
      showCalibrationResetToast();
      // Visual feedback
      setCalibrationFeedback(true);
      setTimeout(() => setCalibrationFeedback(false), 1000);
    }
    setLastPermissionState(permissionGranted);
  }, [permissionGranted, lastPermissionState, isMobile]);

  // Auto-calibration when sensors first become available
  useEffect(() => {
    if (
      sensorsAvailable &&
      !lastSensorsAvailable &&
      isMobile &&
      permissionGranted
    ) {
      resetCalibration();
      setCalibrationResetCount((prev) => prev + 1);
      showCalibrationResetToast();
      // Visual feedback
      setCalibrationFeedback(true);
      setTimeout(() => setCalibrationFeedback(false), 1000);
    }
    setLastSensorsAvailable(sensorsAvailable);
  }, [sensorsAvailable, lastSensorsAvailable, isMobile, permissionGranted]);

  // Auto-calibration on significant orientation changes
  useEffect(() => {
    if (!permissionGranted || !orientation || !isMobile) return;

    const currentOrientation = {
      alpha: orientation.alpha ?? 0,
      beta: orientation.beta ?? 0,
      gamma: orientation.gamma ?? 0,
    };

    // Calculate total orientation change
    const orientationChange =
      Math.abs(currentOrientation.alpha - lastOrientationValues.alpha) +
      Math.abs(currentOrientation.beta - lastOrientationValues.beta) +
      Math.abs(currentOrientation.gamma - lastOrientationValues.gamma);

    // Reset calibration if orientation changes significantly (>30 degrees total)
    if (orientationChange > 30) {
      resetCalibration();
      setCalibrationResetCount((prev) => prev + 1);
      showCalibrationResetToast();
      // Visual feedback
      setCalibrationFeedback(true);
      setTimeout(() => setCalibrationFeedback(false), 1000);
    }

    setLastOrientationValues(currentOrientation);
  }, [orientation, permissionGranted, isMobile, lastOrientationValues]);

  return (
    <>
      <BlobHead
        onHeadClick={handleHeadClick}
        motionPermissionGranted={permissionGranted}
        isMobile={isMobile}
        cameraControlsRef={cameraControlsRef}
        showOptions={showOptions}
        isClosing={isClosing}
        emotionState={emotionState}
        onCameraZoomAnimation={setCameraZoomAnimation}
      />

      {showOptions && (
        <OptionsGroup
          windowWidth={windowSize.width}
          windowHeight={windowSize.height}
          cameraControlsRef={cameraControlsRef}
          hideOptions={() => {
            setIsClosing(true);
            setTimeout(() => {
              setShowOptions(false);
              setIsClosing(false);
            }, 400);
          }}
          isMobile={isMobile}
          isClosing={isClosing}
          orientation={orientation}
          acceleration={acceleration}
          permissionGranted={permissionGranted}
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
  isMobile,
  isClosing,
  orientation,
  permissionGranted,
  acceleration,
}: {
  windowWidth: number;
  windowHeight: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
  isMobile: boolean;
  isClosing: boolean;
  orientation: DeviceOrientation;
  permissionGranted: boolean;
  acceleration: DeviceMotionEventAcceleration;
}) {
  const routes = useGameStore((state) => state.routes);
  const count = routes.length;

  // Early return if no routes to improve performance
  if (count === 0) {
    return <group />;
  }

  // Memoize calculations to improve performance
  const screenCenter = useMemo(
    () => new THREE.Vector3(-0.5, OPTIONS_Y_OFFSET, 0),
    []
  );

  // Memoize route positions to prevent unnecessary recalculations
  const routePositions = useMemo(() => {
    if (!routes.length || !windowWidth || !windowHeight) {
      return [];
    }

    // Convert screen dimensions to Three.js world coordinates
    const aspect = windowWidth / windowHeight;
    const fov = 75; // Assuming default camera FOV, adjust if different
    const distance = 5; // Assuming camera distance, adjust if different

    // Calculate visible world dimensions at camera distance
    const vFOV = (fov * Math.PI) / 180;
    const worldHeight = 2 * Math.tan(vFOV / 2) * distance;
    const worldWidth = worldHeight * aspect;

    // Define safe margins (as percentage of world dimensions)
    const marginPercent = 0.1; // 10% margin from edges
    const bottomNavPercent = 0.15; // 15% reserved for bottom navigation

    const safeWidth = worldWidth * (1 - 2 * marginPercent);
    const safeHeight = worldHeight * (1 - marginPercent - bottomNavPercent);

    // Calculate optimal ellipse radii that fit within safe bounds
    const maxXRadius = safeWidth / 2;
    const maxYRadius = safeHeight / 2;

    // Dynamic radius calculation based on number of items
    // More items = larger ellipse to prevent overlap
    const baseRadiusMultiplier = Math.min(1, Math.sqrt(count / 8)); // Scale with item count
    const xRadius = maxXRadius * baseRadiusMultiplier;
    const yRadius = maxYRadius * baseRadiusMultiplier;

    // Calculate positions
    return routes.map((route, index) => {
      // Even distribution around ellipse
      const angle = (index / count) * Math.PI * 2;
      const adjustedAngle = angle - Math.PI / 2; // Start from top

      // Calculate ellipse position
      let x = Math.cos(adjustedAngle) * xRadius;
      let y = Math.sin(adjustedAngle) * yRadius;

      // Apply strict boundary clamping
      const halfSafeWidth = safeWidth / 2;
      const halfSafeHeight = safeHeight / 2;
      const bottomOffset = worldHeight * bottomNavPercent;

      x = Math.max(-halfSafeWidth, Math.min(halfSafeWidth, x));
      y = Math.max(-halfSafeHeight + bottomOffset, Math.min(halfSafeHeight, y));

      // Offset by screen center
      return new THREE.Vector3(x, y, 0).add(screenCenter);
    });
  }, [routes, count, windowWidth, windowHeight, screenCenter]);

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
  route: any; // Route type from game store
  index: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
  isClosing: boolean;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const navigate = useNavigate();

  // Position is fixed for now (magnet functionality disabled)
  const position = initialPosition;

  const handleOptionClick = () => {
    match({
      purchased: route.purchased,
    })
      .with({ purchased: true }, () => {
        cameraControlsRef.current.setLookAt(
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
      })
      .otherwise(() => {
        // Route is locked - notify user about shop
        toast.custom((id) => (
          <CustomToast>Visit the shop to unlock it!</CustomToast>
        ));
      });
  };

  return (
    <group ref={optionRef} position={position}>
      <Html position={[0, 1.5, 0]}>
        <motion.button
          key={route.id}
          initial={MOTION_VARIANTS.springScaleReversed.initial}
          animate={
            isClosing
              ? MOTION_VARIANTS.springScaleReversed.exit
              : MOTION_VARIANTS.springScaleReversed.animate({
                  delay: index,
                  isDisabled: !route.purchased,
                })
          }
          exit={MOTION_VARIANTS.springScaleReversed.exit}
          whileHover={MOTION_VARIANTS.springScaleReversed.hover}
          whileTap={MOTION_VARIANTS.springScaleReversed.tap}
          style={{
            color: "var(--text-color)",
            padding: "16px 20px",
            borderRadius: "50px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            gap: "8px",
            cursor: "pointer",
            textDecoration: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "translate(-50%, -50%)",
            fontSize: "22px",
            letterSpacing: "0.5px",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleOptionClick}
        >
          {!route.purchased && <LockIcon />}
          {route.name}
        </motion.button>
      </Html>
    </group>
  );
}

const CustomToast = styled.div`
  background-color: #000000;
  color: white;
  padding: 16px 24px;
  height: 58px;
  width: fit-content;
  max-width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;

  border-radius: 24px;
  box-shadow: 0 4px 10px 10px rgba(37, 36, 39, 0.08);
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;

  @media (max-width: 600px) {
    width: 100%;
  }
`;
