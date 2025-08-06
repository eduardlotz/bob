import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { FullScreen, ContentWidth, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import { Toaster } from "sonner";
import styled from "styled-components";
import { ROUTE_PATHS, useAppStore } from "@/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAnimations } from "@/hooks/useAnimations";
import { UILayer } from "@/components/UILayer";

// Route Components
import Home from "./routes/Home";
import About from "./routes/About";
import Portfolio from "./routes/Portfolio";
import Technical from "./routes/Technical";
import Creative from "./routes/Creative";
import Guestbook from "./routes/Guestbook";

export default function App() {
  const location = useLocation();
  const { setCurrentRoute, currentRoute } = useAppStore();

  // Initialize animations hook
  useAnimations();

  // Initialize route on app startup
  useEffect(() => {
    const initialRoute =
      location.pathname === "/" ? "/home" : location.pathname;
    if (!currentRoute || currentRoute !== initialRoute) {
      console.log("App: Initializing route to:", initialRoute);
      setCurrentRoute(initialRoute);
    }
  }, []);

  // // Sync router location with store
  useEffect(() => {
    // Update the current route and ensure it's properly set
    setCurrentRoute(location.pathname);
  }, [location.pathname]);

  return (
    <ThemeProvider>
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
                <Route
                  path="/"
                  element={<Navigate to={ROUTE_PATHS.HOME} replace />}
                />
                <Route path={ROUTE_PATHS.HOME} element={<Home />} />
                <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
                <Route path={ROUTE_PATHS.TECHNICAL} element={<Technical />} />
                <Route path={ROUTE_PATHS.CREATIVE} element={<Creative />} />
                <Route path={ROUTE_PATHS.PORTFOLIO} element={<Portfolio />} />
                <Route path={ROUTE_PATHS.GUESTBOOK} element={<Guestbook />} />
              </Routes>
            </ContentWidth>
          </ContentWrapper>
        </MainLayout>
      </FullScreen>
    </ThemeProvider>
  );
}

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
  padding-top: 100px;
`;
