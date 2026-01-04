import React, { useRef, useState } from "react";
import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { Vector3, Plane, Vector2 } from "three";
import { useViewStore } from "@/store";

type DragMode = "kinematic" | "spring";

type GrabbableProps = {
  children: React.ReactElement; // has to be <RigidBody>
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  mode?: DragMode; // 'kinematic' = precise hard lock; 'spring' = soft physics pull
  lockX?: boolean;
  lockY?: boolean;
  lockZ?: boolean;
  min?: { x?: number; y?: number; z?: number };
  max?: { x?: number; y?: number; z?: number };
  stiffness?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export const Grabbable = ({
  children,
  rigidBodyRef,
  mode = "kinematic",
  lockX = false,
  lockY = false,
  lockZ = false,
  min,
  max,
  stiffness = 20,
  onDragStart,
  onDragEnd,
}: GrabbableProps) => {
  const { camera, raycaster, size } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const { cameraControlsRef } = useViewStore();
  const controls = cameraControlsRef?.current;

  // refs for vectors to avoid garbage collection during the drag loop
  const plane = useRef(new Plane());
  const intersection = useRef(new Vector3());
  // offset from center of object to click point
  const offset = useRef(new Vector3());
  const targetPos = useRef(new Vector3());
  const mouseUV = useRef(new Vector2());

  // kinematic throw velocity calculation
  const lastPos = useRef(new Vector3());
  const velocity = useRef(new Vector3());

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const body = rigidBodyRef.current;
    if (!body) return;

    // disable camera controls
    if (controls) (controls as any).enabled = false;

    // capture pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // setup dragging plane
    // the plane faces the camera and passes through the object's center
    const worldPos = body.translation();
    plane.current.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new Vector3()).negate(),
      new Vector3(worldPos.x, worldPos.y, worldPos.z)
    );

    // 3. get offset (grab point vs object center)
    raycaster.setFromCamera(
      new Vector2(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1
      ),
      camera
    );

    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      offset.current.subVectors(
        new Vector3(worldPos.x, worldPos.y, worldPos.z),
        intersection.current
      );
    }

    body.wakeUp();
    if (mode === "kinematic") {
      body.setBodyType(2, true);
    } else {
      // in spring mode keep it dynamic but disable gravity
      // so it doesn't sag while holding it
      body.setGravityScale(0, true);
    }

    setIsDragging(true);
    if (onDragStart) onDragStart();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    // update mouse coordinates for the useFrame loop
    mouseUV.current.set(
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1
    );
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    const body = rigidBodyRef.current;

    // re-enable camera controls
    if (controls) (controls as any).enabled = true;

    if (body) {
      if (mode === "kinematic") {
        // restore Dynamic
        body.setBodyType(0, true);

        // apply clamped throw velocity
        const maxThrow = 20;
        velocity.current.x = Math.max(
          -maxThrow,
          Math.min(maxThrow, velocity.current.x)
        );
        velocity.current.y = Math.max(
          -maxThrow,
          Math.min(maxThrow, velocity.current.y)
        );
        velocity.current.z = Math.max(
          -maxThrow,
          Math.min(maxThrow, velocity.current.z)
        );
        body.setLinvel(velocity.current, true);
      } else {
        // restore gravity
        body.setGravityScale(1, true);
      }
    }

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  useFrame(() => {
    if (!isDragging || !rigidBodyRef.current) return;

    raycaster.setFromCamera(mouseUV.current, camera);

    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      targetPos.current.addVectors(intersection.current, offset.current);

      const currentPos = rigidBodyRef.current.translation();

      if (lockX) targetPos.current.x = currentPos.x;
      if (lockY) targetPos.current.y = currentPos.y;
      if (lockZ) targetPos.current.z = currentPos.z;

      if (min) {
        if (min.x !== undefined)
          targetPos.current.x = Math.max(min.x, targetPos.current.x);
        if (min.y !== undefined)
          targetPos.current.y = Math.max(min.y, targetPos.current.y);
        if (min.z !== undefined)
          targetPos.current.z = Math.max(min.z, targetPos.current.z);
      }
      if (max) {
        if (max.x !== undefined)
          targetPos.current.x = Math.min(max.x, targetPos.current.x);
        if (max.y !== undefined)
          targetPos.current.y = Math.min(max.y, targetPos.current.y);
        if (max.z !== undefined)
          targetPos.current.z = Math.min(max.z, targetPos.current.z);
      }

      if (mode === "kinematic") {
        rigidBodyRef.current.setNextKinematicTranslation(targetPos.current);

        velocity.current
          .subVectors(targetPos.current, lastPos.current)
          .multiplyScalar(60);
        lastPos.current.copy(targetPos.current);
      } else {
        const direction = new Vector3().subVectors(
          targetPos.current,
          currentPos
        );
        const newVel = direction.multiplyScalar(stiffness);
        rigidBodyRef.current.setLinvel(newVel, true);
      }
    }
  });

  return React.cloneElement(children as React.ReactElement, {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  });
};
