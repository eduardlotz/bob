import React, { useState, useCallback, useMemo, memo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useQuestStore } from "@/store/questStore";
import { useAppStore } from "@/store";
import { CheckmarkIcon } from "@/icons/checkmark";
import { CloseIcon } from "@/icons/close";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  completed: boolean;
}

interface RouteQuests {
  [key: string]: Quest[];
}

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

// Memoized Quest Item Component
const MemoizedQuestItem = memo<{
  quest: any;
  onQuestClick: (quest: any) => void;
}>(({ quest, onQuestClick }) => {
  const questIcon = useMemo(() => {
    if (quest.completed) return "✅";
    if (quest.progress >= quest.maxProgress) return "🎯";
    return "📋";
  }, [quest.completed, quest.progress, quest.maxProgress]);

  return (
    <QuestItem $completed={quest.completed} onClick={() => onQuestClick(quest)}>
      <QuestIcon>{questIcon}</QuestIcon>
      <QuestInfo>
        <QuestName>{quest.title}</QuestName>
        <QuestDescription>{quest.description}</QuestDescription>
        <QuestProgress>
          {quest.progress}/{quest.maxProgress}
        </QuestProgress>
        <ProgressBar
          $progress={quest.progress}
          $maxProgress={quest.maxProgress}
        />
      </QuestInfo>
      <QuestReward>+{quest.reward}</QuestReward>
    </QuestItem>
  );
});

MemoizedQuestItem.displayName = "MemoizedQuestItem";

export function ProgressTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentRoute } = useAppStore();
  const { getQuestsByRoute, completeQuest, updateQuestProgress } =
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

  // Memoized quest data
  const currentQuests = useMemo(
    () => getQuestsByRoute(routeId),
    [getQuestsByRoute, routeId]
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

  // Memoized handlers
  const handleQuestComplete = useCallback(
    (questId: string) => {
      const quest = currentQuests.find((q: any) => q.id === questId);
      if (quest && !quest.completed && quest.progress >= quest.maxProgress) {
        // Complete the quest
        completeQuest(questId);

        // Trigger confetti
        triggerConfetti();

        // Show success toast
        toast.success(`Quest completed! +${quest.reward} taps`, {
          description: quest.title,
          duration: 3000,
        });
      }
    },
    [currentQuests, completeQuest]
  );

  const handleQuestProgress = useCallback(
    (questId: string, progress: number) => {
      updateQuestProgress(questId, progress);
    },
    [updateQuestProgress]
  );

  // Auto-complete quests for testing (only in development)
  const handleAutoComplete = useCallback(
    (questId: string) => {
      const quest = currentQuests.find((q: any) => q.id === questId);
      if (quest && !quest.completed) {
        updateQuestProgress(questId, quest.maxProgress);
      }
    },
    [currentQuests, updateQuestProgress]
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Memoized quest click handler
  const handleQuestClick = useCallback(
    (quest: any) => {
      if (quest.completed) {
        // Show completion message
        toast.info("Quest already completed!", {
          description: quest.title,
          duration: 2000,
        });
      } else if (quest.progress >= quest.maxProgress) {
        // Complete the quest if progress is full
        handleQuestComplete(quest.id);
      } else {
        // Show progress message
        toast.info("Quest in progress...", {
          description: `${quest.title} - ${quest.progress}/${quest.maxProgress}`,
          duration: 2000,
        });
      }
    },
    [handleQuestComplete]
  );

  return (
    <>
      <TrackerButton
        onClick={toggleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        $isActive={isOpen}
      >
        <AnimatePresence mode="popLayout">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.25,
                type: "spring" as const,
                bounce: 0.5,
              }}
            >
              <CloseIcon color="#ffffff" />
            </motion.div>
          ) : (
            <motion.div
              key="tracker"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.25,
                type: "spring" as const,
                bounce: 0.5,
              }}
            >
              <TrackerContent>
                <QuestIcon>📋</QuestIcon>
                <QuestProgress>
                  {completedQuests}/{currentQuests.length}
                </QuestProgress>
              </TrackerContent>
            </motion.div>
          )}
        </AnimatePresence>
      </TrackerButton>

      <AnimatePresence>
        {isOpen && (
          <TrackerPanel
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <TrackerContent>
              <TrackerHeader>
                <TrackerTitle>Quests</TrackerTitle>
                <CloseButton onClick={closePanel}>×</CloseButton>
              </TrackerHeader>

              <QuestsList>
                {currentQuests.map((quest) => (
                  <MemoizedQuestItem
                    key={quest.id}
                    quest={quest}
                    onQuestClick={handleQuestClick}
                  />
                ))}
              </QuestsList>

              {totalReward > 0 && (
                <TotalReward>Total Reward: +{totalReward}</TotalReward>
              )}

              {/* Test buttons for development */}
              {process.env.NODE_ENV === "development" &&
                currentQuests.length > 0 && (
                  <TestSection>
                    <TestTitle>Test Progress</TestTitle>
                    {currentQuests.map((quest) => (
                      <div
                        key={`test-${quest.id}`}
                        style={{ marginBottom: "8px" }}
                      >
                        <TestButton
                          onClick={() =>
                            handleQuestProgress(quest.id, quest.progress + 25)
                          }
                          disabled={quest.completed}
                        >
                          +25 Progress
                        </TestButton>
                        <TestButton
                          onClick={() => handleAutoComplete(quest.id)}
                          disabled={quest.completed}
                          style={{ marginLeft: "8px" }}
                        >
                          Complete
                        </TestButton>
                      </div>
                    ))}
                  </TestSection>
                )}
            </TrackerContent>
          </TrackerPanel>
        )}
      </AnimatePresence>
    </>
  );
}

// Styled Components
const TrackerButton = styled(motion.button)<{ $isActive?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(14px);
  border: ${(props) =>
    props.$isActive
      ? "2px solid #ffffff"
      : "1px solid rgba(255, 255, 255, 0.1)"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  opacity: ${(props) => (props.$isActive ? 1 : 0.75)};

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${(props) =>
      props.$isActive ? "#ffffff" : "rgba(255, 255, 255, 0.2)"};
    opacity: 1;
  }
`;

const TrackerContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const QuestIcon = styled.div`
  font-size: 16px;
  line-height: 1;
`;

const QuestProgress = styled.div`
  font-size: 10px;
  font-weight: bold;
  color: #4ade80;
  line-height: 1;
  margin-top: 4px;
`;

const ProgressBar = styled.div<{ $progress: number; $maxProgress: number }>`
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  overflow: hidden;
  margin-top: 2px;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) => (props.$progress / props.$maxProgress) * 100}%;
    background: #4ade80;
    transition: width 0.3s ease;
  }
`;

const TrackerPanel = styled(motion.div)`
  position: fixed;
  bottom: 120px;
  left: 0;
  right: 0;
  margin: 0 auto;

  width: 320px;
  max-width: calc(100% - 32px);
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 999;
  overflow: hidden;
  pointer-events: auto;
`;

const TrackerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TrackerTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666666;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #ffffff;
  }
`;

const QuestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  opacity: ${(props) => (props.$completed ? 0.7 : 1)};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const QuestInfo = styled.div`
  flex: 1;
`;

const QuestName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
`;

const QuestDescription = styled.div`
  font-size: 12px;
  color: #666666;
`;

const QuestReward = styled.div`
  font-size: 12px;
  color: #4ade80;
  font-weight: 500;
`;

const TotalReward = styled.div`
  font-size: 14px;
  color: #4ade80;
  font-weight: 600;
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const TestSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const TestTitle = styled.div`
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
`;

const TestButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 4px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
