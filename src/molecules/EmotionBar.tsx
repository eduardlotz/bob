import styled from "styled-components";
import { EmotionState } from "@/hooks/useBlobEmotions";
import { Text3D, Center } from "@react-three/drei";

interface EmotionBarProps {
  emotionState: EmotionState;
  tapCount: number;
  getEmotionIcon: (emotion: EmotionState) => string;
  routeColor?: string;
}

const EmotionContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  font-family: "Open Sauce Two", sans-serif;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 100px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0px 0px 4px rgba(255, 255, 255, 0.25);
`;

const BobName = styled.h3<{ $routeColor: string }>`
  color: #000;
  font-size: 24px;
  font-weight: 400;
  margin: 0;
  letter-spacing: -1.5px;
`;

const EmotionDisplay = styled.h4`
  font-size: 32px;
  margin: 0;
  line-height: 1;
`;

export function EmotionBar({
  emotionState,
  tapCount,
  getEmotionIcon,
  routeColor = "#4facfe",
}: EmotionBarProps) {
  return (
    <EmotionContainer>
      <BobName $routeColor={routeColor}>Bob</BobName>
      <EmotionDisplay>{getEmotionIcon(emotionState)}</EmotionDisplay>
    </EmotionContainer>
  );
}

export const EmotionCounter = ({
  tapCount,
  position = [0, 0, -1],
}: {
  tapCount: number;
  position?: [number, number, number];
}) => {
  // Format number with leading zeros for consistent width
  const formattedNumber = tapCount.toString().padStart(3, "0");

  return (
    <Center position={position} scale={[0.6, 0.6, 0.6]}>
      {/* Wireframe text for testing */}
      <Text3D
        font="/fonts/OpenSauceTwoBlack.json"
        size={5}
        height={1.5}
        curveSegments={32}
        letterSpacing={-0.15}
        bevelEnabled={true}
        bevelSize={0.02}
        bevelThickness={0.01}
        bevelSegments={5}
      >
        {formattedNumber}
        <meshBasicMaterial color="white" wireframe={true} />
      </Text3D>

      {/* OLD VERSION - White material with black outline */}
      {/* 
      <Text3D
        font="/fonts/OpenSauceTwoBlack.json"
        size={5}
        height={1.5} // Increased depth for more solid 3D feel
        curveSegments={32} // Increased segments for smoother curves
        scale={[1.05, 1.05, 1.05]} // Slightly larger for outline
        letterSpacing={-0.15} // Tighter letter spacing
        position={[0, 0, 0.01]} // Slight z-offset for outline
      >
        {formattedNumber}
        <meshStandardMaterial color="black" metalness={0} roughness={0.3} />
      </Text3D>

      <Text3D
        font="/fonts/OpenSauceTwoBlack.json"
        size={5}
        height={1.5} // Increased depth for more solid 3D feel
        curveSegments={32} // Increased segments for smoother curves
        letterSpacing={-0.15} // Tighter letter spacing
        bevelEnabled={true}
        bevelSize={0.02}
        bevelThickness={0.01}
        bevelSegments={5}
      >
        {formattedNumber}
        <meshStandardMaterial color="white" metalness={0.1} roughness={0.2} />
      </Text3D>
      */}
    </Center>
  );
};
