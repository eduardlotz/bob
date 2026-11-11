import { useCoreStore } from "@/store/core/store";
import { ROUTE_PATHS, useViewStore } from "@/store";
import { useEffect } from "react";
import { InteractiveObject } from "../molecules/InteractiveObject";
import { useNavigate } from "react-router-dom";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import {
  ABOUT_CORNERS,
  ABOUT_ROOM,
  ABOUT_LOUNGE,
} from "@/store/config/aboutRoom";
import { Room } from "@/3d-objects/Room";
import { BasketBox } from "@/physics/BasketBox";
import { GreenDiamond } from "@/3d-objects/models/greenDiamond";
import { MusicOverlay } from "@/layout/game-ui/music";
import { SocialVinylCorner } from "@/3d-objects/about/SocialVinylCorner";
import { SocialPosters } from "@/3d-objects/about/SocialPosters";
import { MusicCorner } from "@/3d-objects/about/MusicCorner";
import { AboutBookshelf } from "@/3d-objects/about/AboutBookshelf";
import { VinylCollection } from "@/3d-objects/about/VinylCollection";
import { useVinylStore } from "@/store/vinyls";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { BlenderRoomPart } from "@/3d-objects/about/BlenderRoomPart";
import { AboutWeatherProvider } from "@/3d-objects/about/AboutWeather";
import { CornerTrigger } from "@/3d-objects/about/CornerTrigger";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";

export function AboutScene() {
  const checkUnlockedRoutes = useCoreStore(
    (state) => state.checkUnlockedRoutes,
  );
  const currentView = useViewStore((state) => state.currentView);
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const allowed = checkUnlockedRoutes(ROUTE_PATHS.ABOUT);
  useEffect(() => {
    if (!allowed) navigate(ROUTE_PATHS.HOME, { replace: true });
  }, [allowed, navigate]);
  useEffect(() => {
    if (currentView !== "socials" && currentView !== "computer")
      useVinylStore.getState().select(null);
    setHoveredObject(null);
  }, [currentView, setHoveredObject]);
  useEffect(
    () => () => {
      useVinylStore.getState().select(null);
    },
    [],
  );
  const hover = (view: "desk" | "computer" | "socials") => {
    if (currentView !== view)
      setHoveredObject({
        title: viewControlsMessages[locale].viewTitles[view],
      });
  };
  return (
    <AboutWeatherProvider>
      <InteractiveObject
        questAction="click_desk"
        mode="view"
        viewId="desk"
      >
        <MusicCorner />
        {currentView === "desk" && <MusicOverlay />}
      </InteractiveObject>
      <InteractiveObject
        questAction="click_socials"
        mode="view"
        viewId="socials"
        position={ABOUT_CORNERS.socials.position}
      >
        <group
          rotation={[0, ABOUT_CORNERS.socials.yaw, 0]}
          onPointerEnter={() => hover("socials")}
          onPointerLeave={() => setHoveredObject(null)}
        >
          <SocialVinylCorner />
        </group>
      </InteractiveObject>
      <VinylCollection />
      <AboutBookshelf />
      <SocialPosters wall="right" />
      <InteractiveObject
        questAction="click_plant"
        mode="view"
        viewId="computer"
        position={[4.05, ABOUT_ROOM.floorY, -3.5]}
      >
        <group
          onPointerEnter={() => hover("computer")}
          onPointerLeave={() => setHoveredObject(null)}
        >
          <BlenderRoomPart name="Plant" local />
        </group>
      </InteractiveObject>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[4.05, ABOUT_ROOM.floorY, -3.5]}
      >
        <CuboidCollider args={[0.45, 0.5, 0.45]} position={[0, 0.5, 0]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={ABOUT_LOUNGE.chair}
        rotation={[0, ABOUT_LOUNGE.yaw, 0]}
      >
        <CuboidCollider args={[0.74, 0.73, 0.59]} position={[0, 0.77, 0]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={ABOUT_LOUNGE.lamp}>
        <CuboidCollider args={[0.32, 0.045, 0.32]} position={[0, 0.045, 0]} />
        <CuboidCollider args={[0.035, 1.25, 0.035]} position={[0, 1.32, 0]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={ABOUT_LOUNGE.table}>
        <CylinderCollider args={[0.03, 0.34]} position={[0, 0.69, 0]} />
        <CylinderCollider args={[0.3, 0.035]} position={[0, 0.36, 0]} />
        <CylinderCollider args={[0.02, 0.23]} position={[0, 0.045, 0]} />
      </RigidBody>
      <GreenDiamond
        position={[4.68, ABOUT_ROOM.floorY + 0.18, -4.35]}
        rotation={[0, 0.3, 0.28]}
        scale={[0.75, 0.75, 0.75]}
      />
      <CornerTrigger
        viewId="socials"
        questAction="click_socials"
        surfaces={[
          {
            position: [-2.6, ABOUT_ROOM.floorY + 2.6, -4.799],
            size: [5.1, 5.15],
          },
          {
            position: [-2.7, ABOUT_ROOM.floorY + 0.006, -3.65],
            rotation: [-Math.PI / 2, 0, 0],
            size: [4.6, 2.2],
          },
          {
            position: [-5.16, ABOUT_ROOM.floorY + 2.6, -3.65],
            rotation: [0, Math.PI / 2, 0],
            size: [2.2, 5.15],
          },
        ]}
      />
      <CornerTrigger
        viewId="computer"
        questAction="click_socials"
        surfaces={[
          {
            position: [2.6, ABOUT_ROOM.floorY + 2.6, -4.799],
            size: [5.1, 5.15],
          },
          {
            position: [3.5, ABOUT_ROOM.floorY + 0.006, -3.5],
            rotation: [-Math.PI / 2, 0, 0],
            size: [3.3, 2.5],
          },
          {
            position: [5.16, ABOUT_ROOM.floorY + 2.6, -3.5],
            rotation: [0, -Math.PI / 2, 0],
            size: [2.5, 5.15],
          },
        ]}
      />
      <CornerTrigger
        viewId="lounge"
        questAction="click_socials"
        surfaces={[
          {
            position: [5.199, ABOUT_ROOM.floorY + 2.9, 3.35],
            rotation: [0, -Math.PI / 2, 0],
            size: [2.7, 5.15],
          },
          {
            position: [3.9, ABOUT_ROOM.floorY + 0.006, 3.6],
            rotation: [-Math.PI / 2, 0, 0],
            size: [2.4, 2.3],
          },
        ]}
      />
      <CornerTrigger
        viewId="desk"
        questAction="click_desk"
        surfaces={[
          {
            position: [-4.99, ABOUT_ROOM.floorY + 2.6, .2],
            rotation: [0, Math.PI / 2, 0],
            size: [6.1, 5.15],
          },
          {
            position: [-3.6, ABOUT_ROOM.floorY + 0.006, .2],
            rotation: [-Math.PI / 2, 0, 0],
            size: [2.8, 5.9],
          },
        ]}
      />
      <Room />
      <BasketBox
        position={[0, FLOOR_Y_POSITION + 5, 0]}
        width={ABOUT_ROOM.width}
        depth={ABOUT_ROOM.depth}
        height={11.5}
        wallThickness={0.2}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ABOUT_ROOM.floorY + 0.055, 0]}
      >
        <circleGeometry args={[0.8, 32]} />
        <meshToonMaterial
          color="#111820"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </AboutWeatherProvider>
  );
}
