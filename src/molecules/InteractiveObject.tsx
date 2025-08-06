import { useRef, useState } from "react";
import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { Mesh } from "three";
import { a } from "@react-spring/three";

interface InteractiveObjectProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  questAction: string;
  questValue?: number;
  children: React.ReactNode;
  onDialogOpen?: () => void;
}

export function InteractiveObject({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  questAction,
  questValue = 25,
  children,
  onDialogOpen,
}: InteractiveObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { triggerQuest } = useQuestSystem();

  useFrame(() => {
    if (meshRef.current && isHovered) {
      meshRef.current.rotation.y += 0.02;
    }
  });

  const handleClick = () => {
    triggerQuest(questAction, questValue);
    onDialogOpen?.();
  };

  return (
    <a.group
      position={position}
      rotation={rotation}
      scale={scale}
      style={{ cursor: "pointer" }}
    >
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {children}
        {isHovered && <Outlines thickness={0.03} color="black" screenspace />}
      </mesh>
    </a.group>
  );
}
