# IndexedDB Persistence for Zustand Stores

This implementation provides a robust, async persistence layer for Zustand stores using IndexedDB with automatic fallback to localStorage.

## Features

- **Async Operations**: All IndexedDB operations are non-blocking and async
- **Automatic Fallback**: Gracefully degrades to localStorage if IndexedDB is unavailable
- **Data Serialization**: Uses `structuredClone()` for deep object preservation
- **Versioning & Migration**: Supports store versioning and data migration
- **Error Handling**: Comprehensive error handling with user feedback
- **Migration Utility**: Automatic migration from localStorage to IndexedDB

## Architecture

### Core Components

1. **IndexedDBManager**: Handles IndexedDB operations
2. **LocalStorageManager**: Fallback storage manager
3. **PersistenceManager**: Main coordinator with fallback logic
4. **StoreMigration**: Migration utility for localStorage → IndexedDB

### Database Schema

```typescript
// IndexedDB Configuration
const DB_NAME = "vorgarten-store";
const DB_VERSION = 1;
const STORE_NAME = "zustand-stores";

// Store metadata
interface StoreMetadata {
  version: number;
  lastUpdated: number;
  storeName: string;
}
```

## Usage

### Basic Store Setup

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkAndMigrate } from "./migration";

export const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      // Your store implementation
    }),
    {
      name: "my-store",
      version: 1,
      partialize: (state) => ({
        // Select which parts to persist
      }),
      onRehydrateStorage: (state) => {
        console.log("Store rehydrated:", state);
        // Check for migration after store is loaded
        checkAndMigrate().catch(console.error);
      },
    }
  )
);
```

### Migration Utility

```typescript
import {
  checkAndMigrate,
  getMigrationStatus,
  forceMigration,
  clearAllData,
} from "./migration";

// Check and migrate automatically
await checkAndMigrate();

// Get migration status
const status = getMigrationStatus();
console.log(status);
// {
//   isAvailable: true,
//   currentStorage: "indexeddb",
//   isMigrating: false
// }

// Force migration
await forceMigration();

// Clear all data (for testing)
await clearAllData();
```

### IndexedDB Utilities

```typescript
import {
  getStorageType,
  isIndexedDBAvailable,
  forceLocalStorage,
  clearAllStores,
} from "./indexedDB";

// Check storage type
const storageType = getStorageType(); // "indexeddb" | "localstorage"

// Check if IndexedDB is available
const available = isIndexedDBAvailable(); // boolean

// Force localStorage (for debugging)
forceLocalStorage();

// Clear all stores
await clearAllStores();
```

## Migration Strategy

### Automatic Migration

1. **Detection**: Checks if IndexedDB is available and data exists in localStorage
2. **Migration**: Moves data from localStorage to IndexedDB
3. **Cleanup**: Removes data from localStorage after successful migration
4. **Fallback**: Continues using localStorage if IndexedDB fails

### Migration Process

```typescript
// 1. Check if migration is needed
const needsMigration = await migration.checkMigrationNeeded();

// 2. Migrate all stores
await migration.migrateAllStores();

// 3. Get migration status
const status = migration.getMigrationStatus();
```

## Error Handling

### IndexedDB Errors

- **Not Supported**: Falls back to localStorage
- **Access Denied**: Falls back to localStorage
- **Quota Exceeded**: Falls back to localStorage
- **Version Mismatch**: Handles database upgrades

### Data Corruption

- **Serialization Errors**: Uses JSON.stringify fallback
- **Deserialization Errors**: Returns empty state
- **Migration Errors**: Preserves original data

## Performance Considerations

### Async Operations

- All IndexedDB operations are async and non-blocking
- Uses Promise-based API for better error handling
- Implements proper connection pooling

### Data Serialization

- Uses `structuredClone()` for deep object preservation
- Falls back to `JSON.stringify()` if structuredClone fails
- Handles complex objects, Maps, Sets, and TypedArrays

### Caching

- IndexedDB connection is cached and reused
- Implements proper cleanup and connection management
- Avoids repeated database opens/closes

## Browser Compatibility

### IndexedDB Support

- **Modern Browsers**: Full support
- **Mobile Browsers**: Full support
- **Private Mode**: May have limitations
- **Safari**: Full support (iOS 10+)

### Fallback Strategy

```typescript
// Automatic fallback chain
IndexedDB → localStorage → in-memory
```

## Testing

### Development Tools

```typescript
// Check storage type
console.log("Storage type:", getStorageType());

// Force localStorage for testing
forceLocalStorage();

// Clear all data
await clearAllStores();

// Check migration status
console.log("Migration status:", getMigrationStatus());
```

### Debugging

```typescript
// Enable debug logging
localStorage.setItem("debug-indexeddb", "true");

// Check IndexedDB availability
console.log("IndexedDB available:", isIndexedDBAvailable());

// Monitor storage changes
window.addEventListener("storage", (e) => {
  console.log("Storage changed:", e);
});
```

## Best Practices

### Store Configuration

1. **Version Management**: Always specify store versions
2. **Partialization**: Only persist necessary data
3. **Migration**: Handle data structure changes
4. **Error Handling**: Provide fallback mechanisms

### Data Management

1. **Size Limits**: Monitor data size (IndexedDB: ~50MB, localStorage: ~5MB)
2. **Cleanup**: Implement data cleanup strategies
3. **Backup**: Consider data backup mechanisms
4. **Validation**: Validate data integrity

### Performance

1. **Async Operations**: Never block the main thread
2. **Batching**: Batch multiple operations when possible
3. **Caching**: Cache frequently accessed data
4. **Cleanup**: Properly close connections

## Troubleshooting

### Common Issues

1. **IndexedDB Not Available**

   - Check browser support
   - Verify private mode settings
   - Check for browser extensions blocking IndexedDB

2. **Migration Fails**

   - Check data integrity in localStorage
   - Verify IndexedDB permissions
   - Check for quota exceeded errors

3. **Performance Issues**
   - Monitor data size
   - Check for memory leaks
   - Verify async operation completion

### Debug Commands

```typescript
// Check all storage types
console.log({
  indexeddb: isIndexedDBAvailable(),
  storageType: getStorageType(),
  migrationStatus: getMigrationStatus(),
});

// Force migration
await forceMigration();

// Clear all data
await clearAllData();
```

## Future Enhancements

### Planned Features

1. **Compression**: Data compression for large stores
2. **Encryption**: Optional data encryption
3. **Sync**: Cross-device synchronization
4. **Analytics**: Storage usage analytics
5. **Backup**: Automatic backup mechanisms

### API Improvements

1. **Batch Operations**: Batch multiple store operations
2. **Streaming**: Stream large datasets
3. **Compression**: Built-in data compression
4. **Encryption**: Built-in data encryption
