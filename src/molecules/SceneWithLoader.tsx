import { useState, useEffect, Suspense, useRef } from "react";
import { useProgress } from "@react-three/drei";
import Scene from "@/molecules/Scene";
import { UILayer } from "@/components/UILayer";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { initializeSoundSystem, unlockAudioContext } from "@/utils/soundSystem";
import { Cursor } from "./Cursor";
import { InitialLoadingScreen } from "@/components/InitialLoadingScreen";
import { ScreenTransition } from "@/components/ScreenTransition";
import { useScreenTransition } from "@/store/screenTransition";
import { useLocation } from "react-router-dom";
import { isInitialRouteReady, useRouteLoading } from "@/store/routeLoading";
import { getBobAssetKey } from "@/utils/bobAssetKeys";

export const CustomLoader = ({
  onEnter,
  isInitialLoad,
}: {
  onEnter: () => void;
  isInitialLoad: boolean;
}) => {
  const { active, progress } = useProgress();
  const { pathname } = useLocation();
  const hydrated = useCoreStore(state => state.isHydrated);
  const attachedKey = useCoreStore(state => getBobAssetKey(state.bobItems.filter(item => item.enabled), false));
  const detachedKey = useCoreStore(state => getBobAssetKey(state.bobItems.filter(item => item.enabled), true));
  const routeReady = useRouteLoading(state => isInitialRouteReady(pathname, attachedKey, detachedKey, state)) && hydrated;
  const [percentage, setPercentage] = useState(0);
  const [finished, setFinished] = useState(false);

  // Track if this is monitoring initial scene load only
  const initialLoadCompleteRef = useRef(false);

  useEffect(() => {
    // Only update progress during initial load
    if (isInitialLoad && !initialLoadCompleteRef.current) {
      setPercentage((prev) => Math.max(prev, routeReady && !active ? 100 : Math.min(progress, 99)));

      if (routeReady && !active) {
        setFinished(true);
        initialLoadCompleteRef.current = true;
      }
    }
  }, [active, progress, isInitialLoad, routeReady]);

  const handleEnter = () => {
    if (!finished || useScreenTransition.getState().phase !== "loading") return;
    void useViewStore.getState().beginLoadingCamera(false, { initial: true });
    onEnter();
  };

  return (
    <InitialLoadingScreen
      progress={percentage}
      finished={finished}
      onStart={handleEnter}
    />
  );
};

export const SceneWithLoader = ({
  permissionGranted,
  onLoaded,
  ...rest
}: {
  permissionGranted: boolean;
  onLoaded?: () => void;
}) => {
  const isMobile = useAppStore(state => state.isMobile);
  const emotionState = useAppStore(state => state.emotionData?.emotionState || "normal");
  const setPermissionGranted = useAppStore(state => state.setPermissionGranted);
  const isReady = useCoreStore(state => state.isReady);
  const setGameReady = useCoreStore(state => state.setGameReady);
  const [hasEntered, setHasEntered] = useState(false);
  const [mountLoader, setMountLoader] = useState(true);
  const { pathname } = useLocation();

  const handleEnter = () => {
    setGameReady(true);
    setHasEntered(true);
    onLoaded?.();
    useScreenTransition.getState().reveal(() => {
      setMountLoader(false);
      useViewStore.getState().finishLoadingCamera(useAppStore.getState().currentRoute);
    });
    // Unlock sound in the user gesture without tying the visual reveal to audio.
    void (async () => {
      try {
        await initializeSoundSystem();
        await unlockAudioContext();
      } catch (error) {
        console.error("failed to initialize sound system:", error);
      }
    })();
  };

  return (
    <>
      <ScreenTransition>
        {mountLoader && (
          <CustomLoader key={pathname} onEnter={handleEnter} isInitialLoad={!hasEntered} />
        )}
      </ScreenTransition>

      <Suspense fallback={null}>
        <Scene permissionGranted={permissionGranted} {...rest} />
      </Suspense>

      {!isMobile && <Cursor attachToParent />}

      {isReady && (
        <UILayer
          permissionGranted={permissionGranted}
          isMobile={isMobile}
          sceneLoaded={isReady}
          setPermissionGranted={setPermissionGranted}
          emotionState={emotionState}
        />
      )}
    </>
  );
};
