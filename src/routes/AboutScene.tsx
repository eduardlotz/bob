import { useGameStore } from "@/store/gameStore";
import { ROUTE_PATHS } from "@/store";
import { useEffect } from "react";
import { InteractiveObject } from "../molecules/InteractiveObject";
import { useNavigate } from "react-router-dom";
import { useSpring } from "@react-spring/three";
import { DeskModel } from "@/3d-objects/models/desk";
import { MacbookModel } from "@/3d-objects/models/macbook";
import { FLOOR_Y_POSITION } from "../molecules/Scene";
import { BookshelfModel } from "@/3d-objects/models/bookshelf";

export function AboutScene() {
  const { checkUnlockedRoutes } = useGameStore();
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
    <group>
      <InteractiveObject
        questAction="click_desk"
        questValue={30}
        mode="view"
        viewId="desk"
      >
        <DeskModel
          position={[-3, FLOOR_Y_POSITION + 1.2, 0]}
          rotation={[0, 0, 0]}
          scale={[2, 2, 2]}
        />

        <MacbookModel
          position={[-2.85, FLOOR_Y_POSITION + 1.271, 0]}
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
      </InteractiveObject>
    </group>
  );
}
