import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMotionValue, useSpring } from "motion/react";

// Utility functions for better validation and performance
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

const safeDistance = (vec1: THREE.Vector3, vec2: THREE.Vector3): number => {
  try {
    const distance = vec1.distanceTo(vec2);
    return isValidNumber(distance) ? distance : 0;
  } catch (error) {
    console.warn("Error calculating distance:", error);
    return 0;
  }
};

// Performance optimization: reuse objects to avoid garbage collection
const tempVector3 = new THREE.Vector3();
const tempVector3_2 = new THREE.Vector3();

/**
 * Magnetic attraction configuration for navigation options
 * Controls how strongly options are attracted to the cursor
 */
export interface MagneticConfig {
  strength: number; // Base magnetic strength (0-1)
  radius: number; // Distance at which magnetic effect starts
  falloff: number; // How quickly the effect drops off with distance
  lerpFactor: number; // Smoothing factor for position updates
  maxDisplacement: number; // Maximum distance an option can move from base position
}

/**
 * Current state of magnetic attraction for an option
 */
export interface MagneticState {
  isAttracted: boolean; // Whether the option is currently being attracted
  attractionStrength: number; // Current strength of attraction (0-1)
  displacement: { x: number; y: number; z: number }; // How far from base position
}

/**
 * Validates and sanitizes magnetic configuration
 */
const validateMagneticConfig = (
  config: Partial<MagneticConfig>
): MagneticConfig => {
  return {
    strength: clamp(
      isValidNumber(config.strength) ? config.strength : 0.8,
      0,
      2
    ),
    radius: clamp(isValidNumber(config.radius) ? config.radius : 2.0, 0.1, 10),
    falloff: clamp(
      isValidNumber(config.falloff) ? config.falloff : 1.5,
      0.1,
      5
    ),
    lerpFactor: clamp(
      isValidNumber(config.lerpFactor) ? config.lerpFactor : 0.15,
      0.01,
      1
    ),
    maxDisplacement: clamp(
      isValidNumber(config.maxDisplacement) ? config.maxDisplacement : 1.0,
      0.1,
      5
    ),
  };
};

/**
 * Default configuration for magnetic attraction
 * Provides a good balance of responsiveness and smoothness
 */
const DEFAULT_CONFIG: MagneticConfig = {
  strength: 0.8,
  radius: 2.0,
  falloff: 1.5,
  lerpFactor: 0.15,
  maxDisplacement: 1.0,
};

/**
 * Custom hook for mouse tracking with improved performance
 * Handles mobile detection and provides normalized mouse coordinates
 */
const useMouseTracking = () => {
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMobileRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize mobile detection once
  useEffect(() => {
    const userAgent = navigator.userAgent || "";
    isMobileRef.current =
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768; // Additional check for small screens
  }, []);

  const updateMousePosition = useCallback((event: MouseEvent) => {
    // Throttle updates to improve performance (60 FPS max)
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 16) return;
    lastUpdateTimeRef.current = now;

    try {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;

      // Validate window dimensions to avoid division by zero
      if (innerWidth <= 0 || innerHeight <= 0) return;

      const normalizedX = clamp((clientX / innerWidth) * 2 - 1, -1, 1);
      const normalizedY = clamp(-((clientY / innerHeight) * 2 - 1), -1, 1);

      mousePositionRef.current = {
        x: normalizedX,
        y: normalizedY,
      };
    } catch (error) {
      console.warn("Error updating mouse position:", error);
    }
  }, []);

  useEffect(() => {
    if (isMobileRef.current) {
      // Center position for mobile
      mousePositionRef.current = { x: 0, y: 0 };
      return;
    }

    // Use passive listener for better performance
    window.addEventListener("mousemove", updateMousePosition, {
      passive: true,
    });
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [updateMousePosition]);

  return { mousePositionRef, isMobile: isMobileRef.current };
};

/**
 * Motion-based magnetic attraction hook
 * Uses Framer Motion springs for smooth, responsive attraction
 *
 * If strength is 0, attraction is disabled (option stays at base position).
 * If falloff is 1, attraction is linear with distance.
 *
 * TODO: Consider supporting dynamic centering for different screen sizes.
 */
