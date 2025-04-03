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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

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
