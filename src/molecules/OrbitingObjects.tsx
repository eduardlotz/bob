import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SceneObject } from "@/contexts/RouteContext";
import { useSpring, animated } from "@react-spring/three";
import { RigidBody } from "@react-three/rapier";
import { ObjectFactory } from "./ObjectFactory";
import { useKeyPress } from "@/hooks/useKeyPress";

interface OrbitingObjectsProps {
  objects: SceneObject[];
  isVisible: boolean;
  onObjectClick: (object: SceneObject) => void;
  onDialogOpen?: (dialogContent: { title: string; content: string }) => void;
}

export function OrbitingObjects({
  objects,
  isVisible,
  onObjectClick,
  onDialogOpen,
}: OrbitingObjectsProps) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  // Spring animation for object visibility
  const [springs, api] = useSpring(() => ({
    scale: [0, 0, 0],
    config: { tension: 300, friction: 20 },
  }));

  // Animate objects in/out based on visibility
  useEffect(() => {
    if (isVisible) {
      api.start({
        scale: [1, 1, 1],
        delay: 500, // Delay to let menu close animation finish
      });
    } else {
      api.start({
        scale: [0, 0, 0],
      });
    }
  }, [isVisible, api]);

  // Orbit animation - stop when hovering
  useFrame(({ clock }) => {
    if (orbitGroupRef.current && !hoveredObject) {
      // Rotate the entire orbit group only when not hovering
      orbitGroupRef.current.rotation.y += 0.005;
    }
  });

  const handleObjectClick = (object: SceneObject) => {
    onObjectClick(object);

    // Get dialog content and pass it to parent
    if (onDialogOpen && object.dialogTitle && object.dialogContent) {
      onDialogOpen({
        title: object.dialogTitle,
        content: object.dialogContent,
      });
    }
  };

  useKeyPress("Escape", () => {
    // Handle escape key for dialog closing in parent component
  });

  const renderObject = (object: SceneObject) => {
    if (object.type === "custom" && object.objectType) {
      const ObjectComponent = ObjectFactory.getObjectComponent(
        object.objectType
      );
      if (ObjectComponent) {
        return (
          <ObjectComponent
            color={object.color}
            scale={object.scale?.[0] || 1}
          />
        );
      }
    }

    // Fallback to primitive geometry
    const getGeometry = (geometry?: string) => {
      switch (geometry) {
        case "sphere":
          return <sphereGeometry args={[1, 32, 32]} />;
        case "cube":
          return <boxGeometry args={[1, 1, 1]} />;
        case "cylinder":
          return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
        case "torus":
          return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
        default:
          return <sphereGeometry args={[1, 32, 32]} />;
      }
    };

    return (
      <mesh scale={object.scale || [1, 1, 1]}>
        {getGeometry(object.geometry)}
        <meshToonMaterial color={object.color || "#ffffff"} />
      </mesh>
    );
  };

  // Detect bad scene object structure
  useEffect(() => {
    objects.forEach((obj) => {
      if (obj instanceof THREE.Object3D) {
        throw new Error(
          "Invalid: sceneObjects contains THREE.Object3D instance"
        );
      }
      if (
        "id" in obj &&
        Object.getOwnPropertyDescriptor(obj, "id")?.writable === false
      ) {
        throw new Error("sceneObject.id is read-only");
      }
    });
  }, [objects]);

  if (!objects.length) return null;

  const groupKey = objects.map((o) => o.id).join("-");
  const clonedObjects = objects;

  return (
    <animated.group
      key={`orbit-${groupKey}`}
      ref={orbitGroupRef}
      scale={springs.scale}
    >
      {clonedObjects.map(
        (
          {
            id,
            scale,
            color,
            geometry,
            orbitRadius,
            type,
            objectType,
            dialogTitle,
            dialogContent,
            // ...otherProps
          },
          index
        ) => {
          const angle = (index / clonedObjects.length) * Math.PI * 2;
          const radius = orbitRadius || 2.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const isHovered = hoveredObject === id;

          const object: SceneObject = {
            id,
            scale,
            color,
            geometry,
            orbitRadius,
            type,
            objectType,
            dialogTitle,
            dialogContent,
            position: [x, 0, z], // add required field from known position
          };

          return (
            <group key={`obj-${id}`} position={[x, 0, z]}>
              <RigidBody
                {...{
                  colliders: "cuboid",
                  mass: 1,
                  friction: 0.7,
                  restitution: 0.2,
                  translation: [0, 5, 0],
                }}
              >
                <group
                  onClick={() => handleObjectClick(object)}
                  onPointerOver={() => setHoveredObject(id)}
                  onPointerOut={() => setHoveredObject(null)}
                >
                  {renderObject(object)}

                  {/* Hover sphere - only visible when hovered */}
                  {isHovered && (
                    <mesh>
                      <sphereGeometry args={[1.5, 32, 32]} />
                      <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.1}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                </group>
              </RigidBody>
            </group>
          );
        }
      )}
    </animated.group>
  );
}
