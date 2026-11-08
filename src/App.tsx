import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, useEffect, useRef, useState, type CSSProperties } from "react";
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
import { RouteScreenTransitions } from "@/components/RouteScreenTransitions";
import { RouteLoadingBoundary } from "@/components/RouteLoadingBoundary";

import { AnimatePresence, motion } from "motion/react";
import { useMessageSystem } from "@/hooks/useMessageSystem";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { FloatingBarProvider, FloatingBarUI } from "./layout/FloatingBar";
import { CursorInputBridge } from "./bridges/CursorInputBridge";
import { ClickableBridge } from "./bridges/ClickableBridge";
import { useI18n } from "@/i18n";

const Home = lazy(() => import("./routes/Home"));
const About = lazy(() => import("./routes/About"));
const Portfolio = lazy(() => import("./routes/Portfolio"));
const MiniGames = lazy(() => import("./routes/MiniGames"));
const Literature = lazy(() => import("./routes/Literature"));

const SILEO_TOAST_DURATION_MS = 6000;

const toastLightStyle = {
  "--vorgarten-toast-duration": `${SILEO_TOAST_DURATION_MS}ms`,
} as CSSProperties;

const ToastTopLights = () => (
  <div className="sileo-top-lights" style={toastLightStyle} aria-hidden="true">
    <span className="sileo-top-light sileo-top-light--left-45" />
    <span className="sileo-top-light sileo-top-light--left-25" />
    <span className="sileo-top-light sileo-top-light--vertical" />
    <span className="sileo-top-light sileo-top-light--right-25" />
    <span className="sileo-top-light sileo-top-light--right-45" />
  </div>
);

export default function App() {
  const location = useLocation();
  const setCurrentRoute = useAppStore((state) => state.setCurrentRoute);
  const unlockRouteFromUrl = useCoreStore((state) => state.unlockRouteFromUrl);
  const gameHydrated = useCoreStore((state) => state.isHydrated);
  const syncViewToRoute = useViewStore((state) => state.syncViewToRoute);
  const viewDebuggerVisible = useCoreStore(
    (state) => state.viewDebuggerVisible,
  );

  const [currentRouteInPretty, setCurrentRouteInPretty] = useState("");
  const [showRouteChip, setShowRouteChip] = useState(false);
  const previousPathRef = useRef<string | null>(null);
  const routeChipTimeoutRef = useRef<number | null>(null);
  const { locale } = useI18n();

  useEffect(() => {
    const nextPath = location.pathname;
    const previousPath = previousPathRef.current;

    if (gameHydrated) unlockRouteFromUrl(nextPath, location.search);
    setCurrentRoute(nextPath);
    syncViewToRoute(nextPath);

    if (previousPath && previousPath !== nextPath) {
      setShowRouteChip(true);

      if (routeChipTimeoutRef.current !== null) {
        clearTimeout(routeChipTimeoutRef.current);
      }

      routeChipTimeoutRef.current = window.setTimeout(() => {
        setShowRouteChip(false);
        routeChipTimeoutRef.current = null;
      }, 1800);
    }

    previousPathRef.current = nextPath;
  }, [
    location.pathname,
    location.search,
    setCurrentRoute,
    syncViewToRoute,
    unlockRouteFromUrl,
    gameHydrated,
  ]);

  useEffect(() => {
    setCurrentRouteInPretty(getRouteLabelByPath(location.pathname, locale));
  }, [location.pathname, locale]);

  useEffect(
    () => () => {
      if (routeChipTimeoutRef.current !== null) {
        clearTimeout(routeChipTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <ThemeProvider>
      <FloatingBarProvider>
        <AppSystems />
        <GlobalStyle />

        <Toaster
          position="top-center"
          offset={"1.25rem"}
          children={<ToastTopLights />}
          options={{
            duration: SILEO_TOAST_DURATION_MS,
            fill: "#d9c8de",
            roundness: 24,
            styles: {
              badge: "toast-badge",
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
            <ViewDebugger />
          )}

          <DebugSceneTuningOverlays />

          <RouteScreenTransitions />
          <MainLayout>
            <ContentWrapper>
              <ContentWidth>
                <RouteLoadingBoundary route={location.pathname}>
                  <Routes>
                    <Route path={ROUTE_PATHS.HOME} element={<Home />} />
                    <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
                    <Route path={ROUTE_PATHS.PORTFOLIO} element={<Portfolio />} />
                    <Route path={ROUTE_PATHS.MINIGAMES} element={<MiniGames />} />
                    <Route path={ROUTE_PATHS.LITERATURE} element={<Literature />} />
                    <Route path="/library" element={<Navigate to={ROUTE_PATHS.LITERATURE} replace />} />
                    <Route path="/places" element={<Navigate to={ROUTE_PATHS.LITERATURE} replace />} />
                    <Route
                      path="*"
                      element={<Navigate to={ROUTE_PATHS.HOME} replace />}
                    />
                  </Routes>
                </RouteLoadingBoundary>
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

// Keep progress subscriptions in a leaf so auto taps do not render the app shell.
function AppSystems() {
  useMessageSystem();
  useQuestSystem();
  return null;
}

function ViewDebugger() {
  const {
    currentView,
    isTransitioning,
    cameraControlsRef,
    previousView,
    viewMode,
    previousViewMode,
    defaultViewMode,
    lastFocusPosition,
  } = useViewStore();
  return (
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
