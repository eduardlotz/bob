import { useCoreStore } from "@/store/core/store";
import { ROUTE_PATHS, useViewStore } from "@/store";
import { useEffect } from "react";
import { InteractiveObject } from "../molecules/InteractiveObject";
import { useNavigate } from "react-router-dom";
import { DeskModel } from "@/3d-objects/models/desk";
import { FLOOR_Y_POSITION } from "@/store/config/scene";
import { BackgroundPlanet } from "@/3d-objects/BackgroundPlanet";
import { SkateboardModel } from "@/3d-objects/models/skateboard";
import { Room } from "@/3d-objects/Room";
import { XboxControllerModel } from "@/3d-objects/models/xbox-controller";
import { BasketBox } from "@/physics/BasketBox";
import { DjControllerModel } from "@/3d-objects/models/dj-controller";
import { DeskSpeakersModel } from "@/3d-objects/models/desk-speakers";
import { PSControllerModel } from "@/3d-objects/models/ps-controller";
import { GreenDiamond } from "@/3d-objects/models/greenDiamond";
import { MusicOverlay } from "@/layout/game-ui/music";
import { RigidBodyCameraModel } from "@/3d-objects/models/rigidBodyCamera";
import { StandaloneSocialsGlobe } from "@/3d-objects/socials";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { PottedPlant, WorkCorner, WORK_SURFACE_Y } from "@/3d-objects/WorkCorner";

export function AboutScene() {
  const workCornerPosition: [number, number, number] = [2, FLOOR_Y_POSITION - 0.55, -4];
  const { checkUnlockedRoutes } = useCoreStore();
  const { getCurrentViewConfig } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.ABOUT);

  useEffect(() => {
    if (!isAllowedToAcces) {
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  return (
    <>
      <BackgroundPlanet />
      <InteractiveObject
        questAction="click_desk"
        questValue={1}
        mode="view"
        viewId="desk"
        position={[0, 0, 1.5]}
      >
        <DeskModel
          position={[-3.5, FLOOR_Y_POSITION + 0.7, 0]}
          rotation={[0, 0, 0]}
          scale={[2.5, 2.5, 2.5]}
        />

        <DeskSpeakersModel
          position={[-3.75, FLOOR_Y_POSITION + 1, 1.25]}
          rotation={[0, 0.3, 0]}
        />

        <DeskSpeakersModel
          position={[-3.75, FLOOR_Y_POSITION + 1, -1.25]}
          rotation={[0, -0.3, 0]}
        />

        <DjControllerModel position={[-3, FLOOR_Y_POSITION + 1, 0]} />

        {getCurrentViewConfig()?.id === "desk" && <MusicOverlay />}
      </InteractiveObject>

      {/* SOCIALS CORNER  */}

      <StandaloneSocialsGlobe
        questAction="click_socials"
        questValue={1}
        position={[-3, FLOOR_Y_POSITION + 2, -3.5]}
        scale={[3.5, 3.5, 3.5]}
      />

      {/* The former book table is now the work corner. */}
      <InteractiveObject
        questAction="click_work_corner"
        questValue={1}
        mode="view"
        viewId="computer"
        position={workCornerPosition}
      >
        <WorkCorner />
      </InteractiveObject>

      {/* Miniature interests remain individually grabbable on the desktop. */}
      <group position={workCornerPosition}>
        <XboxControllerModel position={[0.83, WORK_SURFACE_Y + 0.04, 0.4]}
          rotation={[0, -0.2, 0]} scale={[0.45, 0.45, 0.45]} />
        <PSControllerModel position={[1.44, WORK_SURFACE_Y + 0.16, 0.39]}
          rotation={[0, 0.2, 0]} scale={[0.5, 0.5, 0.5]} />
        <SkateboardModel position={[-1.05, WORK_SURFACE_Y + 0.04, 0.4]}
          rotation={[0, Math.PI / 2 + 0.15, 0]} scale={[0.35, 0.35, 0.35]} />
        <RigidBodyCameraModel position={[-1.56, WORK_SURFACE_Y + 0.04, 0.35]}
          rotation={[0, 0.2, 0]} scale={[0.35, 0.35, 0.35]} />
      </group>

      {/* A plant occupies the old hobby-box corner, hiding a discoverable plumbob. */}
      <InteractiveObject
        questAction="click_plant"
        questValue={1}
        mode="view"
        viewId="cardbox"
        position={[3.8, FLOOR_Y_POSITION - 0.55, 2]}
      >
        <PottedPlant scale={2.7} />
      </InteractiveObject>
      <RigidBody type="fixed" colliders={false} position={[3.8, FLOOR_Y_POSITION - 0.55, 2]}>
        <CuboidCollider args={[0.48, 0.5, 0.48]} position={[0, 0.5, 0]} />
      </RigidBody>
      <GreenDiamond position={[4.37, FLOOR_Y_POSITION - 0.04, 1.3]}
        rotation={[0, 0.3, 0.28]} scale={[0.75, 0.75, 0.75]} />

      <Room />

      <BasketBox
        position={[0, FLOOR_Y_POSITION + 5, 0]}
        width={10}
        depth={10}
        height={11.5}
        wallThickness={0.2}
      />
      {/* bottom fake shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y_POSITION - 0.5, 0]}
      >
        <circleGeometry args={[0.8, 16, 16]} />
        <meshToonMaterial color="#111820" transparent opacity={0.5} />
      </mesh>
    </>
  );
}
