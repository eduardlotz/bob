import { HugColumn } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { useMiniGameStore, useViewStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import styled from "styled-components";
import { SmallArrowLeftIcon } from "@/icons/arrow";

export const BackToLobbyButton = ({ show }: { show: boolean }) => {
  const { finishGame } = useMiniGameStore();
  const { setViewMode, transitionToView } = useViewStore();

  const onTriggerClick = () => {
    finishGame();
    setViewMode("fixed");
  };

  return (
    <AnimatePresence mode="popLayout">
      {show && (
        <HugColumn
          key="back-to-lobby-wrapper"
          style={{ opacity: 0, translateZ: 0 }}
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.5,
          }}
          layout
          $gap={"0.75rem"}
          $align="center"
          $justify="flex-end"
        >
          <Magnetic>
            <TriggerContainer
              key="back-to-lobby-trigger"
              onClick={onTriggerClick}
              data-ui-sound-id="ui-tap-close"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              style={{ borderRadius: "50px" }}
            >
              <SmallArrowLeftIcon />

              <motion.span
                initial={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                exit={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                transition={{
                  type: "spring" as const,
                  bounce: 0.2,
                }}
              >
                Spiel beenden
              </motion.span>
            </TriggerContainer>
          </Magnetic>
        </HugColumn>
      )}
    </AnimatePresence>
  );
};

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;
  gap: 0.5rem;

  span {
    max-height: 1.5rem;
  }
`;
