import { useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

type UseSwipeDismissProps = {
  onClose: () => void;
  threshold?: number;
};

export function useSwipeDismiss({
  onClose,
  threshold = 150,
}: UseSwipeDismissProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [1, 0]);

  useEffect(() => {
    y.set(0); // Reset position when reopened
  }, []);

  const dragEndHandler = (_: any, info: any) => {
    if (info.point.y > threshold) {
      onClose();
    }
  };

  const motionStyles = {
    y,
    opacity,
    touchAction: "none",
  };

  const dragConstraints = {
    top: 0,
    bottom: 300,
    left: 0,
    right: 0,
  };

  return {
    motionStyles,
    dragConstraints,
    dragEndHandler,
  };
}
