import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Fisheye,
  Environment,
  PerspectiveCamera,
  PerformanceMonitor,
} from "@react-three/drei";

import { match } from "ts-pattern";
import { a, useSpring } from "@react-spring/three";
import { Physics } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import {
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  DEFAULT_WORLD_LIGHTING,
  DebugLightSettings,
  useAppStore,
  useCoreStore,
  useMiniGameStore,
} from "../store";
import { useViewStore } from "../store/viewStore";
import { ROUTE_IDS, ROUTE_PATHS } from "../store/config/routes";
import { FISHEYE_CONFIG } from "../store/config/themes";
import {
  attachListenerToCamera,
  playWorldSound,
  stopAllWorldSounds,
} from "@/utils/soundSystem";
import { PortfolioScene } from "@/routes/PortfolioScene";
import { AboutScene } from "../routes/AboutScene";

import { HeadNavigation } from "./HeadNavigation";
import { TapCounter } from "./TapCounter";
import { MessageBubble } from "@/molecules/MessageBubble";

import { BackgroundPlanet } from "../3d-objects/BackgroundPlanet";
import { TapEffects } from "../3d-objects/ParticleEffects";
import { SceneDecorations } from "@/3d-objects/Decorations";
import { MiniGamesScene } from "@/routes/MiniGamesScene";
import {
  DEFAULT_PINK_NOISE,
  DEFAULT_WORLD_MUSIC,
} from "@/utils/sound/defaults";
import * as THREE from "three";
import { Color } from "three";

import { useLocation, useNavigate } from "react-router-dom";
import { sileo } from "sileo";
import { CameraGLBridge } from "@/bridges/CameraBridge";
import { useCursor } from "@/hooks/useCursor";
import { commonUiMessages } from "@/ui/common.messages";
import { getLocale } from "@/i18n";
import { PresetsType } from "@react-three/drei/helpers/environment-assets";

const Debug = () => {
  const { width } = useThree((s) => s.size);
  return <Perf minimal={width < 712} matrixUpdate deepAnalyze overClock />;
};

// TODO: make proper constant file
export const FLOOR_Y_POSITION = -1.5;
const MOON_WORLD_ID = "world_moon";
const SPACE_WORLD_ID = "world_space";
const HOME_LIGHT_RADIUS = 6.7;
const HOME_LIGHT_TARGET: [number, number, number] = [0, 0.7, 0];
const HOME_LIGHT_AZIMUTH = 0.38;
const HOME_LIGHT_ELEVATION = 0.64;
const ROUTE_LIGHT_POSITION = [2, 4, 5] as const;
const ROUTE_LIGHT_INTENSITY = 1.2;
const FAKE_SHADOW_Y = -1.32;
const FAKE_SHADOW_OPACITY = 0.5;

type EnvironmentPreset = PresetsType | null;

type HomeSunRig = {
  radius: number;
  target: [number, number, number];
  azimuth: number;
  elevation: number;
};

const HOME_SUN_RIGS: Partial<Record<string, Partial<HomeSunRig>>> = {
  world_default: {},
  world_forest: {
    azimuth: 0.52,
    elevation: 0.7,
  },
  world_desert: {
    azimuth: 0.18,
    elevation: 0.82,
  },
  world_winter: {
    azimuth: 0.44,
    elevation: 0.48,
  },
  [MOON_WORLD_ID]: {},
  [SPACE_WORLD_ID]: {},
};

const HOME_WORLD_ENVIRONMENT_PRESETS: Partial<
  Record<string, EnvironmentPreset>
> = {
  world_default: null,
  world_forest: "forest",
  world_desert: "sunset",
  world_winter: "park",
  [MOON_WORLD_ID]: "night",
  [SPACE_WORLD_ID]: null,
};

const ROUTE_ENVIRONMENT_PRESETS: Partial<Record<string, EnvironmentPreset>> = {
  [ROUTE_PATHS.ABOUT]: "city",
  [ROUTE_PATHS.PORTFOLIO]: null,
  [ROUTE_PATHS.MINIGAMES]: "sunset",
};

