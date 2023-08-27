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
} from "@/layout";
import { IconButton, Logo, MotionWrapper } from "@/layout/atoms";
import { LockIcon } from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MiniForm, PasswordField } from "@/molecules/form";
import { MotionVariants } from "@/styles/motion";

export default function Home() {
  const password = useInput("");
  const [showPassword, setShowPassword] = useState(false);

  const openPasswordField = () => {
    setShowPassword(true);
  };

  const closePasswordField = () => {
    setShowPassword(false);
  };

  const checkPassword = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.value === "") return;

    const response = await fetch("/api/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password.value }),
    });

    if (response.ok) {
      const blob = await response.blob();
      download(blob, "portfolio.pdf", "application/pdf");

      toast.success("Aber nicht weitergeben 👀");
    } else toast.error("Du darfst nicht.");

    console.log("response", response);
  };

  return (
    <>
      <Head>
        <title>Eduard Lotz — Design + Development</title>
        <meta name="description" content="Eduard Lotz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="bottom-right" />

      <FullScreen>
        <NavigationWrapper>
          <ContentWidth>
            <FillRow $align="center" $justify="flex-start">
              <IconLink href="/">
                <Logo />
              </IconLink>
            </FillRow>
          </ContentWidth>
        </NavigationWrapper>

        <ContentWrapper>
          <ContentWidth>
            <FillColumn $gap="32px" $justify="flex-start" $align="flex-start">
              <H2>
                Hallöchen, ich bin Eddie. <br />
                Brillenschlange, Designer und Entwickler 🥸
              </H2>
              <H2>
                Hier ist leider noch Baustelle. <br />
                Bisher gibt es nur mein Portfolio zu sehen.
              </H2>
            </FillColumn>

            <PortfolioContainer>
              {showPassword ? (
                <HugRow $gap="10px">
                  <IconButton layoutId="lock-icon" onClick={closePasswordField}>
                    <LockIcon color="#121212" />
                  </IconButton>
                  <MiniForm
                    onSubmit={checkPassword}
                    variants={MotionVariants.SpringScale}
                    animate="animate"
                    exit="exit"
                    initial="initial"
                  >
                    <PasswordField
                      value={password.value}
                      onChange={password.setValue}
                      placeholder="Passwort eingeben"
                    />
                  </MiniForm>
                </HugRow>
              ) : (
                <Button onClick={openPasswordField}>
                  <MotionWrapper layoutId="lock-icon">
                    <LockIcon color="#ffffff" />
                  </MotionWrapper>
                  Portfolio herunterladen
                </Button>
              )}
            </PortfolioContainer>

            <BottomInfoWrapper>
              <BottomText>
                Im Laufe der Zeit soll diese Website als Ort dienen, an dem ich
                meine Gedanken und Ideen auf eine kreative Weise teilen kann.
                <br />
                Meine persönliche Sammlung von Ideen, Notizen und Inspirationen.
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
  padding: 54px;
  border-radius: 30px;
  background: #f6f6f6;
  margin-top: 80px;
`;

const Button = styled.button`
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

  box-shadow: 0px 0px 0px 0px #000;
  transition: box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 0.8);
  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 0px 4px #000;
  }
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

const IconLink = styled(Link)`
  text-decoration: none;
`;
