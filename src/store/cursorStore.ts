import { create } from "zustand";

type CursorVariant = "default" | "hover" | "active" | "grab" | "grabbing";

export const useCursorStore = create<{
  variant: CursorVariant;
  set: (v: CursorVariant) => void;
}>((set) => ({
  variant: "default",
  set: (variant) => set({ variant }),
}));
