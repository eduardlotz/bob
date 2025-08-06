import { Float } from "@react-three/drei";
import { useCallback, useEffect } from "react";
import { InteractiveObject } from "./InteractiveObject";
import { ImageCarousel } from "./ImageCarousel";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useDialogStore } from "@/store/dialogStore";
import { ROUTE_PATHS, useGameStore } from "@/store";
import { useNavigate } from "react-router-dom";

export function PortfolioScene() {
  const { openDialog } = useDialogStore();
  const { checkUnlockedRoutes } = useGameStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.PORTFOLIO);

  useEffect(() => {
    if (!isAllowedToAcces) {
      navigate(ROUTE_PATHS.HOME);
    }
  }, [isAllowedToAcces]);

  // Portfolio project images
  const projectImages = [
    {
      src: "/api/placeholder/400/300",
      alt: "E-commerce Platform",
      title: "E-commerce Platform",
      description:
        "Full-stack React application with Node.js backend and PostgreSQL database. Features include user authentication, product management, and payment integration.",
    },
    {
      src: "/api/placeholder/400/300",
      alt: "Task Management App",
      title: "Task Management App",
      description:
        "Real-time collaborative task management built with React, TypeScript, and Socket.io. Includes drag-and-drop functionality and team collaboration features.",
    },
    {
      src: "/api/placeholder/400/300",
      alt: "Portfolio Website",
      title: "Portfolio Website",
      description:
        "Interactive 3D portfolio built with React Three Fiber and Framer Motion. Features quest system, animations, and responsive design.",
    },
  ];

  // Dialog content for different objects
  const getDialogContent = useCallback(
    (objectId: string) => {
      switch (objectId) {
        case "computer":
          return (
            <div>
              <h3>Development</h3>
              <p>This represents my development environment</p>
            </div>
          );
        case "books":
          return (
            <div>
              <h3 style={{ color: "#ffd700", marginBottom: "12px" }}>
                Learning
              </h3>
              <p>These books represent my books</p>
            </div>
          );
        case "coffee":
          return (
            <div>
              <h3 style={{ color: "#ffd700", marginBottom: "12px" }}>
                Project Showcase
              </h3>
              <ImageCarousel images={projectImages} />
            </div>
          );
        default:
          return (
            <p>
              This object represents my portfolio and professional experience.
            </p>
          );
      }
    },
    [projectImages]
  );

  const handleObjectClick = useCallback(
    (objectId: string) => {
      openDialog({
        title: `Portfolio - ${
          objectId.charAt(0).toUpperCase() + objectId.slice(1)
        }`,
        content: getDialogContent(objectId),
      });
    },
    [getDialogContent, openDialog]
  );

  return (
    <group>
      {/* Interactive 3D Objects */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[-3, -1, -8]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.2, 1.2]}
          questAction="click_computer"
          questValue={40}
          onDialogOpen={() => handleObjectClick("computer")}
        >
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#2C3E50" />
        </InteractiveObject>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[3, 0, -8]}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
          questAction="click_books"
          questValue={30}
          onDialogOpen={() => handleObjectClick("books")}
        >
          <boxGeometry args={[0.8, 1.2, 0.6]} />
          <meshStandardMaterial color="#8B4513" />
        </InteractiveObject>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <InteractiveObject
          position={[0, 1, -10]}
          rotation={[0, 0, 0]}
          scale={[0.8, 0.8, 0.8]}
          questAction="click_coffee"
          questValue={50}
          onDialogOpen={() => handleObjectClick("coffee")}
        >
          <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </InteractiveObject>
      </Float>
    </group>
  );
}
