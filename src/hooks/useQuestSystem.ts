import { useCallback, useMemo, useEffect } from "react";
import { useQuestStore } from "@/store/questStore";
import { useGameStore } from "@/store/gameStore";
import { useAppStore } from "@/store";
import { toast } from "sonner";

export const useQuestSystem = () => {
  const { currentRoute } = useAppStore();
  const { addTaps } = useGameStore();
  const questStore = useQuestStore();
  const quests = questStore.quests;
  const updateQuestProgress = questStore.updateQuestProgress;
  const completeQuest = questStore.completeQuest;

  // Convert route path to route ID for quest lookup
  const routeId = useMemo(() => {
    const routeMap: { [key: string]: string } = {
      "/home": "route_home",
      "/about": "route_about",
      "/portfolio": "route_portfolio",
      "/creative": "route_creative",
      "/technical": "route_technical",
      "/guestbook": "route_guestbook",
    };
    return routeMap[currentRoute] || "route_home";
  }, [currentRoute]);

  // Get quests for current route - using stable reference
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
          quest.routeId === routeId &&
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

          addTaps(quest.reward);

          toast.success(`Quest erledigt! +${quest.reward} taps erhalten`, {
            description: quest.title,
            duration: 3000,
          });
        }
      });
    },
    [routeId, updateQuestProgress, completeQuest, addTaps]
  );

  // Specific quest triggers
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
    // Debug function to reset quests
    resetQuests: () => {
      const questStore = useQuestStore.getState();
      questStore.resetAllQuests();
    },
  };
};
