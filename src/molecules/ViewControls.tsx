import { useViewStore } from "@/store/viewStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@/icons/arrow";

const VIEWID_TITLE_MAP = {
  default: "Über mich",
  desk: "Mein Arbeitsplatz",
  books: "Meine Lieblingsbücher",
  computer: "Mein Computer",
};

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
        <ViewControlsWrapper>
          <BackButton
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key="view-controls-back-button"
            initial={{ y: -120, filter: "blur(6px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: -120, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: "circInOut" }}
          >
            <ArrowLeftIcon />
          </BackButton>
          {currentView !== "default" && (
            <CurrentViewChip
              key="view-controls-current-view-chip"
              initial={{ scale: 0.9, opacity: 0, filter: "blur(6px)" }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
              }}
              exit={{ scale: 0.9, opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "circInOut", delay: 0.3 }}
            >
              {VIEWID_TITLE_MAP[currentView as keyof typeof VIEWID_TITLE_MAP]}
            </CurrentViewChip>
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
`;

const CurrentViewChip = styled(motion.div)`
  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;

  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(32px);
  backdrop-filter: blur(32px);
  border-radius: 50px;
  font-size: 16px;
  letter-spacing: -2%;
  font-weight: 600;
  z-index: 1000;
`;

const BackButton = styled(motion.button)`
  background: #ffffff;
  color: #121212;
  border: none;
  border-radius: 50px;
  height: 40px;
  width: 40px;
  aspect-ratio: 1/1;

  box-shadow: 0 -2px 10px 0 rgba(0, 0, 0, 0.1);

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    height: 14px;
  }
`;
