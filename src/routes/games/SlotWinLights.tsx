import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FakeSpotlight } from "./FakeSpotlight";

export function SlotWinLights({ age, duration, backdrop }: {
  age: React.MutableRefObject<number>; duration: React.MutableRefObject<number>;
  backdrop: React.RefObject<THREE.MeshBasicMaterial>;
}) {
  const scene = useThree((state) => state.scene);
  const beams = useRef<Array<THREE.Group | null>>([]);
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const accent = useRef<THREE.PointLight>(null);
  const envelope = useRef(0);
  const lights = useRef<Array<{ light: THREE.Light; baseline: number; applied: number }>>([]);
  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.AmbientLight || object instanceof THREE.DirectionalLight) {
        lights.current.push({ light: object, baseline: object.intensity, applied: object.intensity });
      }
    });
    return () => {
      lights.current.forEach(({ light, baseline }) => { light.intensity = baseline; });
      lights.current = [];
      backdrop.current?.color.setScalar(1);
    };
  }, [scene, backdrop]);
  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const winning = age.current >= 0 && age.current < duration.current;
    const target = winning ? Math.min(1, (duration.current - age.current) / 0.6) : 0;
    envelope.current = THREE.MathUtils.damp(envelope.current, target, 7, delta);
    const power = envelope.current;
    for (const entry of lights.current) {
      // Preserve changes made through the world's lighting settings while playing.
      if (Math.abs(entry.light.intensity - entry.applied) > 1e-5) entry.baseline = entry.light.intensity;
      entry.applied = entry.baseline * (1 - power * 0.6);
      entry.light.intensity = entry.applied;
    }
    backdrop.current?.color.setScalar(1 - power * 0.65);
    if (accent.current) accent.current.intensity = power * 1.7;
    beams.current.forEach((beam, i) => {
      if (!beam) return;
      const side = i < 2 ? -1 : 1;
      beam.rotation.z = side * (0.22 + (i % 2) * 0.26) + Math.sin(clock.elapsedTime * 0.85 + i * 1.8) * 0.28;
      beam.visible = power > 0.01;
      const material = materials.current[i];
      if (material) material.opacity = power * 0.22;
    });
  });
  return <group name="slot-win-spotlights">
    {[0, 1, 2, 3].map((i) => <group key={i} ref={(group) => { beams.current[i] = group; }} position={[i < 2 ? -2.6 : 2.6, 0, -1.5]}>
      <group position={[0, 4.75, 0]}>
        <FakeSpotlight upwards materialRef={(material) => { materials.current[i] = material; }} />
      </group>
    </group>)}
    <pointLight ref={accent} position={[0, 3.2, 3.5]} color="#ffe09a" intensity={0} distance={9} decay={2} />
  </group>;
}
