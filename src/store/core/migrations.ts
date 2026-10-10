import {
  GAME_STORE_VERSION,
  initialGameState,
  initialRoutes,
  initialThemes,
} from "..";
import { initialBobItems } from "@/shop-items/bobItems";
import { initialTapEffects } from "@/shop-items/tapEffects";
import { initialTapUpgrades } from "@/shop-items/upgrades";
import { initialWorlds } from "@/shop-items/worlds";
import { THEME_IDS } from "../config/themes";

const normalizeWorlds = (worlds: any[] = []) => {
  const previousWorlds = new Map(worlds.map((item: any) => [item.id, item]));
  const enabledWorldId =
    worlds.find((item: any) => item.enabled)?.id ?? "world_default";

  return initialWorlds.map((world) => {
    const previousWorld = previousWorlds.get(world.id);

    if (!previousWorld) {
      return {
        ...world,
        enabled: world.id === enabledWorldId,
      };
    }

    return {
      ...world,
      purchased: previousWorld.purchased ?? world.purchased,
      enabled: world.id === enabledWorldId,
      preview: false,
    };
  });
};

const normalizeTapEffects = (tapEffects: any[] = []) => {
  const previousTapEffects = new Map(
    tapEffects.map((item: any) => [item.id, item]),
  );
  const enabledEffectId =
    tapEffects.find((item: any) => item.enabled)?.id ?? "tap_effect_default";

  return initialTapEffects.map((effect) => {
    const previousEffect = previousTapEffects.get(effect.id);

    if (!previousEffect) {
      return {
        ...effect,
        enabled: effect.id === enabledEffectId,
      };
    }

    return {
      ...effect,
      purchased: previousEffect.purchased ?? effect.purchased,
      enabled: effect.id === enabledEffectId,
      preview: false,
    };
  });
};

const normalizeBobItems = (bobItems: any[] = []) => {
  const previousBobItems = new Map(
    bobItems.map((item: any) => [item.id, item]),
  );

  return initialBobItems.map((item) => {
    const previousItem = previousBobItems.get(item.id);

    if (!previousItem) {
      return item;
    }

    return {
      ...item,
      purchased: previousItem.purchased ?? item.purchased,
      enabled: previousItem.enabled ?? item.enabled,
      unlocked: previousItem.unlocked ?? item.unlocked,
      preview: false,
    };
  });
};

const normalizeUpgrades = (upgrades: any[] = []) => {
  const previousUpgrades = new Map(
    upgrades.map((item: any) => [item.id, item]),
  );
  const legacyTapMultiplierLevel =
    previousUpgrades.get("tap_multiplier")?.level ?? 0;

  return initialTapUpgrades.map((upgrade) => {
    const previousUpgrade = previousUpgrades.get(upgrade.id);
    const fallbackLevel =
      upgrade.id === "finger_training" ? legacyTapMultiplierLevel : 0;
    const level = Math.max(
      0,
      Math.min(
        upgrade.maxLevel,
        Number(previousUpgrade?.level ?? fallbackLevel) || 0,
      ),
    );

    return {
      ...upgrade,
      level,
      unlocked: previousUpgrade?.unlocked ?? upgrade.unlocked,
    };
  });
};

export function migrateCoreStore(persisted: any, fromVersion: number) {
  if (!persisted || typeof persisted !== "object") {
    return initialGameState;
  }

  let state = { ...persisted };

  // V1-V4 use a different numbering range. A current save must not run those
  // historical resets again just because the world catalogue gained an item.
  if (
    fromVersion === GAME_STORE_VERSION.V10 ||
    fromVersion === GAME_STORE_VERSION.V11
  ) {
    return {
      ...state,
      worlds: normalizeWorlds(state.worlds),
      version: GAME_STORE_VERSION.LATEST,
    };
  }

  if (fromVersion < GAME_STORE_VERSION.V0) {
    return initialGameState;
  }

  if (fromVersion < GAME_STORE_VERSION.V1) {
    const themeId = state.currentTheme?.id ?? THEME_IDS.DEFAULT;
    state.routes = initialRoutes;
    state.themes = initialThemes;
    state.currentTheme =
      initialThemes.find((t) => t.id === themeId) ?? initialThemes[0];
  }

  if (fromVersion < GAME_STORE_VERSION.V2) {
    state.decorations = state.decorations ?? [];
    state.graphicPreferences = {
      qualityMode: "auto",
      effectsEnabled: true,
      reducedTapMotion: false,
    };
  }

  if (fromVersion < GAME_STORE_VERSION.V3) {
    const themeId = state.currentTheme?.id ?? THEME_IDS.DEFAULT;
    state.themes = initialThemes;
    state.currentTheme =
      initialThemes.find((t) => t.id === themeId) ?? initialThemes[0];
  }

  if (fromVersion < GAME_STORE_VERSION.V4) {
    state.routes = initialRoutes;
  }

  if (fromVersion < GAME_STORE_VERSION.V5) {
    state.worlds = normalizeWorlds(state.worlds);
    state.tapEffects = normalizeTapEffects(state.tapEffects);

    delete state.decorations;
  }

  if (fromVersion < GAME_STORE_VERSION.V6) {
    state.bobItems = normalizeBobItems(state.bobItems);
  }

  if (fromVersion < GAME_STORE_VERSION.V7) {
    state.upgrades = normalizeUpgrades(state.upgrades);
  }

  if (fromVersion < GAME_STORE_VERSION.V8) {
    state.themes = initialThemes;
    state.currentTheme = initialThemes[0];
  }

  if (fromVersion < GAME_STORE_VERSION.V9) {
    state.graphicPreferences = {
      qualityMode: state.graphicPreferences?.qualityMode ?? "auto",
      effectsEnabled: state.graphicPreferences?.effectsEnabled ?? true,
      reducedTapMotion: state.graphicPreferences?.reducedTapMotion ?? false,
    };
  }

  if (fromVersion < GAME_STORE_VERSION.V10) {
    state.upgrades = normalizeUpgrades(state.upgrades);
  }

  if (fromVersion < GAME_STORE_VERSION.V11) {
    state.worlds = normalizeWorlds(state.worlds);
  }

  return {
    ...state,
    version: GAME_STORE_VERSION.LATEST,
  };
}