export const useMagneticAttraction = (
  basePosition: THREE.Vector3,
  config: Partial<MagneticConfig> = {}
): {
  position: THREE.Vector3;
  state: MagneticState;
  isActive: boolean;
} => {
  const { mousePositionRef, isMobile } = useMouseTracking();

  // Validate and memoize config to prevent unnecessary recalculations
  const validatedConfig = useMemo(
    () => validateMagneticConfig(config),
    [config]
  );

  // Validate base position
  const safeBasePosition = useMemo(() => {
    if (
      !basePosition ||
      !isValidNumber(basePosition.x) ||
      !isValidNumber(basePosition.y) ||
      !isValidNumber(basePosition.z)
    ) {
      console.warn("Invalid base position provided, using origin");
      return new THREE.Vector3(0, 0, 0);
    }
    return basePosition.clone();
  }, [basePosition]);

  const [position, setPosition] = useState(() => safeBasePosition.clone());
  const [state, setState] = useState<MagneticState>({
    isAttracted: false,
    attractionStrength: 0,
    displacement: { x: 0, y: 0, z: 0 },
  });

  // Motion values for smooth spring-based movement with optimized spring config
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = useMemo(
    () => ({
      damping: 100,
      stiffness: 400,
      mass: 1,
    }),
    []
  );

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Performance: Use refs to avoid recreating objects in render loop
  const cursorVec3 = useRef(new THREE.Vector3());
  const targetVec3 = useRef(new THREE.Vector3());
  const displacementVec3 = useRef(new THREE.Vector3());

  useFrame(() => {
    try {
      if (isMobile) {
        // On mobile, keep at base position
        setPosition(safeBasePosition.clone());
        setState({
          isAttracted: false,
          attractionStrength: 0,
          displacement: { x: 0, y: 0, z: 0 },
        });
        return;
      }

      const mousePos = mousePositionRef.current;
      if (
        !mousePos ||
        !isValidNumber(mousePos.x) ||
        !isValidNumber(mousePos.y)
      ) {
        return; // Skip frame if mouse position is invalid
      }

      // Convert normalized mouse position to 3D space
      // Use more accurate scaling based on typical R3F scene dimensions
      const scaleX = clamp(mousePos.x * 8.0, -20, 20); // Increased scale for wider scene
      const scaleY = clamp(mousePos.y * 6.0, -20, 20); // Different Y scale for aspect ratio

      cursorVec3.current.set(scaleX, scaleY, 0);

      // Calculate distance from option's base position to cursor
      const distanceToCursor = safeDistance(
        safeBasePosition,
        cursorVec3.current
      );

      // Check if cursor is within magnetic field radius
      const isWithinField =
        distanceToCursor <= validatedConfig.radius && distanceToCursor > 0;

      let pullDistance = 0;
      let attractionStrength = 0;

      if (isWithinField) {
        // Calculate attraction strength based on distance with falloff
        const normalizedDistance = clamp(
          distanceToCursor / validatedConfig.radius,
          0,
          1
        );
        attractionStrength =
          Math.pow(1 - normalizedDistance, validatedConfig.falloff) *
          validatedConfig.strength;

        // Calculate direction vector safely
        tempVector3.subVectors(cursorVec3.current, safeBasePosition);
        const directionLength = tempVector3.length();

        if (directionLength > 0.001) {
          // Avoid division by very small numbers
          // Normalize direction
          tempVector3.normalize();

          // Calculate pull distance with smooth falloff
          pullDistance = clamp(
            attractionStrength * validatedConfig.maxDisplacement,
            0,
            validatedConfig.maxDisplacement
          );

          // Update motion values for spring-based movement
          x.set(tempVector3.x * pullDistance);
          y.set(tempVector3.y * pullDistance);
        } else {
          x.set(0);
          y.set(0);
        }
      } else {
        // Outside field - return to base position
        x.set(0);
        y.set(0);
        attractionStrength = 0;
      }

      // Use spring values for smooth movement
      const springXValue = springX.get();
      const springYValue = springY.get();

      // Validate spring values
      const safeSpringX = isValidNumber(springXValue) ? springXValue : 0;
      const safeSpringY = isValidNumber(springYValue) ? springYValue : 0;

      // Calculate new position
      tempVector3_2.set(
        safeBasePosition.x + safeSpringX,
        safeBasePosition.y + safeSpringY,
        safeBasePosition.z
      );

      setPosition(tempVector3_2.clone());

      // Calculate displacement for visual feedback
      displacementVec3.current.subVectors(tempVector3_2, safeBasePosition);

      setState({
        isAttracted: isWithinField && attractionStrength > 0.01,
        attractionStrength: clamp(attractionStrength, 0, 1),
        displacement: {
          x: displacementVec3.current.x,
          y: displacementVec3.current.y,
          z: displacementVec3.current.z,
        },
      });
    } catch (error) {
      console.warn("Error in magnetic attraction frame update:", error);
      // Fallback to base position on error
      setPosition(safeBasePosition.clone());
      setState({
        isAttracted: false,
        attractionStrength: 0,
        displacement: { x: 0, y: 0, z: 0 },
      });
    }
  });

  return {
    position,
    state,
    isActive: !isMobile,
  };
};

/**
 * Legacy hook for backward compatibility
 * Provides simple 2D influence values for motion components
 *
 * @deprecated Use useMagneticAttraction for better 3D control
 */
export const useMagnetInfluence = (
  basePosition: { x: number; y: number },
  isActive: boolean = true
): { x: number; y: number } => {
  const [influence, setInfluence] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { mousePositionRef, isMobile } = useMouseTracking();

  // Validate base position
  const safeBasePosition = useMemo(() => {
    return {
      x: isValidNumber(basePosition.x) ? basePosition.x : 0,
      y: isValidNumber(basePosition.y) ? basePosition.y : 0,
    };
  }, [basePosition.x, basePosition.y]);

  useFrame(() => {
    try {
      if (isMobile || !isActive) {
        setInfluence({ x: 0, y: 0 });
        return;
      }

      const mousePos = mousePositionRef.current;
      if (
        !mousePos ||
        !isValidNumber(mousePos.x) ||
        !isValidNumber(mousePos.y)
      ) {
        return;
      }

      // Calculate distance safely
      const deltaX = mousePos.x - safeBasePosition.x;
      const deltaY = mousePos.y - safeBasePosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!isValidNumber(distance) || distance === 0) {
        setInfluence({ x: 0, y: 0 });
        return;
      }

      const normalizedDistance = clamp(distance / 2.0, 0, 1);
      const influenceFactor = (1 - normalizedDistance) * 0.8;

      if (influenceFactor > 0.01) {
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        const influenceX = clamp(directionX * influenceFactor * 50, -100, 100);
        const influenceY = clamp(directionY * influenceFactor * 50, -100, 100);

        setInfluence({
          x: influenceX,
          y: influenceY,
        });
      } else {
        setInfluence({ x: 0, y: 0 });
      }
    } catch (error) {
      console.warn("Error in magnet influence calculation:", error);
      setInfluence({ x: 0, y: 0 });
    }
  });

  return influence;
};
