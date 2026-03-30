import { useCallback, useEffect, useMemo } from "react";
import { hasQuestReward, useQuestStore } from "@/store/core/quests";
import { useCoreStore } from "@/store/core/store";
import { useAppStore } from "@/store";
import { ROUTE_DICTIONARY } from "@/store/config/routes";
import { calculateAutoTapRate } from "@/shop-items/upgradeMath";

export const useQuestActions = () => {
  const currentRoute = useAppStore((state) => state.currentRoute);
  const questStoreHydrated = useQuestStore((state) => state.isHydrated);
  const triggerQuestAction = useQuestStore((state) => state.triggerQuestAction);
  const routeId = useMemo(
    () => ROUTE_DICTIONARY[currentRoute] || "route_home",
    [currentRoute],
  );

  const triggerQuest = useCallback(
    (action: string, value?: number) => {
      if (!questStoreHydrated) {
        return;
      }

      triggerQuestAction(action, value, routeId);
    },
    [questStoreHydrated, routeId, triggerQuestAction],
  );

  const triggerInteraction = useCallback(
    (elementId: string) => {
      triggerQuest(`click_${elementId}`);
    },
    [triggerQuest],
  );

  return {
    triggerQuest,
    triggerInteraction,
  };
};

export const useQuestSystem = () => {
  const currentRoute = useAppStore((state) => state.currentRoute);
  const upgrades = useCoreStore((state) => state.upgrades);
  const lifetimeTotalTaps = useCoreStore((state) => state.lifetimeTotalTaps);
  const manualTaps = useCoreStore((state) => state.manualTaps);
  const gameStoreHydrated = useCoreStore((state) => state.isHydrated);
  const getTotalTapMultiplier = useCoreStore(
    (state) => state.getTotalTapMultiplier,
  );
  const bobItems = useCoreStore((state) => state.bobItems);
  const tapEffects = useCoreStore((state) => state.tapEffects);
  const worlds = useCoreStore((state) => state.worlds);
  const quests = useQuestStore((state) => state.quests);
  const questStoreHydrated = useQuestStore((state) => state.isHydrated);
  const syncQuestProgressFromMetric = useQuestStore(
    (state) => state.syncQuestProgressFromMetric,
  );
  const { triggerQuest, triggerInteraction } = useQuestActions();

  const routeId = useMemo(
    () => ROUTE_DICTIONARY[currentRoute] || "route_home",
    [currentRoute],
  );

  const currentQuests = useMemo(
    () => quests.filter((quest) => quest.routeId === routeId),
    [quests, routeId],
  );

  const completedQuests = useMemo(
    () => currentQuests.filter((q: any) => q.completed).length,
    [currentQuests],
  );

  const totalReward = useMemo(
    () =>
      currentQuests.reduce(
        (sum: number, q: any) =>
          sum +
          (q.completed &&
          hasQuestReward(q) &&
          q.reward?.type === "taps_reward"
            ? Math.max(0, Number(q.reward.amount) || 0)
            : 0),
        0,
      ),
    [currentQuests],
  );

  const purchasedBobItems = useMemo(
    () => bobItems.filter((item) => item.purchased && item.cost > 0).length,
    [bobItems],
  );

  const purchasedTapEffects = useMemo(
    () => tapEffects.filter((item) => item.purchased && item.cost > 0).length,
    [tapEffects],
  );

  const purchasedWorlds = useMemo(
    () => worlds.filter((item) => item.purchased && item.cost > 0).length,
    [worlds],
  );

  const totalUpgradeLevels = useMemo(
    () => upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0),
    [upgrades],
  );

  const autoTapRate = useMemo(() => calculateAutoTapRate(upgrades), [upgrades]);
  const tapMultiplier = useMemo(
    () => Math.floor(getTotalTapMultiplier()),
    [getTotalTapMultiplier, upgrades],
  );

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("taps_total", lifetimeTotalTaps);
  }, [
    gameStoreHydrated,
    lifetimeTotalTaps,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("manual_taps_total", manualTaps);
  }, [
    gameStoreHydrated,
    manualTaps,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("shop_buy_bob_item", purchasedBobItems);
  }, [
    gameStoreHydrated,
    purchasedBobItems,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("shop_buy_tap_effect", purchasedTapEffects);
  }, [
    gameStoreHydrated,
    purchasedTapEffects,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("shop_buy_world", purchasedWorlds);
  }, [
    gameStoreHydrated,
    purchasedWorlds,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("upgrade_levels_total", totalUpgradeLevels);
  }, [
    gameStoreHydrated,
    questStoreHydrated,
    syncQuestProgressFromMetric,
    totalUpgradeLevels,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("auto_tap_rate", autoTapRate);
  }, [
    autoTapRate,
    gameStoreHydrated,
    questStoreHydrated,
    syncQuestProgressFromMetric,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    syncQuestProgressFromMetric("tap_multiplier", tapMultiplier);
  }, [
    gameStoreHydrated,
    questStoreHydrated,
    syncQuestProgressFromMetric,
    tapMultiplier,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;

    upgrades.forEach((upgrade) => {
      syncQuestProgressFromMetric(`${upgrade.id}_level`, upgrade.level);
    });
  }, [
    gameStoreHydrated,
    questStoreHydrated,
    syncQuestProgressFromMetric,
    upgrades,
  ]);

  useEffect(() => {
    if (!gameStoreHydrated || !questStoreHydrated) return;
    const timer = window.setInterval(() => {
      triggerQuest("playtime_seconds", 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [gameStoreHydrated, questStoreHydrated, triggerQuest]);

  return {
    currentQuests,
    completedQuests,
    totalReward,
    triggerQuest,
    triggerInteraction,
    resetQuests: () => {
      const questStore = useQuestStore.getState();
      questStore.resetAllQuests();
    },
  };
};
