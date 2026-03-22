import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { useAppStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";
import { useSocialsStore } from "@/store/socials";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";

import type { ThroneId } from "./data";
import { throneObjectRefs } from ".";
import type {
  ResolvedThroneFocusInteraction,
  SocialThroneConfig,
  ThroneFocusInteraction,
} from "./types";
import { socialsMessages } from "./socials.messages";

const PEDESTAL_H = 0.5;
const PEDESTAL_W = 0.28;
const PLATFORM_OVERHANG = 0.032;
const THRONE_OBJECT_SCALE = 0.5;
const DEFAULT_PEDESTAL_H = 0.5;
const BODY_MATERIAL = {
  color: "#17191d",
  roughness: 0.42,
  metalness: 0.16,
};
const TOP_PLATE_MATERIAL = {
  color: "#8f6540",
  roughness: 0.82,
  metalness: 0.02,
};

const FOCUS_DIST = 1.5;
const FOCUS_POS_LERP = 0.14;
const FOCUS_DISMISS_LERP = 0.22;
const DRAG_THRESHOLD_PX = 4;

const DEFAULT_FOCUS_INTERACTION: ResolvedThroneFocusInteraction = {
  allowDrag: true,
  dismissOnClick: true,
  dragSensitivity: 0.005,
  idleSpinSpeed: 0.001,
  yawLimit: [-Math.PI, Math.PI],
  pitchLimit: [-0.7, 0.7],
};

const _t = {
  pQuat: new THREE.Quaternion(),
  pScale: new THREE.Vector3(),
  pPos: new THREE.Vector3(),
  tQuat: new THREE.Quaternion(),
  baseQuat: new THREE.Quaternion(),
  toCamera: new THREE.Vector3(),
  camFwd: new THREE.Vector3(),
  camRight: new THREE.Vector3(),
  camUp: new THREE.Vector3(),
  targetW: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, "YXZ"),
};

function resolveFocusInteraction(
  config?: ThroneFocusInteraction,
): ResolvedThroneFocusInteraction {
  return {
    allowDrag: config?.allowDrag ?? DEFAULT_FOCUS_INTERACTION.allowDrag,
    dismissOnClick:
      config?.dismissOnClick ?? DEFAULT_FOCUS_INTERACTION.dismissOnClick,
    dragSensitivity:
      config?.dragSensitivity ?? DEFAULT_FOCUS_INTERACTION.dragSensitivity,
    idleSpinSpeed:
      config?.idleSpinSpeed ?? DEFAULT_FOCUS_INTERACTION.idleSpinSpeed,
    yawLimit: config?.yawLimit ?? DEFAULT_FOCUS_INTERACTION.yawLimit,
    pitchLimit: config?.pitchLimit ?? DEFAULT_FOCUS_INTERACTION.pitchLimit,
  };
}

