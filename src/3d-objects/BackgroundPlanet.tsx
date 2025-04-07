import { GradientTexture } from "@react-three/drei";
import { BackSide } from "three";

export const BackgroundPlanet = () => {
  return (
    <mesh>
      <sphereGeometry args={[5, 32, 32]} />
      <meshBasicMaterial side={BackSide}>
        <GradientTexture
          stops={[0, 0.5, 1]} // As many stops as you want
          colors={["#ffffff", "#C5BDD5", "#85799F"]} // Colors need to match the number of stops
          size={1024} // Size is optional, default = 1024
        />
      </meshBasicMaterial>
    </mesh>
  );
};
