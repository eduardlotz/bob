import { useEffect, useRef, useState } from "react";

/** Sensor values stay outside React; only permission/toggle state renders UI. */
export function usePaddleTilt() {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const input = useRef({ x: 0, y: 0 });
  const neutral = useRef<{ x: number; y: number } | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    neutral.current = null;
    let received = false;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      received = true;
      const angle = (window.screen.orientation?.angle ?? 0) * Math.PI / 180;
      const x = event.gamma * Math.cos(angle) + event.beta * Math.sin(angle);
      const y = event.beta * Math.cos(angle) - event.gamma * Math.sin(angle);
      if (!neutral.current) neutral.current = { x, y };
      const clamp = (n: number) => Math.max(-1, Math.min(1, n));
      input.current.x = clamp((x - neutral.current.x) / 25);
      input.current.y = clamp(-(y - neutral.current.y) / 25);
    };
    const recalibrate = () => { neutral.current = null; };
    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("orientationchange", recalibrate);
    const timeout = window.setTimeout(() => {
      if (!received) { setEnabled(false); setUnavailable(true); }
    }, 2500);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("orientationchange", recalibrate);
      input.current = { x: 0, y: 0 };
    };
  }, [enabled]);

  const toggle = async () => {
    if (pending) return;
    if (enabled) { setEnabled(false); return; }
    setUnavailable(false);
    if (!window.isSecureContext || typeof DeviceOrientationEvent === "undefined") {
      setUnavailable(true);
      return;
    }
    setPending(true);
    try {
      const sensor = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<string>;
      };
      const permission = sensor.requestPermission ? await sensor.requestPermission() : "granted";
      if (!mounted.current) return;
      setEnabled(permission === "granted");
      setUnavailable(permission !== "granted");
    } catch {
      if (mounted.current) setUnavailable(true);
    } finally {
      if (mounted.current) setPending(false);
    }
  };
  return { enabled, pending, unavailable, input, toggle };
}
