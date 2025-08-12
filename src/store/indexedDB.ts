import { toast } from "sonner";

// IndexedDB configuration
const DB_NAME = "vorgarten-store";
const DB_VERSION = 1;
const STORE_NAME = "zustand-stores";

// Store metadata interface
interface StoreMetadata {
  version: number;
  lastUpdated: number;
  storeName: string;
}

// IndexedDB wrapper class
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn("IndexedDB not supported, falling back to localStorage");
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log("IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "storeName",
          });
          store.createIndex("version", "version", { unique: false });
          store.createIndex("lastUpdated", "lastUpdated", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  // Save data to IndexedDB
  async save(storeName: string, data: any, version: number): Promise<void> {
    try {
      await this.ensureInitialized();

      if (!this.db) {
        throw new Error("IndexedDB not available");
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const storeData = {
        storeName,
        // store as structured object for easier inspection in devtools
        data,
        metadata: {
          version,
          lastUpdated: Date.now(),
          storeName,
        } as StoreMetadata,
      };

      const request = store.put(storeData);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to save ${storeName} to IndexedDB:`, error);
      throw error;
    }
  }

  // Load data from IndexedDB
  async load(
    storeName: string
  ): Promise<{ data: any; metadata: StoreMetadata } | null> {
    try {
      await this.ensureInitialized();

      if (!this.db) {
        throw new Error("IndexedDB not available");
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storeName);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            const { data, metadata } = request.result;
            const parsed =
              typeof data === "string" ? this.deserialize(data) : data;
            resolve({
              data: parsed,
              metadata,
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to load ${storeName} from IndexedDB:`, error);
      throw error;
    }
  }

  // Delete data from IndexedDB
  async delete(storeName: string): Promise<void> {
    try {
      await this.ensureInitialized();

      if (!this.db) {
        throw new Error("IndexedDB not available");
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(storeName);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to delete ${storeName} from IndexedDB:`, error);
      throw error;
    }
  }

  // Get all store names
  async getAllStoreNames(): Promise<string[]> {
    try {
      await this.ensureInitialized();

      if (!this.db) {
        throw new Error("IndexedDB not available");
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const keys = request.result as string[];
          resolve(keys);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get store names from IndexedDB:", error);
      throw error;
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    try {
      await this.ensureInitialized();

      if (!this.db) {
        throw new Error("IndexedDB not available");
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to clear IndexedDB:", error);
      throw error;
    }
  }

  // Serialize data with structuredClone for deep cloning
  private serialize(data: any): string {
    try {
      // Use structuredClone for better object preservation
      const cloned = structuredClone(data);
      return JSON.stringify(cloned);
    } catch (error) {
      console.warn(
        "structuredClone failed, falling back to JSON.stringify:",
        error
      );
      return JSON.stringify(data);
    }
  }

  // Deserialize data
  private deserialize(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to deserialize data:", error);
      throw error;
    }
  }

  // Check if IndexedDB is available
  isAvailable(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Fallback localStorage manager
class LocalStorageManager {
  private prefix = "vorgarten-";

  save(storeName: string, data: any, version: number): void {
    try {
      const storeData = {
        data,
        metadata: {
          version,
          lastUpdated: Date.now(),
          storeName,
        } as StoreMetadata,
      };
      localStorage.setItem(this.prefix + storeName, JSON.stringify(storeData));
    } catch (error) {
      console.error(`Failed to save ${storeName} to localStorage:`, error);
      throw error;
    }
  }

  load(storeName: string): { data: any; metadata: StoreMetadata } | null {
    try {
      const stored = localStorage.getItem(this.prefix + storeName);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Failed to load ${storeName} from localStorage:`, error);
      return null;
    }
  }

  delete(storeName: string): void {
    try {
      localStorage.removeItem(this.prefix + storeName);
    } catch (error) {
      console.error(`Failed to delete ${storeName} from localStorage:`, error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }
}

// Main persistence manager
class PersistenceManager {
  private indexedDB: IndexedDBManager;
  private localStorage: LocalStorageManager;
  private useIndexedDB: boolean = true;

  constructor() {
    this.indexedDB = new IndexedDBManager();
    this.localStorage = new LocalStorageManager();
  }

  // Save data with fallback
  async save(storeName: string, data: any, version: number): Promise<void> {
    try {
      await this.indexedDB.save(storeName, data, version);
    } catch (error) {
      console.warn(
        `IndexedDB save failed for ${storeName}, falling back to localStorage:`,
        error
      );
      this.useIndexedDB = false;
      this.localStorage.save(storeName, data, version);
    }
  }

  // Load data with fallback
  async load(
    storeName: string
  ): Promise<{ data: any; metadata: StoreMetadata } | null> {
    try {
      return await this.indexedDB.load(storeName);
    } catch (error) {
      console.warn(
        `IndexedDB load failed for ${storeName}, falling back to localStorage:`,
        error
      );
      this.useIndexedDB = false;
      return this.localStorage.load(storeName);
    }
  }

  // Delete data
  async delete(storeName: string): Promise<void> {
    try {
      await this.indexedDB.delete(storeName);
    } catch (error) {
      console.warn(
        `IndexedDB delete failed for ${storeName}, falling back to localStorage:`,
        error
      );
      this.useIndexedDB = false;
      this.localStorage.delete(storeName);
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    try {
      await this.indexedDB.clear();
    } catch (error) {
      console.warn(
        "IndexedDB clear failed, falling back to localStorage:",
        error
      );
      this.useIndexedDB = false;
      this.localStorage.clear();
    }
  }

  // Get storage type being used
  getStorageType(): "indexeddb" | "localstorage" {
    return this.useIndexedDB && this.indexedDB.isAvailable()
      ? "indexeddb"
      : "localstorage";
  }

  // Force use of localStorage
  forceLocalStorage(): void {
    this.useIndexedDB = false;
  }

  // Check if IndexedDB is available
  isIndexedDBAvailable(): boolean {
    return this.indexedDB.isAvailable();
  }
}

// Create singleton instance
const persistenceManager = new PersistenceManager();

// Create a storage adapter compatible with Zustand v5 persist typings
// It reads/writes the StorageValue<T> object directly via our persistence layer
export const createIndexedDBStorage = <T extends unknown>() => ({
  getItem: async (
    name: string
  ): Promise<import("zustand/middleware").StorageValue<T> | null> => {
    try {
      const result = await persistenceManager.load(name);
      // We expect our persistence layer to have stored the StorageValue<T> directly
      // If older shape is found, adapt it
      if (!result) return null;
      const data = result.data;
      if (data && typeof data === "object" && "state" in data) {
        return data as import("zustand/middleware").StorageValue<T>;
      }
      // Fallback: wrap raw data as state
      return {
        state: data as T,
        version: (result.metadata?.version as number) ?? 0,
      } as import("zustand/middleware").StorageValue<T>;
    } catch (error) {
      console.error(`Failed to load ${name}:`, error);
      return null;
    }
  },
  setItem: async (
    name: string,
    value: import("zustand/middleware").StorageValue<T>
  ): Promise<void> => {
    try {
      await persistenceManager.save(
        name,
        value,
        (value?.version as number) ?? 1
      );
    } catch (error) {
      console.error(`Failed to save ${name}:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await persistenceManager.delete(name);
    } catch (error) {
      console.error(`Failed to remove ${name}:`, error);
    }
  },
});

// Utility functions
export const clearAllStores = async (): Promise<void> => {
  try {
    await persistenceManager.clear();
    // toast.success("All stores cleared successfully");
    console.log("All stores cleared successfully");
  } catch (error) {
    console.error("Failed to clear stores:", error);
    // toast.error("Failed to clear stores");
  }
};

export const getStorageType = (): "indexeddb" | "localstorage" => {
  return persistenceManager.getStorageType();
};

export const isIndexedDBAvailable = (): boolean => {
  return persistenceManager.isIndexedDBAvailable();
};

export const forceLocalStorage = (): void => {
  persistenceManager.forceLocalStorage();
  toast.info("Switched to localStorage");
};

// Export the manager for direct access if needed
export { persistenceManager };
