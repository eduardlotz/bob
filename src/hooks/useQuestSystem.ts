import { useCallback, useMemo } from "react";
import { useQuestStore } from "@/store/questStore";
import { useGameStore } from "@/store/gameStore";
import { useAppStore } from "@/store";
import { toast } from "sonner";

// Helper function to trigger confetti
const triggerConfetti = () => {
  if ((window as any).createTapParticles) {
    // Create multiple confetti bursts
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        (window as any).createTapParticles(-1, 0.5, -1, 1);
      }, i * 100);
    }
  }
};

export const useQuestSystem = () => {
  const { currentRoute } = useAppStore();
  const { addTaps } = useGameStore();
  const { quests, updateQuestProgress, completeQuest, getQuestsByRoute } =
    useQuestStore();

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

  // Get quests for current route
  const currentQuests = useMemo(
    () => getQuestsByRoute(routeId),
    [getQuestsByRoute, routeId]
  );

  // Memoized quest completion handler
  const handleQuestComplete = useCallback(
    (questId: string) => {
      const quest = quests.find((q) => q.id === questId);
      if (quest && !quest.completed && quest.progress >= quest.maxProgress) {
        // Complete the quest
        completeQuest(questId);

        // Add reward to taps
        addTaps(quest.reward);

        // Trigger confetti
        triggerConfetti();

        // Show success toast
        toast.success(`Quest completed! +${quest.reward} taps`, {
          description: quest.title,
          duration: 3000,
        });
      }
    },
    [quests, completeQuest, addTaps]
  );

  // Quest trigger handler
  const triggerQuest = useCallback(
    (action: string, value?: number) => {
      const relevantQuests = currentQuests.filter(
        (quest) => !quest.completed && quest.trigger?.action === action
      );

      relevantQuests.forEach((quest) => {
        const progressIncrement = value || quest.trigger?.value || 1;
        const newProgress = Math.min(
          quest.progress + progressIncrement,
          quest.maxProgress
        );

        updateQuestProgress(quest.id, newProgress);

        // Check if quest is now complete
        if (newProgress >= quest.maxProgress) {
          handleQuestComplete(quest.id);
        }
      });
    },
    [currentQuests, updateQuestProgress, handleQuestComplete]
  );

  // Specific quest triggers
  const triggerInteraction = useCallback(
    (elementId: string) => {
      triggerQuest(`click_${elementId}`);
    },
    [triggerQuest]
  );

  const triggerViewProject = useCallback(() => {
    triggerQuest("view_project");
  }, [triggerQuest]);

  const triggerDownloadResume = useCallback(() => {
    triggerQuest("download_resume");
  }, [triggerQuest]);

  const triggerViewArtwork = useCallback(() => {
    triggerQuest("view_artwork");
  }, [triggerQuest]);

  const triggerViewProcess = useCallback(() => {
    triggerQuest("view_process");
  }, [triggerQuest]);

  const triggerReadDocs = useCallback(() => {
    triggerQuest("read_docs");
  }, [triggerQuest]);

  const triggerReviewCode = useCallback(() => {
    triggerQuest("review_code");
  }, [triggerQuest]);

  const triggerSignGuestbook = useCallback(() => {
    triggerQuest("sign_guestbook");
  }, [triggerQuest]);

  const triggerReadMessages = useCallback(() => {
    triggerQuest("read_messages");
  }, [triggerQuest]);

  return {
    currentQuests,
    triggerQuest,
    triggerInteraction,
    triggerViewProject,
    triggerDownloadResume,
    triggerViewArtwork,
    triggerViewProcess,
    triggerReadDocs,
    triggerReviewCode,
    triggerSignGuestbook,
    triggerReadMessages,
    handleQuestComplete,
  };
};
