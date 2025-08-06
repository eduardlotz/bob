import { useState, useRef, useEffect } from "react";
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
import { useMagneticAttraction, MagneticConfig } from "@/hooks/useMagnets";
import { toast } from "sonner";
import styled from "styled-components";
import { useAppStore, ROUTES } from "@/store";
import { useNavigate } from "react-router-dom";

//#region constants
export const CAMERA_Y_POSITION = 1;
export const CAMERA_HEIGHT = 2; // New constant for camera height only
export const CAMERA_FOLLOW_OFFSET = 2.5;
export const OPTIONS_Y_OFFSET = -1; // Y offset for options positioning

export const VISIBLE_OPTIONS_CAMERA_ZOOM = 8;
// export const HIDDEN_OPTIONS_CAMERA_ZOOM = 1.75;
export const HIDDEN_OPTIONS_CAMERA_ZOOM = 2.5;
export const FUNNY_FISHEYE_ZOOM = 1.15;

export const OPTION_RADIUS_OFFSET = 0.004;
export const OPTIONS_BASE_RADIUS_MULTIPLIER = 1.9;

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
    // Only handle blob emotion on head click
    handleTap();
  };

  useFrame(() => {
    // Add camera zoom animation on tap
    const baseZoom =
      showOptions && !isClosing
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation
      ? Math.sin(Date.now() * 0.02) * 0.5
      : 0;

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
  const count = ROUTES.length;

  const screenCenter = new THREE.Vector3(-1, OPTIONS_Y_OFFSET, 0);

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
      {ROUTES.map((option, index) => {
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
              href={option.path}
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
  const { navigateToRoute } = useAppStore();
  const navigate = useNavigate();

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

      // Navigate using React Router
      navigate(href);

      // Update the store
      navigateToRoute(href);

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
              : MOTION_VARIANTS.springScaleReversed.animate({
                  delay: index,
                  hovered,
                  attractionStrength: state.attractionStrength,
                  isAttracted: state.isAttracted,
                  isDisabled: href === "#",
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
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleOptionClick}
        >
          {label}
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
