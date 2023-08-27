import download from "downloadjs";
import Head from "next/head";
import { useState } from "react";
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
  Logo,
  MotionIconWrapper,
  RoundIconButton,
} from "@/layout/atoms";
import {
  ArrowRightIcon,
  CheckmarkIcon,
  DownloadIcon,
  LoadingSpinner,
  LockIcon,
} from "@/layout/icons";
import { BottomText, H2, UppercaseText } from "@/layout/text";
import { MiniForm, PasswordField } from "@/molecules/form";
import { MotionVariants } from "@/styles/motion";
import { motion } from "framer-motion";
import { useLoading } from "@/hooks/useLoading";

export default function Home() {
  const password = useInput("");
  const [showPassword, setShowPassword] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const { isLoading, startLoading, stopLoading } = useLoading();

  const checkPassword = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    startLoading();

    if (password.value === "") return;

    const response = await fetch("/api/portfolio/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password.value }),
    });

    if (response.ok) setShowPassword(false);
    else {
      password.setError("Falsches Passwort");
      toast.error("Falsches Passwort 😭");
    }
    stopLoading();
  };

  const downloadPortfolio = async () => {
    startLoading();
    const response = await fetch("/api/portfolio/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password.value }),
    });

    if (response.ok) {
      const blob = await response.blob();
      download(blob, "portfolio.pdf", "application/pdf");

      toast.success("Portfolio wurde heruntergeladen.");
      setDownloaded(true);
    } else toast.error("Interner Fehler aufgetreten.");
    stopLoading();
  };

  const DownloadSuccess = () => (
    <HugRow
      variants={MotionVariants.SpringScale}
      animate="animate"
      exit="exit"
      initial="initial"
    >
      <CheckmarkIcon />
      <UppercaseText>download erfolgreich</UppercaseText>
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
            <FillRow $align="center" $justify="flex-start">
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
            <FillColumn $gap="32px" $justify="flex-start" $align="flex-start">
              <H2
                variants={MotionVariants.SlideUp}
                animate="animate"
                exit="exit"
                initial="initial"
              >
                Hallöchen, ich bin Eddie. <br />
                Brillenschlange, Designer und Entwickler. 🥸
              </H2>
              <H2
                variants={MotionVariants.SlideUp}
                animate="animate"
                exit="exit"
                initial="initial"
                custom={2}
              >
                Mit dem richtigen Passwort kannst du mein Portfolio
                herunterladen, ansonsten ist hier noch Baustelle. 🚧
              </H2>
            </FillColumn>

            <PortfolioContainer layout>
              {downloaded ? (
                <DownloadSuccess />
              ) : showPassword ? (
                <HugColumn $gap="16px" $align="center" $justify="center">
                  <MotionIconWrapper layout="position">
                    <LockIcon color="#121212" />
                  </MotionIconWrapper>
                  <MiniForm onSubmit={checkPassword}>
                    <PasswordField
                      value={password.value}
                      onChange={password.setValue}
                      placeholder="Passwort eingeben"
                    />
                    {password.value.length > 0 && (
                      <RoundIconButton
                        type="submit"
                        variants={MotionVariants.SlideIn}
                        animate="animate"
                        exit="exit"
                        initial="initial"
                        layout="position"
                        key="submit-button"
                      >
                        {isLoading ? <LoadingSpinner /> : <ArrowRightIcon />}
                      </RoundIconButton>
                    )}
                  </MiniForm>
                </HugColumn>
              ) : isLoading ? (
                <LoadingSpinner color="#121212" />
              ) : (
                <Button
                  onClick={downloadPortfolio}
                  variants={MotionVariants.SpringScaleReversed}
                  animate="animate"
                  exit="exit"
                  initial="initial"
                >
                  <DownloadIcon />
                  Portfolio herunterladen
                </Button>
              )}
            </PortfolioContainer>

            <BottomInfoWrapper
              variants={MotionVariants.SlideUp}
              animate="animate"
              exit="exit"
              initial="initial"
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
  padding: 16px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
`;

const PortfolioContainer = styled(FillRow)`
  align-items: center;
  justify-content: center;
  padding: 54px 24px;
  border-radius: 30px;
  background: #f6f6f6;
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
