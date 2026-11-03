import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createCameraStore, cameraStorageBytes, MAX_CAMERA_STORAGE_BYTES, MAX_CAMERA_PHOTOS, serializePhotos } from "./camera";

const image = "data:image/png;base64,AA==";
function storageWith(value: string | null = null) {
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
}

describe("camera gallery storage", () => {
  test("stops at 24 without removing existing photos and permits capture after deletion", () => {
    const storage = storageWith();
    const store = createCameraStore(storage);
    for (let i = 0; i < MAX_CAMERA_PHOTOS; i++) assert.equal(store.getState().addPhoto(image), "saved");
    const photos = store.getState().photos;
    assert.equal(store.getState().addPhoto(image), "full");
    assert.deepEqual(store.getState().photos, photos);
    assert.equal(store.getState().deletePhoto(photos[0].id), true);
    assert.equal(store.getState().addPhoto(image), "saved");
    assert.equal(createCameraStore(storage).getState().photos.length, 24);
  });

  test("enforces the serialized 3 MB budget before writing", () => {
    const store = createCameraStore(storageWith());
    assert.equal(store.getState().addPhoto(image + "A".repeat(MAX_CAMERA_STORAGE_BYTES / 2)), "full");
    assert.equal(store.getState().photos.length, 0);
    assert.ok(cameraStorageBytes(store.getState().photos) < MAX_CAMERA_STORAGE_BYTES);
  });

  test("quota failure does not add or delete a photo in memory", () => {
    const photos = [{ id: "old", dataUrl: image, takenAt: 1 }];
    const store = createCameraStore({ getItem: () => serializePhotos(photos), setItem: () => { throw new Error("QuotaExceededError"); } });
    assert.equal(store.getState().addPhoto(image), "storage-error");
    assert.equal(store.getState().deletePhoto("old"), false);
    assert.deepEqual(store.getState().photos, photos);
  });

  test("preserves older galleries over the new limits", () => {
    const photos = Array.from({ length: 30 }, (_, i) => ({ id: String(i), dataUrl: image, takenAt: i }));
    const store = createCameraStore(storageWith(serializePhotos(photos)));
    assert.deepEqual(store.getState().photos, photos);
    assert.equal(store.getState().addPhoto(image), "full");
  });

  test("handles malformed saves and unavailable storage", () => {
    assert.deepEqual(createCameraStore(storageWith("broken")).getState().photos, []);
    assert.equal(createCameraStore().getState().addPhoto(image), "storage-error");
  });
});
