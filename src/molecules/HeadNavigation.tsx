import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Float, CameraControls } from "@react-three/drei";
import { motion } from "motion/react";
import { BlobHead } from "./BlobHead";
import { useRouter } from "next/router";
import { LockIcon } from "@/layout/icons";

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
      scale: 0.2,
      opacity: 0,
      // filter: "blur(6px)",
      transition: { type: "spring", duration: 0.6, bounce: 0.4 },
    },
    hover: {
      scale: 1.05,
      transition: { type: "spring", duration: 0.3, bounce: 0.2 },
    },
    tap: {
      scale: 0.9,
      transition: { type: "spring", duration: 0.3, bounce: 0.5 },
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
  cameraControlsRef,
}: {
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  cameraControlsRef: React.RefObject<CameraControls>;
}) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Update camera zoom based on showOptions state
  useFrame(() => {
    const cursorPos = new THREE.Vector3(
      mousePosition.x * 3,
      mousePosition.y * 3,
      0
    );

    if (cameraControlsRef.current) {
      cameraControlsRef.current.setLookAt(
        0,
        0,
        showOptions ? 4 : 2,
        cursorPos.x,
        cursorPos.y,
        cursorPos.z,
        true
      );
    }
  });

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
          cameraControlsRef={cameraControlsRef}
          hideOptions={() => setShowOptions(false)}
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
}: {
  windowWidth: number;
  windowHeight: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
}) {
  const radius = 2.5;
  const count = NAV_OPTIONS.length;

  // Center of the screen in 3D space
  // const screenCenter = new THREE.Vector3(-0.5, 0.2, 0);
  const screenCenter = new THREE.Vector3(0, -0.5, 0);

  return (
    <group>
      {NAV_OPTIONS.map((option, index) => {
        // Calculate position on circle centered in screen
        const angle = (index / count) * Math.PI * 2;
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;

        // Estimate size in 3D units to keep inside bounds
        const xMax = (windowWidth / windowHeight) * 1.5;
        const yMax = 1.5;

        x = Math.max(-xMax, Math.min(x, xMax));
        y = Math.max(-yMax, Math.min(y, yMax));

        const basePosition = new THREE.Vector3(x, y, 0);

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
              cameraControlsRef={cameraControlsRef}
              hideOptions={hideOptions}
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
}: {
  initialPosition: THREE.Vector3;
  label: string;
  href: string;
  index: number;
  windowWidth: number;
  windowHeight: number;
  cameraControlsRef: React.RefObject<CameraControls>;
  hideOptions: () => void;
}) {
  const optionRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const initialPositionRef = useRef(initialPosition.clone());
  const [position, setPosition] = useState(initialPosition.clone());
  const router = useRouter();

  // Track mouse for interactive effect
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

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

    cameraControlsRef.current.setLookAt(
      0,
      0,
      4,
      // newPos.x,
      cursorPos.x,
      cursorPos.y,
      cursorPos.z,
      true
    );

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
        <motion.button
          key={href}
          initial={MOTION_VARIANTS.springScaleReversed.initial}
          animate={MOTION_VARIANTS.springScaleReversed.animate(index)}
          exit={MOTION_VARIANTS.springScaleReversed.exit}
          whileHover={MOTION_VARIANTS.springScaleReversed.hover}
          whileTap={MOTION_VARIANTS.springScaleReversed.tap}
          style={{
            background: hovered ? "#4285F4" : "#2979FF",
            color: href === "#" ? "#7FA6FF" : "white",
            padding: "16px 20px",
            borderRadius: "50px",
            // fontFamily: "Inter, sans-serif",
            fontWeight: "500",
            whiteSpace: "nowrap",
            gap: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            // width: "fit-content",
            textDecoration: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "translate(-50%, -50%)",
            fontSize: "22px",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => {
            cameraControlsRef.current.setLookAt(
              0,
              0,
              4,
              position.x,
              position.y,
              position.z,
              true
            );
            router.push(href, undefined, { shallow: true });
            hideOptions();
          }}
        >
          {label}
          {href !== "#" && <LockIcon color="#ffffff" />}
        </motion.button>
      </Html>
    </group>
  );
}
