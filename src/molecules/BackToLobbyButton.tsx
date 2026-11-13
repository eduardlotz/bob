import { HugColumn } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { exitMiniGame } from "@/utils/miniGameTransitions";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { floatingActionButtonStyles } from "@/components/FloatingActionButton";
import { getPanelItemMotion } from "@/styles/panelMotion";
import { useI18n } from "@/i18n";
import { backToLobbyButtonMessages } from "./BackToLobbyButton.messages";

export const BackToLobbyButton = ({ show }: { show: boolean }) => {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion();

  const onTriggerClick = () => {
    exitMiniGame();
  };

  return (
    <AnimatePresence mode="popLayout">
      {show && (
        <HugColumn
          key="back-to-lobby-wrapper"
          {...getPanelItemMotion(0, reducedMotion)}
          layout
          $gap={"0.75rem"}
          $align="center"
          $justify="flex-end"
        >
          <Magnetic>
            <TriggerContainer
              $variant="muted"
              key="back-to-lobby-trigger"
              onClick={onTriggerClick}
              data-ui-sound-id="ui-tap-close"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              style={{ borderRadius: "50px" }}
            >
              <motion.span>
                {backToLobbyButtonMessages[locale].label}
              </motion.span>
            </TriggerContainer>
          </Magnetic>
        </HugColumn>
      )}
    </AnimatePresence>
  );
};

const TriggerContainer = styled(motion.button)<{ $variant: "muted" }>`
  ${floatingActionButtonStyles}
  height: 3rem; padding: 0.5rem 20px; border-radius: 50px;
  font-size: 1rem; font-weight: 900; letter-spacing: -0.02em; white-space: nowrap;
`;
