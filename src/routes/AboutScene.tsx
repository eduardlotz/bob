import { useGameStore } from "@/store/gameStore";
import { ROUTE_PATHS, useViewStore } from "@/store";
import { useEffect, useRef } from "react";
import { InteractiveObject } from "../molecules/InteractiveObject";
import { useNavigate } from "react-router-dom";
import { useSpring } from "@react-spring/three";
import { DeskModel } from "@/3d-objects/models/desk";
import { MacbookModel } from "@/3d-objects/models/macbook";
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
import { FloatingBar } from "@/layout/FloatingLabel";

export function AboutScene() {
  const { checkUnlockedRoutes } = useGameStore();
  const { getCurrentViewConfig } = useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.ABOUT);
  const isInObjectMode = getCurrentViewConfig()?.id === "bookshelf";

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

  const leftRB = useRef(null);
  const rightRB = useRef(null);

  return (
    <group>
      <InteractiveObject
        questAction="click_desk"
        questValue={30}
        mode="view"
        viewId="desk"
      >
        <DeskModel
          position={[-4, FLOOR_Y_POSITION + 1.2, 0]}
          rotation={[0, 0, 0]}
          scale={[2, 2, 2]}
        />

        <MacbookModel
          position={[-3.85, FLOOR_Y_POSITION + 1.271, 0]}
          rotation={[0, 1.58, 0]}
          scale={[0.4, 0.4, 0.4]}
        />
      </InteractiveObject>

      <InteractiveObject
        questAction="click_books"
        questValue={30}
        mode="view"
        viewId="bookshelf"
      >
        <BookshelfModel
          position={[3, FLOOR_Y_POSITION, -3]}
          rotation={[0, -0.75, 0]}
          scale={[2, 2, 2]}
        />

        {isInObjectMode && (
          <InProgressOverlay
            position={[2.8, FLOOR_Y_POSITION + 2, -2.8]}
            rotation={[0, -0.75, 0]}
          />
        )}
      </InteractiveObject>

      <BasketBox
        position={[4, FLOOR_Y_POSITION + 0.9, 2]}
        width={1.8}
        depth={1.8}
        height={1.8}
        wallThickness={0.02}
      />

      <XboxControllerModel
        position={[3.5, FLOOR_Y_POSITION + 14, 2]}
        rotation={[1.2, 0.9, -0.2]}
      />

      <SkateboardModel
        position={[4, FLOOR_Y_POSITION + 12, 2]}
        rotation={[1.2, 0.9, -0.2]}
      />

      <MidiControllerModel
        position={[4, FLOOR_Y_POSITION + 20, 1]}
        rotation={[1.2, 0.9, -0.2]}
      />

      <InteractiveObject
        questAction="click_cardbox"
        questValue={30}
        mode="view"
        viewId="cardbox"
      >
        <CardboxModel
          position={[4, FLOOR_Y_POSITION + 0.05, 2]}
          rotation={[-1.56, 0, 1.57]}
          scale={[0.9, 0.9, 0.9]}
        />

        {/* <BaguetteModel
          position={[3.6, FLOOR_Y_POSITION + 0.3, 1.6]}
          rotation={[-1.25, 0, -2.5]}
          scale={[1, 1, 1]}
        /> */}
      </InteractiveObject>

      <Room posterUrls={["/images/test_poster.png"]} />
    </group>
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
