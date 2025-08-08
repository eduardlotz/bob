import { useCallback, useEffect, useRef, useState } from "react";

export interface HoldToInteractOptions {
  durationMs?: number; // default 1500ms
  onComplete: () => void;
}

export interface HoldToInteractBind {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

export function useHoldToInteract(options: HoldToInteractOptions) {
  const { durationMs = 1500, onComplete } = options;

  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const suppressClickUntilRef = useRef<number>(0);

  const cancel = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startTimeRef.current = null;
    completedRef.current = false;
    setIsHolding(false);
    setProgress(0);
    suppressClickUntilRef.current = performance.now() + 300;
  }, []);

  const step = useCallback(
    (now: number) => {
      if (startTimeRef.current == null) return;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(p);
      if (p >= 1 && !completedRef.current) {
        completedRef.current = true;
        setIsHolding(false);
        try {
          onComplete();
        } finally {
          // allow visual to show 100% briefly then reset
          setTimeout(() => setProgress(0), 100);
          suppressClickUntilRef.current = performance.now() + 300;
        }
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    },
    [durationMs, onComplete]
  );

  const onPointerDown = useCallback(() => {
    if (isHolding) return;
    setIsHolding(true);
    completedRef.current = false;
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
  }, [isHolding, step]);

  const onPointerUp = useCallback(() => {
    cancel();
  }, [cancel]);

  const onPointerLeave = useCallback(() => {
    cancel();
  }, [cancel]);

  const onPointerCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  useEffect(() => () => cancel(), [cancel]);

  const bind: HoldToInteractBind = {
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
  };

  const shouldSuppressClick =
    performance.now() < suppressClickUntilRef.current ||
    isHolding ||
    progress > 0;

  return { bind, progress, isHolding, shouldSuppressClick } as const;
}
