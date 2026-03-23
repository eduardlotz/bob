import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { useCursorStore } from "@/store/core/cursor";

import { useViewStore } from "@/store";
import { useSocialsStore } from "@/store/socials";
import { _restoreFullControls } from "@/3d-objects/books/utils";

import { THRONE_BY_ID, THRONE_CONFIG, type ThroneId } from "./data";
import { FocusedThroneMesh, Throne } from "./throne";
import type {
  ResolvedThroneFocusInteraction,
  SocialThroneConfig,
} from "./types";
import { SocialsGlobeObject } from "./sceneObjects";
import { socialsMessages } from "./socials.messages";

export const throneObjectRefs = new Map<ThroneId, THREE.Group>();
const STANDALONE_OBJECT_SCALE = 0.5;
const STANDALONE_THRONE_DEFS = [THRONE_BY_ID.socials] as const;
const STANDALONE_SOCIALS_INTERACTION: ResolvedThroneFocusInteraction = {
  allowDrag: THRONE_BY_ID.socials.object.focusInteraction?.allowDrag ?? true,
  dismissOnClick:
    THRONE_BY_ID.socials.object.focusInteraction?.dismissOnClick ?? true,
  dragSensitivity:
    THRONE_BY_ID.socials.object.focusInteraction?.dragSensitivity ?? 0.00395,
  idleSpinSpeed:
    THRONE_BY_ID.socials.object.focusInteraction?.idleSpinSpeed ?? 0.00062,
  yawLimit: THRONE_BY_ID.socials.object.focusInteraction?.yawLimit ?? null,
  pitchLimit: THRONE_BY_ID.socials.object.focusInteraction?.pitchLimit ?? null,
};

export function SocialsCorner({
  viewId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  throneDefs = THRONE_CONFIG,
}: {
  viewId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  throneDefs?: readonly SocialThroneConfig[];
}) {
  const currentView = useViewStore((state) => state.currentView);
  const setCameraEnabled = useViewStore((state) => state.setCameraEnabled);
  const focusedThrone = useSocialsStore((state) => state.focusedThrone);
  const groupRef = useRef<THREE.Group>(null);
  const viewActive = currentView === viewId;

  useEffect(() => {
    if (!viewActive) {
      useSocialsStore.getState().clearFocus();
      setCameraEnabled(true);
      _restoreFullControls();
      return;
    }

    setCameraEnabled(!focusedThrone);
  }, [focusedThrone, setCameraEnabled, viewActive]);

  return (
    <>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        {throneDefs.map((def) => (
          <Throne
            key={def.id}
            def={def}
            focused={focusedThrone === def.id}
            viewActive={viewActive}
          />
        ))}
      </group>
      <FocusedThroneMesh groupRef={groupRef} throneDefs={throneDefs} />
    </>
  );
}

export function StandaloneSocialsGlobe({
  questAction = "click_socials",
  questValue = 30,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  questAction?: string;
  questValue?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const { locale } = useI18n();
  const localizedMessages =
    socialsMessages[locale as keyof typeof socialsMessages];
  const { triggerQuest } = useQuestSystem();
  const { playUISound } = useSoundSystem();
  const { setHoveredObject } = useFloatingBar();
  const setHoveringClickable = useCursorStore((state) => state.setHoveringClickable);

  const setCameraEnabled = useViewStore((state) => state.setCameraEnabled);

  const focusedThrone = useSocialsStore((state) => state.focusedThrone);
  const setFocused = useSocialsStore((state) => state.setFocused);
  const clearFocus = useSocialsStore((state) => state.clearFocus);

  const groupRef = useRef<THREE.Group>(null);
  const isFocused = focusedThrone === "socials";

  useEffect(() => {
    if (focusedThrone) {
      setCameraEnabled(false);
      return;
    }

    setCameraEnabled(true);
    _restoreFullControls();
  }, [focusedThrone, setCameraEnabled]);

  const objectGroupRef = (group: THREE.Group | null) => {
    if (group) {
      throneObjectRefs.set("socials", group);
      return;
    }
    throneObjectRefs.delete("socials");
  };

  const handlePointerEnter = (event: any) => {
    if (isFocused) return;
    event.stopPropagation();
    setHoveredObject({
      title: localizedMessages.socials.label,
    });
    setHoveringClickable(true);
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
    setHoveringClickable(false);
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    setHoveredObject(null);
    setHoveringClickable(false);

    triggerQuest(questAction, questValue);

    if (!isFocused) {
      playUISound("ui-tap-2");
    }

    if (!isFocused) {
      setFocused("socials");
    }
  };

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <group
          ref={objectGroupRef}
          scale={isFocused ? 0 : STANDALONE_OBJECT_SCALE}
        >
          <SocialsGlobeObject
            color={THRONE_BY_ID.socials.rimColor}
            focused={isFocused}
            isFloating={false}
            throneId="socials"
            interaction={STANDALONE_SOCIALS_INTERACTION}
          />
        </group>
      </group>
      <FocusedThroneMesh groupRef={groupRef} throneDefs={STANDALONE_THRONE_DEFS} />
    </>
  );
}
