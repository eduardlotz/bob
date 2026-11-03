import { create } from "zustand";

export const MAX_CAMERA_PHOTOS = 24;
export const MAX_CAMERA_STORAGE_BYTES = 3 * 1024 * 1024;
const STORAGE_KEY = "bob-camera-store";

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  takenAt: number;
}

export type PhotoSaveResult = "saved" | "full" | "storage-error";
type PhotoStorage = Pick<Storage, "getItem" | "setItem">;

interface CameraStore {
  photos: CapturedPhoto[];
  addPhoto: (dataUrl: string) => PhotoSaveResult;
  deletePhoto: (id: string) => boolean;
  clearAll: () => boolean;
}

// Preserve the existing persisted format, including photos from older versions.
export const serializePhotos = (photos: CapturedPhoto[]) =>
  JSON.stringify({ state: { photos }, version: 0 });
export const cameraStorageBytes = (photos: CapturedPhoto[]) => serializePhotos(photos).length * 2;
export const isCameraFull = (photos: CapturedPhoto[]) =>
  photos.length >= MAX_CAMERA_PHOTOS || cameraStorageBytes(photos) >= MAX_CAMERA_STORAGE_BYTES;

function readPhotos(storage?: PhotoStorage): CapturedPhoto[] {
  try {
    const photos: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null")?.state?.photos;
    if (!Array.isArray(photos)) return [];
    // Do not silently discard older galleries exceeding the new limits.
    return photos.filter((p): p is CapturedPhoto => p && typeof p.id === "string" &&
      typeof p.dataUrl === "string" && p.dataUrl.startsWith("data:image/") && typeof p.takenAt === "number");
  } catch { return []; }
}

export function createCameraStore(storage?: PhotoStorage) {
  return create<CameraStore>((set, get) => {
    const commit = (photos: CapturedPhoto[]) => {
      // Write first: quota/privacy failures must never create a phantom saved
      // photo or remove an existing photo only from the visible gallery.
      try {
        if (!storage) return false;
        storage.setItem(STORAGE_KEY, serializePhotos(photos));
        set({ photos });
        return true;
      } catch { return false; }
    };
    return {
      photos: readPhotos(storage),
      addPhoto: dataUrl => {
        const photos = get().photos;
        if (isCameraFull(photos)) return "full";
        const next = [{ id: crypto.randomUUID(), dataUrl, takenAt: Date.now() }, ...photos];
        if (cameraStorageBytes(next) > MAX_CAMERA_STORAGE_BYTES) return "full";
        return commit(next) ? "saved" : "storage-error";
      },
      deletePhoto: id => commit(get().photos.filter(p => p.id !== id)),
      clearAll: () => commit([]),
    };
  });
}

let storage: Storage | undefined;
try { storage = typeof window !== "undefined" ? window.localStorage : undefined; } catch { /* Privacy mode. */ }
export const useCameraStore = createCameraStore(storage);
