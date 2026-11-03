import { create } from "zustand";
import type { WebGLRenderer } from "three";

const previewSubscribers = new Set<(canvas: HTMLCanvasElement) => void>();

export function subscribeCameraPreview(render: (canvas: HTMLCanvasElement) => void) {
  previewSubscribers.add(render);
  return () => { previewSubscribers.delete(render); };
}

export function renderCameraPreviews(canvas: HTMLCanvasElement) {
  previewSubscribers.forEach(render => render(canvas));
}

/**
 * Bridges the renderer for the app-owned camera window's controls.
 *
 * Populated by <CameraGLBridge /> which must be placed inside your R3F scene.
 */
interface GLBridgeStore {
  gl: WebGLRenderer | null;
  setGL: (gl: WebGLRenderer | null) => void;
}

export const useGLBridge = create<GLBridgeStore>((set) => ({
  gl: null,
  setGL: (gl) => set({ gl }),
}));
