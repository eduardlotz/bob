import { TropicalBobMotion } from "@/3d-objects/worlds/TropicalWorlds";
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
  Clock,
  Float32BufferAttribute,
  SphereGeometry,
  Quaternion,
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
import { getBobItemSlot, useCoreStore } from "@/store/core/store";
import { useViewStore } from "@/store/viewStore";
import { match } from "ts-pattern";
import { BOB_WEARABLES } from "@/components/bob/wearableRegistry";
import { BobWearables } from "@/components/BobWearables";
import { BlobForm } from "@/components/BlobForm";
import {
  getSelectedBlobForm,
  getBlobFormType,
  getBobEyePosition,
} from "@/types/blobForms";
import { SimsPlumbob } from "@/3d-objects/models/simsPlumbob";
import { useCursor } from "@/hooks/useCursor";
import { useCursorStore } from "@/store/core/cursor";
import { ROUTE_PATHS } from "@/store/config/routes";
import { useAppStore, useMiniGameStore } from "@/store";
import { playTapSound } from "@/utils/soundSystem";
import { resolveTapSoundForEffect } from "@/utils/sound/configs";
import { BallCollider, RigidBody } from "@react-three/rapier";
import { BobSleepZs } from "./BobSleepZs";
import { THEME_CONFIG } from "@/store/config/themes";
import {
  BobIdleAnimation,
  BOB_IDLE_DURATIONS,
  sampleBobIdlePose,
  smoothIdleStep,
} from "./bobIdleMotion";

// TODO: move constants to a shared config file
const HEAD_POSITION_Y = 0;
const MAX_ROTATION_X = 0.9;
const MAX_ROTATION_Y = 0.9;
const MAX_TAP_CAMERA_SHAKE = 0.25;
const CURSOR_POSITION_FACTOR = 2.5;
// Match the preferred gaze with the cursor two-thirds down the screen.
const IDLE_LOOK_DOWN_OFFSET =
  (2 / 3 - 0.5) * CURSOR_POSITION_FACTOR * MAX_ROTATION_Y;

