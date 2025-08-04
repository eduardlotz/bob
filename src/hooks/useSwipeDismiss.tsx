import { useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

type Direction = "x" | "y";

type UseSwipeDismissProps = {
  onClose: () => void;
  threshold?: number;
  direction?: Direction;
};

export function useSwipeDismiss({
  onClose,
  threshold = 150,
  direction = "y",
}: UseSwipeDismissProps) {
  const dragValue = useMotionValue(0);
  const opacity = useTransform(
    dragValue,
    [-threshold, 0, threshold],
    [0, 1, 0]
  );

  useEffect(() => {
    dragValue.set(0); // Reset position when reopened
  }, []);

  const dragEndHandler = (_: any, info: any) => {
    const point = direction === "x" ? info.point.x : info.point.y;
    const velocity = direction === "x" ? info.velocity.x : info.velocity.y;

    // Check if swipe distance exceeds threshold or has sufficient velocity
    if (Math.abs(point) > threshold || Math.abs(velocity) > 500) {
      onClose();
    } else {
      // Reset position if swipe wasn't sufficient
      dragValue.set(0);
    }
  };

  const motionStyles = {
    x: direction === "x" ? dragValue : undefined,
    y: direction === "y" ? dragValue : undefined,
    opacity,
    touchAction: "none",
  };

  // Allow dragging in both directions for the specified axis
  const dragConstraints =
    direction === "x" ? { left: -300, right: 300 } : { top: -300, bottom: 300 };

  return {
    motionStyles,
    dragConstraints,
    dragEndHandler,
    drag: direction,
  };
}