const getHomeSunRig = (
  lightSettings: DebugLightSettings,
  worldId?: string | null,
): HomeSunRig => ({
  radius: HOME_LIGHT_RADIUS,
  target: HOME_LIGHT_TARGET,
  azimuth: HOME_LIGHT_AZIMUTH + lightSettings.lightAngle,
  elevation: HOME_LIGHT_ELEVATION,
  ...(worldId ? HOME_SUN_RIGS[worldId] : {}),
});

const getSceneLightColors = (lightSettings: DebugLightSettings) => ({
  ambientColor: new Color(lightSettings.lightColor),
  directionalColor: new Color(lightSettings.lightColor),
});

const rotateLightPosition = (
  position: readonly [number, number, number],
  angle: number,
) => {
  const [x, y, z] = position;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - z * sin, y, x * sin + z * cos] as const;
};

const getEffectiveWorldLighting = (
  sceneWorld: ReturnType<typeof useCoreStore.getState>["worlds"][number] | null,
) => sceneWorld?.scene.lighting ?? DEFAULT_WORLD_LIGHTING;

const getEnvironmentPreset = ({
  isHome,
  worldId,
  currentRoute,
}: {
  isHome: boolean;
  worldId?: string | null;
  currentRoute: string;
}): EnvironmentPreset => {
  if (isHome) {
    if (!worldId) return null;
    return HOME_WORLD_ENVIRONMENT_PRESETS[worldId] ?? null;
  }

  return ROUTE_ENVIRONMENT_PRESETS[currentRoute] ?? null;
};

function HomeDirectionalLight({
  rig,
  color,
  intensity,
}: {
  rig: HomeSunRig;
  color: Color;
  intensity: number;
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    const horizontalRadius = Math.cos(rig.elevation) * rig.radius;
    const [targetX, targetY, targetZ] = rig.target;

    targetRef.current.position.set(targetX, targetY, targetZ);
    lightRef.current.position.set(
      targetX + Math.sin(rig.azimuth) * horizontalRadius,
      targetY + Math.sin(rig.elevation) * rig.radius,
      targetZ + Math.cos(rig.azimuth) * horizontalRadius,
    );
    targetRef.current.updateMatrixWorld();
  }, [rig]);

  return (
    <>
      <object3D ref={targetRef} />
      <directionalLight ref={lightRef} intensity={intensity} color={color} />
    </>
  );
}

