import { useFloatingBar } from "@/layout/FloatingBar";
import { useAppStore } from "@/store";
import { useSocialsStore, ThroneId } from "@/store/socials";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import {
  RefObject,
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
} from "react";
import * as THREE from "three";

import { THRONE_META } from "./data";
import { ThroneDef, throneObjectRefs } from ".";

const PEDESTAL_H = 0.5;
const PEDESTAL_W = 0.28;
const PLATFORM_OVERHANG = 0.032;

const FOCUS_DIST = 1.5; // same as books
const FOCUS_POS_LERP = 0.14; // same as books
const FOCUS_DISMISS_LERP = 0.22; // same as books
const DRAG_THRESHOLD_PX = 4;

const _t = {
  invMat: new THREE.Matrix4(),
  pQuat: new THREE.Quaternion(),
  pScale: new THREE.Vector3(),
  pPos: new THREE.Vector3(),
  localPos: new THREE.Vector3(),
  localQuat: new THREE.Quaternion(),
  tQuat: new THREE.Quaternion(),
  toCamera: new THREE.Vector3(),
  camFwd: new THREE.Vector3(),
  camRight: new THREE.Vector3(),
  camUp: new THREE.Vector3(),
  targetW: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, "XYZ"),
};

export const FocusedThroneMesh = ({
  groupRef,
  throneDefs,
}: {
  groupRef: RefObject<THREE.Group | null>;
  throneDefs: ThroneDef[];
}) => {
  const focusedThrone = useSocialsStore((s) => s.focusedThrone);
  const clearFocus = useSocialsStore((s) => s.clearFocus);
  const isMobile = useAppStore((s) => s.isMobile);

  const [renderThrone, setRenderThrone] = useState<ThroneId | null>(null);

  const meshRef = useRef<THREE.Group>(null);
  const curWorldPos = useRef(new THREE.Vector3());
  const curWorldQuat = useRef(new THREE.Quaternion());
  const curScale = useRef(0);
  const targetScale = useRef(0);
  const isDismissing = useRef(false);
  const active = useRef(false);

  // Match FocusedBookMesh: slow idle spin (0.001/frame)
  const spin = useRef(0);
  const dragYaw = useRef(0);
  const dragPitch = useRef(0);
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Global pointer — keeps drag alive when cursor leaves the mesh
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      if (
        !hasDragged.current &&
        (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)
      ) {
        hasDragged.current = true;
      }
      dragYaw.current -= dx * 0.005;
      dragPitch.current += dy * 0.005;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
    };
    const onUp = () => {
      dragging.current = false;
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

  // Seed start world position from the throne's live object group
  useEffect(() => {
    if (focusedThrone) {
      const src = throneObjectRefs.get(focusedThrone);
      if (src) {
        src.getWorldPosition(curWorldPos.current);
        curWorldQuat.current.identity();
      } else if (groupRef.current) {
        groupRef.current.updateWorldMatrix(true, false);
        const def = throneDefs.find((d) => d.id === focusedThrone);
        if (def) {
          groupRef.current.localToWorld(
            curWorldPos.current.set(def.x, PEDESTAL_H + 0.2, def.z),
          );
        }
        curWorldQuat.current.identity();
      }

      curScale.current = 1;
      targetScale.current = 1.1;
      isDismissing.current = false;
      active.current = true;

      spin.current = 0;
      dragYaw.current = 0;
      dragPitch.current = 0;
      dragging.current = false;
      hasDragged.current = false;

      setRenderThrone(focusedThrone);
    } else {
      isDismissing.current = true;
      targetScale.current = 0;
      dragging.current = false;
      hasDragged.current = false;
    }
  }, [focusedThrone]);

  useFrame(({ camera }) => {
    if (!meshRef.current || !groupRef.current || !active.current) return;

    const lf = isDismissing.current ? FOCUS_DISMISS_LERP : FOCUS_POS_LERP;
    curScale.current += (targetScale.current - curScale.current) * lf;

    if (!isDismissing.current) {
      // ── Position: camera-forward + offset, identical to FocusedBookMesh ──
      camera.getWorldDirection(_t.camFwd);
      _t.camRight.crossVectors(_t.camFwd, camera.up).normalize();
      _t.camUp.crossVectors(_t.camRight, _t.camFwd).normalize();

      _t.targetW.copy(camera.position).addScaledVector(_t.camFwd, FOCUS_DIST);
      //   _t.targetW.addScaledVector(_t.camFwd, 0.95);
      if (isMobile) {
        _t.targetW.addScaledVector(_t.camUp, 0.28);
      } else {
        _t.targetW.addScaledVector(_t.camUp, -0.28);
        _t.targetW.addScaledVector(_t.camRight, -0.25);
      }
      curWorldPos.current.lerp(_t.targetW, FOCUS_POS_LERP);

      // ── Stable camera-facing rotation + spin + drag ──
      if (!dragging.current) spin.current += 0.001;

      _t.toCamera.copy(camera.position).sub(curWorldPos.current).normalize();

      const yaw = Math.atan2(_t.toCamera.x, _t.toCamera.z);

      _t.euler.set(
        dragPitch.current,
        yaw + spin.current + dragYaw.current,
        0,
        "XYZ",
      );

      _t.tQuat.setFromEuler(_t.euler);
      curWorldQuat.current.slerp(_t.tQuat, FOCUS_POS_LERP * 1.8);
    }

    // ── World → group-local (identical to FocusedBookMesh) ──
    groupRef.current.updateWorldMatrix(true, false);
    _t.invMat.copy(groupRef.current.matrixWorld).invert();
    _t.localPos.copy(curWorldPos.current).applyMatrix4(_t.invMat);

    groupRef.current.matrixWorld.decompose(_t.pPos, _t.pQuat, _t.pScale);
    _t.localQuat.copy(_t.pQuat).invert().multiply(curWorldQuat.current);

    meshRef.current.position.copy(_t.localPos);
    meshRef.current.quaternion.copy(_t.localQuat);
    meshRef.current.scale.setScalar(curScale.current);

    if (isDismissing.current && curScale.current < 0.008) {
      active.current = false;
      isDismissing.current = false;
      setRenderThrone(null);
    }
  });

  if (!renderThrone) return null;

  const def = throneDefs.find((d) => d.id === renderThrone)!;
  const ObjectComponent = def.customModel;

  return (
    <group
      ref={meshRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        dragging.current = true;
        hasDragged.current = false;
        lastX.current = e.clientX;
        lastY.current = e.clientY;
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasDragged.current) clearFocus();
        hasDragged.current = false;
      }}
    >
      <ObjectComponent color={def.rimColor} focused={false} isFloating={true} />
    </group>
  );
};

