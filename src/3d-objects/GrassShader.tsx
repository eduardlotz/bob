import { memo } from "react";
import { GrassField } from "./worlds/DenseGrassField";
import { useWorldQuality } from "./worlds/quality";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  preview: boolean;
  densityMultiplier?: number;
  /** Preserve the football field's existing ground height. */
  rootOffset?: number;
  fieldRadius?: number;
  flowers?: boolean;
}

/** Football and world scenery share the same curved, distance-batched blades. */
export const GrassShader = memo(function GrassShader({ position, rotation, scale,
  densityMultiplier = 1, rootOffset = -.9, fieldRadius = 10, flowers = false,
}: Props) {
  const quality = useWorldQuality();
  const bladeBudget = { low: 1800, medium: 4800, high: 7200 }[quality];
  const meadowBudget = { low: 18000, medium: 52000, high: 85000 }[quality];
  const areaRatio = Math.min(1, fieldRadius ** 2 / 324);
  // Retain the football field's blade budget and root height.
  const density = bladeBudget * densityMultiplier / (meadowBudget * Math.max(areaRatio, .0001));
  return <group position={position} rotation={rotation} scale={scale}>
    <GrassField position={[0, rootOffset, 0]} radius={fieldRadius} height={.85}
      density={density} flowers={flowers} />
  </group>;
});
