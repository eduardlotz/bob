import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { SceneObject } from "@/contexts/RouteContext";
import { useSpring, animated } from "@react-spring/three";
import { RigidBody } from "@react-three/rapier";
import { ObjectPrimitives } from "@/3d-objects/primitives";
import { FillColumn } from "@/layout";
import { H2 } from "@/layout/text";
import styled from "styled-components";

interface OrbitingObjectsProps {
  objects: SceneObject[];
  isVisible: boolean;
  onObjectClick: (object: SceneObject) => void;
}

export function OrbitingObjects({
  objects,
  isVisible,
  onObjectClick,
}: OrbitingObjectsProps) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<string | null>(null);
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

  // Orbit animation
  useFrame(({ clock }) => {
    if (orbitGroupRef.current) {
      // Rotate the entire orbit group
      orbitGroupRef.current.rotation.y += 0.005;
    }
  });

  const handleObjectClick = (object: SceneObject) => {
    onObjectClick(object);
    setShowDialog(object.id);
    // setTimeout(() => setShowDialog(null), 4000);
  };

  const renderObject = (object: SceneObject) => {
    if (object.type === "custom" && object.objectType === "message") {
      const ObjectComponent =
        ObjectPrimitives[object.objectType as keyof typeof ObjectPrimitives];
      if (ObjectComponent) {
        return <ObjectComponent color={object.color} />;
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
                </group>
              </RigidBody>

              {/* Dialog */}
              <AnimatePresence>
                {showDialog === id && dialogContent && (
                  <Html position={[0, 2, 0]} center>
                    <Backdrop
                      onClick={() => setShowDialog(null)}
                      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    >
                      <ModalContent
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <FillColumn>
                          {dialogTitle && <H2> {dialogTitle}</H2>}
                          <Content>
                            <p>{dialogContent}</p>
                          </Content>
                        </FillColumn>
                      </ModalContent>
                    </Backdrop>
                  </Html>
                )}
              </AnimatePresence>
            </group>
          );
        }
      )}
    </animated.group>
  );
}

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 18, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  overflow: hidden;
  height: 100dvh;
  max-height: 100lvh;
  min-height: 100svh;
`;

const ModalContent = styled(motion.div)`
  background: white;
  padding: 24px;
  border-radius: 44px;
  max-width: 500px;
  width: calc(100% - 48px);
  max-height: 80vh;
  overflow-y: auto;
`;

const Content = styled.div`
  margin-top: 20px;

  p {
    margin-bottom: 16px;
    line-height: 1.6;
    color: #333;
  }
`;
