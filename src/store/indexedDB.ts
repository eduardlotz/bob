import type { PersistStorage, StorageValue } from "zustand/middleware";

const DB_NAME = "app-storage";
const DB_VERSION = 1;
const STORE_NAME = "zustand";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDBStorage<T>(): PersistStorage<T> {
  return {
    async getItem(name) {
      return (
        (await withStore<StorageValue<T> | null>("readonly", (s) =>
          s.get(name)
        )) ?? null
      );
    },

    async setItem(name, value) {
      await withStore("readwrite", (s) => s.put(value, name));
    },

    async removeItem(name) {
      await withStore("readwrite", (s) => s.delete(name));
    },
  };
}
