import {
  persistenceManager,
  getStorageType,
  isIndexedDBAvailable,
} from "./indexedDB";
import { toast } from "sonner";

// Migration utility to move data from localStorage to IndexedDB
export class StoreMigration {
  private static instance: StoreMigration;
  private isMigrating = false;
  private migrationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private constructor() {}

  static getInstance(): StoreMigration {
    if (!StoreMigration.instance) {
      StoreMigration.instance = new StoreMigration();
    }
    return StoreMigration.instance;
  }

  // Check if migration is needed
  async checkMigrationNeeded(): Promise<boolean> {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    const storageType = getStorageType();
    return storageType === "localstorage";
  }

  // Queue a migration task to be executed after stores are ready
  queueMigration(task: () => Promise<void>): void {
    this.migrationQueue.push(task);
    console.log(
      `Migration task queued. Queue length: ${this.migrationQueue.length}`
    );

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      console.log("Starting to process migration queue...");
      this.processMigrationQueue();
    } else {
      console.log(
        "Migration queue is already being processed, task will be handled later"
      );
    }
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
            // Continue with other tasks even if one fails
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
      console.log("IndexedDB not available, skipping migration");
      return;
    }

    this.isMigrating = true;

    try {
      const stores = ["game-store", "quest-store", "route-store", "app-store"];

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
      // Check if data exists in localStorage
      const localStorageKey = `vorgarten-${storeName}`;
      const localStorageData = localStorage.getItem(localStorageKey);

      if (!localStorageData) {
        return false;
      }

      // Validate the data before migration
      let parsedData;
      try {
        parsedData = JSON.parse(localStorageData);

        // Basic validation - ensure it's an object
        if (!parsedData || typeof parsedData !== "object") {
          console.warn(
            `Invalid data format for ${storeName}, skipping migration`
          );
          return false;
        }
      } catch (parseError) {
        console.error(
          `Failed to parse localStorage data for ${storeName}:`,
          parseError
        );
        return false;
      }

      // Save to IndexedDB
      await persistenceManager.save(storeName, parsedData, 1);

      // Only remove from localStorage after successful save
      localStorage.removeItem(localStorageKey);

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

      // Also clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("vorgarten-")) {
          localStorage.removeItem(key);
        }
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
