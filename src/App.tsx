import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FullScreen, ContentWidth, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import { toast, Toaster } from "sonner";
import styled from "styled-components";
import { getRouteLabelByPath, ROUTE_PATHS, useAppStore } from "@/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAnimations } from "@/hooks/useAnimations";
import { DialogRoot } from "@/molecules/DialogRoot";
import { executeMigrationsWhenReady } from "@/store/migrationExecutor";

// Route Components
import Home from "./routes/Home";
import About from "./routes/About";
import Portfolio from "./routes/Portfolio";
import Technical from "./routes/Technical";
import Creative from "./routes/Creative";
import Guestbook from "./routes/Guestbook";
import { AnimatePresence, motion } from "motion/react";
import MiniGames from "./routes/MiniGames";
import { useMessageSystem } from "@/hooks/useMessageSystem";

export default function App() {
  const location = useLocation();
  const { setCurrentRoute, currentRoute } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [currentRouteInPretty, setCurrentRouteInPretty] = useState("");
  const [showRouteChip, setShowRouteChip] = useState(false);

  useAnimations();
  // initialize message system globally so it can enqueue messages on route/tap events
  useMessageSystem();

  useEffect(() => {
    setCurrentRoute(location.pathname);
    setMounted(true);
  }, []);

  // Execute queued migrations after stores are ready
  useEffect(() => {
    if (mounted) {
      // Execute migrations after a short delay to ensure all stores are initialized
      const timer = setTimeout(() => {
        executeMigrationsWhenReady().catch(console.error);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // sync router location with store
  // fix potential access to locked pages
  useEffect(() => {
    if (currentRoute !== location.pathname) {
      setCurrentRoute(location.pathname);

      if (mounted) {
        const route = getRouteLabelByPath(location.pathname);
        setCurrentRouteInPretty(route);
        setShowRouteChip(true);

        setTimeout(() => {
          setShowRouteChip(false);
        }, 1800);
      }
    }
  }, [location.pathname, currentRoute, setCurrentRoute]);

  return (
    <ThemeProvider>
      <GlobalStyle />

      <Toaster duration={5000} position="top-center" />
      <AnimatePresence mode="sync">
        <RouteChip
          initial={{ y: -120, filter: "blur(6px)" }}
          animate={{
            y: showRouteChip ? 0 : -120,
            filter: showRouteChip ? "blur(0px)" : "blur(6px)",
          }}
          exit={{ y: -120, filter: "blur(6px)" }}
          transition={{ duration: 0.9, ease: "circInOut" }}
        >
          {currentRouteInPretty}
        </RouteChip>
      </AnimatePresence>

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
                <Route path={ROUTE_PATHS.MINIGAMES} element={<MiniGames />} />
              </Routes>
            </ContentWidth>
          </ContentWrapper>
        </MainLayout>
      </FullScreen>

      <DialogRoot />
    </ThemeProvider>
  );
}

const ContentWrapper = styled(FillColumn)`
  padding: 16px;
  padding-top: 100px;
`;

export const RouteChip = styled(motion.div)`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  margin: 0 auto;

  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;

  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(32px);
  backdrop-filter: blur(32px);
  border-radius: 50px;
  font-size: 16px;
  letter-spacing: -2%;
  font-weight: 600;
  z-index: 1000;
`;
