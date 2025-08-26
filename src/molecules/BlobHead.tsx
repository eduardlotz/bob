import {
  useDeviceOrientation,
  DeviceOrientation,
} from "@/hooks/useDeviceOrientation";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  Group,
  Mesh,
  MathUtils,
  Vector3,
  Clock,
  Float32BufferAttribute,
  SphereGeometry,
} from "three";
import {
  CAMERA_Y_POSITION,
  CAMERA_HEIGHT,
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";
import { CameraControls, Outlines, RoundedBox } from "@react-three/drei";
import { calculateAcceleratedRotation } from "@/utils/math";
import { a, useSpring } from "@react-spring/three";
import { type RapierRigidBody } from "@react-three/rapier";
import { Star3D } from "@/3d-objects/Star3D";
import { EmotionState } from "@/hooks/useBlobEmotions";
import { useGameStore } from "@/store/gameStore";
import { useViewStore } from "@/store/viewStore";
import { KrustyKrabHat } from "@/3d-objects/models/krustyKrabHat";
import { match } from "ts-pattern";
import { RoundGlasses } from "@/3d-objects/models/roundGlasses";
import { AfroHair } from "@/3d-objects/models/afroHair";
import { BuilderHelmet } from "@/3d-objects/models/builderHelmet";
import { BlobForm } from "@/components/BlobForm";
import { getSelectedBlobForm, getBlobFormType } from "@/types/blobForms";
import { SimsPlumbob } from "@/3d-objects/models/simsPlumbob";

// TODO: Move these constants to a shared config file
// Default head position Y

const HEAD_POSITION_Y = 0;
const MAX_ROTATION_X = 0.9;
const MAX_ROTATION_Y = 0.9;

// Idle animation constants
const IDLE_TIMEOUT_MIN = 15000; // 15 seconds
const IDLE_ANIMATION_DURATION = 3000; // 3 seconds for each animation

const createEyeGeometries = () => {
  const sphereGeometry = new SphereGeometry(0.12, 16, 16);
  const baseGeometry = sphereGeometry.clone();

  // Blinking eye geometry (squeezed from top and bottom)
  const blinkGeometry = sphereGeometry.clone();
  const blinkPositions = [];
  const basePositions = sphereGeometry.getAttribute("position").array;

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    // Squeeze from both top and bottom for blinking
    let newY = y;
    if (Math.abs(y) > 0.02) {
      // Squeeze both top and bottom for closed eye effect
      newY = y * 0.1;
    }

    blinkPositions.push(x, newY, z);
  }

  blinkGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(blinkPositions, 3)
  );
  blinkGeometry.computeVertexNormals();

  // Mad eye geometry (squeezed from bottom)
  const madGeometry = sphereGeometry.clone();
  const madPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    // Squeeze bottom half more than top half
    let newY = y;
    if (y < 0) {
      // Bottom half - squeeze more
      newY = y * 0.3;
    } else if (y > 0.02) {
      // Top half - squeeze less
      newY = y * 0.8;
    }

    madPositions.push(x, newY, z);
  }

  madGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(madPositions, 3)
  );
  madGeometry.computeVertexNormals();

  // Happy eye geometry (squeezed from top)
  const happyGeometry = sphereGeometry.clone();
  const happyPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    // Squeeze top half more than bottom half
    let newY = y;
    if (y > 0) {
      // Top half - squeeze more
      newY = y * 0.3;
    } else if (y < -0.02) {
      // Bottom half - squeeze less
      newY = y * 0.8;
    }

    happyPositions.push(x, newY, z);
  }

  happyGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(happyPositions, 3)
  );
  happyGeometry.computeVertexNormals();

  // Dizzy eye geometry (squeezed from sides like ><)
  const dizzyGeometry = sphereGeometry.clone();
  const dizzyPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    // Squeeze from sides (left and right)
    let newY = y;
    if (y < 0) {
      // Bottom side - squeeze more
      newY = y * 0.3;
    } else if (y > 0.02) {
      // Top side - squeeze more
      newY = y * 0.3;
    }

    dizzyPositions.push(x, newY, z);
  }

  dizzyGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(dizzyPositions, 3)
  );
  dizzyGeometry.computeVertexNormals();

  return {
    baseGeometry,
    blinkGeometry,
    madGeometry,
    happyGeometry,
    dizzyGeometry,
  };
};

