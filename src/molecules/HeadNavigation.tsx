import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Float, CameraControls } from "@react-three/drei";
import { motion } from "motion/react";
import { BlobHead } from "./BlobHead";
import { useRouter } from "next/router";
import { LockIcon } from "@/layout/icons";
import {
  useDeviceOrientation,
  DeviceOrientation,
} from "@/hooks/useDeviceOrientation";
import { calculateAcceleratedRotation, resetCalibration } from "@/utils/math";
import { useRoute } from "@/contexts/RouteContext";
import { useBlobEmotions } from "@/hooks/useBlobEmotions";
import { useMagneticAttraction, MagneticConfig } from "@/hooks/useMagnets";
import { toast } from "sonner";
import styled from "styled-components";

//#region constants
export const CAMERA_Y_POSITION = 0;
export const CAMERA_FOLLOW_OFFSET = 2.5;

export const VISIBLE_OPTIONS_CAMERA_ZOOM = 10;
export const HIDDEN_OPTIONS_CAMERA_ZOOM = 1.75;
export const FUNNY_FISHEYE_ZOOM = 1.15;

export const OPTION_RADIUS_OFFSET = 0.004;
export const OPTIONS_BASE_RADIUS_MULTIPLIER = 1.5;

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
      transition: { type: "spring" as const, duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring" as const, duration: 0.4, bounce: 0.4 },
    },
    hover: {
      scale: 1.1,
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    },
    tap: {
      scale: 0.9,
      transition: { type: "spring" as const, duration: 0.3, bounce: 0.5 },
    },
    animate: (custom?: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        duration: 0.6,
        bounce: 0.6,
        delay: custom ? custom * 0.05 : 0,
      },
    }),
  },
};

// Navigation options will be provided by route context

//#endregion

export function HeadNavigation({
  showOptions,
  setShowOptions,
  cameraControlsRef,
  permissionGranted,
  onEmotionUpdate,
  ...rest
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
  [key: string]: any;
}) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { orientation, acceleration } = useDeviceOrientation();
  const isMobile =
    typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

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
  const [lastTapTime, setLastTapTime] = useState(0);

  // Blob emotion system
  const { emotionState, tapCount, handleTap, getEmotionIcon } =
    useBlobEmotions();
  const { currentRoute } = useRoute();

  // Pass emotion data up to parent
  useEffect(() => {
    if (onEmotionUpdate) {
      onEmotionUpdate({ emotionState, tapCount, getEmotionIcon });
    }
  }, [emotionState, tapCount, onEmotionUpdate]);

  const showCalibrationResetToast = () => {
    toast.custom((id) => <CustomToast>Kalibrierung zurückgesetzt</CustomToast>);
  };

  const toggleOptions = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // double tap detection for calibration reset (mobile only)
    // TODO: replace with a more robust gesture detection or add a dedicated button
    if (timeSinceLastTap < 500 && timeSinceLastTap > 100) {
      const wasCalibrated = orientation; // Check if sensors were active
      resetCalibration();
      setLastTapTime(0);
      // Only show toast if sensors were actually active/calibrated
      if (wasCalibrated && permissionGranted) {
        showCalibrationResetToast();
      }
      return;
    }

    setLastTapTime(now);

    // Handle blob emotion on tap
    handleTap();

    if (showOptions) {
      setIsClosing(true);
      // wait for exit animation to complete before hiding
      setTimeout(() => {
        setShowOptions(false);
        setIsClosing(false);
      }, 400);
    } else {
      setShowOptions(true);
    }
  };

  useFrame(() => {
    if (orientation && acceleration && permissionGranted) {
      const { targetRotX, targetRotY, targetRotZ } =
        calculateAcceleratedRotation(acceleration, orientation);
      cameraControlsRef.current.setLookAt(
        0,
        showOptions && !isClosing ? 2 : CAMERA_Y_POSITION,
        showOptions && !isClosing
          ? VISIBLE_OPTIONS_CAMERA_ZOOM
          : HIDDEN_OPTIONS_CAMERA_ZOOM,
        -targetRotX,
        targetRotY + CAMERA_Y_POSITION,
        -targetRotZ,
        true
      );
    } else {
      const cursorPos = new THREE.Vector3(
        (mousePosition.x - 0.5) * CAMERA_FOLLOW_OFFSET * 0.1,
        (mousePosition.y - 0.5) * CAMERA_FOLLOW_OFFSET * 0.1,
        0
      );
      cameraControlsRef.current.setLookAt(
        0,
        showOptions && !isClosing ? 2 : CAMERA_Y_POSITION,
        showOptions && !isClosing
          ? VISIBLE_OPTIONS_CAMERA_ZOOM
          : HIDDEN_OPTIONS_CAMERA_ZOOM,
        cursorPos.x,
        cursorPos.y + CAMERA_Y_POSITION,
        cursorPos.z,
        true
      );
    }
  });

  return (
    <>
      <BlobHead
        onHeadClick={toggleOptions}
        motionPermissionGranted={permissionGranted}
        isMobile={isMobile}
        cameraControlsRef={cameraControlsRef}
        showOptions={showOptions}
        isClosing={isClosing}
        emotionState={emotionState}
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
  const { routes } = useRoute();
  const count = routes.length;

  const screenCenter = new THREE.Vector3(-1, -2, 0);

  // Calculate appropriate radii based on screen dimensions
  // Use the smaller dimension to ensure elements stay within viewport
  const minDimension = Math.min(windowWidth, windowHeight);
  const baseRadius = minDimension * OPTIONS_BASE_RADIUS_MULTIPLIER;

  // Apply the offset to create an elliptical path if needed
  const xRadius =
    windowWidth > windowHeight
      ? baseRadius * OPTION_RADIUS_OFFSET
      : baseRadius * (windowWidth / windowHeight) * OPTION_RADIUS_OFFSET;

  const yRadius =
    windowHeight > windowWidth
      ? baseRadius * OPTION_RADIUS_OFFSET
      : baseRadius * (windowHeight / windowWidth) * OPTION_RADIUS_OFFSET;

  return (
    <group>
      {routes.map((option, index) => {
        // calculate position on ellipse centered in screen
        const angle = (index / count) * Math.PI * 2;

        // adjust starting angle (start from top instead of right)
        const adjustedAngle = angle - Math.PI / 2;

        const x = Math.cos(adjustedAngle) * xRadius;
        const y = Math.sin(adjustedAngle) * -yRadius;

        const position = new THREE.Vector3(x, y, 0).add(screenCenter);

        return (
          <Float
            floatIntensity={3}
            floatingRange={[0.2, 0.1]}
            speed={1.5}
            key={option.label}
          >
            <Option
              initialPosition={position}
              label={option.label}
              href={option.href}
              index={index}
              windowWidth={windowWidth}
              windowHeight={windowHeight}
              cameraControlsRef={cameraControlsRef}
              hideOptions={hideOptions}
              isMobile={isMobile}
              isClosing={isClosing}
              orientation={orientation}
              permissionGranted={permissionGranted}
              acceleration={acceleration}
            />
          </Float>
        );
      })}
    </group>
  );
}

