import download from "downloadjs";
import Head from "next/head";
import { FormEvent, useState } from "react";
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
import { MotionVariants, LayoutTransition } from "@/styles/motion";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useLoading } from "@/hooks/useLoading";
import { minDelay } from "@/utils/simulate";

export default function Home() {
  const password = useInput("");
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
      download(blob, "eduardl-lotz-design-portfolio.pdf", "application/pdf");

      toast.success("Portfolio downloaded ✨");
      if (!downloaded) setDownloaded(true);
    } else {
      password.setError("Wrong password");
      toast.error("Wrong password 😭");
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
        <title>Eduard Lotz — Design Portfolio</title>
        <meta name="description" content="Eduard Lotz Design Portfolio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <FillColumn>
        <AnimatePresence mode="popLayout">
          <MotionWrapper
            key="portfolio-head"
            variants={MotionVariants.SlideUp}
            animate="animate"
            exit="exit"
            initial="initial"
          >
            <H2>My design portfolio.</H2>
          </MotionWrapper>
        </AnimatePresence>
        <PortfolioContainer layout>
          <LayoutGroup>
            <FillColumn $gap="20px" $align="center" $justify="center">
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
                        placeholder="password"
                        key="password-field"
                      />
                    </MotionWrapper>
                  )}
                </AnimatePresence>
                <Button type="submit" layout disabled={isLoading}>
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
                        download
                      </MotionWrapper>
                    )}
                  </AnimatePresence>
                </Button>
              </MiniForm>
            </FillColumn>
          </LayoutGroup>
        </PortfolioContainer>
      </FillColumn>

      <BottomInfoWrapper>
        <BottomText>
          Over time, this website will eventually become a place for sharing my
          thoughts and ideas in a creative way. My personal collection of ideas,
          notes and inspirations.
        </BottomText>
      </BottomInfoWrapper>
    </>
  );
}

const PortfolioContainer = styled(FillRow)`
  align-items: center;
  justify-content: center;
  margin-top: 40px;
`;

const BottomInfoWrapper = styled(FillRow)`
  height: 100%;
  align-items: flex-end;
`;
