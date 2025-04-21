import Head from "next/head";
import { useEffect, useState } from "react";

import styled from "styled-components";

import { FillRow, FillColumn, HugRow } from "@/layout";
import { MotionWrapper } from "@/layout/atoms";

import { BottomText, H2 } from "@/layout/text";
import { MotionVariants } from "@/styles/motion";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";

import { useRouter } from "next/router";
import { useKeyPress } from "@/hooks/useKeyPress";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";

const inertiaTransition = {
  type: "inertia" as const,
  bounceStiffness: 300,
  bounceDamping: 40,
  timeConstant: 300,
};

const staticTransition = {
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1],
};

const CustomToast = styled.div`
  background-color: white;
  color: black;
  padding: 20px 30px;
  height: 58px;
  min-width: 320px;
  max-width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 24px;
  box-shadow: 0 4px 10px 10px rgba(37, 36, 39, 0.08);
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const ErrorToast = styled(CustomToast)`
  background-color: #121212;
  color: #f2f2f4;
`;

export default function About() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true); // Controls visibility for animation

  // Initialize height to 0 to avoid SSR issues.
  const [h, setH] = useState(0);

  useEffect(() => {
    // Now it's safe to access window.
    setH(window.innerHeight);
  }, []);

  // Use the motion values based on the computed height.
  const y = useMotionValue(h);
  const bgOpacity = useTransform(y, [0, h], [0.4, 0]);
  const bg = useMotionTemplate`rgba(0, 0, 0, ${bgOpacity})`;

  const closeModal = () => {
    setIsVisible(false); // triggers exit animation
  };

  useKeyPress("Escape", () => {
    if (isVisible) {
      closeModal();
    }
  });

  return (
    <AnimatePresence
      onExitComplete={() => {
        router.push("/", undefined, { shallow: true }); // Only change route AFTER animation finishes
      }}
    >
      {isVisible && (
        <>
          <Head>
            <title>Eduard Lotz — Über mich</title>
            <meta name="description" content="Eduard Lotz Design Portfolio" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <Backdrop
            onClick={closeModal}
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            style={{ backgroundColor: bg as any }}
          >
            <ModalContent
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              key="portfolio-modal"
              layout
              variants={MotionVariants.SpringScaleReversed}
              animate="animate"
              initial="initial"
              exit="exit"
              transition={staticTransition}
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
                  animate(y, 0, { ...inertiaTransition, min: 0, max: 0 });
                }
              }}
            >
              <FillColumn $gap="12px">
                <CloseButton
                  variants={MOTION_VARIANTS.springScaleReversed}
                  animate="animate"
                  exit="exit"
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={closeModal}
                >
                  <CloseIcon />
                </CloseButton>
                <AnimatePresence mode="popLayout">
                  <MotionWrapper
                    key="portfolio-head"
                    variants={MotionVariants.SlideUp}
                    animate="animate"
                    exit="exit"
                    initial="initial"
                    layout="position"
                  >
                    <H2>Über mich</H2>
                  </MotionWrapper>
                </AnimatePresence>
                <BottomText>
                  Ich arbeite an der Schnittstelle von Gestaltung, Technologie
                  und Konzept —digitale Medien und visuelle Kommunikation.
                </BottomText>
                <BottomText>
                  Ich mag klare Ideen, durchdachte Gestaltung und Systeme, die
                  funktionieren, ohne sich in den Vordergrund zu drängen.
                  Gleichzeitig liebe ich es, Dinge zu hinterfragen, neu zu
                  denken oder einfach mal auszuprobieren, was passiert.
                </BottomText>
                <BottomText>
                  In meinen Projekten verbinde ich analytisches Denken mit einer
                  guten Portion Intuition.Struktur hilft mir, Ideen greifbar zu
                  machen - Neugier bringt sie in Bewegung.
                </BottomText>
                <BottomText>
                  Diese Seite zeigt einen Ausschnitt meiner Arbeit, aber auch
                  ein bisschen, wie ich ticke.
                </BottomText>
                <BottomText>С Богом, Эдик.</BottomText>
              </FillColumn>
            </ModalContent>
          </Backdrop>

          <BottomInfoWrapper></BottomInfoWrapper>
        </>
      )}
    </AnimatePresence>
  );
}

const PortfolioContainer = styled(FillRow)`
  align-items: center;
  justify-content: center;
  margin-top: 20px;
`;

const BottomInfoWrapper = styled(FillRow)`
  height: 100%;
  align-items: flex-end;
`;

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 18, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const BODY_BORDER_RADIUS = 20;

const ModalContent = styled(motion.div)`
  background: white;
  padding: 10px 16px;
  padding-top: 24px;
  border-radius: ${BODY_BORDER_RADIUS}px;
  max-width: 400px;
  width: calc(100% - 24px);
`;

const CLOSEBUTTON_OFFSET = 8;

const CloseButton = styled(motion.button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  z-index: 1;

  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  right: ${CLOSEBUTTON_OFFSET}px;
  top: ${CLOSEBUTTON_OFFSET}px;

  background: rgba(33, 33, 33, 0.05);
  border-radius: calc(${BODY_BORDER_RADIUS}px - ${CLOSEBUTTON_OFFSET}px);
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
