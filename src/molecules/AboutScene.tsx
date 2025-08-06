import { Float } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import { ROUTE_PATHS } from "@/store";
import { useCallback, useEffect } from "react";
import { InteractiveObject } from "./InteractiveObject";
import { useDialogStore } from "@/store/dialogStore";
import { useNavigate } from "react-router-dom";

export function AboutScene() {
  const { checkUnlockedRoutes } = useGameStore();
  const { openDialog } = useDialogStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.PORTFOLIO);

  useEffect(() => {
    if (!isAllowedToAcces) {
      navigate(ROUTE_PATHS.HOME);
    }
  }, [isAllowedToAcces]);

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
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[-4, -1, -8]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.2, 1.2]}
          questAction="click_chair"
          questValue={30}
          onDialogOpen={() => handleObjectClick("chair")}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B4513" />
        </InteractiveObject>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[4, 2, -8]}
          rotation={[0, 0, 0]}
          scale={[1.5, 1.5, 1.5]}
          questAction="click_sun"
          questValue={25}
          onDialogOpen={() => handleObjectClick("sun")}
        >
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </InteractiveObject>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[0, 0, -10]}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
          questAction="click_lamp"
          questValue={35}
          onDialogOpen={() => handleObjectClick("lamp")}
        >
          <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
          <meshStandardMaterial color="#FFD700" />
        </InteractiveObject>
      </Float>
    </group>
  );
}
