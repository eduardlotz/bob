import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { FillColumn, FillRow } from "@/layout";
import { H2 } from "@/layout/text";

export default function Guestbook() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const closeModal = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        // router.push("/", undefined, { shallow: true });
        closeModal();
      }}
    >
      {isVisible && (
        <>
          <Head>
            <title>Gästebuch — Eduard Lotz</title>
            <meta
              name="description"
              content="Leave a message in Eduard's guestbook"
            />
          </Head>

          <Backdrop
            onClick={closeModal}
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
                <H2>Gästebuch</H2>
                <Content>
                  <p>
                    Hinterlasse eine Nachricht in meinem digitalen Gästebuch!
                  </p>
                  <p>
                    Ich freue mich über Feedback, Anregungen oder einfach nur
                    einen netten Gruß. Deine Nachricht wird hier für andere
                    Besucher sichtbar sein.
                  </p>
                  <p>
                    Bald wird hier ein Formular zum Hinterlassen von Nachrichten
                    verfügbar sein.
                  </p>
                </Content>
              </FillColumn>
            </ModalContent>
          </Backdrop>
        </>
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
