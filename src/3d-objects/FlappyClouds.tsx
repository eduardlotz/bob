import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  BASE_RING_SPEED,
  RING_SPEED_SCORE_FACTOR,
} from "@/3d-objects/FlappyRings";

const CLOUD_CLUSTER_COUNT = 16;
const CLOUD_PUFF_MIN = 3;
const CLOUD_PUFF_MAX = 5;
const CLOUD_START_X = 6;
const CLOUD_SPACING_MIN = 3.8;
const CLOUD_SPACING_MAX = 6.2;
const CLOUD_RECYCLE_X = -18;
const CLOUD_SCROLL_FACTOR = 0.45;
const CLOUD_BOB_HEIGHT = 0.2;

const CLOUD_Y_MIN = -0.8;
const CLOUD_Y_MAX = 4.5;
const CLOUD_Z_MIN = -3.2;
const CLOUD_Z_MAX = -0.7;

const CLOUD_SPHERE = new THREE.SphereGeometry(1, 7, 7);

type CloudPuff = {
  offset: [number, number, number];
  scale: number;
};

type CloudCluster = {
  x: number;
  y: number;
  z: number;
  speedFactor: number;
  bobPhase: number;
  bobSpeed: number;
  puffs: CloudPuff[];
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const createCloudPuffs = (): CloudPuff[] => {
  const count = Math.floor(rand(CLOUD_PUFF_MIN, CLOUD_PUFF_MAX + 1));
  const puffs: CloudPuff[] = [];

  for (let i = 0; i < count; i += 1) {
    puffs.push({
      offset: [rand(-1.2, 1.2), rand(-0.35, 0.35), rand(-0.55, 0.55)],
      scale: rand(0.75, 1.5),
    });
  }

  return puffs;
};

const createCloudClusters = (): CloudCluster[] => {
  let nextX = CLOUD_START_X;

  return new Array(CLOUD_CLUSTER_COUNT).fill(0).map(() => {
    const cloud: CloudCluster = {
      x: nextX,
      y: rand(CLOUD_Y_MIN, CLOUD_Y_MAX),
      z: rand(CLOUD_Z_MIN, CLOUD_Z_MAX),
      speedFactor: rand(0.85, 1.1),
      bobPhase: rand(0, Math.PI * 2),
      bobSpeed: rand(0.35, 0.7),
      puffs: createCloudPuffs(),
    };

    nextX += rand(CLOUD_SPACING_MIN, CLOUD_SPACING_MAX);
    return cloud;
  });
};

export function FlappyClouds({ score }: { score: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialClouds = useMemo(() => createCloudClusters(), []);
  const cloudsRef = useRef<CloudCluster[]>(initialClouds);
  const matrixDummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  const instanceCount = useMemo(
    () => cloudsRef.current.reduce((sum, cloud) => sum + cloud.puffs.length, 0),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let index = 0;
    cloudsRef.current.forEach((cloud) => {
      cloud.puffs.forEach(() => {
        const c = rand(0.88, 0.98);
        tint.setRGB(c, c, 1);
        mesh.setColorAt(index, tint);
        index += 1;
      });
    });

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    index = 0;
    cloudsRef.current.forEach((cloud) => {
      cloud.puffs.forEach((puff) => {
        matrixDummy.position.set(
          cloud.x + puff.offset[0],
          cloud.y + puff.offset[1],
          cloud.z + puff.offset[2],
        );
        matrixDummy.scale.setScalar(puff.scale);
        matrixDummy.updateMatrix();
        mesh.setMatrixAt(index, matrixDummy.matrix);
        index += 1;
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrixDummy, tint]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const speed =
      (BASE_RING_SPEED + Math.min(score, 80) * RING_SPEED_SCORE_FACTOR) *
      CLOUD_SCROLL_FACTOR;

    let furthestX = Number.NEGATIVE_INFINITY;
    cloudsRef.current.forEach((cloud) => {
      furthestX = Math.max(furthestX, cloud.x);
    });

    cloudsRef.current.forEach((cloud) => {
      cloud.x -= speed * cloud.speedFactor * delta;

      if (cloud.x < CLOUD_RECYCLE_X) {
        cloud.x = furthestX + rand(CLOUD_SPACING_MIN, CLOUD_SPACING_MAX);
        cloud.y = rand(CLOUD_Y_MIN, CLOUD_Y_MAX);
        cloud.z = rand(CLOUD_Z_MIN, CLOUD_Z_MAX);
        cloud.speedFactor = rand(0.85, 1.1);
        cloud.bobPhase = rand(0, Math.PI * 2);
        furthestX = cloud.x;
      }
    });

    const elapsed = state.clock.getElapsedTime();
    let index = 0;

    cloudsRef.current.forEach((cloud) => {
      const bob =
        Math.sin(elapsed * cloud.bobSpeed + cloud.bobPhase) * CLOUD_BOB_HEIGHT;

      cloud.puffs.forEach((puff) => {
        matrixDummy.position.set(
          cloud.x + puff.offset[0],
          cloud.y + bob + puff.offset[1],
          cloud.z + puff.offset[2],
        );
        matrixDummy.scale.setScalar(puff.scale);
        matrixDummy.updateMatrix();
        mesh.setMatrixAt(index, matrixDummy.matrix);
        index += 1;
      });
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[CLOUD_SPHERE, undefined, instanceCount]}
      frustumCulled={false}
    >
      <meshToonMaterial
        color="#f4f7ff"
        transparent
        opacity={0.34}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
