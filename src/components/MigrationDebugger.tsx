import React, { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  getMigrationStatus,
  forceMigration,
  clearAllData,
} from "@/store/migration";
import { forceV9Migration } from "@/store/gameStore";
import { toast } from "sonner";
import styled from "styled-components";
import {
  DebugBlock,
  DevActionButton,
  DevActionDescription,
} from "@/layout/atoms";

export const MigrationDebugger: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [storeVersion, setStoreVersion] = useState<number>(0);
  const [lastSchemaUpdate, setLastSchemaUpdate] = useState<Date | null>(null);
  const { themes, currentTheme } = useGameStore();

  useEffect(() => {
    const status = getMigrationStatus();
    setMigrationStatus(status);

    const store = useGameStore.getState();
    setStoreVersion(store.version || 0);
    setLastSchemaUpdate(store.lastSchemaUpdate || null);
  }, []);

  const handleForceMigration = async () => {
    try {
      await forceMigration();
      toast.success("Forced migration completed");
      // Refresh status
      setMigrationStatus(getMigrationStatus());
    } catch (error) {
      toast.error("Migration failed");
      console.error(error);
    }
  };

  const handleForceV9Migration = () => {
    try {
      forceV9Migration();
      toast.success("V9 migration completed");
      // Refresh store version
      const store = useGameStore.getState();
      setStoreVersion(store.version || 0);
    } catch (error) {
      toast.error("V9 migration failed");
      console.error(error);
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      console.log("All data cleared");
      // Refresh status
      setMigrationStatus(getMigrationStatus());
    } catch (error) {
      toast.error("Failed to clear data");
      console.error(error);
    }
  };

  const handleTriggerSchemaMigration = () => {
    try {
      const store = useGameStore.getState();
      // Set lastSchemaUpdate to an old date to trigger migration
      useGameStore.setState({
        ...store,
        lastSchemaUpdate: new Date("2020-01-01"), // Old date to trigger migration
      });
      toast.success("Schema migration trigger set - reload to apply");
    } catch (error) {
      toast.error("Failed to set schema migration trigger");
      console.error(error);
    }
  };

  const checkThemeColors = () => {
    const themesWithIssues = themes.filter(
      (theme) => !theme.outlineColor || !theme.eyeColor
    );

    if (themesWithIssues.length > 0) {
      toast.error(
        `${themesWithIssues.length} themes missing outlineColor or eyeColor`
      );
      console.log("Themes with issues:", themesWithIssues);
    } else {
      toast.success("All themes have proper outlineColor and eyeColor");
    }
  };

  return (
    <DebugBlock>
      <b>Migration Debugger</b>

      <div>
        <strong>Store Version:</strong> {storeVersion}
      </div>

      <div>
        <strong>Storage:</strong> {migrationStatus?.currentStorage || "unknown"}
      </div>

      <div>
        <strong>IndexedDB Available:</strong>{" "}
        {migrationStatus?.isAvailable ? "Yes" : "No"}
      </div>

      <div>
        <strong>Current Theme:</strong> {currentTheme?.id || "none"}
      </div>

      <div>
        <strong>Last Schema Update:</strong>{" "}
        {/* somehow lastSchemaUpdate is a string here */}
        {lastSchemaUpdate
          ? new Date(lastSchemaUpdate.toString()).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N/A"}
      </div>

      <div style={{ marginTop: "10px" }}>
        <DevActionButton onClick={handleForceMigration} $variant="primary">
          Force Storage Migration
        </DevActionButton>
        <DevActionDescription>
          Apply current storage migration logic.
        </DevActionDescription>

        <DevActionButton onClick={handleForceV9Migration}>
          Force V9 Migration
        </DevActionButton>
        <DevActionDescription>
          Test older migration path (V9) specifically.
        </DevActionDescription>

        <DevActionButton onClick={checkThemeColors}>
          Check Theme Colors
        </DevActionButton>
        <DevActionDescription>
          Verifies themes for required color fields after migrations.
        </DevActionDescription>

        <DevActionButton onClick={handleClearData} $variant="danger">
          Clear All Data
        </DevActionButton>
        <DevActionDescription>
          Remove all persisted data. This cannot be undone.
        </DevActionDescription>

        <DevActionButton
          onClick={handleTriggerSchemaMigration}
          $variant="accent"
        >
          Trigger Schema Migration
        </DevActionButton>
        <DevActionDescription>
          Sets a flag for schema migration to run on next reload.
        </DevActionDescription>
      </div>

      <div style={{ marginTop: "10px", fontSize: "10px" }}>
        <strong>Themes ({themes.length}):</strong>
        {themes.map((theme) => (
          <div key={theme.id} style={{ marginLeft: "10px" }}>
            {theme.id}: outline={theme.outlineColor || "MISSING"}, eye=
            {theme.eyeColor || "MISSING"}
          </div>
        ))}
      </div>
    </DebugBlock>
  );
};
