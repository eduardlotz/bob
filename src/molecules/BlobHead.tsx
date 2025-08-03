import {
  useDeviceOrientation,
  DeviceOrientation,
} from "@/hooks/useDeviceOrientation";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
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
  HIDDEN_OPTIONS_CAMERA_ZOOM,
  VISIBLE_OPTIONS_CAMERA_ZOOM,
} from "./HeadNavigation";
import { CameraControls, Outlines } from "@react-three/drei";
import { calculateAcceleratedRotation } from "@/utils/math";
import { a, useSpring, useSprings } from "@react-spring/three";
import { type RapierRigidBody } from "@react-three/rapier";
import { Star3D } from "@/3d-objects/Star3D";
import { EmotionState } from "@/hooks/useBlobEmotions";
import { useCallback } from "react";

interface TapParticle {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  maxLife: number;
}

// Uses animated meshes instead of Points so we can individually fade each particle
const TapParticles = ({ particles }: { particles: TapParticle[] }) => {
  // Create one spring per particle
  const [springs] = useSprings(
    particles.length,
    (index) => {
      const p = particles[index];
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      return {
        scale: 0.05 + 0.15 * lifeRatio,
        opacity: lifeRatio,
        config: { tension: 60, friction: 10 },
      };
    },
    [particles]
  );

  return (
    <>
      {springs.map((styles, index) => {
        const particle = particles[index];
        return (
          <a.mesh
            key={particle.id}
            position={particle.position}
            scale={styles.scale}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <a.meshBasicMaterial
              color={["white", "grey", "black"][particle.id % 3]}
              transparent
              opacity={styles.opacity}
            />
          </a.mesh>
        );
      })}
    </>
  );
};

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

  // Mad eye geometry (squeezed from bottom)
  const madGeometry = sphereGeometry.clone();
  const madPositions = [];
  const basePositions = sphereGeometry.getAttribute("position").array;

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

  return { baseGeometry, madGeometry, happyGeometry, dizzyGeometry };
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
  const headRef = useRef<Group>(null!);
  const leftEyeRef = useRef<Mesh>(null!);
  const rightEyeRef = useRef<Mesh>(null!);
  const starRef = useRef<Mesh>(null!);

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
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const particleIdCounter = useRef(0);
  const [cameraZoomAnimation, setCameraZoomAnimation] = useState(false);

  // Ref for physics body
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { orientation, acceleration } = useDeviceOrientation();

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

  // Track mouse position for head rotation
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking animation every 4-5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 4000 + Math.random() * 1000);
    return () => clearInterval(blinkInterval);
  }, []);

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
        // Only choose from spin and tilt
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

    // Desktop interaction events
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
        handleDesktopMovement(clock, delta);
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
    const cameraPosition = new Vector3(
      0,
      CAMERA_Y_POSITION,
      baseZoom + zoomOffset
    );
    const target = cameraPosition.clone().add(lookDirection);

    cameraControlsRef.current.setLookAt(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z,
      target.x,
      target.y,
      target.z,
      true
    );
  };

  // Handle desktop mouse movement
  const handleDesktopMovement = (clock: Clock, delta: number) => {
    // Calculate target rotations based on mouse position
    const targetRotY = mousePosition.x * MAX_ROTATION_X;
    const targetRotX = mousePosition.y * MAX_ROTATION_Y;
    const targetRotZ = -mousePosition.x * MAX_ROTATION_X;

    // Apply desktop specific head rotation
    applyHeadRotation(targetRotX, targetRotY, targetRotZ, delta);

    // Apply breathing animation for head position
    const floatY = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    headRef.current.position.y = floatY + HEAD_POSITION_Y;

    // Set camera look-at for desktop
    const cursorPos = new Vector3(
      mousePosition.x * 0.2,
      mousePosition.y * 0.2,
      0
    );

    // Add camera zoom animation on tap
    const baseZoom = showOptions
      ? VISIBLE_OPTIONS_CAMERA_ZOOM
      : HIDDEN_OPTIONS_CAMERA_ZOOM;
    const zoomOffset = cameraZoomAnimation
      ? Math.sin(clock.getElapsedTime() * 20) * 0.5
      : 0;

    cameraControlsRef.current.setLookAt(
      0,
      CAMERA_Y_POSITION,
      baseZoom + zoomOffset,
      cursorPos.x,
      cursorPos.y + 2,
      cursorPos.z,
      true
    );
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

    // Handle blinking first
    if (blinking) {
      // Use a very compressed geometry for blinking
      targetGeometry = eyeGeometries.current.baseGeometry;
    } else {
      // Handle emotion-based eye changes
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
    const numParticles = 50; // Increased particle count
    const newParticles: TapParticle[] = [];

    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles;
      const speed = 0.05 + Math.random() * 0.1; // Reduced speed for smaller spread
      newParticles.push({
        id: particleIdCounter.current++,
        position: [x, y, z],
        velocity: [
          Math.cos(angle) * speed,
          Math.sin(angle) * speed + 0.05, // Reduced upward bias
          (Math.random() - 0.5) * speed,
        ],
        life: 0.8, // Slightly shorter life
        maxLife: 0.8,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Update particles in animation frame
  useFrame((state, delta) => {
    setParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          position: [
            particle.position[0] + particle.velocity[0] * delta * 60,
            particle.position[1] + particle.velocity[1] * delta * 60,
            particle.position[2] + particle.velocity[2] * delta * 60,
          ] as [number, number, number],
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0)
    );
  });

  const onClick = (event: any) => {
    // Stop event propagation to prevent double counting from activity listeners
    event.stopPropagation();

    // Create particles at the counter text position instead of cursor
    const COUNTER_POS: [number, number, number] = [-1, 0.5, -1];
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

    // Only trigger emotion animation, not menu opening
    onHeadClick();
  };

  const onPointerOver = () => {
    document.body.style.cursor = "pointer";
  };

  const onPointerLeave = () => {
    document.body.style.cursor = "auto";
  };

  const content = (
    <>
      <TapParticles particles={particles} />
      <a.group
        ref={headRef}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerLeave={onPointerLeave}
        castShadow
        scale={spring.scale}
        rotation={[0, Math.PI, 0]}
        position={[0, 2, 0]}
      >
        {/* Head */}
        <mesh castShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshToonMaterial color="#ffffff" />
          <Outlines thickness={0.005} color="black" screenspace />
        </mesh>

        {/* Eyes */}
        <group position={[0, 0.2, 0.85]}>
          <mesh ref={leftEyeRef} position={[-0.3, 0, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshToonMaterial color="#000000" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.3, 0, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshToonMaterial color="#000000" />
          </mesh>
        </group>

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
                rotation={[
                  Math.sin(star.spinAngle) * 0.2,
                  Math.cos(star.spinAngle * 0.7) * 0.3,
                  Math.sin(star.spinAngle * 1.3) * 0.1,
                ]}
              >
                <Star3D />
              </group>
            );
          })}
      </a.group>
    </>
  );

  return content;
}
