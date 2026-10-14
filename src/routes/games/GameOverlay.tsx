import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

/** DOM controls need a DOM renderer; a React portal inside R3F still uses Three. */
export function GameOverlay({ children }: { children: ReactNode }) {
  const root = useRef<Root | null>(null);
  useLayoutEffect(() => {
    const container = document.createElement("div");
    container.dataset.gameOverlay = "true";
    (document.getElementById("motion-root") ?? document.body).appendChild(container);
    const mountedRoot = createRoot(container);
    root.current = mountedRoot;
    return () => {
      root.current = null;
      // Let the canvas finish its own unmount before tearing down the DOM root.
      queueMicrotask(() => { mountedRoot.unmount(); container.remove(); });
    };
  }, []);
  useLayoutEffect(() => { root.current?.render(children); }, [children]);
  return null;
}
