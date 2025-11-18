import { useState } from "react";
import { Outlines } from "@react-three/drei";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useViewStore } from "@/store/viewStore";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { a } from "@react-spring/three";
import { match } from "ts-pattern";

export type InteractionMode = "dialog" | "view";

interface InteractiveObjectProps {
  questAction: string;
  questValue?: number;
  children: React.ReactNode;
  mode: InteractionMode;
  onDialogOpen?: () => void;
  viewId?: string;
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
  const { transitionToView, currentView, isTransitioning, resetToDefaultView } =
    useViewStore();
  const { playUISound } = useSoundSystem();

  // go back to normal view if view is currently active
  const isViewActive = mode === "view" && currentView === viewId;

  const handleClick = async (e: any) => {
    e.stopPropagation();
    playUISound("ui-tap-2");

    triggerQuest(questAction, questValue);

    await match(mode)
      .with("dialog", async () => {
        onDialogOpen?.();
      })
      .with("view", async () => {
        if (viewId) {
          if (isViewActive) {
            resetToDefaultView();
          } else {
            setIsActive(true);
            try {
              await transitionToView(viewId);
            } finally {
              setIsActive(false);
            }
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
          thickness={isViewActive ? 1.2 : 1}
          color={isViewActive ? "#ffffff" : "#00000000"}
          opacity={isViewActive ? 0.8 : 1}
          screenspace
        />
      )}
      {children}
    </a.group>
  );
}
