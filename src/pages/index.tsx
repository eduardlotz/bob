import download from "downloadjs";
import Head from "next/head";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import styled from "styled-components";

import { useInput } from "@/hooks/useInput";
import {
  FullScreen,
  ContentWidth,
  FillRow,
  FillColumn,
  HugRow,
} from "@/layout";
import { Logo } from "@/layout/atoms";
import { LockIcon } from "@/layout/icons";
import { BottomText, H2 } from "@/layout/text";
import { MiniForm, PasswordField } from "@/molecules/form";

export default function Home() {
  const password = useInput("");
  const [showPassword, setShowPassword] = useState(false);

  const openPasswordField = () => {
    setShowPassword(true);
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

      <Toaster position="bottom-center" />

      <FullScreen>
        <NavigationWrapper>
          <ContentWidth>
            <FillRow $align="center" $justify="flex-start">
              <Logo />
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
              <H2>Hier ist leider noch Baustelle.</H2>
            </FillColumn>

            <PortfolioContainer>
              {showPassword ? (
                <HugRow $gap="10px">
                  <LockIcon color="#121212" />
                  <MiniForm onSubmit={checkPassword}>
                    <PasswordField
                      value={password.value}
                      onChange={password.setValue}
                      placeholder="Passwort eingeben"
                    />
                  </MiniForm>
                </HugRow>
              ) : (
                <Button onClick={openPasswordField}>
                  <LockIcon color="#ffffff" />
                  Portfolio
                </Button>
              )}
            </PortfolioContainer>

            <BottomInfoWrapper>
              <BottomText>
                Im Laufe der Zeit soll diese Website als Ort dienen, an dem ich
                meine Gedanken und Ideen auf eine kreative Weise teilen kann. Es
                wird meine persönliche Sammlung von Ideen, Notizen und
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
  padding: 54px;
  border-radius: 30px;
  background: rgba(18, 18, 18, 0.04);
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
`;
