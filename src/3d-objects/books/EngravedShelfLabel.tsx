import { useCallback, useEffect, useMemo } from "react";
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, SRGBColorSpace } from "three";
import { LIBRARY_ARC, type LIBRARY_SHELVES, shelfDimensions } from "@/store/config/library";
import { useAppStore, useViewStore } from "@/store";
import { useLibraryStore } from "@/store/exploration";
import { useCursorStore } from "@/store/core/cursor";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";

/** Lettering follows the inner stone surface, with a recessed bump and lit lower lip. */
export function EngravedShelfLabel({ shelf }: { shelf: typeof LIBRARY_SHELVES[number] }) {
  const { messages } = useI18n();
  const label = messages.books.statuses[shelf.status];
  const showOptions = useAppStore(state => state.showOptions);
  const currentView = useViewStore(state => state.currentView);
  const bookId = useLibraryStore(state => state.bookId);
  const { setHoveredObject } = useFloatingBar();
  const interactive = !showOptions && bookId === null && currentView.startsWith("library");
  const radius = LIBRARY_ARC.wallInnerRadius - 0.008;
  const angle = -shelf.rotation;
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    const depth = document.createElement("canvas");
    canvas.width = depth.width = 1536;
    canvas.height = depth.height = 256;
    const ctx = canvas.getContext("2d")!;
    const bump = depth.getContext("2d")!;
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    const bumpMap = new CanvasTexture(depth);
    const paint = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bump.fillStyle = "black";
      bump.fillRect(0, 0, depth.width, depth.height);
      for (const context of [ctx, bump]) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = '800 120px "Nunito", Helvetica, Arial, sans-serif';
      }
      // Fit long translated names without changing the typeface's proportions.
      const fit = Math.min(1, 1400 / ctx.measureText(label).width);
      ctx.save(); bump.save();
      ctx.translate(768, 128); bump.translate(768, 128);
      ctx.scale(fit, fit); bump.scale(fit, fit);
      ctx.fillStyle = "#d9dfda"; ctx.fillText(label, 0, 4);
      ctx.fillStyle = "#46534f"; ctx.fillText(label, 0, -3);
      ctx.fillStyle = "#727c76"; ctx.fillText(label, 0, 0);
      bump.fillStyle = "white"; bump.fillText(label, 0, 0);
      ctx.restore(); bump.restore();
      map.needsUpdate = bumpMap.needsUpdate = true;
    };
    paint();
    return { map, bumpMap, paint };
  }, [label]);
  useEffect(() => {
    let active = true;
    void document.fonts.load('800 120px "Nunito"', label).then(() => {
      if (active) surface.paint();
    }).catch(() => {});
    return () => { active = false; surface.map.dispose(); surface.bumpMap.dispose(); };
  }, [surface, label]);
  const geometry = useMemo(() => {
    const positions: number[] = [], normals: number[] = [], uv: number[] = [], indices: number[] = [];
    const width = 3.45, height = width / 6, segments = 32;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments - 0.5) * width / radius;
      for (const y of [-height / 2, height / 2]) {
        positions.push(Math.sin(theta) * radius, y, (1 - Math.cos(theta)) * radius);
        normals.push(-Math.sin(theta), 0, Math.cos(theta));
        uv.push(i / segments, y > 0 ? 1 : 0);
      }
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    return geometry;
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const clearHover = useCallback(() => {
    setHoveredObject(null);
    useCursorStore.getState().setHoveringClickable(false);
  }, [setHoveredObject]);
  useEffect(() => {
    if (!interactive) clearHover();
    return clearHover;
  }, [interactive, clearHover]);
  return <mesh name={`library-engraving-${shelf.status}`} geometry={geometry}
    position={[Math.sin(angle) * radius, shelf.position[1] + shelfDimensions(shelf.status).height + 1.15, -Math.cos(angle) * radius]}
    rotation={[0, shelf.rotation, 0]}
    onClick={event => {
      if (!interactive || event.delta > 5) return;
      event.stopPropagation(); clearHover(); useLibraryStore.getState().browse(shelf.status);
    }}
    onPointerMove={event => {
      if (!interactive) return;
      event.stopPropagation(); setHoveredObject({ title: label });
      useCursorStore.getState().setHoveringClickable(true);
    }} onPointerLeave={clearHover}>
    <meshStandardMaterial map={surface.map} bumpMap={surface.bumpMap} bumpScale={-0.035}
      transparent depthWrite={false} roughness={0.94} metalness={0} />
  </mesh>;
}