function Option({
  initialPosition,
  label,
  href,
  index,
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
  initialPosition: THREE.Vector3;
  label: string;
  href: string;
  index: number;
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
  const optionRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const { setCurrentRoute, getRouteByPath } = useRoute();

  // Only enable magnetic attraction when hovered
  const magneticConfig: MagneticConfig = {
    strength: hovered ? 0.7 : 0, // No attraction unless hovered
    radius: 2.5,
    falloff: 1.0, // Linear falloff for symmetric attraction
    lerpFactor: 0.5,
    maxDisplacement: 1.5,
  };

  const { position, state } = useMagneticAttraction(
    initialPosition,
    isClosing ? { ...magneticConfig, strength: 0 } : magneticConfig
  );

  // Apply magnetic position to the option
  useFrame(() => {
    if (optionRef.current && position) {
      // Ensure position is valid before applying
      if (
        isFinite(position.x) &&
        isFinite(position.y) &&
        isFinite(position.z)
      ) {
        optionRef.current.position.copy(position);
      }
    }
  });

  const handleOptionClick = () => {
    if (href !== "#") {
      // Use the current magnetic position for camera focus
      cameraControlsRef.current.setLookAt(
        0,
        CAMERA_Y_POSITION,
        VISIBLE_OPTIONS_CAMERA_ZOOM,
        position.x,
        position.y + 2,
        position.z,
        true
      );

      // Update the current route in context instead of navigating
      const selectedRoute = getRouteByPath(href);
      if (selectedRoute) {
        setCurrentRoute(selectedRoute);
      }

      hideOptions();
    }
  };

  return (
    <group ref={optionRef} position={position}>
      <Html position={[0, 1.5, 0]}>
        <motion.button
          key={href}
          initial={MOTION_VARIANTS.springScaleReversed.initial}
          animate={
            isClosing
              ? MOTION_VARIANTS.springScaleReversed.exit
              : MOTION_VARIANTS.springScaleReversed.animate(index)
          }
          exit={MOTION_VARIANTS.springScaleReversed.exit}
          whileHover={MOTION_VARIANTS.springScaleReversed.hover}
          whileTap={MOTION_VARIANTS.springScaleReversed.tap}
          style={{
            background: hovered ? "#4285F4" : "#2979FF",
            color: href === "#" ? "#7FA6FF" : "white",
            padding: "16px 20px",
            borderRadius: "50px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            gap: "8px",
            boxShadow: state.isAttracted
              ? `0 8px 16px rgba(66, 133, 244, ${
                  0.3 + state.attractionStrength * 0.4
                })`
              : "0 4px 8px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            textDecoration: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `translate(-50%, -50%) scale(${
              1 + state.attractionStrength * 0.15
            })`,
            fontSize: "22px",
            letterSpacing: "0.5px",
            transition: "all 0.2s ease-out",
            border: state.isAttracted
              ? `2px solid rgba(66, 133, 244, ${
                  0.5 + state.attractionStrength * 0.5
                })`
              : "2px solid transparent",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleOptionClick}
        >
          {label}
          {href === "/portfolio" && <LockIcon color="#ffffff" />}
        </motion.button>

        {/* Debug info - shows magnetic field status */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 1000,
              opacity: state.isAttracted ? 1 : 0.5,
            }}
          >
            {label}: {state.isAttracted ? "ATTRACTED" : "IDLE"}(
            {state.attractionStrength.toFixed(2)})
          </div>
        )}
      </Html>
    </group>
  );
}

const CustomToast = styled.div`
  background-color: white;
  color: black;
  padding: 20px 30px;
  height: 58px;
  width: 320px;
  max-width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

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
