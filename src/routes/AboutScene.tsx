import { useCoreStore } from "@/store/core/store";
import { ROUTE_IDS, ROUTE_PATHS, useViewStore } from "@/store";
import { useEffect } from "react";
import { InteractiveObject } from "../molecules/InteractiveObject";
import { useNavigate } from "react-router-dom";
import { useSpring } from "@react-spring/three";
import { DeskModel } from "@/3d-objects/models/desk";
import { FLOOR_Y_POSITION } from "../molecules/Scene";
import { BookshelfModel } from "@/3d-objects/models/bookshelf";
import { Html } from "@react-three/drei";
import styled from "styled-components";
import { motion } from "motion/react";
import { CardboxModel } from "@/3d-objects/models/cardbox";
import { SkateboardModel } from "@/3d-objects/models/skateboard";
import { Room } from "@/3d-objects/Room";
import { XboxControllerModel } from "@/3d-objects/models/xbox-controller";
import { MidiControllerModel } from "@/3d-objects/models/midi-controller";
import { BasketBox } from "@/physics/BasketBox";
import { DjControllerModel } from "@/3d-objects/models/dj-controller";
import { DeskSpeakersModel } from "@/3d-objects/models/desk-speakers";
import { PSControllerModel } from "@/3d-objects/models/ps-controller";
import { GreenDiamond } from "@/3d-objects/models/greenDiamond";
import { MusicOverlay } from "@/layout/game-ui/music";
import { BookStacks } from "@/3d-objects/books/index";
import { BookTable } from "@/3d-objects/models/bookTable";
import { SocialsCorner } from "@/3d-objects/socials";
import { RigidBodyCameraModel } from "@/3d-objects/models/rigidBodyCamera";

export function AboutScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const { getCurrentViewConfig } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.ABOUT);

  useEffect(() => {
    if (!isAllowedToAcces) {
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 15 },
  }));

  useEffect(() => {
    api.start({
      scale: 1,
      config: { mass: 0.5, tension: 300, friction: 10 },
    });
  }, []);

  return (
    <>
      <InteractiveObject
        questAction="click_desk"
        questValue={30}
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

      {/* <InteractiveObject
        questAction="click_socials"
        questValue={30}
        mode="view"
        viewId="socials"
      >
        <SocialsCorner
          viewId="socials"
          position={[-3, FLOOR_Y_POSITION - 0.55, -3.5]}
          // rotation={[0, Math.PI * 0.15, 0]}
          scale={[4, 4, 4]}
        />
      </InteractiveObject> */}

      {/* BOOK STACKS + TABLE */}

      <InteractiveObject
        questAction="click_books"
        questValue={30}
        mode="view"
        viewId="bookshelf"
      >
        <BookStacks
          viewId="bookshelf"
          position={[2, FLOOR_Y_POSITION + 1, -4]}
          rotation={[0, (Math.PI / 2) * 4, 0]}
          scale={[3, 3, 3]}
        />

        <BookTable
          position={[2, FLOOR_Y_POSITION + 0.4, -4]}
          rotation={[0, (Math.PI / 2) * 2, 0]}
          scale={[1.15, 1.15, 1.15]}
        />
      </InteractiveObject>

      {/* INTEREST / HOBBY ITEMS */}

      <XboxControllerModel
        position={[3.5, FLOOR_Y_POSITION + 4, 2]}
        rotation={[1.2, 0.9, -0.2]}
      />

      <SkateboardModel
        position={[4, FLOOR_Y_POSITION + 2, 2]}
        rotation={[1.2, 0.9, -0.2]}
      />

      <MidiControllerModel
        position={[4, FLOOR_Y_POSITION + 6, 2]}
        rotation={[1.2, 0, -0.2]}
      />

      <PSControllerModel
        position={[4, FLOOR_Y_POSITION + 2, 2]}
        rotation={[1.2, 0, -0.2]}
      />

      <RigidBodyCameraModel
        position={[3.5, FLOOR_Y_POSITION + 2, 2]}
        rotation={[1.2, 0, -0.2]}
      />

      <InteractiveObject questAction="click_plumbob" questValue={1}>
        <GreenDiamond
          position={[3.5, FLOOR_Y_POSITION + 2, 2]}
          rotation={[1.2, 0, -0.2]}
        />
      </InteractiveObject>

      {/* INTEREST / HOBBY CARDBOX */}

      <InteractiveObject
        questAction="click_box"
        questValue={30}
        mode="view"
        viewId="cardbox"
      >
        <CardboxModel
          position={[4, FLOOR_Y_POSITION + 0.05 - 0.55, 2]}
          rotation={[-1.56, 0, 1.57]}
          scale={[0.9, 0.9, 0.9]}
        />

        <BasketBox
          position={[4, FLOOR_Y_POSITION + 0.9 - 0.55, 2]}
          width={2.1}
          depth={2.1}
          height={1.9}
          wallThickness={0.22}
        />
      </InteractiveObject>

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

const InProgressOverlay = (props: {
  position: [number, number, number];
  rotation: [number, number, number];
}) => {
  return (
    <group>
      <Html
        position={props.position}
        transform
        scale={[0.2, 0.2, 0.2]}
        rotation={props.rotation}
      >
        <OverlayBody
          key="bookshelf-overlay-body"
          initial={{ scale: 0.9, opacity: 0, filter: "blur(6px)" }}
          animate={{
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
          }}
          exit={{ scale: 0.9, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: "circInOut", delay: 0.15 }}
        >
          <h3>Noch nicht verfügbar...</h3>
          <p>... sorry 😢</p>
        </OverlayBody>
      </Html>
    </group>
  );
};

const OverlayBody = styled(motion.div)`
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;

  * {
    margin: 0;
    padding: 0;
  }

  h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fefefe;
    width: 20ch;
  }

  p {
    font-size: 1rem;
    color: #f9f9f9;
    line-height: 1.3;
    max-width: 75ch;
  }
`;
