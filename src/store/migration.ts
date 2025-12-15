import {
  persistenceManager,
  getStorageType,
  isIndexedDBAvailable,
} from "./indexedDB";
import {
  initialBobItems,
  initialDecorations,
  initialRoutes,
  initialThemes,
  useGameStore,
} from "./gameStore";
import { useQuestStore } from "./questStore";
import { useMessageStore } from "./messageStore";
import { toast } from "sonner";
import { initialTapUpgrades } from "@/shop-items/upgrades";

// utility to move data from localStorage to IndexedDB
export class StoreMigration {
  private static instance: StoreMigration;
  private isMigrating = false;
  private migrationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  // flag for data resets, increase version to trigger
  static readonly FINAL_RESET_FLAG_KEY = "vg-final-reset-v1";
  static readonly META_STORE_KEY = "migration-meta";

  private constructor() {}

  static getInstance(): StoreMigration {
    if (!StoreMigration.instance) {
      StoreMigration.instance = new StoreMigration();
    }
    return StoreMigration.instance;
  }

  async checkMigrationNeeded(): Promise<boolean> {
    // If legacy localStorage entries exist, we should migrate them to IndexedDB
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k === "game-store" ||
          k === "quest-store" ||
          k === "route-store" ||
          k === "app-store" ||
          k === "message-store" ||
          k.startsWith("vorgarten-game-store") ||
          k.startsWith("vorgarten-quest-store") ||
          k.startsWith("vorgarten-route-store") ||
          k.startsWith("vorgarten-app-store") ||
          k.startsWith("vorgarten-message-store")
        ) {
          keys.push(k);
        }
      }
      return keys.length > 0;
    } catch {
      return false;
    }
  }

  queueMigration(task: () => Promise<void>): void {
    this.migrationQueue.push(task);
    console.log(
      `Migration task queued. Queue length: ${this.migrationQueue.length}`
    );
  }

  async processMigrationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.migrationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      console.log(
        `Processing ${this.migrationQueue.length} queued migration tasks...`
      );

      while (this.migrationQueue.length > 0) {
        const task = this.migrationQueue.shift();
        if (task) {
          try {
            await task();
            console.log("Migration task completed successfully");
          } catch (error) {
            console.error("Migration task failed:", error);
            const shouldRetry =
              (error as any)?.retry === true ||
              (error as any)?.message === "IndexedDB not ready";
            if (shouldRetry) {
              console.warn("Re-queuing migration task for retry");
              this.migrationQueue.push(task);
            }
          }
        }
      }

      console.log("All queued migration tasks processed");
    } catch (error) {
      console.error("Error processing migration queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Migrate all stores from localStorage to IndexedDB
  async migrateAllStores(): Promise<void> {
    if (this.isMigrating) {
      console.log("Migration already in progress");
      return;
    }

    if (!isIndexedDBAvailable()) {
      console.log("IndexedDB not available, delaying migration (will retry)");
      const err: any = new Error("IndexedDB not ready");
      err.retry = true;
      throw err;
    }

    this.isMigrating = true;

    try {
      const stores = [
        "game-store",
        "quest-store",
        "route-store",
        "app-store",
        "message-store",
      ];

      let migratedCount = 0;
      let failedCount = 0;

      for (const storeName of stores) {
        try {
          const migrated = await this.migrateStore(storeName);
          if (migrated) {
            migratedCount++;
          }
        } catch (storeError) {
          console.error(`Failed to migrate store ${storeName}:`, storeError);
          failedCount++;
        }
      }

      if (migratedCount > 0) {
        const message =
          failedCount > 0
            ? `Migrated ${migratedCount} stores, ${failedCount} failed`
            : `Successfully migrated ${migratedCount} stores to IndexedDB`;

        if (failedCount > 0) {
          console.warn(message);
        } else {
          console.log(message);
        }
        console.log(
          `Migration completed: ${migratedCount} stores migrated, ${failedCount} failed`
        );
      } else if (failedCount > 0) {
        toast.error("All store migrations failed");
        console.log("Migration completed: all stores failed to migrate");
      } else {
        console.log("No stores needed migration");
      }
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Failed to migrate stores to IndexedDB");
    } finally {
      this.isMigrating = false;
    }
  }

  private async migrateStore(storeName: string): Promise<boolean> {
    try {
      const prefixedKey = `vorgarten-${storeName}`;
      const plainKey = storeName;
      let raw = localStorage.getItem(prefixedKey);
      let parsedData: any = null;
      if (raw) {
        try {
          parsedData = JSON.parse(raw)?.data ?? JSON.parse(raw);
        } catch {
          parsedData = null;
        }
      }
      if (!parsedData) {
        raw = localStorage.getItem(plainKey);
        if (raw) {
          try {
            parsedData = JSON.parse(raw)?.state ?? JSON.parse(raw);
          } catch {
            parsedData = null;
          }
        }
      }

      if (!parsedData || typeof parsedData !== "object") {
        return false;
      }

      await persistenceManager.save(storeName, parsedData, 1);

      try {
        localStorage.removeItem(prefixedKey);
        localStorage.removeItem(plainKey);
      } catch {}

      console.log(
        `Successfully migrated ${storeName} from localStorage to IndexedDB`
      );
      return true;
    } catch (error) {
      console.error(`Failed to migrate ${storeName}:`, error);
      return false;
    }
  }

  getMigrationStatus(): {
    isAvailable: boolean;
    currentStorage: "indexeddb" | "localstorage";
    isMigrating: boolean;
    queueLength: number;
    isProcessingQueue: boolean;
  } {
    return {
      isAvailable: isIndexedDBAvailable(),
      currentStorage: getStorageType(),
      isMigrating: this.isMigrating,
      queueLength: this.migrationQueue.length,
      isProcessingQueue: this.isProcessingQueue,
    };
  }

  getDetailedMigrationInfo(): {
    status: ReturnType<StoreMigration["getMigrationStatus"]>;
    queueDetails: string[];
    storageInfo: {
      indexedDBAvailable: boolean;
      localStorageKeys: string[];
    };
  } {
    const status = this.getMigrationStatus();
    const queueDetails = this.migrationQueue.map(
      (_, index) => `Task ${index + 1}`
    );

    const localStorageKeys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vorgarten-")) {
          localStorageKeys.push(key);
        }
      }
    } catch (error) {
      console.warn("Could not access localStorage:", error);
    }

    return {
      status,
      queueDetails,
      storageInfo: {
        indexedDBAvailable: isIndexedDBAvailable(),
        localStorageKeys,
      },
    };
  }

  async forceMigration(): Promise<void> {
    console.log("Forcing migration to IndexedDB");
    await this.migrateAllStores();
  }

  async clearAllData(): Promise<void> {
    try {
      await persistenceManager.clear();

      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("vorgarten-")) {
          localStorage.removeItem(key);
        }
      });
      [
        "game-store",
        "quest-store",
        "route-store",
        "app-store",
        "message-store",
      ].forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      console.log("All store data cleared");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }

  clearMigrationQueue(): void {
    const queueLength = this.migrationQueue.length;
    this.migrationQueue = [];
    console.log(`Cleared migration queue (${queueLength} tasks removed)`);
  }

  // Final reset migration (idempotent)
  async runFinalResetMigration(force: boolean = false): Promise<void> {
    const flag = localStorage.getItem(StoreMigration.FINAL_RESET_FLAG_KEY);
    console.group("[FINAL RESET] Migration");
    if (flag && !force) {
      console.log("Final reset migration already executed. Skipping.");
      return;
    }

    if (this.isMigrating) {
      console.log("Another migration is in progress; delaying final reset");
      const err: any = new Error("Migration in progress");
      err.retry = true;
      throw err;
    }

    this.isMigrating = true;
    try {
      console.log(
        "[FINAL RESET] Clearing all persisted data (IndexedDB + localStorage)..."
      );
      await this.clearAllData();

      // Reinitialize stores to their defaults and persist them
      console.log(
        "[FINAL RESET] Re-initializing default state for all stores..."
      );
      try {
        useGameStore.setState((s) => ({
          ...s,
          version: useGameStore.getState().version,
          lastSchemaUpdate: new Date(),
          taps: 0,
          manualTaps: 0,
          manualTapsPerSecond: 0,
          tapsPerSecond: 0,
          tapMultiplier: 1,
          autoTapRate: 0,
          isPaused: false,
          recentManualTaps: [],
          lastAutoTapTime: Date.now(),
          upgrades: initialTapUpgrades,
          decorations: initialDecorations,
          themes: initialThemes,
          currentTheme: initialThemes[0] || null,
          routes: initialRoutes,
          blobForms: useGameStore.getState().blobForms,
          // preserve purchased bobItems during final reset to avoid losing progress
          bobItems: (() => {
            const currentBobItems = useGameStore.getState().bobItems || [];
            return initialBobItems.map((newItem) => {
              const existingItem = currentBobItems.find(
                (item) => item.id === newItem.id
              );
              if (existingItem && existingItem.purchased) {
                return {
                  ...newItem,
                  purchased: existingItem.purchased,
                  equipped: existingItem.enabled,
                  detached: existingItem.detached,
                };
              }
              return newItem;
            });
          })(),
          fisheyeIntensity: 0,
          animationsEnabled: true,
          statisticsVisible: false,
          soundSystem: {
            enabled: true,
            masterVolume: 1.0,
            tapVolume: 1.0,
            worldVolume: 0.9,
            uiVolume: 1.0,
            textVolume: 0.8,
            tapEnabled: true,
            worldEnabled: true,
          },
          soundPreferences: { enabled: true, muted: false },
          audioSelections: {
            worldMusicId: "world-lofi",
            tapEffectId: "tap_effect_default",
            worldSoundIds: [],
            tapEffectAudioId: undefined,
          },
        }));
      } catch (e) {
        console.warn("[FINAL RESET] Failed to reset game store state", e);
      }

      try {
        useQuestStore.setState((s) => ({
          ...s,
          quests: useQuestStore.getState().quests.map((q) => ({
            ...q,
            progress: 0,
            completed: false,
          })),
          activeQuests: [],
        }));
      } catch (e) {
        console.warn("[FINAL RESET] Failed to reset quest store state", e);
      }

      localStorage.setItem(StoreMigration.FINAL_RESET_FLAG_KEY, "1");
      try {
        await persistenceManager.save(
          StoreMigration.META_STORE_KEY,
          { state: { finalResetRanAt: Date.now() }, version: 1 },
          1
        );
      } catch (error) {
        console.warn("[FINAL RESET] Failed to save meta store state", error);
      }
      console.log("[FINAL RESET] Completed. All user data reset to defaults.");
    } catch (error) {
      console.error("[FINAL RESET] Failed:", error);
      throw error;
    } finally {
      this.isMigrating = false;
      console.groupEnd();
    }
  }
}