const Scene = ({ permissionGranted }: { permissionGranted: boolean }) => {
  const cameraControlsRef = useRef<CameraControls>(null!);
  const { setCameraControlsRef } = useViewStore();
  const {
    statisticsVisible,
    physicsDebugEnabled,
    worlds,
    previewMode,
    debugCameraSettings,
    debugLightSettings,
    soundSystem,
    isPaused,
    graphicPreferences,
  } = useCoreStore();
  const { activeGame } = useMiniGameStore();
  const activeRouteMusicRef = useRef<string | null>(null);
  const location = useLocation();
  const routePath = location.pathname;

  const { currentRoute } = useAppStore();

  // shop items are only visible on home route
  const isHome = currentRoute === ROUTE_PATHS.HOME;
  const showBackground = currentRoute === ROUTE_PATHS.ABOUT;
  const sceneWorld = useMemo(() => {
    if (previewMode === "world") {
      return (
        worlds.find((world) => world.preview) ??
        worlds.find((world) => world.enabled) ??
        null
      );
    }

    return worlds.find((world) => world.enabled) ?? null;
  }, [previewMode, worlds]);
  const activeLightingWorld = isHome ? sceneWorld : null;
  const worldLighting = useMemo(
    () => getEffectiveWorldLighting(activeLightingWorld),
    [activeLightingWorld],
  );
  const resolvedAmbientIntensity =
    worldLighting.ambientIntensity *
    debugLightSettings.ambientIntensityMultiplier;
  const resolvedDirectionalIntensity =
    worldLighting.directionalIntensity *
    debugLightSettings.directionalIntensityMultiplier;
  const worldLightColors = useMemo(
    () => getSceneLightColors(debugLightSettings),
    [debugLightSettings],
  );
  const homeSunRig = useMemo(
    () => getHomeSunRig(debugLightSettings, activeLightingWorld?.id),
    [activeLightingWorld?.id, debugLightSettings],
  );
  const showHomeShadow = isHome && sceneWorld?.id !== SPACE_WORLD_ID;

  const handleCameraControlsRef = useCallback(
    (controls: CameraControls | null) => {
      if (!controls) return;
      cameraControlsRef.current = controls;
      setCameraControlsRef(cameraControlsRef);
    },
    [setCameraControlsRef],
  );

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 15 },
  }));

  // route based music
  // default: jazz world music
  // portfolio: pink noise

  const worldMusicId = useMemo(() => {
    switch (routePath) {
      case ROUTE_PATHS.PORTFOLIO: {
        return DEFAULT_PINK_NOISE.id;
      }

      case ROUTE_PATHS.MINIGAMES: {
        return activeGame === "PING_PONG" || activeGame === "FLAPPY_BIRD"
          ? DEFAULT_WORLD_MUSIC.id
          : null;
      }

      default: {
        return null;
      }
    }
  }, [activeGame, routePath]);

  const canPlayRouteMusic =
    soundSystem.enabled &&
    soundSystem.masterVolume > 0 &&
    soundSystem.worldEnabled !== false &&
    !isPaused;

  useEffect(() => {
    stopAllWorldSounds();

    if (!canPlayRouteMusic || !worldMusicId) {
      activeRouteMusicRef.current = null;
      return;
    }

    playWorldSound(worldMusicId);
    activeRouteMusicRef.current = worldMusicId;

    return () => {
      if (activeRouteMusicRef.current === worldMusicId)
        activeRouteMusicRef.current = null;
      stopAllWorldSounds();
    };
  }, [canPlayRouteMusic, worldMusicId]);

  const envLightPreset = useMemo(
    () =>
      getEnvironmentPreset({
        isHome,
        worldId: sceneWorld?.id,
        currentRoute,
      }),
    [currentRoute, isHome, sceneWorld?.id],
  );

  return (
    <>
      <FullScreenCanvas>
        <Suspense fallback={null}>
          <AudioListenerBinder />
          <Fisheye zoom={FISHEYE_CONFIG.MIN} renderPriority={2}>
            <CursorFollowCamera />
            <CameraControls
              ref={handleCameraControlsRef}
              truckSpeed={debugCameraSettings.truckSpeed}
              azimuthRotateSpeed={debugCameraSettings.azimuthRotateSpeed}
            />
            <ambientLight
              intensity={resolvedAmbientIntensity}
              color={worldLightColors.ambientColor}
            />
            <PerspectiveCamera makeDefault position={[0, 0, 3]} />
            {isHome ? (
              <HomeDirectionalLight
                rig={homeSunRig}
                intensity={resolvedDirectionalIntensity}
                color={worldLightColors.directionalColor}
              />
            ) : (
              <directionalLight
                intensity={ROUTE_LIGHT_INTENSITY}
                color={worldLightColors.directionalColor}
                position={rotateLightPosition(
                  ROUTE_LIGHT_POSITION,
                  debugLightSettings.lightAngle,
                )}
              />
            )}
            {envLightPreset && <Environment preset={envLightPreset} />}
            {showBackground && <BackgroundPlanet />}
            {statisticsVisible && <Debug />}

            <Physics gravity={[0, -9.81, 0]} debug={physicsDebugEnabled}>
              {activeGame === "LOBBY" && (
                <HeadNavigation
                  cameraControlsRef={cameraControlsRef}
                  permissionGranted={permissionGranted}
                />
              )}

              <MessageBubble anchor={[0, 2.4, 0]} />

              <a.group visible={isHome} scale={spring.scale}>
                <TapCounter />
                {graphicPreferences.effectsEnabled && <TapEffects />}
              </a.group>

              {isHome && <SceneDecorations />}

              {/* bottom fake shadow */}
              {showHomeShadow && (
                <mesh
                  renderOrder={6}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, FAKE_SHADOW_Y, 0]}
                >
                  <circleGeometry args={[0.8, 16, 16]} />
                  <meshToonMaterial
                    color="#111820"
                    transparent
                    opacity={FAKE_SHADOW_OPACITY}
                    depthWrite={false}
                  />
                </mesh>
              )}

              <Suspense fallback={null}>
                {match(currentRoute)
                  .with(ROUTE_PATHS.ABOUT, () => <AboutScene />)
                  .with(ROUTE_PATHS.PORTFOLIO, () => <PortfolioScene />)
                  .with(ROUTE_PATHS.MINIGAMES, () => <MiniGamesScene />)
                  .otherwise(() => null)}
              </Suspense>
            </Physics>
          </Fisheye>
        </Suspense>
      </FullScreenCanvas>
    </>
  );
};

