import { FullScreen, ContentWidth, FillRow, FillColumn } from "@/layout";
import { Logo } from "@/layout/atoms";
import { BottomText, H2 } from "@/layout/text";
import Head from "next/head";
import styled from "styled-components";

export default function Home() {
  return (
    <>
      <Head>
        <title>Eduard Lotz — Design + Development</title>
        <meta name="description" content="Eduard Lotz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
              <H2>
                Der Rest der Seite befindet sich leider noch in Arbeit, bis
                dahin kannst du dir aber mein Portfolio anschauen.
              </H2>
            </FillColumn>

            <ButtonContainer>
              <LinkButton href="/documents/portfolio.pdf">
                Portfolio öffnen
              </LinkButton>
            </ButtonContainer>

            <BottomInfoWrapper>
              <BottomText>
                Im Laufe der Zeit soll diese Website dient als Ort dienen, an
                dem ich meine Gedanken und Ideen auf eine kreative Weise teilen
                kann. Es wird meine persönliche Sammlung von Gedanken, Ideen,
                Notizen und Inspirationen.
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

const ButtonContainer = styled(FillRow)`
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