export const storeMigration = StoreMigration.getInstance();

// Safe migration function that queues the migration instead of running immediately
export const queueStorageMigration = async (): Promise<void> => {
  const needsMigration = await storeMigration.checkMigrationNeeded();

  if (needsMigration) {
    console.log("Migration needed, queuing for later execution...");
    storeMigration.queueMigration(async () => {
      await storeMigration.migrateAllStores();
    });
  }
};

// check if migration is needed without running it
export const isMigrationNeeded = async (): Promise<boolean> => {
  return await storeMigration.checkMigrationNeeded();
};

// execute all queued migrations (should be called after stores are ready)
export const executeQueuedMigrations = async (): Promise<void> => {
  await storeMigration.processMigrationQueue();
};

// manually trigger migration
export const triggerManualMigration = async (): Promise<void> => {
  console.log("Manually triggering migration...");
  await storeMigration.migrateAllStores();
};

export const getMigrationStatus = () => {
  return storeMigration.getMigrationStatus();
};

export const getDetailedMigrationInfo = () => {
  return storeMigration.getDetailedMigrationInfo();
};

export const forceMigration = async () => {
  await storeMigration.forceMigration();
};

export const clearAllData = async () => {
  await storeMigration.clearAllData();
};

export const clearMigrationQueue = () => {
  storeMigration.clearMigrationQueue();
};

export const hasFinalResetRun = (): boolean => {
  return !!localStorage.getItem(StoreMigration.FINAL_RESET_FLAG_KEY);
};

// async variant that also checks an IndexedDB meta record as a fallback guard
export const hasFinalResetRunAsync = async (): Promise<boolean> => {
  try {
    if (localStorage.getItem(StoreMigration.FINAL_RESET_FLAG_KEY)) return true;
  } catch {}
  try {
    const meta = await persistenceManager.load(StoreMigration.META_STORE_KEY);
    return !!meta && !!(meta.data?.state?.finalResetRanAt as number);
  } catch {
    return false;
  }
};

export const queueFinalResetMigration = (force = false): void => {
  storeMigration.queueMigration(async () => {
    await storeMigration.runFinalResetMigration(force);
  });
};

export const forceFinalResetMigration = async (): Promise<void> => {
  await storeMigration.runFinalResetMigration(true);
};
