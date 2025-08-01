import { useState, useRef, useEffect } from "react";
import { motion, PanInfo } from "motion/react";
import styled from "styled-components";
import { EmotionState } from "@/hooks/useBlobEmotions";

interface EmotionBarProps {
  emotionState: EmotionState;
  tapCount: number;
  getEmotionIcon: (emotion: EmotionState) => string;
  routeColor?: string;
  sensorButtonHeight?: number;
  isMobile?: boolean;
}

interface Position {
  x: number;
  y: number;
}

const DEFAULT_POSITION: Position = { x: 20, y: 20 };
const MOBILE_TOP_CENTER_POSITION = { x: 0, y: 20 }; // Will be calculated dynamically
const EMOTION_BAR_WIDTH = 160;
const EMOTION_BAR_HEIGHT = 75;
const SNAP_MARGIN = 20;
const FLICK_VELOCITY_THRESHOLD = 200;

// Function to constrain position within window bounds with snap points
// Ensures the ENTIRE bar is always visible and draggable
const constrainToWindowWithSnap = (
  pos: Position,
  winWidth: number,
  winHeight: number,
  velocity: { x: number; y: number } = { x: 0, y: 0 },
  sensorButtonHeight = 0
): Position => {
  // Calculate absolute boundaries - ensure entire bar is within viewport
  const minX = SNAP_MARGIN;
  const maxX = Math.max(minX, winWidth - EMOTION_BAR_WIDTH - SNAP_MARGIN);
  const topBound = Math.max(SNAP_MARGIN, sensorButtonHeight + SNAP_MARGIN);
  const bottomBound = Math.max(
    topBound,
    winHeight - EMOTION_BAR_HEIGHT - SNAP_MARGIN
  );

  console.log("Constraining position:", {
    pos,
    boundaries: { minX, maxX, topBound, bottomBound },
    windowSize: { winWidth, winHeight },
    barSize: { width: EMOTION_BAR_WIDTH, height: EMOTION_BAR_HEIGHT },
  });

  let newX = pos.x;
  let newY = pos.y;

  // Horizontal snap points with flick detection
  const isFlicking = Math.abs(velocity.x) > FLICK_VELOCITY_THRESHOLD;

  if (isFlicking) {
    // Snap to edges when flicking
    if (velocity.x < 0) {
      newX = minX; // Snap to left edge
    } else {
      newX = maxX; // Snap to right edge
    }
    console.log(`Flick detected (velocity: ${velocity.x}), snapping to:`, newX);
  } else {
    // Regular drag - use snap zones for better UX
    const leftSnapZone = minX + SNAP_MARGIN * 2;
    const rightSnapZone = maxX - SNAP_MARGIN * 2;

    if (pos.x <= leftSnapZone) {
      newX = minX;
    } else if (pos.x >= rightSnapZone) {
      newX = maxX;
    } else {
      // Normal constraint - always keep entire bar visible
      newX = Math.max(minX, Math.min(pos.x, maxX));
    }
  }

  // Vertical constraints - always keep entire bar visible
  newY = Math.max(topBound, Math.min(pos.y, bottomBound));

  const finalPos = { x: newX, y: newY };
  console.log("Final constrained position:", finalPos);

  return finalPos;
};

// Styled components defined before use
const EmotionBarContainer = styled(motion.div)<{
  $routeColor: string;
  $isDragging: boolean;
  $isMobile?: boolean;
}>`
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid ${(props) => props.$routeColor};
  border-radius: 20px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  cursor: ${(props) => (props.$isDragging ? "grabbing" : "grab")};
  user-select: none;
  min-width: ${EMOTION_BAR_WIDTH}px;
  font-family: "Open Sauce Two", sans-serif;
  z-index: 1001;
  box-shadow: ${(props) =>
    props.$isDragging
      ? "0 10px 30px rgba(0, 0, 0, 0.3)"
      : "0 4px 20px rgba(0, 0, 0, 0.15)"};
  transition: box-shadow 0.2s ease;
`;

const BobInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BobName = styled.span<{ $routeColor: string }>`
  font-weight: 600;
  font-size: 14px;
  color: ${(props) => props.$routeColor};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const EmotionIcon = styled(motion.span)`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TapCounter = styled.div<{ $routeColor: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(
    ${(props) => {
      const hex = props.$routeColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `${r}, ${g}, ${b}`;
    }},
    0.1
  );
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid
    rgba(
      ${(props) => {
        const hex = props.$routeColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `${r}, ${g}, ${b}`;
      }},
      0.2
    );
`;

const TapIcon = styled.span`
  font-size: 12px;
`;

const TapCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #333;
  min-width: 20px;
  text-align: center;
`;

const DragHandle = styled.div<{ $isDragging: boolean }>`
  color: #999;
  font-size: 12px;
  line-height: 1;
  letter-spacing: -1px;
  opacity: ${(props) => (props.$isDragging ? 1 : 0.5)};
  transition: opacity 0.2s ease;

  ${EmotionBarContainer}:hover & {
    opacity: 0.8;
  }
`;

export function EmotionBar({
  emotionState,
  tapCount,
  getEmotionIcon,
  routeColor = "#4facfe",
  sensorButtonHeight = 0,
  isMobile = false,
}: EmotionBarProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Initialize mobile position immediately if needed
  useEffect(() => {
    if (isMobile && typeof window !== "undefined") {
      const centerX = Math.max(0, (window.innerWidth - EMOTION_BAR_WIDTH) / 2);
      const topY =
        sensorButtonHeight > 0 ? sensorButtonHeight + SNAP_MARGIN : SNAP_MARGIN;
      console.log("Initial mobile position:", {
        centerX,
        topY,
        windowWidth: window.innerWidth,
      });
      setPosition({ x: centerX, y: topY });
    }
  }, [isMobile, sensorButtonHeight]);

  // Set up window size and position handling
  useEffect(() => {
    const updateWindowSize = () => {
      const newWindowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setWindowSize(newWindowSize);

      // On mobile, always center horizontally at top
      if (isMobile) {
        const centerX = Math.max(
          0,
          (newWindowSize.width - EMOTION_BAR_WIDTH) / 2
        );
        const topY =
          sensorButtonHeight > 0
            ? sensorButtonHeight + SNAP_MARGIN
            : SNAP_MARGIN;
        console.log("Mobile positioning:", {
          windowWidth: newWindowSize.width,
          barWidth: EMOTION_BAR_WIDTH,
          centerX,
          topY,
          sensorButtonHeight,
        });
        setPosition({ x: centerX, y: topY });
        return;
      }
    };

    // Initial window size and position
    updateWindowSize();

    // Only load saved position on desktop
    if (!isMobile) {
      const savedPosition = localStorage.getItem("bobEmotionBarPosition");
      console.log("Loaded position from localStorage:", savedPosition);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          console.log("Parsed position:", parsed);

          const needsConstraining =
            parsed.x < 0 ||
            parsed.y < 0 ||
            parsed.x > window.innerWidth - EMOTION_BAR_WIDTH ||
            parsed.y > window.innerHeight - EMOTION_BAR_HEIGHT;

          if (needsConstraining) {
            const constrainedPosition = constrainToWindowWithSnap(
              parsed,
              window.innerWidth,
              window.innerHeight,
              { x: 0, y: 0 },
              sensorButtonHeight
            );
            setPosition(constrainedPosition);
          } else {
            setPosition(parsed);
          }
        } catch (error) {
          console.error("Error parsing saved position:", error);
          setPosition(DEFAULT_POSITION);
        }
      }
    }

    // Listen for window resize
    const handleResize = () => {
      updateWindowSize();
      if (!isMobile) {
        setPosition((prev) =>
          constrainToWindowWithSnap(
            prev,
            window.innerWidth,
            window.innerHeight,
            { x: 0, y: 0 },
            sensorButtonHeight
          )
        );
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, sensorButtonHeight]);

  // Save position to localStorage whenever it changes (desktop only)
  useEffect(() => {
    if (
      !isMobile &&
      (position.x !== DEFAULT_POSITION.x || position.y !== DEFAULT_POSITION.y)
    ) {
      console.log("Saving position to localStorage:", position);
      localStorage.setItem("bobEmotionBarPosition", JSON.stringify(position));
    }
  }, [position, isMobile]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    console.log(
      "Drag ended. Current position:",
      position,
      "Info offset:",
      info.offset,
      "Velocity:",
      info.velocity
    );

    setIsDragging(false);

    // Use offset-based calculation
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    };

    console.log("Calculated new position:", newPosition);
    console.log("Window size:", windowSize);
    console.log("Velocity from info:", info.velocity);

    // Always constrain to window bounds with snap logic
    const constrainedPosition = constrainToWindowWithSnap(
      newPosition,
      windowSize.width,
      windowSize.height,
      info.velocity,
      sensorButtonHeight
    );

    console.log("Final constrained position:", constrainedPosition);
    setPosition(constrainedPosition);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <EmotionBarContainer
      drag={!isMobile}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={!isMobile ? handleDragStart : undefined}
      onDragEnd={!isMobile ? handleDragEnd : undefined}
      onPointerDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1.2,
        x: isMobile ? 0 : position.x,
        y: isMobile ? 0 : position.y,
      }}
      style={{
        left: isMobile ? position.x : undefined,
        top: isMobile ? position.y : undefined,
      }}
      whileHover={{ scale: 1.25 }}
      whileTap={{ scale: 1.15 }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 150,
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
      $routeColor={routeColor}
      $isDragging={isDragging}
      $isMobile={isMobile}
    >
      <BobInfo>
        <BobName $routeColor={routeColor}>Bob</BobName>
        <EmotionIcon
          animate={{
            scale: emotionState === "happy" ? [1, 1.2, 1] : 1,
            rotate: emotionState === "dizzy" ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: emotionState === "happy" ? 0.4 : 0.6,
            repeat: emotionState === "dizzy" ? Infinity : 0,
          }}
        >
          {getEmotionIcon(emotionState)}
        </EmotionIcon>
      </BobInfo>
      <TapCounter $routeColor={routeColor}>
        <TapIcon>👆</TapIcon>
        <TapCount>{tapCount}</TapCount>
      </TapCounter>
      {!isMobile && <DragHandle $isDragging={isDragging}>⋮⋮</DragHandle>}
    </EmotionBarContainer>
  );
}
