import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FullScreen, ContentWidth, FillColumn } from "@/layout";
import MainLayout from "@/layout/MainLayout";
import { GlobalStyle } from "@/styles/global";
import { Toaster } from "sileo";
import styled from "styled-components";
import {
  getRouteLabelByPath,
  ROUTE_PATHS,
  useAppStore,
  useCoreStore,
  useViewStore,
} from "@/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DebugSceneTuningOverlays } from "@/components/DebugSceneTuningOverlays";

import Home from "./routes/Home";
import About from "./routes/About";
import { AnimatePresence, motion } from "motion/react";
import { useMessageSystem } from "@/hooks/useMessageSystem";
import { FloatingBarProvider, FloatingBarUI } from "./layout/FloatingBar";
import { CursorInputBridge } from "./bridges/CursorInputBridge";
import { ClickableBridge } from "./bridges/ClickableBridge";
import MiniGames from "./routes/MiniGames";
import Portfolio from "./routes/Portfolio";

export default function App() {
  const location = useLocation();
  const { setCurrentRoute, currentRoute } = useAppStore();
  const {
    currentView,
    isImageFocused,
    isTransitioning,
    cameraControlsRef,
    previousView,
    viewMode,
    previousViewMode,
    defaultViewMode,
    lastFocusPosition,
    syncViewToRoute,
  } = useViewStore();
  const viewDebuggerVisible = useCoreStore(
    (state) => state.viewDebuggerVisible,
  );

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

  useEffect(() => {
    syncViewToRoute(location.pathname);
  }, [location.pathname, syncViewToRoute]);

  useEffect(() => {
    if (!cameraControlsRef?.current) return;
    syncViewToRoute(location.pathname);
  }, [cameraControlsRef, location.pathname, syncViewToRoute]);

  // sync router with store
  useEffect(() => {
    if (currentRoute !== location.pathname) {
      if (mounted) {
        setCurrentRoute(location.pathname);
        const route = getRouteLabelByPath(location.pathname);
        setCurrentRouteInPretty(route);
        setShowRouteChip(true);
        setTimeout(() => {
          setShowRouteChip(false);
        }, 1800);

        // return () => {
        //   clearTimeout(routeChipTimer);
        //   clearTimeout(defaultViewTimer);
        // };
      }
    }
  }, [location.pathname, currentRoute, setCurrentRoute]);

  return (
    <ThemeProvider>
      <FloatingBarProvider>
        <GlobalStyle />

        <Toaster
          position="top-center"
          offset={"1.25rem"}
          options={{
            icon: (
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
            fill: "#212121",
            styles: {
              title: "toast-title",
              description: "toast-desc",
            },
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
            <ViewDebug layout>
              <p>
                CameraControls:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.active ? "active" : "-"}
                </DebugValueChip>
              </p>
              <p>
                LastFocusPoint: x:
                <DebugValueChip>
                  {lastFocusPosition?.x.toFixed(0)}
                </DebugValueChip>{" "}
                y:
                <DebugValueChip>
                  {lastFocusPosition?.y.toFixed(0)}
                </DebugValueChip>{" "}
                z:
                <DebugValueChip>
                  {lastFocusPosition?.z.toFixed(0)}
                </DebugValueChip>
              </p>
              <p>
                Distance:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.distance.toFixed(2)}
                </DebugValueChip>
              </p>
              <p>
                Polar Angle:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.polarAngle.toFixed(2)}
                </DebugValueChip>
              </p>
              <p>
                Polar min:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.minPolarAngle.toFixed(2)}
                </DebugValueChip>
              </p>
              <p>
                Polar max:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.minPolarAngle.toFixed(2)}
                </DebugValueChip>
              </p>
              <p>
                Azimuth Angle:{" "}
                <DebugValueChip>
                  {cameraControlsRef?.current?.azimuthAngle.toFixed(2)}
                </DebugValueChip>
              </p>
              <hr />
              <p>
                transitioning?{" "}
                <DebugValueChip>
                  {isTransitioning ? "yes" : "no"}
                </DebugValueChip>
              </p>
              <p>
                Current View: <DebugValueChip>{currentView}</DebugValueChip>
              </p>
              <p>
                Previous View: <DebugValueChip>{previousView}</DebugValueChip>
              </p>
              <hr />
              <p>
                Default ViewMode:{" "}
                <DebugValueChip>{defaultViewMode}</DebugValueChip>
              </p>
              <p>
                Current ViewMode: <DebugValueChip>{viewMode}</DebugValueChip>
              </p>
              <p>
                Previous ViewMode:{" "}
                <DebugValueChip>{previousViewMode}</DebugValueChip>
              </p>
            </ViewDebug>
          )}

          <DebugSceneTuningOverlays />

          <MainLayout>
            <ContentWrapper>
              <ContentWidth>
                <Routes>
                  <Route path={ROUTE_PATHS.HOME} element={<Home />} />
                  <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
                  <Route path={ROUTE_PATHS.PORTFOLIO} element={<Portfolio />} />
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
  top: 8px;
  left: 8px;
  right: 0;

  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);

  display: flex;
  flex-direction: column;
  gap: 8px;

  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(32px);
  backdrop-filter: blur(32px);
  /* letter-spacing: -2%; */
  font-weight: 600;

  font-size: 14px;
  pointer-events: none;
  z-index: 1;
  word-break: break-all;

  hr {
    width: 100%;
    opacity: 0.5;
  }
`;

const DebugValueChip = styled.span`
  padding: 0px 8px;
  background-color: #f1f1f1;
  color: #212121;
  border-radius: 12px;
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
