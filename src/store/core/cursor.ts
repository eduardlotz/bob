import { create } from "zustand";
import { useViewStore, ViewMode } from "../viewStore";

export type CursorVariant =
  | "default"
  | "hover"
  | "active"
  | "grab"
  | "grabbing";

type CursorSignals = {
  isPointerDown: boolean;
  isHoveringClickable: boolean;
};

type CursorStore = CursorSignals & {
  variant: CursorVariant;
  setPointerDown: (v: boolean) => void;
  setHoveringClickable: (v: boolean) => void;
};

function resolveCursorVariant(
  viewMode: ViewMode,
  { isPointerDown, isHoveringClickable }: CursorSignals
): CursorVariant {
  if (isHoveringClickable) return isPointerDown ? "active" : "hover";
  if (viewMode === "object") {
    return isPointerDown ? "grabbing" : "grab";
  }

  return "default";
}

export const useCursorStore = create<CursorStore>((set, get) => ({
  variant: "default",
  isPointerDown: false,
  isHoveringClickable: false,

  setPointerDown: (isPointerDown) =>
    set(() => {
      const viewMode = useViewStore.getState().viewMode;
      const next = { ...get(), isPointerDown };
      return {
        ...next,
        variant: resolveCursorVariant(viewMode, next),
      };
    }),

  setHoveringClickable: (isHoveringClickable) =>
    set(() => {
      const viewMode = useViewStore.getState().viewMode;
      const next = { ...get(), isHoveringClickable };
      return {
        ...next,
        variant: resolveCursorVariant(viewMode, next),
      };
    }),
}));
