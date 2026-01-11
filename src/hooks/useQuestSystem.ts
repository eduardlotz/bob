import { useCallback, useMemo } from "react";
import { useQuestStore } from "@/store/core/quests";
import { useCoreStore } from "@/store/core/store";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { ROUTE_DICTIONARY } from "@/store/config/routes";

export const useQuestSystem = () => {
  const { currentRoute } = useAppStore();
  const { addTaps, purchaseBobItem } = useCoreStore();
  const questStore = useQuestStore();
  const quests = questStore.quests;
  const updateQuestProgress = questStore.updateQuestProgress;
  const completeQuest = questStore.completeQuest;

  const routeId = useMemo(
    () => ROUTE_DICTIONARY[currentRoute] || "route_home",
    [currentRoute]
  );

  const currentQuests = useMemo(
    () => quests.filter((quest) => quest.routeId === routeId),
    [quests, routeId]
  );

  const completedQuests = useMemo(
    () => currentQuests.filter((q: any) => q.completed).length,
    [currentQuests]
  );

  const totalReward = useMemo(
    () =>
      currentQuests.reduce(
        (sum: number, q: any) => sum + (q.completed ? q.reward : 0),
        0
      ),
    [currentQuests]
  );

  const triggerQuest = useCallback(
    (action: string, value?: number) => {
      const freshQuests = useQuestStore.getState().quests;
      const relevantQuests = freshQuests.filter(
        (quest) =>
          (quest.routeId ? quest.routeId === routeId : true) &&
          !quest.completed &&
          quest.trigger?.action === action
      );

      relevantQuests.forEach((quest) => {
        const currentQuestState = useQuestStore
          .getState()
          .quests.find((q) => q.id === quest.id);
        if (currentQuestState?.completed) {
          return;
        }

        const progressIncrement = value || quest.trigger?.value || 1;
        const newProgress = Math.min(
          quest.progress + progressIncrement,
          quest.maxProgress
        );

        updateQuestProgress(quest.id, newProgress);

        if (newProgress >= quest.maxProgress && !currentQuestState?.completed) {
          completeQuest(quest.id);

          quest.reward.type === "taps_reward"
            ? addTaps(quest.reward.amount as number)
            : purchaseBobItem(quest.reward.amount as string, true);

          toast.success(`${quest.title}`, {
            description: quest.description,
            duration: 3000,
          });
        }
      });
    },
    [routeId, updateQuestProgress, completeQuest, addTaps]
  );

  const triggerInteraction = useCallback(
    (elementId: string) => {
      triggerQuest(`click_${elementId}`);
    },
    [triggerQuest]
  );

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
