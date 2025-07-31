import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { FillColumn } from "@/layout";
import { H2 } from "@/layout/text";

interface DialogModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function DialogModal({
  isVisible,
  onClose,
  title,
  content,
}: DialogModalProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <Backdrop
          onClick={onClose}
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        >
          <ModalContent
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <FillColumn>
              <H2>{title}</H2>
              <Content>
                <p>{content}</p>
              </Content>
            </FillColumn>
          </ModalContent>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 18, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  overflow: hidden;
  height: 100dvh;
  max-height: 100lvh;
  min-height: 100svh;
`;

const ModalContent = styled(motion.div)`
  background: white;
  padding: 24px;
  border-radius: 44px;
  max-width: 500px;
  width: calc(100% - 48px);
  max-height: 80vh;
  overflow-y: auto;
`;

const Content = styled.div`
  margin-top: 20px;

  p {
    margin-bottom: 16px;
    line-height: 1.6;
    color: #333;
  }
`;
