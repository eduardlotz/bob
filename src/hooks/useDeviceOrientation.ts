import { useEffect, useState } from "react";
import { resetCalibration } from "@/utils/math";

export interface DeviceOrientation {
  alpha: number;
  beta: number;
  gamma: number;
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [acceleration, setAcceleration] =
    useState<DeviceMotionEventAcceleration>({ x: 0, y: 0, z: 0 });
  const [sensorsAvailable, setSensorsAvailable] = useState(false);

  useEffect(() => {
    let hasReceivedOrientation = false;
    let hasReceivedMotion = false;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!hasReceivedOrientation) {
        hasReceivedOrientation = true;
        // Auto-calibrate when orientation sensors first become available
        if (
          event.alpha !== null ||
          event.beta !== null ||
          event.gamma !== null
        ) {
          resetCalibration();
        }
      }

      setOrientation({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      });
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!hasReceivedMotion) {
        hasReceivedMotion = true;
        // Auto-calibrate when motion sensors first become available
        const a = event.accelerationIncludingGravity;
        if (a && (a.x !== null || a.y !== null || a.z !== null)) {
          resetCalibration();
        }
      }

      const a = event.accelerationIncludingGravity;
      if (a) {
        setAcceleration({
          x: a.x ?? 0,
          y: a.y ?? 0,
          z: a.z ?? 0,
        });
      }
    };

    // Check if sensors are available
    const checkSensorsAvailable = () => {
      if (hasReceivedOrientation || hasReceivedMotion) {
        setSensorsAvailable(true);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("devicemotion", handleMotion, true);

    // Check sensors availability after a short delay
    const timeoutId = setTimeout(checkSensorsAvailable, 1000);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("devicemotion", handleMotion);
      clearTimeout(timeoutId);
    };
  }, []);

  return { orientation, acceleration, sensorsAvailable };
}
