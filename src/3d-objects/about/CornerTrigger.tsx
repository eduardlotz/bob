import type { CameraViewId } from "@/store/viewStore";
import { useQuestActions } from "@/hooks/useQuestSystem";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useCursorStore } from "@/store/core/cursor";
import { useAppStore, useViewStore } from "@/store";
import { useVinylStore } from "@/store/vinyls";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";

type Point = [number, number, number];
/** Invisible surfaces sit against the architecture, behind the displayed items. */
export function CornerTrigger({viewId, questAction, surfaces}: {
  viewId: Extract<CameraViewId, "desk" | "socials" | "computer" | "lounge">;
  questAction: string;
  surfaces: {position: Point; rotation?: Point; size: [number,number]}[];
}) {
  const {locale} = useI18n();
  const {setHoveredObject} = useFloatingBar();
  const {triggerQuest} = useQuestActions();
  const {playUISound} = useSoundSystem();
  const leave = () => {setHoveredObject(null);useCursorStore.getState().setHoveringClickable(false);};
  return <group onClick={event=>{
    event.stopPropagation();
    if(event.delta>5 || useAppStore.getState().showOptions || useVinylStore.getState().selected !== null || useViewStore.getState().currentView===viewId) return;
    leave(); triggerQuest(questAction,1);playUISound("ui-tap-2");
    useViewStore.getState().transitionToView(viewId);
  }}>
    <group onPointerEnter={()=>{
      useCursorStore.getState().setHoveringClickable(useViewStore.getState().currentView!==viewId);
      if(useViewStore.getState().currentView!==viewId) setHoveredObject({title:viewControlsMessages[locale].viewTitles[viewId]});
    }} onPointerLeave={leave}>
      {surfaces.map((surface,i)=><mesh key={i} position={surface.position} rotation={surface.rotation}>
        <planeGeometry args={surface.size} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>)}
    </group>
  </group>;
}
