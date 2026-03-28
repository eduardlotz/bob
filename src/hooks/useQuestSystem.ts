import { useCallback, useEffect, useMemo } from "react";
import {
  getQuestCompletionToastMeta,
  hasQuestReward,
  useQuestStore,
} from "@/store/core/quests";
import { useCoreStore } from "@/store/core/store";
import { useAppStore } from "@/store";
import { ROUTE_DICTIONARY } from "@/store/config/routes";
import { sileo } from "sileo";
import { getLocale } from "@/i18n";
import { createQuestToastIcon } from "@/components/QuestTrophyIcon";

type TriggerQuestArgs = {
  action: string;
  value?: number;
  routeId: string;
  addTaps: ReturnType<typeof useCoreStore.getState>["addTaps"];
  purchaseBobItem: ReturnType<typeof useCoreStore.getState>["purchaseBobItem"];
  updateQuestProgress: ReturnType<typeof useQuestStore.getState>["updateQuestProgress"];
  completeQuest: ReturnType<typeof useQuestStore.getState>["completeQuest"];
};

const runQuestTrigger = ({
  action,
  value,
  routeId,
  addTaps,
  purchaseBobItem,
  updateQuestProgress,
  completeQuest,
}: TriggerQuestArgs) => {
  const freshQuests = useQuestStore.getState().quests;
  const relevantQuests = freshQuests.filter(
    (quest) =>
      (quest.routeId ? quest.routeId === routeId : true) &&
      !quest.completed &&
      quest.trigger?.action === action,
  );

  relevantQuests.forEach((quest) => {
    const currentQuestState = useQuestStore
      .getState()
      .quests.find((q) => q.id === quest.id);
    if (currentQuestState?.completed) {
      return;
    }

    const progressIncrement = value || quest.trigger?.value || 1;
    const currentProgress = currentQuestState?.progress ?? quest.progress;
    const newProgress = Math.min(
      currentProgress + progressIncrement,
      quest.maxProgress,
    );

    updateQuestProgress(quest.id, newProgress);

    if (newProgress >= quest.maxProgress && !currentQuestState?.completed) {
      completeQuest(quest.id);

      if (hasQuestReward(quest) && quest.reward) {
        if (quest.reward.type === "taps_reward") {
          const amount = Number(quest.reward.amount) || 0;
          if (amount > 0) {
            addTaps(amount);
          }
        } else {
          const itemId = String(quest.reward.amount || "");
          if (itemId) {
            purchaseBobItem(itemId, true);
          }
        }
      }

      const latestQuests = useQuestStore.getState().quests;
      const toastMeta = getQuestCompletionToastMeta(
        quest,
        latestQuests,
        getLocale(),
      );
      if (!toastMeta) {
        return;
      }

      sileo.success({
        title: toastMeta.title,
        description: toastMeta.description,
        icon: createQuestToastIcon(
          toastMeta.toastKey,
          toastMeta.color,
          toastMeta.icon,
        ),
        fill: "#111324",
        styles: {
          badge: "toast-badge",
          title: "quest-toast-title",
          description: "quest-toast-desc",
        },
      });
    }
  });
};

export const useQuestActions = () => {
  const currentRoute = useAppStore((state) => state.currentRoute);
  const addTaps = useCoreStore((state) => state.addTaps);
  const purchaseBobItem = useCoreStore((state) => state.purchaseBobItem);
  const updateQuestProgress = useQuestStore(
    (state) => state.updateQuestProgress,
  );
  const completeQuest = useQuestStore((state) => state.completeQuest);

  const routeId = useMemo(
    () => ROUTE_DICTIONARY[currentRoute] || "route_home",
    [currentRoute],
  );

  const triggerQuest = useCallback(
    (action: string, value?: number) => {
      runQuestTrigger({
        action,
        value,
        routeId,
        addTaps,
        purchaseBobItem,
        updateQuestProgress,
        completeQuest,
      });
    },
    [
      routeId,
      addTaps,
      purchaseBobItem,
      updateQuestProgress,
      completeQuest,
    ],
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
  const lifetimeTotalTaps = useCoreStore((state) => state.lifetimeTotalTaps);
  const manualTaps = useCoreStore((state) => state.manualTaps);
  const bobItems = useCoreStore((state) => state.bobItems);
  const tapEffects = useCoreStore((state) => state.tapEffects);
  const worlds = useCoreStore((state) => state.worlds);
  const quests = useQuestStore((state) => state.quests);
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

  useEffect(() => {
    syncQuestProgressFromMetric("taps_total", lifetimeTotalTaps);
  }, [lifetimeTotalTaps, syncQuestProgressFromMetric]);

  useEffect(() => {
    syncQuestProgressFromMetric("manual_taps_total", manualTaps);
  }, [manualTaps, syncQuestProgressFromMetric]);

  useEffect(() => {
    syncQuestProgressFromMetric("shop_buy_bob_item", purchasedBobItems);
  }, [purchasedBobItems, syncQuestProgressFromMetric]);

  useEffect(() => {
    syncQuestProgressFromMetric("shop_buy_tap_effect", purchasedTapEffects);
  }, [purchasedTapEffects, syncQuestProgressFromMetric]);

  useEffect(() => {
    syncQuestProgressFromMetric("shop_buy_world", purchasedWorlds);
  }, [purchasedWorlds, syncQuestProgressFromMetric]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      triggerQuest("playtime_seconds", 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [triggerQuest]);

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