export const Throne = memo(
  ({
    def,
    focused,
    viewActive,
  }: {
    def: ThroneDef;
    focused: boolean;
    viewActive: boolean;
  }) => {
    const { setHoveredObject } = useFloatingBar();
    const setFocused = useSocialsStore((s) => s.setFocused);
    const clearFocus = useSocialsStore((s) => s.clearFocus);
    const focusedThrone = useSocialsStore((s) => s.focusedThrone);
    const meta = THRONE_META[def.id];

    // Register group so FocusedThroneMesh can read its world position
    const objectGroupRef = useCallback(
      (g: THREE.Group | null) => {
        if (g) throneObjectRefs.set(def.id, g);
        else throneObjectRefs.delete(def.id);
      },
      [def.id],
    );

    const baseColor = new THREE.Color(def.baseColor);
    const platformColor = new THREE.Color(def.baseColor).lerp(
      new THREE.Color("#ffffff"),
      0.14,
    );
    const rimColor = new THREE.Color(def.rimColor);

    const onOver = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        if (!viewActive || focusedThrone) return;
        e.stopPropagation();
        setHoveredObject({ title: meta.label });
        document.body.style.cursor = "pointer";
      },
      [viewActive, focusedThrone, meta.label, setHoveredObject],
    );

    const onOut = useCallback(() => {
      setHoveredObject(null);
      document.body.style.cursor = "default";
    }, [setHoveredObject]);

    const onClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (!viewActive) return;
        if (focusedThrone) {
          clearFocus();
        } else {
          e.stopPropagation();
          setFocused(def.id);
        }
      },
      [viewActive, focusedThrone, def.id, setFocused, clearFocus],
    );

    const ObjectComponent = def.customModel;

    return (
      <group
        position={[def.x, 0, def.z]}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        {/* Column */}
        <mesh position={[0, PEDESTAL_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[PEDESTAL_W, PEDESTAL_H, PEDESTAL_W]} />
          <meshToonMaterial color={baseColor} />
        </mesh>

        {/* Accent rim */}
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[PEDESTAL_W + 0.004, 0.018, PEDESTAL_W + 0.004]} />
          <meshToonMaterial color={rimColor} />
        </mesh>

        {/* Top cap */}
        <mesh position={[0, PEDESTAL_H + 0.011, 0]} castShadow>
          <boxGeometry
            args={[
              PEDESTAL_W + PLATFORM_OVERHANG,
              0.02,
              PEDESTAL_W + PLATFORM_OVERHANG,
            ]}
          />
          <meshToonMaterial color={platformColor} />
        </mesh>

        {/*
        Hidden (scale=0) when this is the actively focused throne — only the
        floating clone from FocusedThroneMesh should be visible, same as books.
      */}
        <group
          ref={objectGroupRef}
          position={[0, PEDESTAL_H + 0.02, 0]}
          scale={focused ? 0 : 1}
        >
          <ObjectComponent
            color={def.rimColor}
            focused={focused}
            isFloating={false}
          />
        </group>
      </group>
    );
  },
);