export const FocusedThroneMesh = ({
  groupRef,
  throneDefs,
}: {
  groupRef: RefObject<THREE.Group | null>;
  throneDefs: readonly SocialThroneConfig[];
}) => {
  const focusedThrone = useSocialsStore((state) => state.focusedThrone);
  const clearFocus = useSocialsStore((state) => state.clearFocus);
  const isMobile = useAppStore((state) => state.isMobile);

  const [renderThrone, setRenderThrone] = useState<ThroneId | null>(null);

  const meshRef = useRef<THREE.Group>(null);
  const curWorldPos = useRef(new THREE.Vector3());
  const curWorldQuat = useRef(new THREE.Quaternion());
  const curScale = useRef(0);
  const targetScale = useRef(0);
  const isDismissing = useRef(false);
  const active = useRef(false);
  const spin = useRef(0);
  const dragYaw = useRef(0);
  const dragPitch = useRef(0);
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const yawVelocity = useRef(0);
  const pitchVelocity = useRef(0);
  const interactionRef = useRef<ResolvedThroneFocusInteraction>(
    DEFAULT_FOCUS_INTERACTION,
  );

  const currentDef = useMemo(
    () => throneDefs.find((throne) => throne.id === renderThrone) ?? null,
    [renderThrone, throneDefs],
  );

  useEffect(() => {
    if (!currentDef) return;
    interactionRef.current = resolveFocusInteraction(
      currentDef.object.focusInteraction,
    );
  }, [currentDef]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return;

      const dx = event.clientX - lastX.current;
      const dy = event.clientY - lastY.current;

      if (
        !hasDragged.current &&
        (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)
      ) {
        hasDragged.current = true;
      }

      const interaction = interactionRef.current;
      const nextYaw = dragYaw.current - dx * interaction.dragSensitivity;
      const nextPitch = dragPitch.current + dy * interaction.dragSensitivity;
      yawVelocity.current = -dx * interaction.dragSensitivity * 0.12;
      pitchVelocity.current = dy * interaction.dragSensitivity * 0.12;

      dragYaw.current = interaction.yawLimit
        ? THREE.MathUtils.clamp(
            nextYaw,
            interaction.yawLimit[0],
            interaction.yawLimit[1],
          )
        : nextYaw;
      dragPitch.current = interaction.pitchLimit
        ? THREE.MathUtils.clamp(
            nextPitch,
            interaction.pitchLimit[0],
            interaction.pitchLimit[1],
          )
        : nextPitch;

      lastX.current = event.clientX;
      lastY.current = event.clientY;
    };

    const onUp = () => {
      dragging.current = false;
      if (interactionRef.current.allowDrag) {
        useCursorStore.setState({ variant: "grab" });
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useEffect(() => {
    if (focusedThrone) {
      const def = throneDefs.find((throne) => throne.id === focusedThrone);
      if (!def) return;

      interactionRef.current = resolveFocusInteraction(def.object.focusInteraction);
      const src = throneObjectRefs.get(focusedThrone);

      if (src) {
        src.getWorldPosition(curWorldPos.current);
        curWorldQuat.current.identity();
      } else if (groupRef.current) {
        groupRef.current.updateWorldMatrix(true, false);
        groupRef.current.localToWorld(
          curWorldPos.current.set(
            def.x,
            (def.pedestalHeight ?? DEFAULT_PEDESTAL_H) + 0.2,
            def.z,
          ),
        );
        curWorldQuat.current.identity();
      }

      curScale.current = 1;
      targetScale.current = 1.1;
      isDismissing.current = false;
      active.current = true;
      spin.current = 0;
      dragYaw.current = 0;
      dragPitch.current = 0;
      yawVelocity.current = 0;
      pitchVelocity.current = 0;
      dragging.current = false;
      hasDragged.current = false;

      if (interactionRef.current.allowDrag) {
        useCursorStore.setState({ variant: "grab" });
      }

      setRenderThrone(focusedThrone);
      return;
    }

    isDismissing.current = true;
    targetScale.current = 0;
    dragging.current = false;
    hasDragged.current = false;
    useCursorStore.setState({ variant: "default" });
  }, [focusedThrone, groupRef, throneDefs]);

  useFrame(({ camera }) => {
    if (!groupRef.current || !active.current || !currentDef) {
      return;
    }

    const interaction = interactionRef.current;
    const lerpFactor = isDismissing.current ? FOCUS_DISMISS_LERP : FOCUS_POS_LERP;
    curScale.current += (targetScale.current - curScale.current) * lerpFactor;

    if (!isDismissing.current) {
      camera.getWorldDirection(_t.camFwd);
      _t.camRight.crossVectors(_t.camFwd, camera.up).normalize();
      _t.camUp.crossVectors(_t.camRight, _t.camFwd).normalize();

      _t.targetW.copy(camera.position).addScaledVector(_t.camFwd, FOCUS_DIST);
      if (isMobile) {
        _t.targetW.addScaledVector(_t.camUp, 0.28);
      } else {
        _t.targetW.addScaledVector(_t.camUp, -0.28);
        _t.targetW.addScaledVector(_t.camRight, -0.25);
      }
      curWorldPos.current.lerp(_t.targetW, FOCUS_POS_LERP);

      if (!dragging.current) {
        spin.current += interaction.idleSpinSpeed;
        dragYaw.current += yawVelocity.current;
        dragPitch.current += pitchVelocity.current;
        yawVelocity.current *= 0.94;
        pitchVelocity.current *= 0.92;

        if (interaction.yawLimit) {
          dragYaw.current = THREE.MathUtils.clamp(
            dragYaw.current,
            interaction.yawLimit[0],
            interaction.yawLimit[1],
          );
          yawVelocity.current *= 0.7;
        }

        if (interaction.pitchLimit) {
          dragPitch.current = THREE.MathUtils.clamp(
            dragPitch.current,
            interaction.pitchLimit[0],
            interaction.pitchLimit[1],
          );
          pitchVelocity.current *= 0.7;
        }
      }
      _t.euler.set(
        dragPitch.current,
        spin.current + dragYaw.current,
        0,
        "YXZ",
      );

      _t.tQuat.setFromEuler(_t.euler);
      _t.baseQuat.copy(camera.quaternion).multiply(_t.tQuat);
      curWorldQuat.current.slerp(_t.baseQuat, FOCUS_POS_LERP * 1.8);
    }

    groupRef.current.matrixWorld.decompose(_t.pPos, _t.pQuat, _t.pScale);
    if (meshRef.current) {
      meshRef.current.position.copy(curWorldPos.current);
      meshRef.current.quaternion.copy(curWorldQuat.current);
      meshRef.current.scale.setScalar(
        _t.pScale.x * curScale.current * THRONE_OBJECT_SCALE,
      );
    }

    if (isDismissing.current && curScale.current < 0.008) {
      active.current = false;
      isDismissing.current = false;
      setRenderThrone(null);
      useCursorStore.setState({ variant: "default" });
    }
  });

  if (!currentDef) return null;

  const ObjectComponent = currentDef.object.Component;
  const interaction = resolveFocusInteraction(currentDef.object.focusInteraction);

  return (
    <group
      ref={meshRef}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (interaction.allowDrag) {
          useCursorStore.setState({ variant: dragging.current ? "grabbing" : "grab" });
        }
      }}
      onPointerOut={() => {
        if (!dragging.current) {
          useCursorStore.setState({ variant: "default" });
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (!interaction.allowDrag) return;

        (event.target as Element).setPointerCapture(event.pointerId);
        dragging.current = true;
        hasDragged.current = false;
        yawVelocity.current = 0;
        pitchVelocity.current = 0;
        lastX.current = event.clientX;
        lastY.current = event.clientY;
        useCursorStore.setState({ variant: "grabbing" });
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        dragging.current = false;
        if (interaction.allowDrag) {
          useCursorStore.setState({ variant: "grab" });
        }
      }}
      onPointerCancel={() => {
        dragging.current = false;
        useCursorStore.setState({ variant: "default" });
      }}
      onClick={(event) => {
        event.stopPropagation();
        const shouldDismiss = interaction.dismissOnClick && !hasDragged.current;
        hasDragged.current = false;
        if (shouldDismiss) {
          clearFocus();
        }
      }}
    >
      <ObjectComponent
        color={currentDef.rimColor}
        focused={false}
        isFloating={true}
        throneId={currentDef.id}
        interaction={interaction}
      />
    </group>
  );
};

export const Throne = memo(
  ({
    def,
    focused,
    viewActive,
  }: {
    def: SocialThroneConfig;
    focused: boolean;
    viewActive: boolean;
  }) => {
    const { setHoveredObject } = useFloatingBar();
    const { locale } = useI18n();
    const setFocused = useSocialsStore((state) => state.setFocused);
    const clearFocus = useSocialsStore((state) => state.clearFocus);
    const focusedThrone = useSocialsStore((state) => state.focusedThrone);

    const objectGroupRef = useCallback(
      (group: THREE.Group | null) => {
        if (group) {
          throneObjectRefs.set(def.id as ThroneId, group);
          return;
        }
        throneObjectRefs.delete(def.id as ThroneId);
      },
      [def.id],
    );

    const interaction = useMemo(
      () => resolveFocusInteraction(def.object.focusInteraction),
      [def.object.focusInteraction],
    );
    const pedestalHeight = def.pedestalHeight ?? DEFAULT_PEDESTAL_H;

    const bodyColor = new THREE.Color(BODY_MATERIAL.color);
    const topPlateColor = new THREE.Color(TOP_PLATE_MATERIAL.color);

    const onOver = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!viewActive || focusedThrone) return;
        event.stopPropagation();
        setHoveredObject({ title: socialsMessages[locale][def.id].label });
        document.body.style.cursor = "pointer";
      },
      [def.id, focusedThrone, locale, setHoveredObject, viewActive],
    );

    const onOut = useCallback(() => {
      setHoveredObject(null);
      document.body.style.cursor = "default";
    }, [setHoveredObject]);

    const onClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        if (!viewActive) return;
        if (focusedThrone) {
          clearFocus();
          return;
        }
        event.stopPropagation();
        setFocused(def.id as ThroneId);
      },
      [clearFocus, def.id, focusedThrone, setFocused, viewActive],
    );

    const ObjectComponent = def.object.Component;

    return (
      <group
        position={[def.x, 0, def.z]}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <mesh position={[0, pedestalHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[PEDESTAL_W, pedestalHeight, PEDESTAL_W]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={BODY_MATERIAL.roughness}
            metalness={BODY_MATERIAL.metalness}
          />
        </mesh>

        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[PEDESTAL_W + 0.004, 0.018, PEDESTAL_W + 0.004]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={BODY_MATERIAL.roughness}
            metalness={BODY_MATERIAL.metalness}
          />
        </mesh>

        <mesh position={[0, pedestalHeight + 0.011, 0]} castShadow>
          <boxGeometry
            args={[
              PEDESTAL_W + PLATFORM_OVERHANG,
              0.02,
              PEDESTAL_W + PLATFORM_OVERHANG,
            ]}
          />
          <meshStandardMaterial
            color={topPlateColor}
            roughness={TOP_PLATE_MATERIAL.roughness}
            metalness={TOP_PLATE_MATERIAL.metalness}
          />
        </mesh>

        <group
          ref={objectGroupRef}
          position={[0, pedestalHeight + 0.02, 0]}
          scale={focused ? 0 : THRONE_OBJECT_SCALE}
        >
          <ObjectComponent
            color={def.rimColor}
            focused={focused}
            isFloating={false}
            throneId={def.id}
            interaction={interaction}
          />
        </group>
      </group>
    );
  },
);
