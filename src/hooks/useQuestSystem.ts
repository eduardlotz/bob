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

  // Note: Removed useEffect that was causing infinite loop
  // Quest activation is now handled directly in the store when needed

  // Quest trigger handler
  const triggerQuest = useCallback(
    (action: string, value?: number) => {
      // Get fresh quest state to ensure we have the latest completion status
      const freshQuests = useQuestStore.getState().quests;
      const relevantQuests = freshQuests.filter(
        (quest) =>
          quest.routeId === routeId &&
          !quest.completed &&
          quest.trigger?.action === action
      );

      relevantQuests.forEach((quest) => {
        // Double-check completion status right before processing
        const currentQuestState = useQuestStore
          .getState()
          .quests.find((q) => q.id === quest.id);
        if (currentQuestState?.completed) {
          return; // skip if already completed
        }

        const progressIncrement = value || quest.trigger?.value || 1;
        const newProgress = Math.min(
          quest.progress + progressIncrement,
          quest.maxProgress
        );

        // Update progress first
        updateQuestProgress(quest.id, newProgress);

        // Check if quest is now complete and handle completion
        if (newProgress >= quest.maxProgress && !currentQuestState?.completed) {
          // Mark as completed immediately to prevent double completion
          completeQuest(quest.id);

          // Add reward to taps
          addTaps(quest.reward);

          // Show success toast
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
