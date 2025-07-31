import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { FillColumn, FillRow } from "@/layout";
import { H2 } from "@/layout/text";

export default function About() {
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
            <title>Über mich — Eduard Lotz</title>
            <meta name="description" content="Learn more about Eduard Lotz" />
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
                <H2>Über mich</H2>
                <Content>
                  <p>
                    Hallo! Ich bin Eduard Lotz, ein leidenschaftlicher Designer
                    und Entwickler.
                  </p>
                  <p>
                    Ich liebe es, kreative Lösungen zu entwickeln, die sowohl
                    funktional als auch ästhetisch ansprechend sind.
                  </p>
                  <p>
                    In meiner Freizeit experimentiere ich gerne mit neuen
                    Technologien und sammle Inspiration aus der Welt um mich
                    herum.
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
