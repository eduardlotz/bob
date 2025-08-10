import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useDialogStore } from "@/store/dialogStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { CloseIcon } from "@/icons/close";

export const DialogRoot = () => {
  const { isOpen, content, closeDialog } = useDialogStore();
  const [isVisible, setIsVisible] = useState(false);
  const [h, setH] = useState(0);

  // initialize height to avoid render issues
  // TODO: check if still needed
  useEffect(() => {
    setH(window.innerHeight);
  }, []);

  // Motion values for drag-to-dismiss
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, h], [0.4, 0]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useKeyPress("Escape", () => {
    if (isVisible) {
      closeDialog();
    }
  });

  const closeModal = () => {
    closeDialog();
  };

  if (!isOpen || !content) return null;

  return (
    <AnimatePresence
      onExitComplete={() => {
        // cleanup after animation
      }}
    >
      {isVisible && (
        <>
          <Backdrop
            onClick={closeModal}
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            style={{ backgroundColor: bgOpacity as any }}
          >
            <ModalContent
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              key="dialog-modal"
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                duration: 0.5,
                ease: [0.32, 0.72, 0, 1],
              }}
              style={{
                y,
              }}
              drag="y"
              dragConstraints={{ top: 2 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > window.innerHeight * 0.75 || velocity.y > 10) {
                  closeModal();
                } else {
                  animate(y, 0, {
                    type: "inertia",
                    bounceStiffness: 300,
                    bounceDamping: 40,
                    timeConstant: 300,
                    min: 0,
                    max: 0,
                  });
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{content.title}</DialogTitle>
                <CloseButton
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                >
                  <CloseIcon />
                </CloseButton>
              </DialogHeader>

              <DialogContent>{content.content}</DialogContent>
            </ModalContent>
          </Backdrop>
        </>
      )}
    </AnimatePresence>
  );
};

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  color: #000000;
  min-width: 300px;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  width: calc(100% - 48px);
`;

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
`;

const CloseButton = styled(motion.button)`
  background: none;
  border: none;
  color: #000000;
  padding: 6px;
  height: 48px;

  background-color: rgba(0, 0, 0, 0.07);
  width: 48px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DialogContent = styled.div`
  line-height: 1.6;
`;
