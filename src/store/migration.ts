import {
  persistenceManager,
  getStorageType,
  isIndexedDBAvailable,
} from "./indexedDB";
import { useGameStore } from "./gameStore";
import { useQuestStore } from "./questStore";
import { useRouteStore } from "./routeStore";
import { useMessageStore } from "./messageStore";
import { toast } from "sonner";

// Migration utility to move data from localStorage to IndexedDB
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

  // Check if migration is needed
  async checkMigrationNeeded(): Promise<boolean> {
    // If legacy localStorage entries exist, we should migrate them to IndexedDB
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // Legacy keys may or may not have the "vorgarten-" prefix
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

  // Queue a migration task to be executed after stores are ready
  queueMigration(task: () => Promise<void>): void {
    this.migrationQueue.push(task);
    console.log(
      `Migration task queued. Queue length: ${this.migrationQueue.length}`
    );
    // Do not auto-run here; the executor will trigger processing deterministically
  }

  // Process the migration queue
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
            // If the task signals a retry, push it back to the end of the queue
            const shouldRetry =
              (error as any)?.retry === true ||
              (error as any)?.message === "IndexedDB not ready";
            if (shouldRetry) {
              console.warn("Re-queuing migration task for retry");
              this.migrationQueue.push(task);
            }
            // Continue with other tasks
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

    // Check if IndexedDB is available before starting migration
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
        // include message store in migration
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
          toast.warning(message);
        } else {
          toast.success(message);
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

  // Migrate a single store
  private async migrateStore(storeName: string): Promise<boolean> {
    try {
      // Try multiple legacy key shapes
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

      // Save to IndexedDB
      await persistenceManager.save(storeName, parsedData, 1);

      // Only remove from localStorage after successful save
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

  // Get migration status
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

  // Get detailed migration info for debugging
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

    // Get localStorage keys for debugging
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

  // Force migration
  async forceMigration(): Promise<void> {
    console.log("Forcing migration to IndexedDB");
    await this.migrateAllStores();
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    try {
      await persistenceManager.clear();

      // Also clear localStorage (both prefixed and known plain keys)
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

      toast.success("All store data cleared");
    } catch (error) {
      console.error("Failed to clear data:", error);
      toast.error("Failed to clear data");
    }
  }

  // Clear the migration queue (useful for debugging)
  clearMigrationQueue(): void {
    const queueLength = this.migrationQueue.length;
    this.migrationQueue = [];
    console.log(`Cleared migration queue (${queueLength} tasks removed)`);
  }

  // Final reset migration (idempotent)
  async runFinalResetMigration(force: boolean = false): Promise<void> {
    const flag = localStorage.getItem(StoreMigration.FINAL_RESET_FLAG_KEY);
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
        // Game store defaults (align with initializer)
        useGameStore.setState((s) => ({
          ...s,
          version: useGameStore.getState().version, // keep enum latest
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
          // Preserve initial arrays from current running store (which were created from config)
          upgrades: useGameStore.getState().upgrades,
          decorations: useGameStore.getState().decorations,
          themes: useGameStore.getState().themes,
          currentTheme: useGameStore.getState().themes[0] || null,
          routes: useGameStore.getState().routes,
          fisheyeIntensity: 0,
          animationsEnabled: true,
          statisticsVisible: false,
          soundSystem: {
            enabled: true,
            masterVolume: 0.0,
            tapVolume: 1.0,
            worldVolume: 0.9,
            uiVolume: 1.0,
            textVolume: 0.8,
            tapEnabled: true,
            worldEnabled: true,
          },
          soundPreferences: { enabled: true, muted: true },
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
        // Quest store defaults
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

      try {
        // Route store is static; ensure it writes current configs once
        const routeState = useRouteStore.getState();
        useRouteStore.setState({ routeConfigs: routeState.routeConfigs });
      } catch (e) {
        console.warn("[FINAL RESET] Failed to reset route store state", e);
      }

      try {
        // reset message store flags so all messages can show again
        useMessageStore.setState((s) => ({
          ...s,
          activeMessage: null,
          queue: [],
          seenThisSession: {},
          repeatFlags: {},
          preferences: {},
        }));
      } catch (e) {
        console.warn("[FINAL RESET] Failed to reset message store state", e);
      }

      // Mark as done before notifying
      localStorage.setItem(StoreMigration.FINAL_RESET_FLAG_KEY, "1");
      try {
        await persistenceManager.save(
          StoreMigration.META_STORE_KEY,
          { state: { finalResetRanAt: Date.now() }, version: 1 },
          1
        );
      } catch {}
      toast.success(
        "All user data was RESET to defaults. Your preferences and progress were cleared."
      );
      console.log("[FINAL RESET] Completed. All user data reset to defaults.");
    } catch (error) {
      console.error("[FINAL RESET] Failed:", error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }
}

// Export singleton instance
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

// Function to check if migration is needed without running it
export const isMigrationNeeded = async (): Promise<boolean> => {
  return await storeMigration.checkMigrationNeeded();
};

// Legacy function for backward compatibility - now queues instead of running immediately
export const checkAndMigrate = async (): Promise<void> => {
  const needsMigration = await storeMigration.checkMigrationNeeded();

  if (needsMigration) {
    console.log("Migration needed, queuing for later execution...");
    storeMigration.queueMigration(async () => {
      await storeMigration.migrateAllStores();
    });
  }
};

// Function to execute queued migrations (call this after stores are ready)
export const executeQueuedMigrations = async (): Promise<void> => {
  await storeMigration.processMigrationQueue();
};

// Function to manually trigger migration (useful for debugging)
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

// Final reset migration APIs
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
