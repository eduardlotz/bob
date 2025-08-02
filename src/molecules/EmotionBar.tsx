import { Text3D, Center, Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Vector3, Group } from "three";
import { useSpring, a } from "@react-spring/three";

const FONT_PATH = "/fonts/OpenRundeBold.json";

export const EmotionCounter = ({
  tapCount,
  position = [0.2, 0, -1],
}: {
  tapCount: number;
  position?: [number, number, number];
}) => {
  const PAD_LENGTH = 0;
  const formattedNumber = tapCount.toString().padStart(PAD_LENGTH, "0");
  const groupRef = useRef<Group>(null!);
  const prevTapCount = useRef(tapCount);

  const { viewport } = useThree();

  const DESIRED_PIXEL_HEIGHT = 1150; // on-screen height in CSS pixels
  const textHeightWorldUnits = DESIRED_PIXEL_HEIGHT / viewport.factor;

  const responsivePosition = new Vector3(-formattedNumber.length + 1, 0.5, -1);

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  useEffect(() => {
    if (tapCount !== prevTapCount.current) {
      // Bounce animation
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
    <Center position={responsivePosition}>
      <a.group ref={groupRef} scale={spring.scale}>
        <Text3D
          font={FONT_PATH}
          size={textHeightWorldUnits}
          height={1.5}
          curveSegments={32}
          letterSpacing={-0.15}
          bevelEnabled={true}
          bevelSize={0.03}
          bevelThickness={0.2}
          bevelSegments={6}
        >
          {formattedNumber}
          <meshToonMaterial color="white" />
          <Outlines thickness={5} color="black" />
        </Text3D>
      </a.group>
    </Center>
  );
};
