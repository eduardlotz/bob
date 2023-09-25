import { FullScreen, ContentWidth, FillRow, FillColumn } from "@/layout";
import { Logo } from "@/layout/atoms";
import { GlobalStyle } from "@/styles/global";
import { MotionVariants } from "@/styles/motion";
import { motion } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { Toaster } from "sonner";
import styled from "styled-components";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalStyle />

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
            <Component {...pageProps} />
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

const IconLink = styled(motion(Link))`
  text-decoration: none;
`;
