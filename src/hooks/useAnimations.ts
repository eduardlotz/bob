import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function useAnimations() {
  const { animationsEnabled } = useGameStore();

  useEffect(() => {
    // Disable CSS animations when animations are disabled
    const style = document.createElement("style");
    style.id = "animation-controls";

    if (!animationsEnabled) {
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Disable motion for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        }
      `;
    } else {
      style.textContent = "";
    }

    // Remove existing style if it exists
    const existingStyle = document.getElementById("animation-controls");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById("animation-controls");
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [animationsEnabled]);

  return { animationsEnabled };
}
