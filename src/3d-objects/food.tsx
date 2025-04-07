import { useGLTF, Hud, Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import { Mesh } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { useFrame } from "@react-three/fiber";

export const TestFood = () => {
  const initialPositions = [
    { x: -1, y: 2, z: 1 },
    { x: -2, y: 2, z: 1 },
    { x: 0, y: 2, z: 1 },
    { x: 1, y: 2, z: 1 },
    { x: 2, y: 2, z: 1 },
  ];

  const { nodes, materials } = useGLTF("./banana-v2-transformed.glb");

  const [bananas, setBananas] = useState(initialPositions);
  const [bananaCount, setBananaCount] = useState(0);

  const handleBananaThrown = () => {
    setBananaCount((prev) => prev + 1);
  };

  const removeBanana = (indexToRemove) => {
    setBananas((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      if (updated.length < 5) {
        updated.push({ x: Math.random() * 4 - 2, y: 2, z: 1 });
      }
      return updated;
    });
  };

  return (
    <>
      <Hud>
        <group position={[-1.5, 1.5, -2]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          <Text position={[0.4, 0, 0]} fontSize={0.3} color="white">
            {bananaCount}
          </Text>
        </group>
      </Hud>

      <RigidBody type="fixed">
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="white" transparent opacity={0} />
        </mesh>
      </RigidBody>

      {bananas.map((position, index) => (
        <DraggableBanana
          key={index}
          index={index}
          position={[position.x, position.y, position.z]}
          geometry={(nodes.banana_high as Mesh).geometry}
          material={materials.skin}
          onThrow={handleBananaThrown}
          onRemove={removeBanana}
        />
      ))}
    </>
  );
};

function DraggableBanana({
  position,
  geometry,
  material,
  onThrow,
  onRemove,
  index,
}) {
  const bodyRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    bodyRef.current?.setBodyType("kinematicPosition");
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    bodyRef.current?.setBodyType("dynamic");
    bodyRef.current?.applyImpulse({ x: 0, y: 1, z: -5 }, true);
    onThrow();
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (isDragging && bodyRef.current) {
      const localPoint = e.point.clone().sub(bodyRef.current.translation());
      bodyRef.current.setNextKinematicTranslation(localPoint);
    }
  };

  useFrame(() => {
    if (bodyRef.current) {
      const pos = bodyRef.current.translation();
      const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
      if (distance > 15) {
        onRemove(index);
      }
    }
  });

  return (
    <RigidBody ref={bodyRef} position={position} colliders="hull">
      <mesh
        geometry={geometry}
        material={material}
        scale={0.1}
        rotation={[0, degToRad(90), 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      />
    </RigidBody>
  );
}
