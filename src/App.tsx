import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FullScreen, ContentWidth, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import { Toaster } from "sonner";
import styled from "styled-components";
import { useAppStore } from "@/store";

// Route Components
import Home from "./routes/Home";
import About from "./routes/About";
import Portfolio from "./routes/Portfolio";
import Technical from "./routes/Technical";
import Creative from "./routes/Creative";
import Guestbook from "./routes/Guestbook";

export default function App() {
  const location = useLocation();
  const { navigateToRoute } = useAppStore();

  // Sync router location with store and handle dialog opening
  useEffect(() => {
    navigateToRoute(location.pathname);
  }, [location.pathname, navigateToRoute]);

  return (
    <>
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
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/technical" element={<Technical />} />
                <Route path="/creative" element={<Creative />} />
                <Route path="/guestbook" element={<Guestbook />} />
              </Routes>
            </ContentWidth>
          </ContentWrapper>
        </MainLayout>
      </FullScreen>
    </>
  );
}

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
  padding-top: 100px;
`;
