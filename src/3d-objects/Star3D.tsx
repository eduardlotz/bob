import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useSpring, a } from "@react-spring/three";

export function Star3D({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const random = useMemo(() => Math.random(), []);

  const spring = useSpring({
    loop: true,
    to: { rotation: [Math.PI * 4, Math.PI * 6, Math.PI * 8] },
    from: {
      rotation: [random * Math.PI, random * Math.PI * 2, random * Math.PI * 4],
    },
    config: { mass: 1, tension: 30, friction: 20 },
    reset: true,
  });

  const { geometry } = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 1;
    const innerRadius = 0.5;
    const step = (Math.PI * 2) / (spikes * 2);

    shape.moveTo(outerRadius, 0);
    for (let i = 1; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.cos(i * step) * radius, Math.sin(i * step) * radius);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      steps: 1,
    };

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const geo = new THREE.BufferGeometry().copy(extrudeGeo);

    // Fake bloated cartoon puff
    const posAttr = geo.attributes.position;
    const temp = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      temp.fromBufferAttribute(posAttr, i);
      const dist = Math.sqrt(temp.x * temp.x + temp.y * temp.y);
      const offset =
        0.06 * Math.cos((temp.z / extrudeSettings.depth) * Math.PI);
      posAttr.setZ(i, temp.z + offset * (1 - dist));
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    return { geometry: geo };
  }, []);

  return (
    <a.mesh
      ref={meshRef}
      rotation={spring.rotation}
      position={position}
      scale={0.2}
      geometry={geometry}
    >
      <meshToonMaterial color="yellow" />
    </a.mesh>
  );
}
