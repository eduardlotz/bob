import download from "downloadjs";
import Head from "next/head";
import { FormEvent, useState } from "react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import styled from "styled-components";

import { useInput } from "@/hooks/useInput";
import {
  FullScreen,
  ContentWidth,
  FillRow,
  FillColumn,
  HugRow,
  HugColumn,
} from "@/layout";
import {
  Button,
  IconButton,
  Logo,
  MotionIconWrapper,
  MotionWrapper,
} from "@/layout/atoms";
import {
  ArrowLeftIcon,
  CheckmarkIcon,
  LoadingSpinner,
  LockIcon,
  UnlockedIcon,
} from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MiniForm, PasswordField } from "@/molecules/form";
import { MotionVariants } from "@/styles/motion";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useLoading } from "@/hooks/useLoading";
import { minDelay } from "@/utils/simulate";

export default function Home() {
  const password = useInput("");
  const [showPassword, setShowPassword] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { isLoading, startLoading, stopLoading } = useLoading();

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
      download(blob, "portfolio.pdf", "application/pdf");

      toast.success("Portfolio wurde heruntergeladen.");
      if (!downloaded) setDownloaded(true);
    } else {
      password.setError("Falsches Passwort");
      toast.error("Falsches Passwort 😭");
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
    <>
      <Head>
        <title>Eduard Lotz — Design + Development</title>
        <meta name="description" content="Eduard Lotz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="top-right" />

      <FullScreen>
        <NavigationWrapper>
          <ContentWidth>
            <FillRow $align="center" $justify="center">
              <IconLink
                href="/"
                variants={MotionVariants.SpringScale}
                animate="animate"
                exit="exit"
                initial="initial"
              >
                <Logo />
              </IconLink>
            </FillRow>
          </ContentWidth>
        </NavigationWrapper>

        <ContentWrapper>
          <ContentWidth>
            <AnimatePresence mode="popLayout">
              {showPassword ? (
                <HugColumn
                  key="portfolio-head"
                  variants={MotionVariants.SlideUp}
                  animate="animate"
                  exit="exit"
                  initial="initial"
                  layout="position"
                >
                  <IconButton
                    onClick={() => setShowPassword(false)}
                    type="button"
                  >
                    <ArrowLeftIcon />
                  </IconButton>
                  <H2>Mein Design Portfolio.</H2>
                </HugColumn>
              ) : (
                <HugColumn
                  $gap="0"
                  $justify="flex-start"
                  $align="center"
                  key="landing-hello"
                  variants={MotionVariants.SlideUp}
                  animate="animate"
                  exit="exit"
                  initial="initial"
                >
                  <H2>Hallöchen.</H2>
                  <H2 custom={1}>Hier ist leider noch Baustelle.</H2>
                </HugColumn>
              )}
            </AnimatePresence>

            <PortfolioContainer
              layout
              variants={MotionVariants.SlideUp}
              animate="animate"
              exit="exit"
              initial="initial"
              custom={2}
            >
              <LayoutGroup>
                {showPassword ? (
                  <HugColumn $gap="20px" $align="center" $justify="center">
                    <MotionIconWrapper layoutId="lock-icon" layout="position">
                      {downloaded ? (
                        <UnlockedIcon color="#121212" />
                      ) : (
                        <LockIcon color="#121212" />
                      )}
                    </MotionIconWrapper>
                    <MiniForm
                      onSubmit={downloadPortfolio}
                      variants={MotionVariants.SpringScaleReversed}
                      animate="animate"
                      exit="exit"
                      initial="initial"
                      layout="position"
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {downloaded ? (
                          <DownloadSuccess key="download-success" />
                        ) : (
                          <MotionWrapper key="password-field">
                            <PasswordField
                              value={password.value}
                              onChange={password.setValue}
                              placeholder="Passwort eingeben"
                              key="password-field"
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
                              variants={MotionVariants.SlideInDown}
                              animate="animate"
                              exit="exit"
                              initial="initial"
                              color="#ffffff"
                              key="loading-spinner"
                            />
                          ) : downloaded ? (
                            <MotionWrapper
                              variants={MotionVariants.SlideInDown}
                              animate="animate"
                              exit="exit"
                              initial="initial"
                              key="download-again"
                            >
                              nochmal herunterladen
                            </MotionWrapper>
                          ) : (
                            <MotionWrapper
                              variants={MotionVariants.SlideInDown}
                              animate="animate"
                              exit="exit"
                              initial="initial"
                              key="download-button"
                            >
                              herunterladen
                            </MotionWrapper>
                          )}
                        </AnimatePresence>
                      </Button>
                    </MiniForm>
                  </HugColumn>
                ) : (
                  <HugColumn
                    $align="center"
                    $gap="20px"
                    key="start-form"
                    layout="position"
                  >
                    <MotionIconWrapper
                      layoutId="lock-icon"
                      layout="position"
                      initial={false}
                    >
                      {downloaded ? (
                        <UnlockedIcon color="#121212" />
                      ) : (
                        <LockIcon color="#121212" />
                      )}
                    </MotionIconWrapper>
                    <MotionIconWrapper
                      layout="position"
                      variants={MotionVariants.SpringScaleReversed}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Button
                        layout="position"
                        type="button"
                        onClick={() => setShowPassword(true)}
                      >
                        Portfolio
                      </Button>
                    </MotionIconWrapper>
                  </HugColumn>
                )}
              </LayoutGroup>
            </PortfolioContainer>

            <BottomInfoWrapper
              variants={MotionVariants.SlideUp}
              animate="animate"
              exit="exit"
              initial="initial"
              custom={6}
            >
              <BottomText>
                Im Laufe der Zeit soll diese Website als Ort dienen, an dem ich
                meine Gedanken und Ideen auf eine kreative Weise teilen kann.
                Meine persönliche Sammlung von Experimenten, Notizen und
                Inspirationen.
              </BottomText>
            </BottomInfoWrapper>
          </ContentWidth>
        </ContentWrapper>
      </FullScreen>
    </>
  );
}

const NavigationWrapper = styled.div`
  width: 100%;
  padding: 40px 16px 0 16px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
  padding-top: 100px;
`;

const PortfolioContainer = styled(FillRow)`
  align-items: center;
  justify-content: center;
  margin-top: 80px;
`;

const BottomInfoWrapper = styled(FillRow)`
  height: 100%;
  align-items: flex-end;
`;

const LinkButton = styled.a`
  display: flex;
  padding: 12px 20px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 50px;
  background: #121212;

  color: #fff;
  text-align: right;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-decoration: none;

  box-shadow: 0px 0px 0px 0px #000;
  transition: box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 0px 4px #000;
  }
`;

const IconLink = styled(motion(Link))`
  text-decoration: none;
`;
