import {
  executeQueuedMigrations,
  hasFinalResetRun,
  queueFinalResetMigration,
} from "./migration";

// This module handles the execution of queued migrations after all stores are ready
// It should be imported and called from the main App component after stores are initialized

let hasExecutedMigrations = false;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 250;

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
    const { useGameStore } = await import("./gameStore");
    const { useQuestStore } = await import("./questStore");
    const { useRouteStore } = await import("./routeStore");

    const areStoresReady = () => {
      try {
        const gameState = useGameStore.getState();
        const questState = useQuestStore.getState();
        const routeState = useRouteStore.getState();
        return (
          !!gameState &&
          typeof gameState.version !== "undefined" &&
          !!questState &&
          Array.isArray(questState.quests) &&
          !!routeState &&
          Array.isArray(routeState.routeConfigs)
        );
      } catch {
        return false;
      }
    };

    let attempts = 0;
    while (!areStoresReady()) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        console.warn("Max retries reached, giving up on migration execution");
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    console.log("Stores are ready, executing queued migrations...");
    await executeQueuedMigrations();

    // Enqueue final reset migration once (idempotent) after base migrations
    if (!hasFinalResetRun()) {
      console.log("Queuing final reset migration (first-run only)...");
      queueFinalResetMigration(false);
      await executeQueuedMigrations();
    }

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