const IDLE_TIMEOUT_MIN = 10000;
const IDLE_ANIMATION_GAP = 15000;
const IDLE_ANIMATIONS: BobIdleAnimation[] = ["spin", "look", "bounce", "sleep"];
const NEUTRAL_IDLE_ROTATION = new Quaternion();

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
    getTotalTapMultiplier,
    graphicPreferences,
  } = useCoreStore();
  const { currentRoute } = useAppStore();

  const showAutoTapParticles =
    currentRoute === ROUTE_PATHS.HOME && graphicPreferences.effectsEnabled;
  const reducedTapMotion = graphicPreferences.reducedTapMotion;
  const ditheringEnabled = graphicPreferences.ditheringEnabled;

  const activeTheme =
    previewMode === "theme" ? themes.find((t) => t.preview) : currentTheme;

  const blobColor = activeTheme?.blobColor;
  const outlineColor = activeTheme?.outlineColor;
  const eyeColor = activeTheme?.eyeColor;
  const headRef = useRef<Group>(null!);
  const idleMotionRef = useRef<Group>(null!);
  const idlePoseRef = useRef([0, 0, 0, 0, 1]);
  const idleEyeOffsetRef = useRef(0);
  const idleBlinkRef = useRef(false);
  const sleepRef = useRef({ seconds: 0, active: false });
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
  const [idleAnimation, setIdleAnimation] = useState<BobIdleAnimation | "none">(
    "none",
  );
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);
  const idleAnimationStartRef = useRef(0);
  const lastBobTapRef = useRef(Date.now());
  const lastIdleAnimationTimeRef = useRef(0);
  const firstIdleAfterTapRef = useRef(true);
  const idleAnimationRef = useRef<BobIdleAnimation | "none">("none");
  const idleAnimationTimeoutRef = useRef<number | undefined>();

  const { orientation, acceleration } = useDeviceOrientation();

  const {
    currentView,
    isDefaultView,
    isNavigationView,
    viewMode,
    isTransitioning,
    isObjectView,
  } = useViewStore();

  const isShopView = currentView === "phone:shop";
  const restingLookPitch =
    (isMobile
      ? -0.5
      : IDLE_LOOK_DOWN_OFFSET -
        (showOptions ? 0 : CAMERA_Y_POSITION) * MAX_ROTATION_Y) +
    (isShopView ? IDLE_LOOK_DOWN_OFFSET : 0);

  const shouldFollowCursor =
    viewMode === "fixed" &&
    !isMobile &&
    (isDefaultView() || isNavigationView());

  const mousePosition = useCursor({
    condition: () => shouldFollowCursor,
    positionFactor: CURSOR_POSITION_FACTOR,
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

  useEffect(() => {
    idleAnimationRef.current = idleAnimation;
  }, [idleAnimation]);

  const cancelIdleOnBobTap = useCallback(() => {
    lastBobTapRef.current = Date.now();
    lastIdleAnimationTimeRef.current = 0;
    firstIdleAfterTapRef.current = true;
    idleAnimationRef.current = "none";
    sleepRef.current.active = false;
    setIdleAnimation("none");
    if (idleAnimationTimeoutRef.current !== undefined) {
      clearTimeout(idleAnimationTimeoutRef.current);
      idleAnimationTimeoutRef.current = undefined;
    }
  }, []);

  // Only Bob taps reset inactivity. Each idle finishes on its own, then rests.
  useEffect(() => {
    const checkIdleAnimation = () => {
      const now = Date.now();
      if (
        now - lastBobTapRef.current >= IDLE_TIMEOUT_MIN &&
        idleAnimationRef.current === "none" &&
        now - lastIdleAnimationTimeRef.current >= IDLE_ANIMATION_GAP
      ) {
        const nextAnimation = firstIdleAfterTapRef.current
          ? "look"
          : IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
        firstIdleAfterTapRef.current = false;

        idleAnimationRef.current = nextAnimation;
        setIdleAnimation(nextAnimation);
        idleAnimationStartRef.current = now;

        idleAnimationTimeoutRef.current = window.setTimeout(() => {
          idleAnimationRef.current = "none";
          sleepRef.current.active = false;
          setIdleAnimation("none");
          lastIdleAnimationTimeRef.current = Date.now();
          idleAnimationTimeoutRef.current = undefined;
        }, BOB_IDLE_DURATIONS[nextAnimation]);
      }
    };

    const idleCheckInterval = window.setInterval(checkIdleAnimation, 1000);
    return () => {
      clearInterval(idleCheckInterval);
      if (idleAnimationTimeoutRef.current !== undefined) {
        clearTimeout(idleAnimationTimeoutRef.current);
      }
    };
  }, []);

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
    const isBobIdle = Date.now() - lastBobTapRef.current >= IDLE_TIMEOUT_MIN;

    // Keep camera motion independent of Bob's gaze and personality animations.
    if (isMobile) {
      handleMobileMovement(
        clock,
        delta,
        showOptions,
        orientation,
        acceleration,
        permissionGranted,
        !isBobIdle,
      );
    } else {
      handleDesktopMovement(clock, delta, showOptions, !isBobIdle);
    }

    if (isBobIdle) {
      applyHeadRotation(restingLookPitch, 0, 0, delta);
      headRef.current.position.x = MathUtils.lerp(
        headRef.current.position.x,
        0,
        1 - Math.exp(-4 * delta),
      );
      headRef.current.position.y =
        HEAD_POSITION_Y + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }

    if (idleAnimation !== "none" && idleAnimationRef.current !== "none") {
      handleIdleAnimation();
    } else {
      idleEyeOffsetRef.current = 0;
      idleBlinkRef.current = false;
      sleepRef.current.active = false;
      if (idleMotionRef.current) {
        const settle = 1 - Math.exp(-14 * delta);
        idleMotionRef.current.position.y = MathUtils.lerp(
          idleMotionRef.current.position.y,
          0,
          settle,
        );
        // Use the shortest rotation back when a tap interrupts a full turn.
        idleMotionRef.current.quaternion.slerp(NEUTRAL_IDLE_ROTATION, settle);
        const scale = idleMotionRef.current.scale;
        scale.set(
          MathUtils.lerp(scale.x, 1, settle),
          MathUtils.lerp(scale.y, 1, settle),
          MathUtils.lerp(scale.z, 1, settle),
        );
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
    followHead: boolean,
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

      if (followHead) {
        applyHeadRotation(
          isShopView ? restingLookPitch : targetRotY,
          targetRotX,
          0,
          delta,
        );
        applyMobileHeadPosition(
          clock,
          delta,
          accelX,
          accelY,
          orientGamma,
          orientBeta,
        );
      }

      const baseZoom = showOptions
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
      const zoomOffset =
        !reducedTapMotion && cameraZoomAnimation
          ? Math.sin(clock.getElapsedTime() * 20) * 0.5
          : 0;
      const lookDirX = -targetRotX;
      const lookDirY = targetRotY;
      const lookDirZ = targetRotZ;
      const lookDirLength = Math.hypot(lookDirX, lookDirY, lookDirZ) || 1;
      const normalizedLookDirX = lookDirX / lookDirLength;
      const normalizedLookDirY = lookDirY / lookDirLength;
      const normalizedLookDirZ = lookDirZ / lookDirLength;
      const cameraX = 0;
      const cameraY = CAMERA_HEIGHT;
      const cameraZ = baseZoom + zoomOffset;
      const targetX = cameraX + normalizedLookDirX;
      const targetY = cameraY + normalizedLookDirY;
      const targetZ = cameraZ + normalizedLookDirZ;

      if (shouldFollowCursor) {
        // Keep transition smoothing enabled so cursor-follow matches regular camera motion.
        cameraControlsRef.current?.setLookAt(
          cameraX,
          cameraY,
          cameraZ,
          targetX,
          targetY,
          targetZ,
          true,
        );
      }
    } else {
      if (followHead) {
        applyHeadRotation(isShopView ? restingLookPitch : -0.5, 0, 0, delta);
        const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
        headRef.current.position.y = floatY + HEAD_POSITION_Y;
      }

      const baseZoom = showOptions
        ? VISIBLE_OPTIONS_CAMERA_ZOOM
        : HIDDEN_OPTIONS_CAMERA_ZOOM;
      const zoomOffset =
        !reducedTapMotion && cameraZoomAnimation ? CAMERA_ZOOM_ON_TAP : 0;
      const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
      const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
      const cameraShakeStrength =
        Math.sin(clock.getElapsedTime() * 50) *
        Math.min(MAX_TAP_CAMERA_SHAKE, 0.01 * getTotalTapMultiplier());

      const cameraShakeX =
        !reducedTapMotion && cameraZoomAnimation ? cameraShakeStrength : 0;
      const cameraShakeY =
        !reducedTapMotion && cameraZoomAnimation ? cameraShakeStrength : 0;

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
    followHead: boolean,
  ) => {
    const cursorX = mousePosition.current.x;
    const cursorY = mousePosition.current.y;
    const targetRotY = cursorX * MAX_ROTATION_X;
    const targetRotX = isShopView
      ? restingLookPitch
      : (-cursorY - (showOptions ? 0 : CAMERA_Y_POSITION)) * MAX_ROTATION_Y;
    const targetRotZ = -cursorX * MAX_ROTATION_X;

    if (followHead) {
      applyHeadRotation(targetRotX, targetRotY, targetRotZ, delta);
      const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      headRef.current.position.y = floatY + HEAD_POSITION_Y;
    }

    const baseZoom = showOptions
      ? VISIBLE_OPTIONS_CAMERA_ZOOM
      : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset =
      !reducedTapMotion && cameraZoomAnimation ? CAMERA_ZOOM_ON_TAP : 0;
    const handCamSwayX = Math.sin(clock.getElapsedTime() * 1) * 0.03;
    const handCamSwayY = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    const cameraShakeStrength =
      Math.sin(clock.getElapsedTime() * 50) *
      Math.min(MAX_TAP_CAMERA_SHAKE, 0.01 * getTotalTapMultiplier());

    const cameraShakeX =
      !reducedTapMotion && cameraZoomAnimation ? cameraShakeStrength : 0;
    const cameraShakeY =
      !reducedTapMotion && cameraZoomAnimation ? cameraShakeStrength : 0;

    if (shouldFollowCursor && !isTransitioning && !isObjectView()) {
      cameraControlsRef.current?.setLookAt(
        0,
        CAMERA_HEIGHT,
        baseZoom + zoomOffset,
        cursorX + handCamSwayX + cameraShakeX,
        cursorY * 0.4 + CAMERA_Y_POSITION + handCamSwayY + cameraShakeY,
        0,
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

  const handleIdleAnimation = () => {
    if (idleAnimation === "none" || !idleMotionRef.current) return;
    const seconds = Math.max(
      0,
      (Date.now() - idleAnimationStartRef.current) / 1000,
    );
    idleBlinkRef.current = false;
    idleEyeOffsetRef.current = 0;
    sleepRef.current.active = idleAnimation === "sleep";
    sleepRef.current.seconds = seconds;

    // Animate relative to the centered gaze, including Bob's normal starting tilt.
    const pose = idlePoseRef.current;
    sampleBobIdlePose(idleAnimation, seconds, pose);
    idleMotionRef.current.rotation.set(pose[0], pose[1], pose[2]);
    idleMotionRef.current.position.y = pose[3];
    // Compensate width and depth to retain volume when squashing/stretching.
    const width = 1 / Math.sqrt(pose[4]);
    idleMotionRef.current.scale.set(width, pose[4], width);

    if (idleAnimation === "look") {
      // Eyes glance toward the next point just before the body follows.
      const left =
        smoothIdleStep((seconds - 0.3) / 0.2) *
        (1 - smoothIdleStep((seconds - 1.45) / 0.25));
      const right =
        smoothIdleStep((seconds - 1.55) / 0.25) *
        (1 - smoothIdleStep((seconds - 2.95) / 0.3));
      idleEyeOffsetRef.current = -left * 0.035 + right * 0.035;
      idleBlinkRef.current = seconds > 1.5 && seconds < 1.65;
    } else if (idleAnimation === "sleep") {
      idleBlinkRef.current = seconds > 0.55 && seconds < 5.15;
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

    if (blinking || idleBlinkRef.current) {
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

    const rightPositions = rightEye.geometry.getAttribute("position").array;
    const eyeBlend = 1 - Math.exp(-8 * delta);
    for (let i = 0; i < currentPositions.length; i++) {
      const position = MathUtils.lerp(
        currentPositions[i],
        targetPositions[i],
        eyeBlend,
      );
      currentPositions[i] = position;
      rightPositions[i] = position;
    }
    leftEye.geometry.getAttribute("position").needsUpdate = true;
    rightEye.geometry.getAttribute("position").needsUpdate = true;

    leftEye.geometry.computeVertexNormals();
    rightEye.geometry.computeVertexNormals();

    const eyePositionBlend = 1 - Math.exp(-12 * delta);
    leftEye.position.x = MathUtils.lerp(
      leftEye.position.x,
      -0.45 + idleEyeOffsetRef.current,
      eyePositionBlend,
    );
    rightEye.position.x = MathUtils.lerp(
      rightEye.position.x,
      0.45 + idleEyeOffsetRef.current,
      eyePositionBlend,
    );
    const closedScale =
      sleepRef.current.active && idleBlinkRef.current ? 0.55 : 1;
    leftEye.scale.y = MathUtils.lerp(
      leftEye.scale.y,
      closedScale,
      eyePositionBlend,
    );
    rightEye.scale.y = MathUtils.lerp(
      rightEye.scale.y,
      closedScale,
      eyePositionBlend,
    );

    const currentLeftY = leftEye.position.y;
    const currentRightY = rightEye.position.y;
    const baseY = 0;

    leftEye.position.y = MathUtils.lerp(
      currentLeftY,
      baseY + eyeOffsetY,
      eyePositionBlend,
    );
    rightEye.position.y = MathUtils.lerp(
      currentRightY,
      baseY + eyeOffsetY,
      eyePositionBlend,
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
    cancelIdleOnBobTap();

    // trigger particles
    if (showAutoTapParticles) {
      const COUNTER_POS: [number, number, number] = [0, 0, 0];
      createParticles(COUNTER_POS[0], COUNTER_POS[1], COUNTER_POS[2]);
    }

    if (!reducedTapMotion) {
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
    }

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

  const calculateEyePosition = (position: [number, number, number]) =>
    getBobEyePosition(position, blobFormType, selectedBlobForm.parameters);

  const renderBobItems = () => {
    const previewItems = bobItems.filter(
      (b) => b.preview && getBobItemSlot(b) === previewMode,
    );

    const enabledItems = bobItems.filter(
      (b) => b.enabled && getBobItemSlot(b) !== previewMode,
    );

    const allEquippedItems = previewMode
      ? [...previewItems, ...enabledItems]
      : enabledItems;

    const bobOffset = allEquippedItems.reduce<[number, number, number]>(
      (offset, item) => {
        const shift = !item.detached && BOB_WEARABLES[item.id]?.bobOffset;
        return shift
          ? [offset[0] + shift[0], offset[1] + shift[1], offset[2] + shift[2]]
          : offset;
      },
      [0, 0, 0],
    );
    const detachedItems = allEquippedItems.filter((i) => i.detached);

    const attachedModels = (
      <BobWearables
        items={allEquippedItems}
        blobFormType={blobFormType}
        parameters={selectedBlobForm.parameters}
        outlineColor={outlineColor}
      />
    );

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
      bobOffset,
      detached: detachedModels,
    };
  };

  const {
    attached: attachedItems,
    detached: detachedItems,
    bobOffset,
  } = renderBobItems();

  const content = (
    <>
      {detachedItems}
      <BobSleepZs
        sleep={sleepRef}
        head={headRef}
        height={
          (blobFormType === "cube"
            ? (selectedBlobForm.parameters.cubeHeight || 1.75) / 2
            : selectedBlobForm.parameters.sphereRadius || 1) *
            1.2 +
          0.65
        }
        color={THEME_CONFIG.DEFAULT.colors.secondary}
      />
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
          receiveShadow
          scale={spring.scale as any}
          rotation={[0, Math.PI, 0]}
          // position={[0, 2, 0]}
        >
          <group ref={idleMotionRef} name="bob-idle-motion">
            <BlobForm
              formType={blobFormType}
              parameters={selectedBlobForm.parameters}
              blobColor={blobColor || "#ffffff"}
              outlineColor={ditheringEnabled ? outlineColor : undefined}
              // outlineColor={outlineColor}
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
                <Star3D key={`dizzy-star-${i}`} />
              ))}
            </group>
          </group>
        </a.group>
      </RigidBody>
    </>
  );

  return <group position={bobOffset}><TropicalBobMotion>{content}</TropicalBobMotion></group>;
}
