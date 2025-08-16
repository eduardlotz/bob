import { useViewStore } from "@/store/viewStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import { useEffect, useState } from "react";

export function ViewControls() {
  const { currentView, isDefaultView, resetToDefaultView, isTransitioning } =
    useViewStore();
  const [isVisible, setIsVisible] = useState(false);

  // show controls when not in default view
  useEffect(() => {
    setIsVisible(!isDefaultView());
  }, [currentView, isDefaultView]);

  // escape key to return to default view
  useKeyPress("Escape", () => {
    if (!isDefaultView() && !isTransitioning) {
      resetToDefaultView();
    }
  });

  const handleBackClick = () => {
    if (!isTransitioning) {
      resetToDefaultView();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <ViewControlsWrapper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ViewControlsContainer key="view-controls-current-container">
            <ViewInfo>
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
            </ViewInfo>
          </ViewControlsContainer>
          {!isTransitioning && (
            <BackButton
              onClick={handleBackClick}
              disabled={isTransitioning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              key="view-controls-back-button"
            >
              ←
            </BackButton>
          )}
        </ViewControlsWrapper>
      )}
    </AnimatePresence>
  );
}

const ViewControlsWrapper = styled(motion.div)`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 auto;
`;

const ViewControlsContainer = styled(motion.div)`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  margin: 0 auto;
  z-index: 100;

  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;

  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const BackButton = styled(motion.button)<{ disabled: boolean }>`
  background: ${(props) =>
    props.disabled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)"};
  color: #ffffff;
  border: none;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: fit-content;

  &:hover {
    background: ${(props) =>
      props.disabled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)"};
  }
`;

const ViewInfo = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
`;
