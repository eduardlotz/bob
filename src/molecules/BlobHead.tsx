import {
  DeviceOrientation,
  useDeviceOrientation,
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
  CAMERA_ZOOM_ON_TAP,
} from "./HeadNavigation";
import { CameraControls } from "@react-three/drei";
import { calculateAcceleratedRotation } from "@/utils/math";
import { a, useSpring } from "@react-spring/three";
import { Star3D } from "@/3d-objects/Star3D";
import { EmotionState } from "@/hooks/useBlobEmotions";
import { useCoreStore } from "@/store/core/store";
import { useViewStore } from "@/store/viewStore";
import { KrustyKrabHat } from "@/3d-objects/models/krustyKrabHat";
import { match } from "ts-pattern";
import { RoundGlasses } from "@/3d-objects/models/roundGlasses";
import { AfroHair } from "@/3d-objects/models/afroHair";
import { BuilderHelmet } from "@/3d-objects/models/builderHelmet";
import { BlobForm } from "@/components/BlobForm";
import { getSelectedBlobForm, getBlobFormType } from "@/types/blobForms";
import { SimsPlumbob } from "@/3d-objects/models/simsPlumbob";
import { BlackCap } from "@/3d-objects/models/blackCap";
import { useCursor } from "@/hooks/useCursor";
import { useCursorStore } from "@/store/core/cursor";
import { ROUTE_PATHS } from "@/store/config/routes";
import { useAppStore, useMiniGameStore } from "@/store";
import { playTapSound } from "@/utils/soundSystem";
import { resolveTapSoundForEffect } from "@/utils/sound/configs";
import { BallCollider, RigidBody } from "@react-three/rapier";
import { AstronautHelmet } from "@/3d-objects/models/astronaut";

// TODO: move constants to a shared config file
const HEAD_POSITION_Y = 0;
const MAX_ROTATION_X = 0.9;
const MAX_ROTATION_Y = 0.9;

const IDLE_TIMEOUT_MIN = 15000;
const IDLE_ANIMATION_DURATION = 3000;

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
  },
};

// TODO: move to utils file
const createEyeGeometries = () => {
  const sphereGeometry = new SphereGeometry(0.12, 16, 16);
  const baseGeometry = sphereGeometry.clone();

  const blinkGeometry = sphereGeometry.clone();
  const blinkPositions = [];
  const basePositions = sphereGeometry.getAttribute("position").array;

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    let newY = y;
    if (Math.abs(y) > 0.02) {
      newY = y * 0.1;
    }

    blinkPositions.push(x, newY, z);
  }

  blinkGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(blinkPositions, 3),
  );
  blinkGeometry.computeVertexNormals();

  const madGeometry = sphereGeometry.clone();
  const madPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    let newY = y;
    if (y < 0) {
      newY = y * 0.3;
    } else if (y > 0.02) {
      newY = y * 0.8;
    }

    madPositions.push(x, newY, z);
  }

  madGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(madPositions, 3),
  );
  madGeometry.computeVertexNormals();

  const happyGeometry = sphereGeometry.clone();
  const happyPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    let newY = y;
    if (y > 0) {
      newY = y * 0.3;
    } else if (y < -0.02) {
      newY = y * 0.8;
    }

    happyPositions.push(x, newY, z);
  }

  happyGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(happyPositions, 3),
  );
  happyGeometry.computeVertexNormals();

  const dizzyGeometry = sphereGeometry.clone();
  const dizzyPositions = [];

  for (let i = 0; i < basePositions.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];

    let newY = y;
    if (y < 0) {
      newY = y * 0.3;
    } else if (y > 0.02) {
      newY = y * 0.3;
    }

    dizzyPositions.push(x, newY, z);
  }

  dizzyGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(dizzyPositions, 3),
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

