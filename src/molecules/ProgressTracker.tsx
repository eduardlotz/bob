import React, { useState, useCallback, useMemo, memo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useQuestStore } from "@/store/questStore";
import { CloseIcon } from "@/icons/close";
import { toast } from "sonner";
import { NavButton } from "./BottomNavigation";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { Magnetic } from "@/layout/Magnetic";

const MemoizedQuestItem = memo<{
  quest: any;
  // onQuestClick: (quest: any) => void;
}>(({ quest }) => {
  const questIcon = useMemo(() => {
    if (quest.completed) return "✅";
    if (quest.progress >= quest.maxProgress) return "🎯";
    return "📋";
  }, [quest.completed, quest.progress, quest.maxProgress]);

  return (
    <QuestItem $completed={quest.completed}>
      <QuestIcon>{questIcon}</QuestIcon>
      <QuestInfo>
        <QuestName>{quest.title}</QuestName>
        <QuestDescription>{quest.description}</QuestDescription>
        {quest.showProgress && (
          <ProgressBar
            $progress={quest.progress}
            $maxProgress={quest.maxProgress}
          />
        )}
      </QuestInfo>
      <QuestReward>
        <span>+{quest.reward}</span>
      </QuestReward>
    </QuestItem>
  );
});

MemoizedQuestItem.displayName = "MemoizedQuestItem";

export function ProgressTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentQuests, completedQuests, totalReward } = useQuestSystem();

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      <Magnetic>
        <NavButton
          key="quests-button"
          onClick={toggleOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={isOpen}
          initial={{ filter: "blur(10px)", opacity: 0, y: 40 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          exit={{
            filter: "blur(10px)",
            opacity: 0,
            y: 40,
            transition: { delay: 0 },
          }}
          transition={{
            // duration: 0.25,
            type: "spring" as const,
            bounce: 0.5,
            delay: 0.05,
          }}
        >
          <AnimatePresence mode="popLayout">
            {isOpen ? (
              <motion.div
                key="close-quests-icon"
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
                key="open-quests-icon"
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
                  {currentQuests.length > 0 && (
                    <QuestProgress>
                      {completedQuests}/{currentQuests.length}
                    </QuestProgress>
                  )}
                </TrackerContent>
              </motion.div>
            )}
          </AnimatePresence>
        </NavButton>
      </Magnetic>

      <AnimatePresence>
        {isOpen && (
          <TrackerPanel
            key="quests-panel"
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

                {totalReward > 0 && (
                  <TotalReward>+{totalReward} taps</TotalReward>
                )}
              </TrackerHeader>

              <QuestsList>
                {currentQuests.map((quest) => (
                  <MemoizedQuestItem key={quest.id} quest={quest} />
                ))}
              </QuestsList>
            </TrackerContent>
          </TrackerPanel>
        )}
      </AnimatePresence>
    </>
  );
}

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
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
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

  width: 300px;
  max-width: calc(100vw - 32px);
  background: rgba(20, 20, 20, 0.95);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 999;
  overflow: hidden;
  pointer-events: auto;
`;

const TrackerHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
`;

const TrackerTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
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
  opacity: ${(props) => (props.$completed ? 0.5 : 1)};

  > * {
    user-select: none;
    pointer-events: none;
  }
`;

const QuestInfo = styled.div`
  flex: 1;
`;

const QuestName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const QuestDescription = styled.div`
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
`;

const QuestReward = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 20px;
  font-size: 12px;
  background-color: var(--success-color);
  font-weight: 500;
  color: var(--success-color);

  > * {
    filter: brightness(0.3);
  }
`;

const TotalReward = styled.div`
  font-size: 14px;
  color: var(--success-color);
  font-weight: 600;
  text-align: right;
`;
