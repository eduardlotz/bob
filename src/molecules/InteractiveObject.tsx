import { useRef, useState } from "react";
import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { Mesh } from "three";
import { a } from "@react-spring/three";

interface InteractiveObjectProps {
  questAction: string;
  questValue?: number;
  children: React.ReactNode;
  onDialogOpen?: () => void;
}

export function InteractiveObject({
  questAction,
  questValue = 25,
  children,
  onDialogOpen,
}: InteractiveObjectProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { triggerQuest } = useQuestSystem();

  const handleClick = () => {
    triggerQuest(questAction, questValue);
    onDialogOpen?.();
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <a.group
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </a.group>
  );
}
