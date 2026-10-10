import { getLocale } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { getBobItemCopy } from "./bobItems.messages";
import { getTapEffectCopy } from "./tapEffects.messages";
import { getWeatherEffectCopy } from "./weatherEffects.messages";
import { getWorldCopy } from "./worlds.messages";

export const getShopItemCopy = (
  itemId: string,
  locale: Locale = getLocale(),
) => {
  if (itemId in getWorldCopyMap) {
    return getWorldCopy(itemId as keyof typeof getWorldCopyMap, locale);
  }

  if (itemId in getTapEffectCopyMap) {
    return getTapEffectCopy(itemId as keyof typeof getTapEffectCopyMap, locale);
  }

  if (itemId in getBobItemCopyMap) {
    return getBobItemCopy(itemId as keyof typeof getBobItemCopyMap, locale);
  }

  if (itemId in getWeatherEffectCopyMap) {
    return getWeatherEffectCopy(
      itemId as keyof typeof getWeatherEffectCopyMap,
      locale,
    );
  }

  return null;
};

const getBobItemCopyMap = {
  builderHelmet: true,
  krustyKrabHat: true,
  afroHair: true,
  chickenLittleGlasses: true,
  simsPlumbob: true,
  blackCap: true,
} as const;

const getTapEffectCopyMap = {
  tap_effect_default: true,
  tap_effect_confetti: true,
  tap_effect_smoke: true,
  tap_effect_bubbles: true,
  tap_effect_hearts: true,
  tap_effect_stars: true,
  tap_effect_laser: true,
  tap_effect_emojis: true,
} as const;

const getWeatherEffectCopyMap = {
  environment_rain: true,
  environment_clouds: true,
  environment_stars: true,
} as const;

const getWorldCopyMap = {
  world_default: true,
  world_forest: true,
  world_city: true,
  world_desert: true,
  world_winter: true,
  world_moon: true,
  world_space: true,
} as const;
