import download from "downloadjs";
import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import styled from "styled-components";

import { useInput } from "@/hooks/useInput";
import { FillRow, FillColumn, HugRow } from "@/layout";
import { Button, MotionIconWrapper, MotionWrapper } from "@/layout/atoms";
import {
  CheckmarkIcon,
  LoadingSpinner,
  LockIcon,
  UnlockedIcon,
} from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MiniForm, PasswordField } from "@/molecules/form";
import { MotionVariants } from "@/styles/motion";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useLoading } from "@/hooks/useLoading";
import { minDelay } from "@/utils/simulate";
import { useRouter } from "next/router";
import { useKeyPress } from "@/hooks/useKeyPress";

const inertiaTransition = {
  type: "inertia" as const,
  bounceStiffness: 300,
  bounceDamping: 40,
  timeConstant: 300,
};

const staticTransition = {
  type: "tween" as const,
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1],
};

const CustomToast = styled.div`
  background-color: white;
  color: black;
  padding: 20px 30px;
  height: 58px;
  width: 320px;
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
  /* background-color: #121212;
  color: #f2f2f4; */
  /* border: 2px solid #121212; */
`;

export default function Home() {
  const router = useRouter();
  const password = useInput("");
  const [downloaded, setDownloaded] = useState(false);
  const { isLoading, startLoading, stopLoading } = useLoading();
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

  const downloadPortfolio = async (e: FormEvent) => {
    e.preventDefault();

    if (password.value === "") {
      return;
    }

    startLoading();
    const response = await minDelay(
      fetch("/api/portfolio/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.value }),
      }),
      1000
    );

    if (response.ok) {
      const blob = await response.blob();
      download(blob, "eduardl-lotz-design-portfolio.pdf", "application/pdf");

      toast.custom((id) => <CustomToast>Viel Spaß ✨</CustomToast>);
      if (!downloaded) setDownloaded(true);
    } else {
      password.setError("Falsches Passwort");
      toast.custom((id) => <ErrorToast>Falsch ☹️</ErrorToast>);
    }
    stopLoading();
  };

  const DownloadSuccess = () => (
    <HugRow
      variants={MotionVariants.SpringScale}
      animate="animate"
      exit="exit"
      initial="initial"
      $padding="20px"
      layout="position"
    >
      <CheckmarkIcon />
    </HugRow>
  );

  return (
    <AnimatePresence
      onExitComplete={() => {
        router.push("/", undefined, { shallow: true }); // Only change route AFTER animation finishes
      }}
    >
      {isVisible && (
        <>
          <Head>
            <title>Eduard Lotz — Design Portfolio</title>
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
              <FillColumn>
                <AnimatePresence mode="popLayout">
                  <MotionWrapper
                    key="portfolio-head"
                    variants={MotionVariants.SlideUp}
                    animate="animate"
                    exit="exit"
                    initial="initial"
                    layout="position"
                  >
                    <H2>Design Portfolio</H2>
                  </MotionWrapper>
                </AnimatePresence>
                <PortfolioContainer layout>
                  <FillColumn $gap="12px" $align="center" $justify="center">
                    <AnimatePresence mode="popLayout">
                      {downloaded ? (
                        <MotionIconWrapper
                          variants={MotionVariants.SlideUp}
                          animate="animate"
                          exit="exit"
                          initial="initial"
                          layoutId="lock-icon"
                          layout="position"
                        >
                          <UnlockedIcon color="#121212" />
                        </MotionIconWrapper>
                      ) : (
                        <MotionIconWrapper
                          variants={MotionVariants.SlideUp}
                          animate="animate"
                          exit="exit"
                          initial="initial"
                          layoutId="lock-icon"
                          layout="position"
                        >
                          <LockIcon color="#121212" />
                        </MotionIconWrapper>
                      )}
                    </AnimatePresence>

                    {!downloaded && <BottomText>Passwortgeschützt</BottomText>}

                    <MiniForm
                      onSubmit={downloadPortfolio}
                      variants={MotionVariants.SlideUp}
                      animate="animate"
                      exit="exit"
                      initial="initial"
                      layout
                    >
                      <AnimatePresence mode="popLayout">
                        {!downloaded && (
                          <MotionWrapper key="password-field">
                            <PasswordField
                              value={password.value}
                              onChange={password.setValue}
                              placeholder="********"
                            />
                          </MotionWrapper>
                        )}
                      </AnimatePresence>
                      <Button
                        type="submit"
                        layout="position"
                        disabled={isLoading}
                      >
                        <AnimatePresence mode="popLayout">
                          {isLoading ? (
                            <LoadingSpinner
                              variants={MotionVariants.SpringScale}
                              animate="animate"
                              exit="exit"
                              initial="initial"
                              color="#ffffff"
                              key="loading-spinner"
                            />
                          ) : (
                            <MotionWrapper
                              variants={MotionVariants.SpringScale}
                              animate="animate"
                              exit="exit"
                              initial="initial"
                              key="download-button"
                            >
                              {downloaded ? <DownloadSuccess /> : <>download</>}
                            </MotionWrapper>
                          )}
                        </AnimatePresence>
                      </Button>
                    </MiniForm>
                  </FillColumn>
                </PortfolioContainer>
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

const ModalContent = styled(motion.div)`
  background: white;
  padding: 20px;
  padding-top: 24px;
  border-radius: 44px;
  max-width: 400px;
  width: calc(100% - 24px);
`;
