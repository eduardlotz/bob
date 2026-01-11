import React, { useRef, useState, useMemo } from "react";
import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { RapierRigidBody, vec3 } from "@react-three/rapier";
import {
  Vector3,
  Plane,
  Vector2,
  Quaternion,
  LineBasicMaterial,
  BufferGeometry,
} from "three";
import { useCoreStore, useViewStore } from "@/store"; // Assuming this exists based on your snippet
import { Line } from "@react-three/drei";

// --- Visual Debug Component ---
const DragDebug = ({ start, end }: { start: Vector3; end: Vector3 }) => {
  return (
    <Line
      points={[start, end]} // Array of points
      color="red"
      lineWidth={1} // In pixels (default)
      depthTest={false} // See it through walls
      opacity={0.5}
      transparent
    />
  );
};

type DragMode = "kinematic" | "spring";

type GrabbableProps = {
  children: React.ReactElement;
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  mode?: DragMode;
  // Locks & Limits
  lockX?: boolean;
  lockY?: boolean;
  lockZ?: boolean;
  min?: { x?: number; y?: number; z?: number };
  max?: { x?: number; y?: number; z?: number };
  // Physics Settings
  stiffness?: number; // How strong the pull is
  damping?: number; // How much to slow down vibration (air resistance)
  throwMult?: number; // Multiplier for throw velocity
  freezeRotation?: boolean; // Stop rotation while dragging?
  // Visuals
  debug?: boolean;
  // Events
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export const Grabbable = ({
  children,
  rigidBodyRef,
  mode = "spring", // Changed default to spring for more natural feel
  lockX = false,
  lockY = false,
  lockZ = false,
  min,
  max,
  stiffness = 80, // Higher default for PD controller
  damping = 5, // Damping adds weight
  throwMult = 1.0,
  freezeRotation = false,
  onDragStart,
  onDragEnd,
}: GrabbableProps) => {
  const { camera, raycaster, size } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const { cameraControlsRef } = useViewStore(); // Keep your store logic
  const controls = cameraControlsRef?.current;
  const { physicsDebugEnabled: debug } = useCoreStore();

  // Refs for math to reduce GC
  const plane = useRef(new Plane());
  const intersection = useRef(new Vector3());
  const offset = useRef(new Vector3());
  const targetPos = useRef(new Vector3());
  const mouseUV = useRef(new Vector2());

  // Velocity smoothing buffer for clean throws
  const velocityBuffer = useRef<Vector3[]>([]);
  const MAX_BUFFER = 5;

  // Debug state for the line renderer
  const [debugStart, setDebugStart] = useState(new Vector3());
  const [debugEnd, setDebugEnd] = useState(new Vector3());

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const body = rigidBodyRef.current;
    if (!body) return;

    if (controls) (controls as any).enabled = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // 1. Setup Drag Plane (Billboarding towards camera)
    const worldPos = body.translation();
    const currentWorldVec = new Vector3(worldPos.x, worldPos.y, worldPos.z);

    plane.current.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new Vector3()).negate(),
      currentWorldVec
    );

    // 2. Calculate Offset (Grab point relative to center)
    // We update raycaster manually to ensure it matches the exact click frame
    raycaster.setFromCamera(
      new Vector2(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1
      ),
      camera
    );

    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      offset.current.subVectors(currentWorldVec, intersection.current);
    }

    // 3. Physics Setup
    body.wakeUp();

    if (mode === "kinematic") {
      body.setBodyType(2, true); // KinematicPosition
    } else {
      // For spring mode, we don't disable gravity anymore.
      // We let the PD controller fight gravity. It feels heavier/better.
      if (freezeRotation) body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    velocityBuffer.current = [];
    setIsDragging(true);
    if (onDragStart) onDragStart();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    mouseUV.current.set(
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1
    );
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    const body = rigidBodyRef.current;

    if (controls) (controls as any).enabled = true;

    if (body) {
      if (mode === "kinematic") {
        body.setBodyType(0, true); // Restore Dynamic
      }

      // CALCULATE THROW
      // Average the velocity buffer for a smooth throw
      if (velocityBuffer.current.length > 0) {
        const avgVel = new Vector3();
        velocityBuffer.current.forEach((v) => avgVel.add(v));
        avgVel
          .divideScalar(velocityBuffer.current.length)
          .multiplyScalar(throwMult);

        // Apply Throw
        body.setLinvel(avgVel, true);
      }
    }

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  useFrame((state, delta) => {
    if (!isDragging || !rigidBodyRef.current) return;

    const body = rigidBodyRef.current;
    raycaster.setFromCamera(mouseUV.current, camera);

    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      // 1. Calculate Target Position
      targetPos.current.addVectors(intersection.current, offset.current);

      const currentPos = body.translation();
      const currentPosVec = new Vector3(
        currentPos.x,
        currentPos.y,
        currentPos.z
      );

      // 2. Apply Constraints
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

      // 3. Move Logic
      if (mode === "kinematic") {
        body.setNextKinematicTranslation(targetPos.current);

        // Calculate velocity for the throw buffer
        const instantaneousVel = new Vector3()
          .subVectors(targetPos.current, currentPosVec)
          .multiplyScalar(1 / delta);

        // Push to buffer
        velocityBuffer.current.push(instantaneousVel);
        if (velocityBuffer.current.length > MAX_BUFFER)
          velocityBuffer.current.shift();
      } else {
        // SPRING / FORCE MODE (PD Controller)
        // Force = (Target - Current) * Stiffness - Velocity * Damping
        const currentVel = body.linvel();
        const currentVelVec = new Vector3(
          currentVel.x,
          currentVel.y,
          currentVel.z
        );

        const direction = new Vector3().subVectors(
          targetPos.current,
          currentPosVec
        );

        // PD Control calculation
        const force = direction
          .multiplyScalar(stiffness)
          .sub(currentVelVec.multiplyScalar(damping));

        // Apply as impulse to account for mass automatically
        // Multiplying by delta makes it force-like behavior integrated over time
        body.applyImpulse(force.multiplyScalar(delta * body.mass()), true);

        // Optional: reduce rotation while dragging to make it easier to handle
        if (freezeRotation) {
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        } else {
          // Apply a little angular damping so it doesn't spin forever
          const angVel = body.angvel();
          body.setAngvel(
            {
              x: angVel.x * 0.9,
              y: angVel.y * 0.9,
              z: angVel.z * 0.9,
            },
            true
          );
        }

        // Push current velocity to buffer for throw consistency
        velocityBuffer.current.push(
          new Vector3(currentVel.x, currentVel.y, currentVel.z)
        );
        if (velocityBuffer.current.length > MAX_BUFFER)
          velocityBuffer.current.shift();
      }

      // 4. Update Debug Visuals
      if (debug) {
        setDebugStart(currentPosVec);
        setDebugEnd(targetPos.current);
      }
    }
  });

  return (
    <>
      {debug && isDragging && <DragDebug start={debugStart} end={debugEnd} />}
      {React.cloneElement(children as React.ReactElement, {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      })}
    </>
  );
};
