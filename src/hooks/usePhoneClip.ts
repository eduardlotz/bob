import { useState, useLayoutEffect } from "react";

/**
 * Punches a transparent hole in the phone body wherever the viewfinder slot is.
 *
 * Usage:
 *   1. Add data-phone-body to your BobPhoneBody element
 *   2. Add data-viewfinder-slot to the transparent div inside CameraApp
 *   3. Spread the returned style onto BobPhoneBody
 *
 * @example
 * // BobPhoneBody wrapper:
 * const clipStyle = usePhoneBodyClip();
 * <BobPhoneBody data-phone-body style={clipStyle}>
 *
 * // ViewfinderSlot inside CameraApp:
 * <ViewfinderSlot data-viewfinder-slot ref={viewfinderRef} />
 */
export function usePhoneBodyClip(): React.CSSProperties {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const compute = () => {
      const body = document.querySelector<HTMLElement>("[data-phone-body]");
      const slot = document.querySelector<HTMLElement>(
        "[data-viewfinder-slot]",
      );

      if (!body || !slot) {
        setStyle({});
        return;
      }

      const bodyRect = body.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();

      // Distances from each edge of the phone body to the viewfinder slot
      const top = slotRect.top - bodyRect.top;
      const left = slotRect.left - bodyRect.left;
      const right = bodyRect.right - slotRect.right;
      const bottom = bodyRect.bottom - slotRect.bottom;

      // Four opaque strips that surround the hole — mask-image approach
      // works everywhere and preserves the outer border-radius
      const mask = `
        linear-gradient(black, black) 0 0 / 100% ${top}px,
        linear-gradient(black, black) 0 100% / 100% ${bottom}px,
        linear-gradient(black, black) 0 0 / ${left}px 100%,
        linear-gradient(black, black) 100% 0 / ${right}px 100%
      `;

      setStyle({
        maskImage: mask,
        maskRepeat: "no-repeat",
        WebkitMaskImage: mask,
        WebkitMaskRepeat: "no-repeat",
      });
    };

    compute();

    // Re-measure on resize and briefly after mount (phone open animation)
    window.addEventListener("resize", compute);
    const interval = setInterval(compute, 80);
    const stop = setTimeout(() => clearInterval(interval), 700);

    return () => {
      window.removeEventListener("resize", compute);
      clearInterval(interval);
      clearTimeout(stop);
      setStyle({});
    };
  }, []);

  return style;
}
