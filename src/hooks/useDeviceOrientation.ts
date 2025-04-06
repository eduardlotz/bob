import { useEffect, useState } from "react";

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      });
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (a) {
        setAcceleration({
          x: a.x ?? 0,
          y: a.y ?? 0,
          z: a.z ?? 0,
        });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("devicemotion", handleMotion, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return { orientation, acceleration };
}
