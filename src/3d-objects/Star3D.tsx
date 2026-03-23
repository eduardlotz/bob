import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { a } from "@react-spring/three";

export function Star3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 1;
    const innerRadius = 0.6;
    const step = (Math.PI * 2) / (spikes * 2);

    shape.moveTo(outerRadius, 0);
    for (let i = 1; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.cos(i * step) * radius, Math.sin(i * step) * radius);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 2,
      steps: 1,
    };

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const geo = extrudeGeo.toNonIndexed();
    extrudeGeo.dispose();

    return { geometry: geo };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <a.mesh
      ref={meshRef}
      rotation={rotation}
      position={position}
      scale={0.2}
      geometry={geometry}
    >
      <meshToonMaterial color="yellow" />
    </a.mesh>
  );
}
