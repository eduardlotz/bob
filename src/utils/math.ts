import { DeviceOrientation } from "@/hooks/useDeviceOrientation";
import { MathUtils, Quaternion, Euler, Vector3 } from "three";

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// Calibration state for device orientation
let isCalibrated = false;
let calibrationQuaternion = new Quaternion();
let lastOrientation = { alpha: 0, beta: 0, gamma: 0 };
let lastCalibrationTime = 0; // timestamp in ms

export function resetCalibration() {
  isCalibrated = false;
  calibrationQuaternion.set(0, 0, 0, 1);
  lastOrientation = { alpha: 0, beta: 0, gamma: 0 };
}

export function calculateAcceleratedRotation(
  acceleration: DeviceMotionEventAcceleration,
  orientation: DeviceOrientation
) {
  const accelX = MathUtils.clamp(acceleration.x ?? 0, -5, 5) / 5; // [-1, 1]
  const accelY = MathUtils.clamp(acceleration.y ?? 0, -5, 5) / 5;
  const accelZ = MathUtils.clamp(acceleration.z ?? 0, -5, 5) / 5;

  // Convert orientation to radians
  const alphaRad = ((orientation.alpha ?? 0) * Math.PI) / 180;
  const betaRad = ((orientation.beta ?? 0) * Math.PI) / 180;
  const gammaRad = ((orientation.gamma ?? 0) * Math.PI) / 180;

  // Create quaternion from device orientation
  const deviceQuaternion = new Quaternion();

  // Apply rotations in the correct order to avoid gimbal lock
  // Z-axis rotation (alpha - device rotation around its axis)
  const alphaQuat = new Quaternion().setFromAxisAngle(
    new Vector3(0, 0, 1),
    alphaRad
  );

  // Y-axis rotation (beta - front/back tilt) - controls up/down movement
  const betaQuat = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    betaRad
  );

  // X-axis rotation (gamma - left/right tilt) - controls left/right movement
  const gammaQuat = new Quaternion().setFromAxisAngle(
    new Vector3(1, 0, 0),
    gammaRad
  );

  // Combine rotations: Z * Y * X (this order helps avoid gimbal lock)
  deviceQuaternion.multiply(alphaQuat).multiply(betaQuat).multiply(gammaQuat);

  // Calibration logic
  const now = Date.now();
  const orientationChange =
    Math.abs((orientation.alpha ?? 0) - lastOrientation.alpha) +
    Math.abs((orientation.beta ?? 0) - lastOrientation.beta) +
    Math.abs((orientation.gamma ?? 0) - lastOrientation.gamma);

  // Initial calibration
  if (!isCalibrated) {
    calibrationQuaternion.copy(deviceQuaternion).invert();
    isCalibrated = true;
    lastCalibrationTime = now;
    lastOrientation = { ...orientation };
  } else {
    // Automatic re-calibration if phone is held fairly still & level for >1s
    const accelMagnitude =
      Math.abs(acceleration.x ?? 0) +
      Math.abs(acceleration.y ?? 0) +
      Math.abs(acceleration.z ?? 0);

    const timeSinceCalib = now - lastCalibrationTime;

    if (
      timeSinceCalib > 1000 &&
      accelMagnitude < 0.5 &&
      orientationChange < 2 // degrees total change
    ) {
      calibrationQuaternion.copy(deviceQuaternion).invert();
      lastCalibrationTime = now;
    }

    // store orientation for next diff calculation
    lastOrientation = { ...orientation };
  }

  // Apply calibration to get relative rotation from neutral position
  const relativeQuaternion = new Quaternion();
  relativeQuaternion.multiply(calibrationQuaternion).multiply(deviceQuaternion);

  // Convert quaternion back to Euler angles for compatibility
  const euler = new Euler();
  euler.setFromQuaternion(relativeQuaternion);

  // Normalize the Euler angles to our expected ranges
  const targetRotX = MathUtils.clamp(euler.x, -1, 1);
  const targetRotY = MathUtils.clamp(euler.y, -1, 1);
  const targetRotZ = MathUtils.clamp(euler.z, -1, 1);

  // Blend with acceleration for smoother movement
  const finalRotX = targetRotX * 0.7 + accelX * 0.3;
  const finalRotY = targetRotY * 0.7 + accelY * 0.3;
  const finalRotZ = targetRotZ * 0.7 + accelZ * 0.3;

  return {
    targetRotX: finalRotX,
    targetRotY: finalRotY,
    targetRotZ: finalRotZ,
    accelX,
    accelY,
    orientGamma: (orientation.gamma ?? 0) / 90,
    orientBeta: (orientation.beta ?? 0) / 90,
    isFlat: Math.abs(orientation.beta ?? 0) > 70,
    isCalibrated,
  };
}