export function BlobHead({
  onHeadClick,
  motionPermissionGranted: permissionGranted,
  isMobile,
  cameraControlsRef,
  showOptions,
  isClosing,
  emotionState,
  onCameraZoomAnimation,
}: {
  onHeadClick: () => void;
  motionPermissionGranted: boolean;
  isMobile: boolean;
  cameraControlsRef: React.RefObject<CameraControls>;
  showOptions: boolean;
  isClosing: boolean;
  emotionState: EmotionState;
  onCameraZoomAnimation?: (isAnimating: boolean) => void;
}) {
  const { currentTheme, bobItems, blobForms } = useGameStore();

  // Get theme-specific blob colors
  const blobColor = currentTheme?.blobColor;
  const outlineColor = currentTheme?.outlineColor;
  const eyeColor = currentTheme?.eyeColor;
  const headRef = useRef<Group>(null!);
  const leftEyeRef = useRef<Mesh>(null!);
  const rightEyeRef = useRef<Mesh>(null!);

  // Create eye geometries once
  const eyeGeometries = useRef(createEyeGeometries());

  // Dizzy animation state
  const [dizzyStars, setDizzyStars] = useState<
    Array<{
      id: number;
      visible: boolean;
      orbitAngle: number;
      orbitRadius: number;
      orbitSpeed: number;
      spinSpeed: number;
      scale: number;
      spinAngle: number;
    }>
  >([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [idleAnimation, setIdleAnimation] = useState<"none" | "spin" | "tilt">(
    "none"
  );
  const [idleAnimationStart, setIdleAnimationStart] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [lastIdleAnimationTime, setLastIdleAnimationTime] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [squeezeScale, setSqueezeScale] = useState(1);
  const particleIdCounter = useRef(0);
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);

  // Ref for physics body
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { orientation, acceleration } = useDeviceOrientation();

  // view store to check if we should control camera
  const { isBlobView } = useViewStore();

  // Keep a ref to spring api for fine-grained control
  const [spring, api] = useSpring(() => ({
    scale: [0, 0, 0], // start invisible
    config: { tension: 200, friction: 15 },
  }));

  // Trigger spawn animation once on mount
  useEffect(() => {
    api.start({
      scale: [1.2, 1.2, 1.2],
      delay: 1500,
      config: { tension: 300, friction: 10 },
    });
  }, []);

  // Animate scale when showOptions or isClosing changes
  useEffect(() => {
    if (!showOptions || isClosing) {
      // Add delay when closing to trigger after all closing animations are done
      const delay = isClosing ? 400 : 0;
      api.start({
        scale: [1.2, 1.2, 1.2],
        config: { tension: 300, friction: 10 },
        delay,
      });
    } else {
      api.start({
        scale: [1.2, 1.2, 1.2], // Keep normal scale when menu is open
        config: { tension: 300, friction: 10 },
      });
    }
  }, [showOptions, isClosing]);

  // Track mouse position for head rotation (only in blob view mode)
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // only update mouse position when in blob view mode
      if (isBlobView()) {
        setMousePosition({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: (event.clientY / window.innerHeight) * 2 - 1,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isBlobView]);

  // Blinking animation every 4-5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 4000 + Math.random() * 1000);
    return () => clearInterval(blinkInterval);
  }, []);

  // micro "happy" jump when emotion switches to happy (also used when triggered by messages)
  useEffect(() => {
    if (emotionState === "happy") {
      api.start({
        scale: [1.35, 1.35, 1.35],
        config: { tension: 420, friction: 10 },
      });
      api.start({
        scale: [1.2, 1.2, 1.2],
        config: { tension: 300, friction: 12 },
        delay: 140,
      });
    }
  }, [emotionState]);

  // Improved idle animation logic - only triggers every 15 seconds
  useEffect(() => {
    const checkIdleAnimation = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeSinceLastIdleAnimation = now - lastIdleAnimationTime;
      const idleTimeout = IDLE_TIMEOUT_MIN; // 15 seconds

      // Only trigger if:
      // 1. User has been idle for 15+ seconds
      // 2. No animation is currently playing
      // 3. At least 15 seconds have passed since the last idle animation
      if (
        timeSinceActivity > idleTimeout &&
        idleAnimation === "none" &&
        timeSinceLastIdleAnimation > idleTimeout
      ) {
        const animations: ("spin" | "tilt")[] = ["spin", "tilt"];
        const randomAnimation =
          animations[Math.floor(Math.random() * animations.length)];

        setIdleAnimation(randomAnimation);
        setIdleAnimationStart(now);
        setLastIdleAnimationTime(now); // Track when we started this animation

        // Always reset head to center before animating
        if (headRef.current) {
          headRef.current.rotation.set(0, 0, 0);
        }

        // Reset after animation duration
        setTimeout(() => {
          setIdleAnimation("none");
        }, IDLE_ANIMATION_DURATION);
      }
    };

    const idleCheckInterval = setInterval(checkIdleAnimation, 1000);
    return () => clearInterval(idleCheckInterval);
  }, [lastActivity, idleAnimation, lastIdleAnimationTime]);

  // Update activity timestamp on mouse movement (desktop) OR device motion (mobile)
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      // Cancel current idle animation if user becomes active
      if (idleAnimation !== "none") {
        setIdleAnimation("none");
        setIsJumping(false);
        setSqueezeScale(1);
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [idleAnimation]);

  // Treat noticeable device motion as activity (mobile)
  // Ref to remember previous orientation values between renders (mobile)
  const prevOrientationRef = useRef<DeviceOrientation | null>(null);

  useEffect(() => {
    if (!isMobile || !permissionGranted) return;

    const movementDetected = () => {
      setLastActivity(Date.now());
      if (idleAnimation !== "none") {
        setIdleAnimation("none");
        setIsJumping(false);
        setSqueezeScale(1);
      }
    };

    const thresholdAccel = 0.2; // g units (~2 m/s^2)
    const thresholdDeg = 0.5; // degrees (lower = more sensitive)

    const accelMag =
      Math.abs(acceleration?.x ?? 0) +
      Math.abs(acceleration?.y ?? 0) +
      Math.abs(acceleration?.z ?? 0);
    const orientChange =
      orientation && prevOrientationRef.current
        ? Math.abs(
            (orientation.alpha ?? 0) - (prevOrientationRef.current.alpha ?? 0)
          ) +
          Math.abs(
            (orientation.beta ?? 0) - (prevOrientationRef.current.beta ?? 0)
          ) +
          Math.abs(
            (orientation.gamma ?? 0) - (prevOrientationRef.current.gamma ?? 0)
          )
        : 0;

    if (accelMag > thresholdAccel || orientChange > thresholdDeg) {
      movementDetected();
    }

    prevOrientationRef.current = orientation;
  }, [orientation, acceleration, isMobile, permissionGranted, idleAnimation]);

  // Manage dizzy stars
  useEffect(() => {
    if (emotionState === "dizzy") {
      // Create 5 stars with different properties
      const newStars = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        visible: false,
        orbitAngle: i * 72 * (Math.PI / 180), // Spread evenly around circle
        orbitRadius: 1.5 + Math.random() * 0.5,
        orbitSpeed: 1 + Math.random() * 2,
        spinSpeed: 2 + Math.random() * 4,
        scale: 0.8 + Math.random() * 0.4,
        spinAngle: Math.random() * Math.PI * 2,
      }));
      setDizzyStars(newStars);

      // Stagger star appearance
      newStars.forEach((star, index) => {
        setTimeout(() => {
          setDizzyStars((prev) =>
            prev.map((s) => (s.id === star.id ? { ...s, visible: true } : s))
          );
        }, index * 200);
      });
    } else {
      // Hide all stars when not dizzy
      setDizzyStars([]);
    }
  }, [emotionState]);

  // Animation for head movement and camera positioning
  useFrame(({ clock }, delta) => {
    // Handle idle animations first (they take priority)
    if (idleAnimation !== "none") {
      handleIdleAnimation(clock, delta);
    } else {
      // Handle device motion for mobile
      if (isMobile && orientation && acceleration && permissionGranted) {
        handleMobileMovement(clock, delta);
      } else {
        // Handle mouse movement for desktop
        handleDesktopMovement(clock, delta, showOptions);
      }
    }

    // Common animations regardless of device
    // Eye animations based on emotion state
    animateEyes(delta);

    // Animate dizzy state
    if (emotionState === "dizzy") {
      // Enhanced head wobble
      const wobbleX = Math.sin(clock.getElapsedTime() * 8) * 0.3;
      const wobbleY = Math.cos(clock.getElapsedTime() * 6) * 0.2;
      const wobbleZ = Math.sin(clock.getElapsedTime() * 10) * 0.4;

      headRef.current.rotation.x += wobbleX * delta;
      headRef.current.rotation.y += wobbleY * delta;
      headRef.current.rotation.z += wobbleZ * delta;

      // Add some position wobble too
      const posWobbleX = Math.sin(clock.getElapsedTime() * 12) * 0.05;
      const posWobbleY = Math.cos(clock.getElapsedTime() * 9) * 0.03;

      headRef.current.position.x += posWobbleX * delta;
      headRef.current.position.y += posWobbleY * delta;

      // Animate orbiting stars
      setDizzyStars((prev) =>
        prev.map((star) => ({
          ...star,
          orbitAngle: star.orbitAngle + star.orbitSpeed * delta,
          spinAngle: star.spinAngle + star.spinSpeed * delta,
        }))
      );
    }
  });

  // Handle mobile device motion
  const handleMobileMovement = (clock: Clock, delta: number) => {
    const {
      targetRotX,
      targetRotY,
      targetRotZ,
      accelX,
      accelY,
      orientGamma,
      orientBeta,
    } = calculateAcceleratedRotation(acceleration, orientation);

    // Apply mobile specific head rotation
    applyHeadRotation(targetRotY, targetRotX, 0, delta);

    // Apply mobile specific head position (shake effect)
    applyMobileHeadPosition(
      clock,
      delta,
      accelX,
      accelY,
      orientGamma,
      orientBeta
    );

    // Set camera look-at for mobile
    const lookDirection = new Vector3(
      -targetRotX,
      targetRotY,
      targetRotZ
    ).normalize();

    // Add camera zoom animation on tap
    const baseZoom = showOptions
      ? VISIBLE_OPTIONS_CAMERA_ZOOM
      : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation
      ? Math.sin(clock.getElapsedTime() * 20) * 0.5
      : 0;
    const cameraPosition = new Vector3(0, CAMERA_HEIGHT, baseZoom + zoomOffset);
    const target = cameraPosition.clone().add(lookDirection);

    // only control camera when in blob view mode
    if (isBlobView()) {
      cameraControlsRef.current?.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        target.x,
        target.y,
        target.z,
        true
      );
    }
  };

  // Handle desktop mouse movement
  const handleDesktopMovement = (
    clock: Clock,
    delta: number,
    showOptions: boolean
  ) => {
    // Calculate target rotations based on mouse position
    // Fix Y-axis inversion: cursor at top should make head look up (negative rotation)
    const targetRotY = mousePosition.x * MAX_ROTATION_X;
    // const targetRotX = mousePosition.y * MAX_ROTATION_Y;
    const targetRotX =
      (mousePosition.y - (showOptions ? 0 : CAMERA_Y_POSITION)) *
      MAX_ROTATION_Y;
    const targetRotZ = -mousePosition.x * MAX_ROTATION_X;

    // Apply desktop specific head rotation
    applyHeadRotation(targetRotX, targetRotY, targetRotZ, delta);

    // Apply breathing animation for head position
    const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    headRef.current.position.y = floatY + HEAD_POSITION_Y;

    // Set camera look-at for desktop
    // Fix camera Y-axis inversion to match head movement
    const cursorPos = new Vector3(
      mousePosition.x * 0.2,
      -(mousePosition.y - 0.5) * 0.4, // Invert Y and center around 0.5
      0
    );

    // Add camera zoom animation on tap
    const baseZoom = showOptions
      ? VISIBLE_OPTIONS_CAMERA_ZOOM
      : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation
      ? Math.sin(clock.getElapsedTime() * 20) * 0.5
      : 0;

    // only control camera when in blob view mode
    if (isBlobView()) {
      cameraControlsRef.current?.setLookAt(
        0,
        CAMERA_HEIGHT,
        baseZoom + zoomOffset,
        cursorPos.x,
        cursorPos.y + 2,
        cursorPos.z,
        true
      );
    }
  };

  // Common function to apply head rotation
  const applyHeadRotation = (
    rotX: number,
    rotY: number,
    rotZ: number,
    delta: number
  ) => {
    headRef.current.rotation.y = MathUtils.lerp(
      headRef.current.rotation.y,
      rotY,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.x = MathUtils.lerp(
      headRef.current.rotation.x,
      rotX,
      1 - Math.exp(-4 * delta)
    );
    headRef.current.rotation.z = MathUtils.lerp(
      headRef.current.rotation.z,
      rotZ,
      1 - Math.exp(-3 * delta)
    );
  };

  // Mobile specific head position with shake effect
  const applyMobileHeadPosition = (
    clock: Clock,
    delta: number,
    accelX: number,
    accelY: number,
    orientGamma: number,
    orientBeta: number
  ) => {
    const shakeStrength = 0.6;
    const shakeOffsetX = MathUtils.clamp(accelX * shakeStrength, -0.4, 0.4);
    const shakeOffsetY = MathUtils.clamp(accelY * shakeStrength, -0.4, 0.4);

    // const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    const floatY = HEAD_POSITION_Y;

    headRef.current.position.x = MathUtils.lerp(
      headRef.current.position.x,
      shakeOffsetX + orientGamma * 0.2,
      1 - Math.exp(-2 * delta)
    );
    headRef.current.position.y = MathUtils.lerp(
      headRef.current.position.y,
      floatY + shakeOffsetY + orientBeta * 0.2,
      1 - Math.exp(-2 * delta)
    );
  };

  // Handle idle animations
  const handleIdleAnimation = (clock: Clock, delta: number) => {
    const animationProgress =
      (Date.now() - idleAnimationStart) / IDLE_ANIMATION_DURATION;
    const easedProgress = 1 - Math.pow(1 - animationProgress, 3); // Ease out

    if (idleAnimation === "spin") {
      // Always reset to center at start
      if (animationProgress < 0.01 && headRef.current) {
        headRef.current.rotation.set(0, 0, 0);
      }
      // Spin animation: build up motion, spin around y-axis, then settle back
      const spinPhase = animationProgress * 3; // 3 phases: build up, spin, settle

      if (spinPhase < 1) {
        // Phase 1: Build up motion (0-33% of animation)
        const buildUpProgress = spinPhase;
        const buildUpEase = 1 - Math.pow(1 - buildUpProgress, 2);
        const rotationY = buildUpEase * Math.PI * 2 * 0.3; // Small rotation to build momentum

        headRef.current.rotation.y = rotationY;
        // headRef.current.rotation.x = buildUpEase * Math.PI * 0.1; // Slight tilt forward
      } else if (spinPhase < 2) {
        // Phase 2: Full spin (33-66% of animation)
        const spinProgress = spinPhase - 1;
        const spinEase = Math.sin(spinProgress * Math.PI); // Smooth spin
        const fullRotation = Math.PI * 2 * 1.5; // 1.5 full rotations

        headRef.current.rotation.y =
          Math.PI * 2 * 0.3 + fullRotation * spinEase;
        // headRef.current.rotation.x = Math.PI * 0.1 * (1 - spinEase); // Return to neutral
      } else {
        // Phase 3: Settle back (66-100% of animation)
        const settleProgress = spinPhase - 2;
        const settleEase = 1 - Math.pow(settleProgress, 2);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-8 * delta)
        );
      }
    } else if (idleAnimation === "tilt") {
      // Always reset to center at start
      if (animationProgress < 0.01 && headRef.current) {
        headRef.current.rotation.set(0, 0, 0);
      }
      // Head tilt animation: look around at different directions
      const tiltPhase = animationProgress * 4; // 4 phases: look left, up, right, center

      if (tiltPhase < 1) {
        // Phase 1: Look left (0-25% of animation)
        const lookLeftProgress = tiltPhase;
        const lookLeftEase = Math.sin(lookLeftProgress * Math.PI * 0.5);

        headRef.current.rotation.y = -lookLeftEase * 0.8;
        headRef.current.rotation.x = lookLeftEase * 0.2;
      } else if (tiltPhase < 2) {
        // Phase 2: Look up (25-50% of animation)
        const lookUpProgress = tiltPhase - 1;
        const lookUpEase = Math.sin(lookUpProgress * Math.PI * 0.5);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-4 * delta)
        );
        headRef.current.rotation.x = lookUpEase * 0.6;
      } else if (tiltPhase < 3) {
        // Phase 3: Look right (50-75% of animation)
        const lookRightProgress = tiltPhase - 2;
        const lookRightEase = Math.sin(lookRightProgress * Math.PI * 0.5);

        headRef.current.rotation.y = lookRightEase * 0.8;
        headRef.current.rotation.x = MathUtils.lerp(
          headRef.current.rotation.x,
          0.2,
          1 - Math.exp(-4 * delta)
        );
      } else {
        // Phase 4: Return to center (75-100% of animation)
        const returnProgress = tiltPhase - 3;
        const returnEase = 1 - Math.pow(returnProgress, 2);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-6 * delta)
        );
        headRef.current.rotation.x = MathUtils.lerp(
          headRef.current.rotation.x,
          0,
          1 - Math.exp(-6 * delta)
        );
      }
    }
  };

  // Eye animation function based on emotion state using morph targets
  const animateEyes = (delta: number) => {
    // Safety checks
    if (!leftEyeRef.current || !rightEyeRef.current || !eyeGeometries.current) {
      return;
    }

    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;

    // Check if geometry attributes exist
    if (!leftEye.geometry.getAttribute("position")) {
      return;
    }

    let targetGeometry = eyeGeometries.current.baseGeometry;
    let eyeOffsetY = 0;

    // Handle blinking first - blinking should always take priority
    if (blinking) {
      // Use the blink geometry for blinking
      targetGeometry = eyeGeometries.current.blinkGeometry;
      // Keep eye offset at 0 for blinking
      eyeOffsetY = 0;
    } else {
      // Handle emotion-based eye changes only when not blinking
      switch (emotionState) {
        case "happy":
          // Squeeze from bottom (happy eyes like ^_^)
          targetGeometry = eyeGeometries.current.madGeometry;
          eyeOffsetY = 0.05; // Slight upward offset
          break;
        case "mad":
          // Squeeze from top (angry eyes like >_<)
          targetGeometry = eyeGeometries.current.happyGeometry;
          eyeOffsetY = -0.03; // Slight downward offset for angry look
          break;
        case "dizzy":
          // Use dizzy geometry (squeezed from sides like ><)
          targetGeometry = eyeGeometries.current.dizzyGeometry;
          eyeOffsetY = -0.02;
          break;
        case "thinking":
          // thinking: slight upward offset and subtle squeeze
          targetGeometry = eyeGeometries.current.baseGeometry;
          eyeOffsetY = 0.03;
          break;
        case "suspicious":
          // suspicious: slight downward offset
          targetGeometry = eyeGeometries.current.baseGeometry;
          eyeOffsetY = -0.02;
          break;
        case "normal":
        default:
          targetGeometry = eyeGeometries.current.baseGeometry;
          eyeOffsetY = 0;
          break;
      }
    }

    // Check if target geometry has position attribute
    if (!targetGeometry.getAttribute("position")) {
      return;
    }

    // Interpolate between current and target geometry positions
    const currentPositions = leftEye.geometry.getAttribute("position").array;
    const targetPositions = targetGeometry.getAttribute("position").array;

    if (
      !currentPositions ||
      !targetPositions ||
      currentPositions.length !== targetPositions.length
    ) {
      return;
    }

    const newPositions = new Float32Array(currentPositions.length);
    for (let i = 0; i < currentPositions.length; i++) {
      newPositions[i] = MathUtils.lerp(
        currentPositions[i],
        targetPositions[i],
        0.1
      );
    }

    // Apply the morphed positions to both eyes
    leftEye.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(newPositions, 3)
    );
    rightEye.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(newPositions, 3)
    );

    // Recompute normals for proper lighting
    leftEye.geometry.computeVertexNormals();
    rightEye.geometry.computeVertexNormals();

    // Apply eye position offset for emotions
    const currentLeftY = leftEye.position.y;
    const currentRightY = rightEye.position.y;
    const baseY = 0; // Base eye position

    leftEye.position.y = MathUtils.lerp(currentLeftY, baseY + eyeOffsetY, 0.2);
    rightEye.position.y = MathUtils.lerp(
      currentRightY,
      baseY + eyeOffsetY,
      0.2
    );
  };

  const createParticles = (x: number, y: number, z: number) => {
    // Use the new tap effect system
    if ((window as any).createTapParticles) {
      (window as any).createTapParticles(x, y, z, 15);
    }
  };

  const onClick = (event: any) => {
    // Stop event propagation to prevent double counting from activity listeners
    event.stopPropagation();

    // Create particles at the counter text position instead of cursor
    const COUNTER_POS: [number, number, number] = [0, 0, 0];
    createParticles(COUNTER_POS[0], COUNTER_POS[1], COUNTER_POS[2]);

    // Trigger bounce animation on tap
    api.start({
      scale: [1.4, 1.4, 1.4],
      config: { tension: 400, friction: 8 },
    });
    api.start({
      scale: [1.2, 1.2, 1.2],
      config: { tension: 300, friction: 10 },
      delay: 150,
    });

    // Trigger camera zoom animation on tap
    setCameraZoomAnimation(true);
    onCameraZoomAnimation?.(true);
    setTimeout(() => {
      setCameraZoomAnimation(false);
      onCameraZoomAnimation?.(false);
    }, 300);

    // Trigger both game tap and emotion animation
    onHeadClick();
  };

  const onPointerOver = () => {
    document.body.style.cursor = "pointer";
  };

  const onPointerLeave = () => {
    document.body.style.cursor = "auto";
  };

  // memoize selected blob form and type
  const selectedBlobForm = useMemo(
    () => getSelectedBlobForm(blobForms),
    [blobForms]
  );
  const blobFormType = useMemo(
    () => getBlobFormType(selectedBlobForm.id),
    [selectedBlobForm.id]
  );

  // memoize costume position calculation function
  const calculateCostumePosition = useCallback(
    (
      basePosition: [number, number, number],
      itemType: "hat" | "accessory",
      itemId?: string
    ): [number, number, number] => {
      const [baseX, baseY, baseZ] = basePosition;
      const { parameters } = selectedBlobForm;

      let adjustedX = baseX;
      let adjustedY = baseY;
      let adjustedZ = baseZ;

      // calculate adjustments based on form type
      if (blobFormType === "sphere") {
        const radiusDiff = (parameters.sphereRadius || 1) - 1; // default sphere radius is 1
        if (itemType === "hat") {
          adjustedY += radiusDiff; // hats move up with larger radius
        } else if (itemType === "accessory" && itemId) {
          // for spheres, radius affects both height and depth
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += radiusDiff * (axisConfig.yMultiplier || 0.5); // y-axis with radius changes
            }
            if (axisConfig.z) {
              adjustedZ += radiusDiff * (axisConfig.zMultiplier || 0.3); // z-axis with radius changes
            }
          }
        }
      } else if (blobFormType === "cube") {
        const heightDiff = (parameters.cubeHeight || 1.75) - 1.75; // default cube height
        const depthDiff = (parameters.cubeDepth || 1.65) - 1.65; // default cube depth

        if (itemType === "hat") {
          adjustedY += heightDiff * 0.5; // hats move up with greater height
        } else if (itemType === "accessory" && itemId) {
          // use configurable axis system for accessories
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += heightDiff * (axisConfig.yMultiplier || 0.5); // y-axis with height changes
            }
            if (axisConfig.z) {
              adjustedZ += depthDiff * (axisConfig.zMultiplier || 0.3); // z-axis with depth changes
            }
          }
        }
      } else if (blobFormType === "pill") {
        const heightDiff = (parameters.pillHeight || 1.6) - 1.6; // default pill height
        const radiusDiff =
          ((parameters.pillRadiusTop || 0.8) +
            (parameters.pillRadiusBottom || 0.8)) /
            2 -
          0.8; // average radius

        if (itemType === "hat") {
          adjustedY += heightDiff * 0.5; // hats move up with greater height
        } else if (itemType === "accessory" && itemId) {
          // use configurable axis system for accessories
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += heightDiff * (axisConfig.yMultiplier || 0.5); // y-axis with height changes
            }
            if (axisConfig.z) {
              adjustedZ += radiusDiff * (axisConfig.zMultiplier || 0.3); // z-axis with radius changes
            }
          }
        }
      }

      return [adjustedX, adjustedY, adjustedZ];
    },
    [selectedBlobForm, blobFormType]
  );

  // accessory axis configuration - defines which axes each accessory type should move on
  const ACCESSORY_AXIS_CONFIG: Record<
    string,
    {
      x: boolean;
      y: boolean;
      z: boolean;
      yMultiplier?: number;
      zMultiplier?: number;
    }
  > = {
    chickenLittleGlasses: {
      x: false,
      y: true,
      z: true,
      yMultiplier: 0.5,
      zMultiplier: 0.7,
    }, // glasses move on both y and z axes
    // add more accessories here as needed
  };

  // memoize eye position calculation function
  const calculateEyePosition = useCallback(
    (basePosition: [number, number, number]): [number, number, number] => {
      const [baseX, baseY, baseZ] = basePosition;
      const { parameters } = selectedBlobForm;

      let adjustedX = baseX;
      let adjustedY = baseY;
      let adjustedZ = baseZ;

      // for spheres, radius acts as both height and depth
      if (blobFormType === "sphere") {
        const radiusDiff = (parameters.sphereRadius || 1) - 1; // default sphere radius is 1
        adjustedY += radiusDiff * 0.4; // eyes move up/down with radius changes
        adjustedZ += radiusDiff * 1.2; // eyes move forward/back with radius changes
      } else if (blobFormType === "cube") {
        const heightDiff = (parameters.cubeHeight || 1.75) - 1.75; // default cube height
        const depthDiff = (parameters.cubeDepth || 1.65) - 1.65; // default cube depth
        adjustedY += heightDiff * 0.4; // eyes move up/down with height changes
        adjustedZ += depthDiff * 0.5; // eyes move forward/back with depth changes
      } else if (blobFormType === "pill") {
        const heightDiff = (parameters.pillHeight || 1.6) - 1.6; // default pill height
        const radiusDiff =
          ((parameters.pillRadiusTop || 0.8) +
            (parameters.pillRadiusBottom || 0.8)) /
            2 -
          0.8; // average radius
        adjustedY += heightDiff * 0.3; // eyes move up/down with height changes
        adjustedZ += radiusDiff * 0.5; // eyes move forward/back with radius changes
      }

      return [adjustedX, adjustedY, adjustedZ];
    },
    [selectedBlobForm, blobFormType]
  );

  const renderBobItems = () => {
    const allEquippedItems = bobItems.filter((item) => item.equipped);

    const detachedItems = allEquippedItems.filter(
      (item) => item.detached === true
    );
    const attachedItems = allEquippedItems.filter(
      (item) => item.detached !== true
    );

    // Render attached items (these move with the head)
    const attachedModels = attachedItems.map((item) => {
      if (item.id === "krustyKrabHat")
        return (
          <KrustyKrabHat
            key={item.id}
            position={calculateCostumePosition([0, 0.9, 0], "hat")}
            scale={[0.006, 0.006, 0.006]}
            outlineColor={outlineColor}
          />
        );
      if (item.id === "chickenLittleGlasses")
        return (
          <RoundGlasses
            key={item.id}
            position={calculateCostumePosition(
              [0, 0.1, 0.7],
              "accessory",
              item.id
            )}
            scale={[1.6, 1.6, 1.6]}
          />
        );
      if (item.id === "builderHelmet")
        return (
          <BuilderHelmet
            key={item.id}
            position={calculateCostumePosition([0, 0.6, 0], "hat")}
            scale={[1.2, 1.2, 1.2]}
            rotation={[Math.PI * -0.05, 0, 0]}
          />
        );
      if (item.id === "afroHair")
        return (
          <AfroHair
            key={item.id}
            position={calculateCostumePosition([0, -0.7, -0.05], "hat")}
            scale={[0.9, 0.9, 0.9]}
          />
        );
      return null;
    });

    const detachedModels = detachedItems.map((item) => {
      if (item.id === "simsPlumbob") {
        return (
          <SimsPlumbob
            key={item.id}
            position={[0, 3.5, 0]}
            scale={[0.4, 0.4, 0.4]}
            color={emotionState === "mad" ? "#ce1111" : undefined}
          />
        );
      }
      return null;
    });

    return {
      attached: attachedModels,
      detached: detachedModels,
    };
  };

  const { attached: attachedItems, detached: detachedItems } = renderBobItems();

  const content = (
    <>
      {detachedItems}

      <a.group
        ref={headRef}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerLeave={onPointerLeave}
        castShadow
        scale={spring.scale.get() as [number, number, number]}
        rotation={[0, Math.PI, 0]}
        position={[0, 2, 0]}
      >
        {/* Head - using selected blob form */}
        <BlobForm
          formType={blobFormType}
          parameters={selectedBlobForm.parameters}
          blobColor={blobColor || "#ff6b9d"}
          outlineColor={outlineColor || "#000000"}
        />

        {/* Eyes */}
        <group position={calculateEyePosition([0, 0.2, 0.85])}>
          <mesh ref={leftEyeRef} position={[-0.45, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshToonMaterial color={eyeColor} />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.45, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshToonMaterial color={eyeColor} />
          </mesh>
        </group>

        {attachedItems}

        {emotionState === "dizzy" &&
          dizzyStars.map((star) => {
            if (!star.visible) return null;

            const orbitX = Math.cos(star.orbitAngle) * star.orbitRadius;
            const orbitZ = Math.sin(star.orbitAngle) * star.orbitRadius;
            const orbitY = 1.5 + Math.sin(star.orbitAngle * 2) * 0.2;

            return (
              <group
                key={star.id}
                position={[orbitX, orbitY, orbitZ]}
                scale={[star.scale, star.scale, star.scale]}
              >
                <Star3D
                  rotation={[
                    Math.sin(star.spinAngle) * 0.1,
                    star.spinAngle,
                    Math.sin(star.spinAngle * 0.5) * 0.05,
                  ]}
                />
              </group>
            );
          })}
      </a.group>
    </>
  );

  return content;
}
