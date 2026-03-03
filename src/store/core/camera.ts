import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  takenAt: number;
}

interface CameraStore {
  photos: CapturedPhoto[];
  subViewName: string;
  addPhoto: (dataUrl: string) => void;
  deletePhoto: (id: string) => void;
  clearAll: () => void;
  setSubViewName: (name: string) => void;
}

export const useCameraStore = create<CameraStore>()(
  persist(
    (set) => ({
      photos: [],
      subViewName: "Camera",

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

      setSubViewName: (name) => set({ subViewName: name }),
    }),
    {
      name: "bob-camera-store",
      partialize: (state) => ({ photos: state.photos }),
    },
  ),
);
