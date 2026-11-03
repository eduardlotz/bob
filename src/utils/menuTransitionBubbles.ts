export interface MenuTransitionBubble {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  color: string;
  opacity: number;
  font: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    fontStyle: string;
    lineHeight: string;
    letterSpacing: string;
  };
  boxShadow: string;
}

/** Measure before the menu exits so the overlay can take over without a jump. */
export function captureMenuTransitionBubbles(): MenuTransitionBubble[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-menu-route]")).flatMap(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || style.visibility === "hidden" || Number(style.opacity) === 0) return [];
    const label = element.querySelector<HTMLElement>("[data-menu-route-label]");
    const fill = element.querySelector<HTMLElement>("[data-menu-bubble-fill]");
    const labelStyle = getComputedStyle(label ?? element);
    const fillStyle = getComputedStyle(fill ?? element);
    return [{
      id: element.dataset.menuRoute!,
      label: label?.textContent ?? element.textContent ?? "",
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
      background: fillStyle.backgroundColor,
      color: style.color,
      opacity: Number(style.opacity),
      font: {
        fontFamily: labelStyle.fontFamily,
        fontSize: labelStyle.fontSize,
        fontWeight: labelStyle.fontWeight,
        fontStyle: labelStyle.fontStyle,
        lineHeight: labelStyle.lineHeight,
        letterSpacing: labelStyle.letterSpacing,
      },
      boxShadow: fillStyle.boxShadow,
    }];
  });
}

/** Match each bubble to its nearest angular slot while preserving menu order. */
export function getMenuOrbitAngles(bubbles: MenuTransitionBubble[], x: number, y: number) {
  const sorted = bubbles.map(bubble => ({
    id: bubble.id,
    angle: Math.atan2(bubble.y - y, bubble.x - x),
  })).sort((a, b) => a.angle - b.angle);
  if (!sorted.length) return new Map<string, number>();
  const step = Math.PI * 2 / sorted.length;
  const offset = sorted.reduce((sum, bubble, index) => sum + bubble.angle - index * step, 0) / sorted.length;
  return new Map(sorted.map((bubble, index) => [bubble.id, offset + index * step]));
}
