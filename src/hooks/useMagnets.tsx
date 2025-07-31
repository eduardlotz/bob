import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// example use:
// const magnetInfluence = useMagnetInfluence(basePosition);
//
// <motion.div
//   variants={animateProps}
//   animate={{
//     ...animateProps,
//     x: (animateProps.x || 0) + magnetInfluence.x,
//     y: (animateProps.y || 0) + magnetInfluence.y,
//   }}
// >
//   {children}
// </motion.div>

const CAMERA_FOLLOW_OFFSET = 1.0;
const CAMERA_Y_POSITION = 2.0;
const VISIBLE_OPTIONS_CAMERA_ZOOM = 5.0;
const MAX_INFLUENCE = 0.4;
const LERP_FACTOR = 0.1;
const INFLUENCE_RADIUS = 2.0; // Distance at which influence drops to zero

// Custom hook for mouse tracking
const useMouseTracking = (): {
  mousePositionRef: React.MutableRefObject<{ x: number; y: number }>;
  isMobile: boolean;
} => {
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMobileRef = useRef<boolean>(
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );

  const updateMousePosition = useCallback((event: MouseEvent) => {
    mousePositionRef.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -((event.clientY / window.innerHeight) * 2 - 1),
    };
  }, []);

  // Set up mouse tracking
  useEffect(() => {
    if (isMobileRef.current) {
      // Center position for mobile
      mousePositionRef.current = { x: 0, y: 0 };
      return;
    }

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [updateMousePosition]);

  return { mousePositionRef, isMobile: isMobileRef.current };
};

// Main component logic
const { mousePositionRef, isMobile } = useMouseTracking();
const optionRef = useRef<THREE.Object3D>(null);
const cameraControlsRef = useRef<any>(null); // Replace 'any' with your camera controls type
const initialPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
const currentPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());

// Reusable vectors to avoid garbage collection - must be at component level
const cursorVec3 = useMemo(() => new THREE.Vector3(), []);
const tempVec3 = useMemo(() => new THREE.Vector3(), []);

useFrame(() => {
  if (!optionRef.current || isMobile) {
    // On mobile, keep at initial position
    if (optionRef.current) {
      optionRef.current.position.copy(initialPositionRef.current);
    }
    return;
  }

  const mousePos = mousePositionRef.current;
  const basePos = initialPositionRef.current;

  // Update cursor position in 3D space
  cursorVec3.set(
    mousePos.x * CAMERA_FOLLOW_OFFSET,
    mousePos.y * CAMERA_FOLLOW_OFFSET,
    0
  );

  // Calculate distance and influence
  const distanceToCursor = basePos.distanceTo(cursorVec3);
  const normalizedDistance = Math.min(distanceToCursor / INFLUENCE_RADIUS, 1);
  const influenceFactor = (1 - normalizedDistance) * MAX_INFLUENCE;

  // Calculate target position with magnet effect
  // The key fix: attract TOWARDS cursor, not away from it
  tempVec3.copy(basePos);
  if (influenceFactor > 0) {
    const direction = cursorVec3.clone().sub(basePos).normalize();
    const pullStrength = influenceFactor * 0.3; // Adjust this for stronger/weaker magnet
    tempVec3.add(direction.multiplyScalar(pullStrength));
  }

  // Smooth lerp to target position
  currentPositionRef.current.lerp(tempVec3, LERP_FACTOR);
  optionRef.current.position.copy(currentPositionRef.current);

  // Update camera
  if (cameraControlsRef.current) {
    cameraControlsRef.current.setLookAt(
      0,
      CAMERA_Y_POSITION,
      VISIBLE_OPTIONS_CAMERA_ZOOM,
      mousePos.x * 0.1,
      mousePos.y * 0.1 + CAMERA_Y_POSITION,
      0,
      true
    );
  }
});

export const useMagnetInfluence = (
  basePosition: { x: number; y: number },
  isActive: boolean = true
): { x: number; y: number } => {
  const [influence, setInfluence] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useFrame(() => {
    if (isMobile || !isActive) {
      setInfluence({ x: 0, y: 0 });
      return;
    }

    const mousePos = mousePositionRef.current;
    const distance = Math.sqrt(
      Math.pow(mousePos.x - basePosition.x, 2) +
        Math.pow(mousePos.y - basePosition.y, 2)
    );

    const normalizedDistance = Math.min(distance / INFLUENCE_RADIUS, 1);
    const influenceFactor = (1 - normalizedDistance) * MAX_INFLUENCE;

    if (influenceFactor > 0) {
      const directionX = mousePos.x - basePosition.x;
      const directionY = mousePos.y - basePosition.y;
      const length = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      if (length > 0) {
        setInfluence({
          x: (directionX / length) * influenceFactor * 50, // Adjust multiplier as needed
          y: (directionY / length) * influenceFactor * 50,
        });
      }
    } else {
      setInfluence({ x: 0, y: 0 });
    }
  });

  return influence;
};
