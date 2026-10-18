import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useIsPresent } from "motion/react";
import styled from "styled-components";
import { BlobFormCustomization } from "@/components/BlobFormCustomization";
import { useCoreStore, useViewStore } from "@/store";
import { useI18n } from "@/i18n";
import { PANEL_SPRING } from "@/styles/panelMotion";

export const BobIcon = () => (
  <img src="/images/app-logos/shop.png" alt="" height={80} width={80} />
);

export function BobApp() {
  const isPresent = useIsPresent();
  const isTransitioning = useViewStore((state) => state.isTransitioning);
  const currentView = useViewStore((state) => state.currentView);
  const transitionToView = useViewStore((state) => state.transitionToView);
  const resetPreview = useCoreStore((state) => state.resetPreview);
  const { messages } = useI18n();

  useEffect(() => {
    resetPreview();
  }, [resetPreview]);

  useEffect(() => {
    if (isPresent && !isTransitioning && currentView !== "phone:bob") transitionToView("phone:bob");
  }, [isPresent, isTransitioning, currentView, transitionToView]);

  return (
    <>
      <BlobFormCustomization section="selector" />
      {currentView === "phone:bob" && createPortal(
        <BobControls
          role="region"
          aria-label={messages.options.sections.bobShape}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={PANEL_SPRING}
        >
          <BlobFormCustomization section="parameters" />
        </BobControls>,
        document.getElementById("motion-root")!,
      )}
    </>
  );
}

const BobControls = styled(motion.div)`
  position: fixed;
  top: calc(50dvh - 74px);
  left: 20px;
  right: 20px;
  width: calc(100vw - 40px);
  pointer-events: none;
  z-index: 1000;

  @media (max-width: 720px) {
    top: auto;
    bottom: 200px;
  }
`;
