import { create } from "zustand";
import type { WebGLRenderer } from "three";

/**
 * Tiny store that bridges the R3F WebGLRenderer out of the Canvas context
 * so UI components (outside Canvas) can call gl.domElement.toDataURL().
 *
 * Populated by <CameraGLBridge /> which must be placed inside your R3F scene.
 */
interface GLBridgeStore {
  gl: WebGLRenderer | null;
  setGL: (gl: WebGLRenderer) => void;
}

export const useGLBridge = create<GLBridgeStore>((set) => ({
  gl: null,
  setGL: (gl) => set({ gl }),
}));
