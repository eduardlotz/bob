import { create } from "zustand";

type CursorVariant = "default" | "hover" | "active";

export const useCursorStore = create<{
  variant: CursorVariant;
  set: (v: CursorVariant) => void;
}>((set) => ({
  variant: "default",
  set: (variant) => set({ variant }),
}));