export default Scene;

const CursorFollowCamera = () => {
  const { isMobile } = useAppStore();
  const { cameraControlsRef, getCurrentViewConfig, viewMode, isTransitioning } =
    useViewStore();
  const cursor = useCursor({ condition: () => !isMobile, positionFactor: 1 });

  useFrame(({ clock }) => {
    if (isMobile) return;
    if (viewMode !== "fixed" || isTransitioning) return;

    const viewConfig = getCurrentViewConfig();
    if (!viewConfig?.cursorFollow || !viewConfig.position || !viewConfig.target)
      return;

    const controls = cameraControlsRef?.current;
    if (!controls) return;

    const {
      strength = 2.2,
      yScale = 0.4,
      swayX = 0.03,
      swayY = 0.02,
    } = viewConfig.cursorFollow;

    const swayXValue = Math.sin(clock.getElapsedTime() * 1) * swayX;
    const swayYValue = Math.sin(clock.getElapsedTime() * 0.5) * swayY;

    controls.setLookAt(
      ...viewConfig.position,
      viewConfig.target[0] + cursor.current.x * strength + swayXValue,
      viewConfig.target[1] + cursor.current.y * strength * yScale + swayYValue,
      viewConfig.target[2],
      true,
    );
  });

  return null;
};

type FullScreenCanvasProps = {
  children: any;
};

const FullScreenCanvas = ({ children, ...props }: FullScreenCanvasProps) => {
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dpr, setDpr] = useState(() =>
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : 1.5,
  );
  const navigate = useNavigate();

  const handlePerformanceChange = ({ factor }: { factor: number }) => {
    setDpr(Math.max(Math.floor(0.5 + 1.5 * factor), 1));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      shadows
      flat
      gl={{
        powerPreference: "high-performance",
        // antialias: false,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;

        const onLost = (e: Event) => {
          e.preventDefault();
        };

        const onRestored = () => {
          window.location.reload();
          navigate(ROUTE_PATHS.HOME);

          sileo.error({
            title:
              commonUiMessages[getLocale()].toasts
                .webglContextRestoredErrorTitle,
          });
        };

        canvas.addEventListener("webglcontextlost", onLost, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
      }}
      color="black"
      camera={{
        position: [0, 0, isMobile ? 1.5 : 2],
        fov: 50,
      }}
      style={{
        width: "100vw",
        height: "100dvh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
      dpr={dpr}
      {...props}
    >
      <>
        <CameraGLBridge />

        <PerformanceMonitor factor={1} onChange={handlePerformanceChange}>
          {children}
        </PerformanceMonitor>
      </>
    </Canvas>
  );
};

function AudioListenerBinder() {
  const { camera } = useThree();
  useEffect(() => {
    attachListenerToCamera(camera);
  }, [camera]);
  return null;
}
