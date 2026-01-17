import { Text3D, Outlines } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { Vector3, Group, Mesh } from "three";
import { useSpring, a } from "@react-spring/three";

const FONT_PATH = "/fonts/OpenRundeBold.json";

interface PointsCounterProps {
  number: number;
  counterColor?: string;
  outlineColor?: string;
}

export const PointsCounter = ({
  number,
  counterColor = "white",
  outlineColor = "black",
}: PointsCounterProps) => {
  const [numberWidth, setNumberWidth] = useState(0);
  const numberRef = useRef<Mesh>(null);

  const formattedNumber = number.toLocaleString("de-DE", {
    maximumFractionDigits: 0,
  });

  const responsivePosition = new Vector3(-numberWidth / 2 - 0.2, -1, -6);

  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { tension: 300, friction: 10 },
  }));

  useEffect(() => {
    if (!numberRef.current) return;

    const geometry = numberRef.current.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const width = box.max.x - box.min.x;
    setNumberWidth(width);
  }, [formattedNumber]);

  useEffect(() => {
    api.start({
      from: { scale: [1.4, 1.8, 1.2] },
      to: { scale: [1, 1, 1] },
      immediate: false,
    });
  }, [number, api]);

  return (
    <a.group scale={spring.scale as any}>
      <a.group position={responsivePosition}>
        <Text3D
          font={FONT_PATH}
          size={3}
          height={0.5}
          curveSegments={8}
          castShadow
          letterSpacing={-0.15}
          bevelEnabled
          bevelSize={0.03}
          bevelThickness={0.2}
          bevelSegments={1}
          ref={numberRef}
        >
          {formattedNumber}
          <meshToonMaterial color={counterColor} />
          <Outlines thickness={0.02} color={outlineColor} screenspace />
        </Text3D>
      </a.group>
    </a.group>
  );
};
