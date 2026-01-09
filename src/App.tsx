import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FullScreen, ContentWidth, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import { Toaster } from "sonner";
import styled from "styled-components";
import {
  getRouteLabelByPath,
  ROUTE_PATHS,
  useAppStore,
  useCoreStore,
  useViewStore,
} from "@/store";
import { ThemeProvider } from "@/components/ThemeProvider";

import Home from "./routes/Home";
import About from "./routes/About";
import { AnimatePresence, motion } from "motion/react";
import { useMessageSystem } from "@/hooks/useMessageSystem";
import { FloatingBarProvider, FloatingBarUI } from "./layout/FloatingBar";
import Creative from "./routes/Creative";
import { stopAllWorldSounds } from "./utils/soundSystem";
import { CursorInputBridge } from "./bridges/CursorInputBridge";
import { ClickableBridge } from "./bridges/ClickableBridge";
import MiniGames from "./routes/MiniGames";

export default function App() {
  const location = useLocation();
  const { setCurrentRoute, currentRoute } = useAppStore();
  const {
    currentView,
    isImageFocused,
    isTransitioning,
    previousView,
    viewMode,
    previousViewMode,
    defaultViewMode,
  } = useViewStore();
  const { viewDebuggerVisible } = useCoreStore();

  const [mounted, setMounted] = useState(false);
  const [currentRouteInPretty, setCurrentRouteInPretty] = useState("");
  const [showRouteChip, setShowRouteChip] = useState(false);

  // init message system globally
  // not a real hook (TODO: change name)
  useMessageSystem();

  useEffect(() => {
    setCurrentRoute(location.pathname);
    setMounted(true);
  }, []);

  // sync router with store
  // stop all previous world sounds onRouteChange
  useEffect(() => {
    if (currentRoute !== location.pathname) {
      setCurrentRoute(location.pathname);
      stopAllWorldSounds();

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
      <FloatingBarProvider>
        <GlobalStyle />

        <Toaster
          duration={5000}
          position="top-center"
          offset={"1.25rem"}
          theme="dark"
          icons={{
            success: (
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.0678 4.9491C23.0378 8.9191 22.9678 15.3991 18.8678 19.2891C15.0778 22.8791 8.92777 22.8791 5.12777 19.2891C1.01777 15.3991 0.947753 8.9191 4.92775 4.9491C8.82775 1.0391 15.1678 1.0391 19.0678 4.9491Z"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.4941 13.0908C16.4941 15.5761 14.4794 17.5908 11.9941 17.5908C9.50886 17.5908 7.49414 15.5761 7.49414 13.0908"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          }}
        />
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
          {viewDebuggerVisible && (
            <ViewDebug>
              <p>transitioning? {isTransitioning ? "yes" : "no"}</p>
              <p>Current View: {currentView}</p>
              <p>Previous View: {previousView}</p>
              <hr />
              <p>Image Focused?: {isImageFocused ? "yes " : "no"}</p>
              <p>Current ViewMode: {viewMode}</p>
              <p>Default ViewMode: {defaultViewMode}</p>
              <p>Previous ViewMode: {previousViewMode}</p>
            </ViewDebug>
          )}

          <MainLayout>
            <ContentWrapper>
              <ContentWidth>
                <Routes>
                  <Route path={ROUTE_PATHS.HOME} element={<Home />} />
                  <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
                  <Route path={ROUTE_PATHS.CREATIVE} element={<Creative />} />
                  <Route path={ROUTE_PATHS.MINIGAMES} element={<MiniGames />} />
                  <Route
                    path="*"
                    element={<Navigate to={ROUTE_PATHS.HOME} replace />}
                  />
                </Routes>
              </ContentWidth>
            </ContentWrapper>
          </MainLayout>

          <FloatingBarUI />
          <CursorInputBridge />
          <ClickableBridge />
        </FullScreen>
      </FloatingBarProvider>
    </ThemeProvider>
  );
}

const ViewDebug = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 200px;
  background: white;
  color: black;
  font-size: 12px;
  font-family: monospace !important;
  border: 2px solid black;
  pointer-events: none;
  z-index: 1;
  padding: 12px;
  word-break: break-all;
`;

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
