import { FullScreen, ContentWidth, FillRow, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "sonner";
import styled from "styled-components";
import { RouteProvider } from "@/contexts/RouteContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RouteProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalStyle />

      <Toaster
        position="top-center"
        style={
          {
            "--width": "320px",
          } as React.CSSProperties
        }
      />

      <FullScreen>
        <MainLayout>
          <ContentWrapper>
            <ContentWidth>
              <Component {...pageProps} />
            </ContentWidth>
          </ContentWrapper>
        </MainLayout>
      </FullScreen>
    </RouteProvider>
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
