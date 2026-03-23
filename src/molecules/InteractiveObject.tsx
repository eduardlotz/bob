import { useQuestSystem } from "@/hooks/useQuestSystem";
import { CameraViewId, useViewStore } from "@/store/viewStore";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { match } from "ts-pattern";
import { useCursorStore } from "@/store/core/cursor";

export type InteractionMode = "dialog" | "view";

interface InteractiveObjectProps {
  questAction: string;
  questValue?: number;
  children: React.ReactNode;
  mode?: InteractionMode;
  onDialogOpen?: () => void;
  viewId?: CameraViewId;
  showOutline?: boolean;
  position?: [number, number, number];
}

export function InteractiveObject({
  questAction,
  questValue = 25,
  children,
  mode,
  onDialogOpen,
  viewId,
  position,
}: InteractiveObjectProps) {
  const { triggerQuest } = useQuestSystem();
  const { transitionToView, currentView } = useViewStore();
  const { playUISound } = useSoundSystem();
  const cursor = useCursorStore();

  const isViewActive = mode === "view" && currentView === viewId;

  const handlePointerEnter = () => {
    if (!isViewActive) cursor.setHoveringClickable(true);
  };

  const handlePointerLeave = () => {
    cursor.setHoveringClickable(false);
  };

  const handlePointerDown = () => {
    if (!isViewActive) {
      cursor.setPointerDown(true);
      playUISound("ui-tap-2");
    }

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

  return (
    <group
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handlePointerDown}
      position={position}
    >
      {children}
    </group>
  );
}
