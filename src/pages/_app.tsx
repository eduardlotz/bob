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

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
  padding-top: 100px;
`;
