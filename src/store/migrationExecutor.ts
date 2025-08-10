import { executeQueuedMigrations } from "./migration";

// This module handles the execution of queued migrations after all stores are ready
// It should be imported and called from the main App component after stores are initialized

let hasExecutedMigrations = false;
let retryCount = 0;
const MAX_RETRIES = 10;

/**
 * Execute any queued migrations after all stores are ready
 * This should be called from the main App component after the initial render
 */
export const executeMigrationsWhenReady = async (): Promise<void> => {
  if (hasExecutedMigrations) {
    return;
  }

  try {
    // Wait a bit to ensure all stores are fully initialized
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if we can access the stores safely
    try {
      // Try to access a store to see if it's ready
      const { useGameStore } = await import("./gameStore");
      const gameState = useGameStore.getState();

      if (!gameState || typeof gameState.version === "undefined") {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          console.warn("Max retries reached, giving up on migration execution");
          return;
        }
        console.log(
          `Stores not ready yet, retrying in 200ms... (attempt ${retryCount}/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        return executeMigrationsWhenReady();
      }
    } catch (error) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.warn("Max retries reached, giving up on migration execution");
        return;
      }
      console.log(
        `Stores not accessible yet, retrying in 200ms... (attempt ${retryCount}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      return executeMigrationsWhenReady();
    }

    console.log("Stores are ready, executing queued migrations...");
    await executeQueuedMigrations();
    hasExecutedMigrations = true;
    console.log("Queued migrations completed");
  } catch (error) {
    console.error("Failed to execute queued migrations:", error);
  }
};

/**
 * Reset the migration execution flag (useful for testing)
 */
export const resetMigrationExecution = (): void => {
  hasExecutedMigrations = false;
  retryCount = 0;
};

/**
 * Check if migrations have been executed
 */
export const getMigrationExecutionStatus = (): boolean => {
  return hasExecutedMigrations;
};

/**
 * Get the current retry count
 */
export const getRetryCount = (): number => {
  return retryCount;
};
