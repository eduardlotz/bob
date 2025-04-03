import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import { motion } from "motion/react";
import { BlobHead } from "./BlobHead";

//#region constants
export const MOTION_VARIANTS = {
  slideInDown: {
    initial: {
      y: -40,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    animate: {
      y: 0,
      opacity: 1,

      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    exit: {
      y: -40,
      opacity: 0,

      transition: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
  },
  slideUp: {
    initial: {
      y: 20,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        type: "spring",
        duration: 0.8,
        bounce: 0.3,
        layout: {
          type: "spring",
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
        type: "spring",
        duration: 0.5,
        bounce: 0.3,
        layout: {
          type: "spring",
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
        type: "spring",
        duration: 0.6,
        bounce: 0.3,
        delay: custom * 0.02,
        layout: {
          type: "spring",
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
      transition: { type: "spring", duration: 0.4, bounce: 0.4 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { type: "spring", duration: 0.4, bounce: 0.4 },
    },
    animate: (custom?: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
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
      // filter: "blur(6px)",
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      // filter: "blur(6px)",
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    hover: {
      scale: 1.05,
      transition: { type: "spring", duration: 0.3, bounce: 0.2 },
    },
    // animate: {
    //   scale: 1,
    //   opacity: 1,
    //   // filter: "blur(0px)",
    //   transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    // },
    animate: (custom?: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        duration: 0.6,
        bounce: 0.4,
        delay: custom ? custom * 0.05 : 0,
      },
    }),
  },
};
export const LAYOUT_TRANSITIONS = {
  quick: {
    layout: {
      type: "spring",
      duration: 0.2,
      bounce: 0.4,
    },
  },
};

// Navigation options
const NAV_OPTIONS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Über mich", href: "#" },
  { label: "Kreatives", href: "#" },
  { label: "Technisches", href: "#" },
  { label: "Gästebuch", href: "#" },
];

//#endregion

export function HeadNavigation({
  showOptions,
  setShowOptions,
}: {
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Get initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  return (
    <>
      <BlobHead onHeadClick={toggleOptions} />

      {showOptions && (
        <OptionsGroup
          windowWidth={windowSize.width}
          windowHeight={windowSize.height}
        />
      )}
    </>
  );
}

function OptionsGroup({
  windowWidth,
  windowHeight,
}: {
  windowWidth: number;
  windowHeight: number;
}) {
  const radius = 1.5;
  const count = NAV_OPTIONS.length;

  // Center of the screen in 3D space
  // const screenCenter = new THREE.Vector3(-0.5, 0.2, 0);
  const screenCenter = new THREE.Vector3(0, -0.5, 0);

  return (
    <group>
      {NAV_OPTIONS.map((option, index) => {
        // Calculate position on circle centered in screen
        const angle = (index / count) * Math.PI * 2;
        const basePosition = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );

        // Position relative to screen center
        const position = basePosition.clone().add(screenCenter);

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
}: {
  initialPosition: THREE.Vector3;
  label: string;
  href: string;
  index: number;
  windowWidth: number;
  windowHeight: number;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const initialPositionRef = useRef(initialPosition.clone());
  const [position, setPosition] = useState(initialPosition.clone());

  // Track mouse for interactive effect
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / windowWidth) * 2 - 1,
        y: -((event.clientY / windowHeight) * 2 - 1),
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [windowWidth, windowHeight]);

  // Apply cursor influence to position, keeping buttons along circular path
  useFrame(() => {
    const basePos = initialPositionRef.current;
    const cursorPos = new THREE.Vector3(
      mousePosition.x * 3,
      mousePosition.y * 3,
      0
    );

    // Calculate distance to cursor for influence weighting
    const distanceToCursor = basePos.distanceTo(cursorPos);
    const maxInfluence = 0.4; // Maximum influence factor

    // The closer the cursor, the stronger the influence
    const influenceFactor =
      Math.max(0, 1 - distanceToCursor / 5) * maxInfluence;

    // Calculate new position with subtle cursor following
    const newPos = basePos.clone();
    newPos.x += (-cursorPos.x - basePos.x) * influenceFactor;
    newPos.y += (-cursorPos.y - basePos.y) * influenceFactor;

    // Update position with smooth lerping
    setPosition((prev) => {
      prev.x = THREE.MathUtils.lerp(prev.x, newPos.x, 0.05);
      prev.y = THREE.MathUtils.lerp(prev.y, newPos.y, 0.05);
      return prev;
    });

    // Apply position
    optionRef.current.position.copy(position);
  });

  return (
    <group ref={optionRef} position={initialPosition}>
      <Html position={[0, 0, 0]} center>
        <motion.a
          key={href}
          initial={MOTION_VARIANTS.springScaleReversed.initial}
          animate={MOTION_VARIANTS.springScaleReversed.animate(index)}
          exit={MOTION_VARIANTS.springScaleReversed.exit}
          whileHover={MOTION_VARIANTS.springScaleReversed.hover}
          style={{
            background: hovered ? "#4285F4" : "#2979FF",
            color: "white",
            padding: "16px 20px",
            borderRadius: "50px",
            // fontFamily: "Inter, sans-serif",
            fontWeight: "500",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            // width: "fit-content",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "translate(-50%, -50%)",
            fontSize: "22px",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => (window.location.href = href)}
        >
          {label}
        </motion.a>
      </Html>
    </group>
  );
}
