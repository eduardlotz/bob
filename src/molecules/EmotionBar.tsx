import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";

const FONT_PATH = "/fonts/OpenRundeBold.json";

export const EmotionCounter = ({ tapCount }: { tapCount: number }) => {
  const PAD_LENGTH = 0;

  const formattedNumber = tapCount.toString().padStart(PAD_LENGTH, "0");
  const groupRef = useRef<Group>(null!);
  const prevTapCount = useRef(tapCount);

  const numberRef = useRef<Mesh>(null);
  const [numberWidth, setNumberWidth] = useState(0);

  useEffect(() => {
    if (!numberRef.current) return;

    const geometry = numberRef.current.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const width = box.max.x - box.min.x;
    setNumberWidth(width);
  }, [formattedNumber]);

  const responsivePosition = new Vector3(-numberWidth / 2, 0.5, -1);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  useEffect(() => {
    if (tapCount !== prevTapCount.current) {
      api.start({
        scale: 1.4,
        immediate: true,
      });
      api.start({
        scale: 1,
        config: { tension: 300, friction: 15 },
      });
      prevTapCount.current = tapCount;
    }
  }, [tapCount]);

  return (
    <a.group ref={groupRef} scale={spring.scale} position={responsivePosition}>
      <Text3D
        font={FONT_PATH}
        size={3}
        height={1.5}
        curveSegments={32}
        letterSpacing={-0.15}
        bevelEnabled={true}
        bevelSize={0.03}
        bevelThickness={0.2}
        bevelSegments={6}
        ref={numberRef}
      >
        {formattedNumber}
        <meshToonMaterial color="white" />
        <Outlines thickness={0.011} color="black" screenspace />
      </Text3D>
    </a.group>
  );
};
