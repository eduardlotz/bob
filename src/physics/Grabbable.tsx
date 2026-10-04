import React, { useEffect, useRef, useState } from "react";
import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { Vector3, Vector2, Plane } from "three";
import { useCoreStore, useViewStore } from "@/store";
import { Line } from "@react-three/drei";

const DragDebug = ({ start, end }: { start: Vector3; end: Vector3 }) => (
  <Line
    points={[start, end]}
    color="red"
    lineWidth={2}
    depthTest={false}
    transparent
    opacity={0.5}
  />
);

type DragMode = "kinematic" | "spring";

type GrabbableProps = {
  children: React.ReactElement;
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  mode?: DragMode;
  lockX?: boolean;
  lockY?: boolean;
  lockZ?: boolean;
  min?: { x?: number; y?: number; z?: number };
  max?: { x?: number; y?: number; z?: number };
  stiffness?: number;
  damping?: number;
  throwMult?: number;
  freezeRotation?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
};

export const Grabbable = ({
  children,
  rigidBodyRef,
  mode = "spring",
  lockX = false,
  lockY = false,
  lockZ = false,
  min,
  max,
  stiffness = 80,
  damping = 6,
  throwMult = 1,
  freezeRotation = false,
  onDragStart,
  onDragEnd,
  onClick,
}: GrabbableProps) => {
  const { camera, size } = useThree();
  const { physicsDebugEnabled: debug } = useCoreStore();

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const mouseUV = useRef(new Vector2());
  const prevMouseUV = useRef(new Vector2());
  const pointerStart = useRef(new Vector2());
  const movedSincePointerDown = useRef(false);

  const grabDepth = useRef(0);
  const screenOffset = useRef(new Vector2());

  const velocityBuffer = useRef<Vector3[]>([]);
  const MAX_BUFFER = 6;

  const debugStart = useRef(new Vector3());
  const debugEnd = useRef(new Vector3());

  const dragPlane = useRef(new Plane());

  const restoreCameraControls = () => {
    const controls = useViewStore.getState().cameraControlsRef?.current;
    if (controls) controls.enabled = true;
  };

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (isDraggingRef.current) restoreCameraControls();
    };
  }, []);

  const updateMouseUV = (e: PointerEvent | ThreeEvent<PointerEvent>) => {
    mouseUV.current.set(
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1,
    );
  };

  const cursorToPlane = (uv: Vector2, out = new Vector3()) => {
    const rayOrigin = camera.position;
    const rayDir = new Vector3(uv.x, uv.y, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();

    const t =
      -(rayOrigin.dot(dragPlane.current.normal) + dragPlane.current.constant) /
      rayDir.dot(dragPlane.current.normal);

    return out.copy(rayOrigin).add(rayDir.multiplyScalar(t));
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pointerStart.current.set(e.clientX, e.clientY);
    movedSincePointerDown.current = false;
    const body = rigidBodyRef.current;
    if (!body) return;

    const controls = useViewStore.getState().cameraControlsRef?.current;
    if (controls) controls.enabled = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    updateMouseUV(e);

    const pos = body.translation();
    const worldPos = new Vector3(pos.x, pos.y, pos.z);

    const camForward = new Vector3();
    camera.getWorldDirection(camForward);

    dragPlane.current.setFromNormalAndCoplanarPoint(camForward, worldPos);

    const projected = worldPos.clone().project(camera);
    grabDepth.current = projected.z;

    screenOffset.current.set(projected.x, projected.y).sub(mouseUV.current);

    velocityBuffer.current = [];
    prevMouseUV.current.copy(mouseUV.current);

    body.wakeUp();
    if (mode === "kinematic") body.setBodyType(2, true);
    if (freezeRotation) body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    isDraggingRef.current = true;
    setIsDragging(true);
    onDragStart?.();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    if (dx * dx + dy * dy > 25) {
      movedSincePointerDown.current = true;
    }
    prevMouseUV.current.copy(mouseUV.current);
    updateMouseUV(e);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    restoreCameraControls();

    const body = rigidBodyRef.current;
    if (!body) {
      setIsDragging(false);
      onDragEnd?.();
      return;
    }

    let throwVel = new Vector3();

    if (velocityBuffer.current.length) {
      for (const v of velocityBuffer.current) throwVel.add(v);
      throwVel.divideScalar(velocityBuffer.current.length);
    }

    if (lockX) throwVel.x = 0;
    if (lockY) throwVel.y = 0;
    if (lockZ) throwVel.z = 0;

    if (throwVel.lengthSq() < 1e-4) {
      camera.getWorldDirection(throwVel);
      if (lockX) throwVel.x = 0;
      if (lockY) throwVel.y = 0;
      if (lockZ) throwVel.z = 0;
    }

    throwVel.normalize().multiplyScalar(throwMult);

    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.applyImpulse(
      {
        x: throwVel.x,
        y: throwVel.y,
        z: throwVel.z,
      },
      true,
    );

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    onDragEnd?.();
  };

  useFrame((_, delta) => {
    if (!isDragging || !rigidBodyRef.current) return;
    const body = rigidBodyRef.current;

    const target = cursorToPlane(
      mouseUV.current.clone().add(screenOffset.current),
    );

    const pos = body.translation();
    const currentPos = new Vector3(pos.x, pos.y, pos.z);

    if (lockX) target.x = currentPos.x;
    if (lockY) target.y = currentPos.y;
    if (lockZ) target.z = currentPos.z;

    if (min?.x !== undefined) target.x = Math.max(min.x, target.x);
    if (min?.y !== undefined) target.y = Math.max(min.y, target.y);
    if (min?.z !== undefined) target.z = Math.max(min.z, target.z);

    if (max?.x !== undefined) target.x = Math.min(max.x, target.x);
    if (max?.y !== undefined) target.y = Math.min(max.y, target.y);
    if (max?.z !== undefined) target.z = Math.min(max.z, target.z);

    if (mode === "kinematic") {
      body.setNextKinematicTranslation(target);
      const vel = target
        .clone()
        .sub(currentPos)
        .multiplyScalar(1 / delta);
      velocityBuffer.current.push(vel);
    } else {
      const lv = body.linvel();
      const currentVel = new Vector3(lv.x, lv.y, lv.z);

      const force = target
        .clone()
        .sub(currentPos)
        .multiplyScalar(stiffness)
        .sub(currentVel.multiplyScalar(damping));

      body.applyImpulse(force.multiplyScalar(delta * body.mass()), true);

      velocityBuffer.current.push(currentVel.clone());
    }

    if (velocityBuffer.current.length > MAX_BUFFER)
      velocityBuffer.current.shift();

    if (debug) {
      debugStart.current.copy(currentPos);
      debugEnd.current.copy(target);
    }
  });

  return (
    <>
      {debug && isDragging && (
        <DragDebug start={debugStart.current} end={debugEnd.current} />
      )}
      {React.cloneElement(children, {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
        onLostPointerCapture: handlePointerUp,
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (!movedSincePointerDown.current) onClick?.();
        },
      })}
    </>
  );
};
