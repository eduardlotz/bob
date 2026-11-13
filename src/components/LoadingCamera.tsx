import { useFrame } from "@react-three/fiber";
import { useViewStore } from "@/store/viewStore";
import { useScreenTransition } from "@/store/screenTransition";

/** Hold runtime loading poses; the initial default view keeps its live follow. */
export function LoadingCamera() {
  useFrame(() => {
    const phase = useScreenTransition.getState().phase;
    if (phase === "covered" || phase === "opening") useViewStore.getState().holdLoadingCamera();
  }, -3);
  return null;
}
