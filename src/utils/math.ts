import { DeviceOrientation } from "@/hooks/useDeviceOrientation";
import { MathUtils } from "three";

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function calculateAcceleratedRotation(
  acceleration: DeviceMotionEventAcceleration,
  orientation: DeviceOrientation
) {
  const accelX = MathUtils.clamp(acceleration.x ?? 0, -5, 5) / 5; // [-1, 1]
  const accelY = MathUtils.clamp(acceleration.y ?? 0, -5, 5) / 5;
  const accelZ = MathUtils.clamp(acceleration.z ?? 0, -5, 5) / 5;

  // Normalize orientation beta (front-back tilt) from [-180°, 180°] to [-1, 1]
  const orientBeta = MathUtils.clamp((orientation.beta ?? 0) / 90, -1, 1);
  // Normalize orientation gamma (side tilt) from [-90°, 90°] to [-1, 1]
  const orientGamma = MathUtils.clamp((orientation.gamma ?? 0) / 90, -1, 1);
  // Normalize orientation alpha (side turn) from [-90°, 90°] to [-1, 1]
  const orientAlpha = MathUtils.clamp((orientation.alpha ?? 0) / 90, -1, 1);

  // Blend acceleration and orientation for smoother result
  // Negative accelY means tilting forward (top of phone down)
  const targetRotX = accelX * -0.6 + orientBeta * -0.5;
  const targetRotY = accelY * 0.6 + orientGamma * 0.4;
  const targetRotZ = accelZ * 0.6 + orientAlpha * 0.3;

  return {
    targetRotX,
    targetRotY,
    targetRotZ,
    accelX,
    accelY,
    orientGamma,
    orientBeta,
    isFlat: Math.abs(orientBeta * 90) > 70,
  };
}
