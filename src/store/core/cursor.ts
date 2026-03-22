import { create } from "zustand";
import { useViewStore, ViewMode } from "../viewStore";

export type CursorVariant =
  | "default"
  | "hidden"
  | "hover"
  | "active"
  | "grab"
  | "grabbing";

type CursorSignals = {
  isPointerDown: boolean;
  isHoveringClickable: boolean;
  isActiveClickablePress: boolean;
};

type CursorStore = CursorSignals & {
  variant: CursorVariant;
  setPointerDown: (v: boolean) => void;
  setHoveringClickable: (v: boolean) => void;
  hide: () => void;
  show: () => void;
};

function resolveCursorVariant(
  viewMode: ViewMode,
  { isPointerDown, isHoveringClickable, isActiveClickablePress }: CursorSignals,
): CursorVariant {
  if (isActiveClickablePress) return "active";
  if (isHoveringClickable) return "hover";
  if (viewMode === "object") {
    return isPointerDown ? "grabbing" : "grab";
  }

  return "default";
}

export const useCursorStore = create<CursorStore>((set, get) => ({
  variant: "default",
  isPointerDown: false,
  isHoveringClickable: false,
  isActiveClickablePress: false,
  hide: () => set({ variant: "hidden" }),
  show: () => set({ variant: "default" }),

  setPointerDown: (isPointerDown) =>
    set(() => {
      const viewMode = useViewStore.getState().viewMode;
      const prev = get();
      const next = {
        ...prev,
        isPointerDown,
        isActiveClickablePress: isPointerDown
          ? prev.isActiveClickablePress || prev.isHoveringClickable
          : false,
      };
      return {
        ...next,
        variant: resolveCursorVariant(viewMode, next),
      };
    }),

  setHoveringClickable: (isHoveringClickable) =>
    set(() => {
      const viewMode = useViewStore.getState().viewMode;
      const prev = get();
      const next = {
        ...prev,
        isHoveringClickable,
        isActiveClickablePress:
          prev.isPointerDown && prev.isActiveClickablePress
            ? true
            : prev.isPointerDown && isHoveringClickable,
      };
      return {
        ...next,
        variant: resolveCursorVariant(viewMode, next),
      };
    }),
}));
