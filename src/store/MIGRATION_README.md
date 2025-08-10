# Improved Migration System

## Overview

The migration system has been completely rewritten to be more robust and avoid the "setter calls before initialization" error that was occurring during rehydration.

## Key Changes

### 1. Queued Migration System

- Instead of running migrations immediately during store rehydration, migrations are now queued
- Migrations are executed later when all stores are fully initialized
- This prevents the initialization order issues that were causing errors

### 2. Safe Rehydration

- All stores now use `queueStorageMigration()` instead of `checkAndMigrate()`
- No more direct migration calls during `onRehydrateStorage`
- Stores can safely rehydrate without migration conflicts

### 3. Migration Executor

- New `migrationExecutor.ts` handles the execution of queued migrations
- Automatically called from `App.tsx` after stores are ready
- Includes retry logic with maximum retry limits to prevent infinite loops

### 4. Enhanced Error Handling

- Better validation of data before migration
- Individual store migration failures don't stop the entire process
- Detailed logging and status reporting
- Graceful fallbacks when IndexedDB is not available

## How It Works

### 1. Store Rehydration

```typescript
onRehydrateStorage: (state) => {
  // Queue migration instead of running immediately
  queueStorageMigration();
  // ... rest of rehydration logic
};
```

### 2. Migration Queuing

```typescript
// Migration tasks are queued for later execution
queueStorageMigration();
```

### 3. Migration Execution

```typescript
// In App.tsx, after stores are ready
useEffect(() => {
  if (mounted) {
    const timer = setTimeout(() => {
      executeMigrationsWhenReady().catch(console.error);
    }, 500);

    return () => clearTimeout(timer);
  }
}, [mounted]);
```

## API Functions

### Core Migration Functions

- `queueStorageMigration()` - Safely queue a migration task
- `executeQueuedMigrations()` - Execute all queued migrations
- `executeMigrationsWhenReady()` - Execute migrations when stores are ready
- `triggerManualMigration()` - Manually trigger migration (for debugging)

### Status and Debugging

- `getMigrationStatus()` - Get current migration status
- `getDetailedMigrationInfo()` - Get detailed debugging information
- `isMigrationNeeded()` - Check if migration is needed without running it
- `clearMigrationQueue()` - Clear the migration queue (for debugging)

### Data Management

- `clearAllData()` - Clear all store data (for testing)
- `forceMigration()` - Force migration to run immediately

## Testing

A test file `migration.test.ts` is included with functions that can be run from the browser console:

```typescript
// In browser console
import { migrationTests } from "./store/migration.test";
migrationTests.testMigrationSystem();
migrationTests.testMigrationExecutor();
migrationTests.testManualMigration();
```

## Migration Flow

1. **Store Initialization**: Stores are created and configured
2. **Rehydration**: Stores rehydrate from storage, queue migrations if needed
3. **App Mount**: App component mounts and waits for stores to be ready
4. **Migration Execution**: Queued migrations are executed safely
5. **Completion**: Migration status is updated and logged

## Benefits

- **No More Initialization Errors**: Migrations don't run until stores are ready
- **Better Performance**: Migrations are batched and executed efficiently
- **Improved Reliability**: Better error handling and retry logic
- **Debugging Support**: Comprehensive logging and status reporting
- **Backward Compatibility**: Existing migration logic is preserved

## Troubleshooting

### Migration Not Running

- Check if `executeMigrationsWhenReady()` is being called in App.tsx
- Verify that stores are properly initialized before migration execution
- Check console logs for migration status and queue information

### Migration Failing

- Use `getDetailedMigrationInfo()` to see what's in the queue
- Check if IndexedDB is available and working
- Verify that localStorage data is valid and parseable

### Performance Issues

- Migrations are now queued and executed in batches
- No more blocking operations during store initialization
- Migration execution is delayed until after the initial render
