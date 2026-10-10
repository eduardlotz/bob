import { useThree } from "@react-three/fiber";
import { useCoreStore } from "@/store";

/** Respect the quality setting, with a conservative budget on narrow devices. */
export function useWorldQuality() {
  const width = useThree((state) => state.size.width);
  const mode = useCoreStore((state) => state.graphicPreferences.qualityMode);
  return mode === "low" || width < 768
    ? "low"
    : mode === "high"
      ? "high"
      : "medium";
}

export function seededRandom(seed: number) {
  let current = seed >>> 0;
  return () => {
    current = (Math.imul(current, 1664525) + 1013904223) >>> 0;
    return current / 4294967296;
  };
}
