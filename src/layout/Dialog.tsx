import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { MotionVariants, Transitions } from "@/styles/motion";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import styled from "styled-components";
import { FillColumn } from ".";
import { MotionWrapper } from "./atoms";
import { H2 } from "./text";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

export interface DialogProps {
  isVisible: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  backgroundColor?: string;
  header?: string;
  head?: React.ReactNode;
  maxWidth?: NumberWithMeasure;
  children?: React.ReactNode;
}

export const Dialog = (props: DialogProps) => {
  const router = useRouter();
  // Controls visibility for animation
  const [isVisible, setIsVisible] = useState(true);

  // Initialize height to 0 to avoid SSR issues
  // set it
  const [h, setH] = useState(0);

  useEffect(() => {
    setH(window.innerHeight);
  }, []);

  // Use the motion values based on the computed height.
  const y = useMotionValue(h);
  const bgOpacity = useTransform(y, [0, h], [0.4, 0]);
  const backgroundColor = props.backgroundColor ?? "#000000";

  const closeModal = () => {
    setIsVisible(false); // triggers exit animation
  };

  useKeyPress("Escape", () => {
    if (isVisible) {
      closeModal();
    }
  });

  return (
    <AnimatePresence onExitComplete={props.onExitComplete}>
      {props.isVisible && (
        <>
          {props.head ? props.head : null}

          <Backdrop
            onClick={props.onClose}
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            style={{ backgroundColor: backgroundColor, opacity: bgOpacity }}
          >
            <ModalContent
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              key="modal-content"
              layout
              variants={MotionVariants.SpringScaleReversed}
              animate="animate"
              initial="initial"
              exit="exit"
              transition={Transitions.staticTransition}
              style={{
                y,
                maxWidth: props.maxWidth ? "auto" : "400px",
              }}
              drag="y"
              dragConstraints={{ top: 2 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > window.innerHeight * 0.75 || velocity.y > 10) {
                  closeModal();
                } else {
                  animate(y, 0, {
                    ...Transitions.inertiaTransition,
                    min: 0,
                    max: 0,
                  });
                }
              }}
            >
              <FillColumn $gap="12px">
                <DialogCloseButton
                  onClick={closeModal}
                  variants={MOTION_VARIANTS.springScaleReversed}
                  animate="animate"
                  exit="exit"
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <CloseIcon />
                </DialogCloseButton>

                <MotionWrapper layout="position">
                  <H2>{props.header}</H2>
                </MotionWrapper>

                {props.children}
              </FillColumn>
            </ModalContent>
          </Backdrop>
        </>
      )}
    </AnimatePresence>
  );
};

const DialogCloseButton = styled(motion.button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  z-index: 1;

  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  right: 4px;
  top: 4px;

  background: rgba(33, 33, 33, 0.05);
  border-radius: 16px;
  color: #b3b1b5;

  &:hover {
    cursor: pointer;
    background: rgba(33, 33, 33, 0.1);
    color: #121212;
  }
`;

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.79254 6.30755C7.38247 5.89748 6.71762 5.89748 6.30755 6.30755C5.89748 6.71762 5.89748 7.38247 6.30755 7.79254L10.515 12L6.30755 16.2075C5.89748 16.6175 5.89748 17.2824 6.30755 17.6924C6.71762 18.1025 7.38247 18.1025 7.79254 17.6924L12 13.485L16.2075 17.6924C16.6175 18.1025 17.2824 18.1025 17.6924 17.6924C18.1025 17.2824 18.1025 16.6175 17.6924 16.2075L13.485 12L17.6924 7.79254C18.1025 7.38247 18.1025 6.71762 17.6924 6.30755C17.2824 5.89748 16.6175 5.89748 16.2075 6.30755L12 10.515L7.79254 6.30755Z"
      fill="currentColor"
    />
  </svg>
);

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 18, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const ModalContent = styled(motion.div)`
  background: white;
  padding: 10px 16px;
  padding-top: 24px;
  border-radius: 20px;
  width: 400px;
  max-width: calc(100% - 24px);

  z-index: 30;
`;
