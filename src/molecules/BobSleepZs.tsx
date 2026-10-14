import { Billboard, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Mesh, MeshBasicMaterial } from "three";
import { smoothIdleStep } from "./bobIdleMotion";

export function BobSleepZs({ sleep, head, height, color }: {
  sleep: React.MutableRefObject<{ seconds: number; active: boolean }>;
  head: React.RefObject<Group>;
  height: number;
  color: string;
}) {
  const root = useRef<Group>(null);
  const letters = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    if (!root.current || !head.current) return;
    const { active, seconds } = sleep.current;
    root.current.visible = active && seconds > 0.65 && seconds < 5.4;
    if (!root.current.visible) return;

    root.current.position.copy(head.current.position);
    const envelope = smoothIdleStep((seconds - 0.65) / 0.4) *
      (1 - smoothIdleStep((seconds - 4.9) / 0.5));

    letters.current.forEach((letter, index) => {
      if (!letter) return;
      const age = seconds - 0.65 - index * 0.42;
      letter.visible = age >= 0;
      const progress = Math.max(0, age % 1.7) / 1.7;
      const fade = smoothIdleStep(progress / 0.15) *
        (1 - smoothIdleStep((progress - 0.6) / 0.4));
      (letter.material as MeshBasicMaterial).opacity = fade * envelope;
      letter.position.set(0.55 + progress * 1.1, height + progress * 1.45, 0.15);
      letter.rotation.z = -0.12 + progress * 0.2;
      letter.scale.setScalar(0.65 + progress * 0.4);
    });
  });

  return (
    <group ref={root} visible={false} name="bob-sleep-zs">
      <Billboard>
        {[0, 1, 2].map((index) => (
          <Text3D
            key={index}
            ref={(mesh) => { letters.current[index] = mesh; }}
            font="/fonts/OpenRundeBold.json"
            size={0.25}
            height={0.035}
            curveSegments={4}
            raycast={() => null}
          >
            Z
            <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
          </Text3D>
        ))}
      </Billboard>
    </group>
  );
}
