/** Leave a paint opportunity between committing the curtain and blocking scene work. */
export function afterScreenTransitionPaint(
  action: () => void,
  requestFrame: typeof requestAnimationFrame = requestAnimationFrame,
  cancelFrame: typeof cancelAnimationFrame = cancelAnimationFrame,
) {
  let cancelled = false;
  let frame = requestFrame(() => {
    if (cancelled) return;
    frame = requestFrame(() => {
      if (!cancelled) action();
    });
  });
  return () => { cancelled = true; cancelFrame(frame); };
}
