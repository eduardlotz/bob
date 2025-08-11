import { Float } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import { ROUTE_PATHS } from "@/store";
import { useCallback, useEffect } from "react";
import { InteractiveObject } from "./InteractiveObject";
import { useDialogStore } from "@/store/dialogStore";
import { useNavigate } from "react-router-dom";
import { TreeModel } from "@/3d-objects/models/tree";
import { a, useSpring } from "@react-spring/three";
import { DeskModel } from "@/3d-objects/models/desk";
import { MacbookModel } from "@/3d-objects/models/macbook";
import { FLOOR_Y_POSITION } from "./Scene";
import { BookshelfModel } from "@/3d-objects/models/bookshelf";

export function AboutScene() {
  const { checkUnlockedRoutes } = useGameStore();
  const { openDialog } = useDialogStore();
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

  // Dialog content for different objects
  const getDialogContent = useCallback((objectId: string) => {
    switch (objectId) {
      case "chair":
        return (
          <div>
            <p>
              This chair represents my journey in web development. It's where I
              spend countless hours coding, learning, and creating.
            </p>
            <p>
              From my first "Hello World" to building complex applications,
              every project has been a step forward in my career.
            </p>
            <p>
              I believe in creating comfortable, accessible, and beautiful user
              experiences - just like a well-designed chair.
            </p>
          </div>
        );
      case "sun":
        return (
          <div>
            <p>
              The sun represents my passion for innovation and growth. It
              symbolizes the energy I bring to every project.
            </p>
            <p>
              Just as the sun provides light and warmth, I strive to bring
              clarity and warmth to my work and collaborations.
            </p>
            <p>
              I'm constantly learning and evolving, always seeking to shine
              brighter and help others grow.
            </p>
          </div>
        );
      case "lamp":
        return (
          <div>
            <p>
              This lamp represents my approach to problem-solving. I illuminate
              complex challenges with clear, elegant solutions.
            </p>
            <p>
              Like a lamp that guides the way, I help teams navigate technical
              challenges and find the best path forward.
            </p>
            <p>
              I believe in shedding light on opportunities and making the
              impossible possible.
            </p>
          </div>
        );
      default:
        return (
          <p>This object represents my journey and passion for technology.</p>
        );
    }
  }, []);

  const handleObjectClick = useCallback(
    (objectId: string) => {
      openDialog({
        title: `About ${objectId.charAt(0).toUpperCase() + objectId.slice(1)}`,
        content: getDialogContent(objectId),
      });
    },
    [getDialogContent, openDialog]
  );

  return (
    <group>
      <InteractiveObject
        questAction="click_chair"
        questValue={30}
        onDialogOpen={() => handleObjectClick("chair")}
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
        questAction="click_chair"
        questValue={30}
        onDialogOpen={() => handleObjectClick("chair")}
      >
        <BookshelfModel
          position={[3, FLOOR_Y_POSITION, -3]}
          rotation={[0, 2.5, 0]}
          scale={[2, 2, 2]}
        />
      </InteractiveObject>
    </group>
  );
}
