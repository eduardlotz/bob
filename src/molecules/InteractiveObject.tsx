import { useState } from "react";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { CameraViewId, useViewStore } from "@/store/viewStore";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { match } from "ts-pattern";
import { useCursorStore } from "@/store/cursorStore";

export type InteractionMode = "dialog" | "view";

interface InteractiveObjectProps {
  questAction: string;
  questValue?: number;
  children: React.ReactNode;
  mode?: InteractionMode;
  onDialogOpen?: () => void;
  viewId?: CameraViewId;
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
  const cursor = useCursorStore();

  const isViewActive = mode === "view" && currentView === viewId;

  const handleClick = (e: any) => {
    playUISound("ui-tap-2");

    triggerQuest(questAction, questValue);

    match(mode)
      .with("dialog", () => {
        onDialogOpen?.();
      })
      .with("view", () => {
        if (viewId) {
          if (!isViewActive) {
            transitionToView(viewId);
          }
        }
      });
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    cursor.set("hover");
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    cursor.set("default");
  };

  const handlePointerDown = () => {
    cursor.set("active");
  };

  return (
    <group
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      {children}
    </group>
  );
}