// TODO: refactor with animation manager
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
  const {
    currentTheme,
    themes,
    previewMode,
    bobItems,
    blobForms,
    addManualTap,
    tapEffects,
    audioSelections,
    tapMultiplier,
    getTotalTapMultiplier,
  } = useCoreStore();
  const { currentRoute } = useAppStore();

  const showAutoTapParticles = currentRoute === ROUTE_PATHS.HOME;

  const activeTheme =
    previewMode === "theme" ? themes.find((t) => t.preview) : currentTheme;

  const blobColor = activeTheme?.blobColor;
  const outlineColor = activeTheme?.outlineColor;
  const eyeColor = activeTheme?.eyeColor;
  const headRef = useRef<Group>(null!);
  const leftEyeRef = useRef<Mesh>(null!);
  const rightEyeRef = useRef<Mesh>(null!);

  const eyeGeometries = useRef(createEyeGeometries());

  const setHovering = useCursorStore.getState().setHoveringClickable;
  const setPointerDown = useCursorStore.getState().setPointerDown;

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
  const starsRef = useRef<Group>(null);
  const starData = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      orbitAngle: i * 72 * (Math.PI / 180),
      orbitRadius: 1.5 + Math.random() * 0.5,
      orbitSpeed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI, // for a vertical bobbing effect
    })),
  );

  const [blinking, setBlinking] = useState(false);
  const [idleAnimation, setIdleAnimation] = useState<"none" | "spin" | "tilt">(
    "none",
  );
  const [idleAnimationStart, setIdleAnimationStart] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [lastIdleAnimationTime, setLastIdleAnimationTime] = useState(0);
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);

  const { orientation, acceleration } = useDeviceOrientation();

  const {
    isDefaultView,
    isAboutView,
    isNavigationView,
    viewMode,
    isTransitioning,
    isObjectView,
  } = useViewStore();

  const shouldFollowCursor =
    viewMode === "fixed" &&
    !isMobile &&
    (isDefaultView() ||
      // || isAboutView()
      isNavigationView());

  const mousePosition = useCursor({
    condition: () => shouldFollowCursor,
    positionFactor: 2.5,
  });

  // default size a little bigger, MAYDO fix directly inside BobForm.tsx
  const [spring, api] = useSpring(() => ({
    scale: [1.2, 1.2, 1.2],
    config: { tension: 300, friction: 12 },
  }));

  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
      },
      4000 + Math.random() * 1000,
    );
    return () => clearInterval(blinkInterval);
  }, []);

  // inactivity animations (spin & look around)
  // MAYDO: add camera panning in idle mode
  useEffect(() => {
    const checkIdleAnimation = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeSinceLastIdleAnimation = now - lastIdleAnimationTime;
      const idleTimeout = IDLE_TIMEOUT_MIN;

      // trigger one of both idle animations if
      // user has been idle for 15+ seconds
      // no animation is currently playing
      // 15 seconds have passed since the last idle animation
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
        setLastIdleAnimationTime(now);

        // reset head to center before animating
        if (headRef.current) {
          headRef.current.rotation.set(0, 0, 0);
        }

        setTimeout(() => {
          setIdleAnimation("none");
        }, IDLE_ANIMATION_DURATION);
      }
    };

    const idleCheckInterval = setInterval(checkIdleAnimation, 1000);
    return () => clearInterval(idleCheckInterval);
  }, [lastActivity, idleAnimation, lastIdleAnimationTime]);

  // reset inactivity timer when user does something again
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (idleAnimation !== "none") {
        setIdleAnimation("none");
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

  // dizzy animation rotating stars
  // TODO: move to animation state machine
  useEffect(() => {
    if (emotionState === "dizzy") {
      const newStars = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        visible: false,
        orbitAngle: i * 72 * (Math.PI / 180),
        orbitRadius: 1.5 + Math.random() * 0.5,
        orbitSpeed: 1 + Math.random() * 2,
        spinSpeed: 2 + Math.random() * 4,
        scale: 0.8 + Math.random() * 0.4,
        spinAngle: Math.random() * Math.PI * 2,
      }));
      setDizzyStars(newStars);

      newStars.forEach((star, index) => {
        setTimeout(() => {
          setDizzyStars((prev) =>
            prev.map((s) => (s.id === star.id ? { ...s, visible: true } : s)),
          );
        }, index * 200);
      });
    } else {
      setDizzyStars([]);
    }
  }, [emotionState]);

  useFrame(({ clock }, delta) => {
    if (idleAnimation !== "none") {
      handleIdleAnimation(clock, delta);
    } else {
      // special case: mobile movement using gyro
      if (isMobile) {
        handleMobileMovement(
          clock,
          delta,
          showOptions,
          orientation,
          acceleration,
          permissionGranted,
        );
      } else {
        handleDesktopMovement(clock, delta, showOptions);
      }
    }

    animateEyes(delta);

    if (emotionState === "dizzy" && starsRef.current) {
      const wobbleX = Math.sin(clock.getElapsedTime() * 8) * 0.6;
      const wobbleY = Math.cos(clock.getElapsedTime() * 6) * 0.2;
      const wobbleZ = Math.sin(clock.getElapsedTime() * 10) * 0.4;

      headRef.current.rotation.x += wobbleX * delta;
      headRef.current.rotation.y += wobbleY * delta;
      headRef.current.rotation.z += wobbleZ * delta;

      const posWobbleX = Math.sin(clock.getElapsedTime() * 12) * 0.05;
      const posWobbleY = Math.cos(clock.getElapsedTime() * 9) * 0.03;

      headRef.current.position.x += posWobbleX * delta;
      headRef.current.position.y += posWobbleY * delta;

      const time = clock.getElapsedTime();

      starsRef.current.children.forEach((star, i) => {
        const data = starData.current[i];

        data.orbitAngle += data.orbitSpeed * delta;

        const x = Math.cos(data.orbitAngle) * data.orbitRadius;
        const z = Math.sin(data.orbitAngle) * data.orbitRadius;
        const y = Math.sin(time * 2 + data.offset) * 0.2;

        star.position.set(x, y, z);
        star.rotation.y += 5 * delta;
      });
    }
  });

  // mobile either fixed camera or using device gyro
  // TODO: test + refactor
  const handleMobileMovement = (
    clock: Clock,
    delta: number,
    showOptions: boolean,
    orientation: DeviceOrientation,
    acceleration: DeviceMotionEventAcceleration,
    permissionGranted: boolean,
  ) => {
    if (permissionGranted) {
      const {
        targetRotX,
        targetRotY,
        targetRotZ,
        accelX,
        accelY,
        orientGamma,
        orientBeta,
      } = calculateAcceleratedRotation(acceleration, orientation);

      applyHeadRotation(targetRotY, targetRotX, 0, delta);

      applyMobileHeadPosition(
        clock,
        delta,
        accelX,
        accelY,
        orientGamma,
        orientBeta,
      );

      const lookDirection = new Vector3(
        -targetRotX,
        targetRotY,
        targetRotZ,
      ).normalize();

      const baseZoom = showOptions
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
      const zoomOffset = cameraZoomAnimation
        ? Math.sin(clock.getElapsedTime() * 20) * 0.5
        : 0;
      const cameraPosition = new Vector3(
        0,
        CAMERA_HEIGHT,
        baseZoom + zoomOffset,
      );
      const target = cameraPosition.clone().add(lookDirection);

      if (shouldFollowCursor) {
        cameraControlsRef.current?.setLookAt(
          cameraPosition.x,
          cameraPosition.y,
          cameraPosition.z,
          target.x,
          target.y,
          target.z,
          true,
        );
      }
    } else {
      // head is looks back on mobile (???)
      applyHeadRotation(-0.5, 0, 0, delta);

      // floating animation
      const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      headRef.current.position.y = floatY + HEAD_POSITION_Y;

      const baseZoom = showOptions
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
      const zoomOffset = cameraZoomAnimation ? CAMERA_ZOOM_ON_TAP : 0;
      const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
      const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
      const cameraShakeStrength =
        Math.sin(clock.getElapsedTime() * 50) *
        Math.min(1, 0.01 * getTotalTapMultiplier());

      const cameraShakeX = cameraZoomAnimation ? cameraShakeStrength : 0;
      const cameraShakeY = cameraZoomAnimation ? cameraShakeStrength : 0;

      if (!isTransitioning && !isObjectView()) {
        cameraControlsRef.current?.setLookAt(
          0,
          CAMERA_HEIGHT,
          baseZoom + zoomOffset,
          handCamSwayX + cameraShakeX,
          CAMERA_Y_POSITION + handCamSwayY + cameraShakeY,
          0,
          true,
        );
      }
    }
  };

  const handleDesktopMovement = (
    clock: Clock,
    delta: number,
    showOptions: boolean,
  ) => {
    const targetRotY = mousePosition.x * MAX_ROTATION_X;
    const targetRotX =
      (-mousePosition.y - (showOptions ? 0 : CAMERA_Y_POSITION)) *
      MAX_ROTATION_Y;
    const targetRotZ = -mousePosition.x * MAX_ROTATION_X;

    applyHeadRotation(targetRotX, targetRotY, targetRotZ, delta);

    // floating animation
    const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    headRef.current.position.y = floatY + HEAD_POSITION_Y;

    const cursorPos = new Vector3(mousePosition.x, mousePosition.y * 0.4, 0);

    const baseZoom = showOptions
      ? VISIBLE_OPTIONS_CAMERA_ZOOM
      : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation ? CAMERA_ZOOM_ON_TAP : 0;
    const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
    const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    const cameraShakeStrength =
      Math.sin(clock.getElapsedTime() * 50) *
      Math.min(1, 0.01 * getTotalTapMultiplier());

    const cameraShakeX = cameraZoomAnimation ? cameraShakeStrength : 0;
    const cameraShakeY = cameraZoomAnimation ? cameraShakeStrength : 0;

    if (shouldFollowCursor && !isTransitioning && !isObjectView()) {
      cameraControlsRef.current?.setLookAt(
        0,
        CAMERA_HEIGHT,
        baseZoom + zoomOffset,
        cursorPos.x + handCamSwayX + cameraShakeX,
        cursorPos.y + CAMERA_Y_POSITION + handCamSwayY + cameraShakeY,
        cursorPos.z,
        true,
      );
    }
  };

  const applyHeadRotation = (
    rotX: number,
    rotY: number,
    rotZ: number,
    delta: number,
  ) => {
    headRef.current.rotation.y = MathUtils.lerp(
      headRef.current.rotation.y,
      rotY,
      1 - Math.exp(-4 * delta),
    );
    headRef.current.rotation.x = MathUtils.lerp(
      headRef.current.rotation.x,
      rotX,
      1 - Math.exp(-4 * delta),
    );
    headRef.current.rotation.z = MathUtils.lerp(
      headRef.current.rotation.z,
      rotZ,
      1 - Math.exp(-3 * delta),
    );
  };

  const applyMobileHeadPosition = (
    clock: Clock,
    delta: number,
    accelX: number,
    accelY: number,
    orientGamma: number,
    orientBeta: number,
  ) => {
    const shakeStrength = 0.6;
    const shakeOffsetX = MathUtils.clamp(accelX * shakeStrength, -0.4, 0.4);
    const shakeOffsetY = MathUtils.clamp(accelY * shakeStrength, -0.4, 0.4);

    const floatY = HEAD_POSITION_Y;

    headRef.current.position.x = MathUtils.lerp(
      headRef.current.position.x,
      shakeOffsetX + orientGamma * 0.2,
      1 - Math.exp(-2 * delta),
    );
    headRef.current.position.y = MathUtils.lerp(
      headRef.current.position.y,
      floatY + shakeOffsetY + orientBeta * 0.2,
      1 - Math.exp(-2 * delta),
    );
  };

  const handleIdleAnimation = (clock: Clock, delta: number) => {
    const animationProgress =
      (Date.now() - idleAnimationStart) / IDLE_ANIMATION_DURATION;
    const easedProgress = 1 - Math.pow(1 - animationProgress, 3); // Ease out

    if (idleAnimation === "spin") {
      if (animationProgress < 0.01 && headRef.current) {
        headRef.current.rotation.set(0, 0, 0);
      }

      const spinPhase = animationProgress * 3;

      if (spinPhase < 1) {
        const buildUpProgress = spinPhase;
        const buildUpEase = 1 - Math.pow(1 - buildUpProgress, 2);
        const rotationY = buildUpEase * Math.PI * 2 * 0.3;

        headRef.current.rotation.y = rotationY;
      } else if (spinPhase < 2) {
        const spinProgress = spinPhase - 1;
        const spinEase = Math.sin(spinProgress * Math.PI);
        const fullRotation = Math.PI * 2 * 1.5;

        headRef.current.rotation.y =
          Math.PI * 2 * 0.3 + fullRotation * spinEase;
      } else {
        const settleProgress = spinPhase - 2;
        const settleEase = 1 - Math.pow(settleProgress, 2);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-8 * delta),
        );
      }
    } else if (idleAnimation === "tilt") {
      if (animationProgress < 0.01 && headRef.current) {
        headRef.current.rotation.set(0, 0, 0);
      }
      const tiltPhase = animationProgress * 4;

      if (tiltPhase < 1) {
        const lookLeftProgress = tiltPhase;
        const lookLeftEase = Math.sin(lookLeftProgress * Math.PI * 0.5);

        headRef.current.rotation.y = -lookLeftEase * 0.8;
        headRef.current.rotation.x = lookLeftEase * 0.2;
      } else if (tiltPhase < 2) {
        const lookUpProgress = tiltPhase - 1;
        const lookUpEase = Math.sin(lookUpProgress * Math.PI * 0.5);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-4 * delta),
        );
        headRef.current.rotation.x = lookUpEase * 0.6;
      } else if (tiltPhase < 3) {
        const lookRightProgress = tiltPhase - 2;
        const lookRightEase = Math.sin(lookRightProgress * Math.PI * 0.5);

        headRef.current.rotation.y = lookRightEase * 0.8;
        headRef.current.rotation.x = MathUtils.lerp(
          headRef.current.rotation.x,
          0.2,
          1 - Math.exp(-4 * delta),
        );
      } else {
        const returnProgress = tiltPhase - 3;
        const returnEase = 1 - Math.pow(returnProgress, 2);

        headRef.current.rotation.y = MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          1 - Math.exp(-6 * delta),
        );
        headRef.current.rotation.x = MathUtils.lerp(
          headRef.current.rotation.x,
          0,
          1 - Math.exp(-6 * delta),
        );
      }
    }
  };

  const animateEyes = (delta: number) => {
    if (!leftEyeRef.current || !rightEyeRef.current || !eyeGeometries.current) {
      return;
    }

    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;

    if (!leftEye.geometry.getAttribute("position")) {
      return;
    }

    let targetGeometry = eyeGeometries.current.baseGeometry;
    let eyeOffsetY = 0;

    if (blinking) {
      targetGeometry = eyeGeometries.current.blinkGeometry;
      eyeOffsetY = 0;
    } else {
      switch (emotionState) {
        case "happy":
          targetGeometry = eyeGeometries.current.madGeometry;
          eyeOffsetY = 0.05;
          break;
        case "mad":
          targetGeometry = eyeGeometries.current.happyGeometry;
          eyeOffsetY = -0.03;
          break;
        case "dizzy":
          targetGeometry = eyeGeometries.current.dizzyGeometry;
          eyeOffsetY = -0.02;
          break;
        case "thinking":
          targetGeometry = eyeGeometries.current.baseGeometry;
          eyeOffsetY = 0.03;
          break;
        case "suspicious":
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

    if (!targetGeometry.getAttribute("position")) {
      return;
    }

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
        0.1,
      );
    }

    // Apply the morphed positions to both eyes
    leftEye.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(newPositions, 3),
    );
    rightEye.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(newPositions, 3),
    );

    leftEye.geometry.computeVertexNormals();
    rightEye.geometry.computeVertexNormals();

    const currentLeftY = leftEye.position.y;
    const currentRightY = rightEye.position.y;
    const baseY = 0;

    leftEye.position.y = MathUtils.lerp(currentLeftY, baseY + eyeOffsetY, 0.2);
    rightEye.position.y = MathUtils.lerp(
      currentRightY,
      baseY + eyeOffsetY,
      0.2,
    );
  };

  const createParticles = useCallback(
    (x: number, y: number, z: number, count = 15) => {
      if ((window as any).createTapParticles) {
        (window as any).createTapParticles(x, y, z, count);
      }
    },
    [],
  );

  const onClick = (e: any) => {
    e.stopPropagation(); // TODO: check why this stops double click bug

    // trigger particles
    if (showAutoTapParticles) {
      const COUNTER_POS: [number, number, number] = [0, 0, 0];
      createParticles(COUNTER_POS[0], COUNTER_POS[1], COUNTER_POS[2]);
    }

    // trigger bob bounce
    api.start({
      scale: [1.35, 1.15, 1.35],
      config: { tension: 420, friction: 10 },
    });

    api.start({
      scale: [1.2, 1.2, 1.2],
      config: { tension: 300, friction: 12 },
      delay: 140,
      reset: true,
    });

    // trigger camera zoom
    setCameraZoomAnimation(true);
    onCameraZoomAnimation?.(true);
    setTimeout(() => {
      setCameraZoomAnimation(false);
      onCameraZoomAnimation?.(false);
    }, 100);

    // trigger emotions
    onHeadClick();

    // get current tap sound config & play it
    const selectedTapEffect = tapEffects.find((u) => u.enabled);
    const tapEffectId = selectedTapEffect?.id || "tap_effect_default";
    const soundConfig = resolveTapSoundForEffect(
      tapEffectId,
      audioSelections.tapEffectAudioId,
    );
    playTapSound(soundConfig.id);

    addManualTap();
  };

  // TODO: fix space bar taps + mention in onboarding
  // useKeyPress(" ", () => onHeadClick());

  const selectedBlobForm = useMemo(
    () => getSelectedBlobForm(blobForms),
    [blobForms],
  );
  const blobFormType = useMemo(
    () => getBlobFormType(selectedBlobForm.id),
    [selectedBlobForm.id],
  );

  const calculateCostumePosition = useCallback(
    (
      basePosition: [number, number, number],
      itemType: "hat" | "accessory",
      itemId?: string,
    ): [number, number, number] => {
      const [baseX, baseY, baseZ] = basePosition;
      const { parameters } = selectedBlobForm;

      let adjustedX = baseX;
      let adjustedY = baseY;
      let adjustedZ = baseZ;

      if (blobFormType === "sphere") {
        const radiusDiff = (parameters.sphereRadius || 1) - 1;
        if (itemType === "hat") {
          adjustedY += radiusDiff;
        } else if (itemType === "accessory" && itemId) {
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += radiusDiff * (axisConfig.yMultiplier || 0.5);
            }
            if (axisConfig.z) {
              adjustedZ +=
                MathUtils.clamp(radiusDiff, -0.4, 5) *
                1.8 *
                (axisConfig.zMultiplier || 0.3);
            }
          }
        }
      } else if (blobFormType === "cube") {
        const heightDiff = (parameters.cubeHeight || 1.75) - 1.75;
        const depthDiff = (parameters.cubeDepth || 1.65) - 1.65;

        if (itemType === "hat") {
          adjustedY += heightDiff * 0.5;
        } else if (itemType === "accessory" && itemId) {
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += heightDiff * (axisConfig.yMultiplier || 0.5);
            }
            if (axisConfig.z) {
              adjustedZ += depthDiff * (axisConfig.zMultiplier || 0.3);
            }
          }
        }
      } else if (blobFormType === "pill") {
        const heightDiff = (parameters.pillHeight || 1.6) - 1.6; //
        const radiusDiff =
          ((parameters.pillRadiusTop || 0.8) +
            (parameters.pillRadiusBottom || 0.8)) /
            2 -
          0.8;

        if (itemType === "hat") {
          adjustedY += heightDiff * 0.5;
        } else if (itemType === "accessory" && itemId) {
          const axisConfig = ACCESSORY_AXIS_CONFIG[itemId];
          if (axisConfig) {
            if (axisConfig.y) {
              adjustedY += heightDiff * (axisConfig.yMultiplier || 0.5);
            }
            if (axisConfig.z) {
              adjustedZ += radiusDiff * (axisConfig.zMultiplier || 0.3);
            }
          }
        }
      }

      return [adjustedX, adjustedY, adjustedZ];
    },
    [selectedBlobForm, blobFormType],
  );

  const calculateEyePosition = useCallback(
    (basePosition: [number, number, number]): [number, number, number] => {
      const [baseX, baseY, baseZ] = basePosition;
      const { parameters } = selectedBlobForm;

      let adjustedX = baseX;
      let adjustedY = baseY;
      let adjustedZ = baseZ;

      if (blobFormType === "sphere") {
        const radiusDiff = (parameters.sphereRadius || 1) - 1;
        adjustedY += radiusDiff * 0.4;
        adjustedZ += radiusDiff * 1.2;
      } else if (blobFormType === "cube") {
        const heightDiff = (parameters.cubeHeight || 1.75) - 1.75;
        const depthDiff = (parameters.cubeDepth || 1.65) - 1.65;
        adjustedY += heightDiff * 0.4;
        adjustedZ += depthDiff * 0.5;
      } else if (blobFormType === "pill") {
        const heightDiff = (parameters.pillHeight || 1.6) - 1.6;
        const radiusDiff =
          ((parameters.pillRadiusTop || 0.8) +
            (parameters.pillRadiusBottom || 0.8)) /
            2 -
          0.8;
        adjustedY += heightDiff * 0.3;
        adjustedZ += radiusDiff * 0.5;
      }

      return [adjustedX, adjustedY, adjustedZ];
    },
    [selectedBlobForm, blobFormType],
  );

  const renderBobItems = () => {
    const previewItems = bobItems.filter(
      (b) => b.preview && b.type === previewMode,
    );

    const enabledItems = bobItems.filter(
      (b) => b.enabled && b.type !== previewMode,
    );

    const allEquippedItems = previewMode
      ? [...previewItems, ...enabledItems]
      : enabledItems;

    const detachedItems = allEquippedItems.filter((i) => i.detached);
    const attachedItems = allEquippedItems.filter((i) => !i.detached);

    const attachedModels = attachedItems.map((item) => {
      if (item.id === "krustyKrabHat")
        return (
          <KrustyKrabHat
            key={item.id}
            position={calculateCostumePosition([0, 0.9, 0], "hat")}
            scale={[0.006, 0.006, 0.006]}
            outlineColor={outlineColor}
            preview={!item.enabled && !!item.preview}
          />
        );
      if (item.id === "chickenLittleGlasses")
        return (
          <RoundGlasses
            key={item.id}
            position={calculateCostumePosition(
              [0, 0.1, 0.7],
              "accessory",
              item.id,
            )}
            scale={[1.6, 1.6, 1.6]}
            preview={!item.enabled && !!item.preview}
          />
        );
      if (item.id === "builderHelmet")
        return (
          <BuilderHelmet
            key={item.id}
            position={calculateCostumePosition([0, 0.75, 0], "hat")}
            scale={[1.22, 1.25, 1.25]}
            preview={!item.enabled && !!item.preview}
          />
        );
      if (item.id === "afroHair")
        return (
          <AfroHair
            key={item.id}
            position={calculateCostumePosition([0, -0.7, -0.05], "hat")}
            rotation={[(Math.PI / 2) * 0.15, 0, 0]}
            scale={[0.9, 0.9, 0.9]}
            preview={!item.enabled && !!item.preview}
          />
        );
      if (item.id === "blackCap")
        return (
          <BlackCap
            key={item.id}
            position={calculateCostumePosition([0, 0.45, 0], "hat")}
            scale={[2, 2, 2]}
            outlineColor={outlineColor}
            rotation={[0, -Math.PI / 2, 0]}
            preview={!item.enabled && !!item.preview}
          />
        );
      if (item.id === "astronautHelmet")
        return (
          <AstronautHelmet
            key={item.id}
            position={calculateCostumePosition([0, 0, 0], "hat")}
            scale={[1.05, 1.05, 1.05]}
            outlineColor={outlineColor}
            rotation={[0, -Math.PI / 2, 0]}
            preview={!item.enabled && !!item.preview}
          />
        );
      return null;
    });

    const detachedModels = detachedItems.map((item) => {
      if (item.id === "simsPlumbob") {
        //TODO: move to plumbob and animate with easing + scale changes
        const emotionColor = match(emotionState)
          .with("mad", () => "#ce1111")
          .with("dizzy", () => "#d3a937")
          .with("normal", () => "#b7e822")
          .otherwise(() => undefined);

        return (
          <SimsPlumbob
            key={item.id}
            position={[0, 3.5, 0]}
            scale={[0.4, 0.4, 0.4]}
            color={emotionColor}
            preview={!item.enabled && !!item.preview}
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
      <RigidBody type="fixed" colliders={false}>
        <BallCollider args={[1]} />
        <a.group
          ref={headRef}
          onClick={onClick}
          onPointerEnter={() => {
            setHovering(true);
          }}
          onPointerLeave={() => {
            setHovering(false);
            setPointerDown(false);
          }}
          onPointerDown={() => {
            setPointerDown(true);
          }}
          onPointerUp={() => {
            setPointerDown(false);
          }}
          castShadow
          scale={spring.scale as any}
          rotation={[0, Math.PI, 0]}
          // position={[0, 2, 0]}
        >
          <BlobForm
            formType={blobFormType}
            parameters={selectedBlobForm.parameters}
            blobColor={blobColor || "#ffffff"}
            outlineColor={outlineColor || "#000000"}
          />

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

          <group ref={starsRef} visible={emotionState === "dizzy"}>
            {[...Array(5)].map((_, i) => (
              <Star3D />
            ))}
          </group>
        </a.group>
      </RigidBody>
    </>
  );

  return content;
}
