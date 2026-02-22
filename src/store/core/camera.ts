import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  takenAt: number;
}

interface CameraStore {
  photos: CapturedPhoto[];
  addPhoto: (dataUrl: string) => void;
  deletePhoto: (id: string) => void;
  clearAll: () => void;
}

export const useCameraStore = create<CameraStore>()(
  persist(
    (set) => ({
      photos: [],

      addPhoto: (dataUrl) =>
        set((s) => ({
          photos: [
            { id: crypto.randomUUID(), dataUrl, takenAt: Date.now() },
            ...s.photos,
          ],
        })),

      deletePhoto: (id) =>
        set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),

      clearAll: () => set({ photos: [] }),
    }),
    { name: "bob-camera-store" },
  ),
);
