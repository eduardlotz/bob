import { useRef, useState } from "react";
import { Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useViewStore } from "@/store/viewStore";
import { Mesh } from "three";
import { a } from "@react-spring/three";
import { match } from "ts-pattern";

// interaction mode types
export type InteractionMode = "dialog" | "view";

interface InteractiveObjectProps {
  questAction: string;
  questValue?: number;
  children: React.ReactNode;

  // interaction mode configuration
  mode: InteractionMode;

  // dialog mode props
  onDialogOpen?: () => void;

  // view mode props
  viewId?: string;

  // optional hover effects
  showOutline?: boolean;
}

export function InteractiveObject({
  questAction,
  questValue = 25,
  children,
  mode,
  onDialogOpen,
  viewId,
  showOutline = true,
}: InteractiveObjectProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { triggerQuest } = useQuestSystem();
  const { transitionToView, currentView, isTransitioning } = useViewStore();

  // check if this object's view is currently active
  const isViewActive = mode === "view" && currentView === viewId;

  const handleClick = async () => {
    // trigger quest system
    triggerQuest(questAction, questValue);

    // handle interaction based on mode
    await match(mode)
      .with("dialog", async () => {
        onDialogOpen?.();
      })
      .with("view", async () => {
        if (viewId) {
          setIsActive(true);
          try {
            await transitionToView(viewId);
          } finally {
            setIsActive(false);
          }
        }
      })
      .exhaustive();
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    document.body.style.cursor = "auto";
  };

  const shouldShowOutline = showOutline && (isHovered || isViewActive);
  const isDisabled = isTransitioning;

  return (
    <a.group
      onClick={isDisabled ? undefined : handleClick}
      onPointerEnter={isDisabled ? undefined : handlePointerEnter}
      onPointerLeave={isDisabled ? undefined : handlePointerLeave}
    >
      {shouldShowOutline && (
        <Outlines
          thickness={isViewActive ? 0.08 : 0.05}
          color={isViewActive ? "#4ade80" : "#60a5fa"}
          transparent
          opacity={isViewActive ? 0.8 : 0.6}
        />
      )}
      {children}
    </a.group>
  );
}
