import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as T from 'three';
import { useWorldEnvironment } from './WorldEnvironment';

/** Shared low-poly birds; the consuming world supplies their flight path. */
export const BirdFlock = forwardRef<T.Group, { count?: number; color?: string; scale?: number }>(function BirdFlock({ count = 3, color = '#fffdf0', scale = 1 }, ref) {
  const group = useRef<T.Group>(null!);
  const environment = useWorldEnvironment();
  useImperativeHandle(ref, () => group.current);
  useFrame(() => {
    const t = environment.current.elapsed;
    group.current?.children.forEach((bird, i) => bird.children.forEach((wing, j) => {
      wing.rotation.z = (j === 0 ? 1 : -1) * (.2 + Math.sin(t * 5 + i) * .45);
    }));
  });
  return <group ref={group} scale={scale} name="bird-flock">
    {Array.from({ length: count }, (_, i) => <group key={i} position={[-i * 1.2, i * .35, -i * .6]}>
      {[-1, 1].map(side => <mesh key={side} position={[side * .22, 0, 0]} scale={[.5, .055, .17]}>
        <octahedronGeometry args={[1, 0]} /><meshBasicMaterial color={color} />
      </mesh>)}
    </group>)}
  </group>;
});
