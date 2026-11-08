import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Group, Mesh } from "three";
import { useLibraryStore } from "@/store/exploration";
import { useAppStore, useViewStore } from "@/store";
import { useI18n } from "@/i18n";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { createLibraryBatches, libraryShelfAtFace } from "./libraryBatching";

/** Children are static source geometry. Lights remain live; merged surfaces render once per material. */
export function StaticLibraryBatch({ children }: { children: ReactNode }) {
  const { messages } = useI18n();
  const { setHoveredObject } = useFloatingBar();
  const showOptions = useAppStore(state => state.showOptions);
  const bookId = useLibraryStore(state => state.bookId);
  const currentView = useViewStore(state => state.currentView);
  const interactive = !showOptions && bookId === null && currentView.startsWith("library");
  const hovered = useRef(false);
  const clearHover = () => {
    if (!hovered.current) return;
    hovered.current = false;
    setHoveredObject(null);
    useCursorStore.getState().setHoveringClickable(false);
  };
  useEffect(() => {
    if (!interactive) clearHover();
    return clearHover;
  }, [interactive, setHoveredObject]);
  const source = useRef<Group>(null!);
  const output = useRef<Group>(null!);
  useLayoutEffect(() => {
    const batches = createLibraryBatches(source.current);
    const originals: { mesh: Mesh; visible: boolean }[] = [];
    source.current.traverse(object => {
      if (!(object instanceof Mesh)) return;
      originals.push({ mesh: object, visible: object.visible });
      object.visible = false;
    });
    for (const mesh of batches.meshes) output.current.add(mesh);
    return () => {
      for (const mesh of batches.meshes) mesh.removeFromParent();
      batches.dispose();
      for (const original of originals) {
        original.mesh.visible = original.visible;
      }
    };
  }, []);
  return <>
    <group ref={source}>{children}</group>
    <group ref={output} onClick={event => {
      const shelf = libraryShelfAtFace(event.object as Mesh, event.faceIndex);
      if (!shelf || !interactive || event.delta > 5) return;
      event.stopPropagation(); clearHover(); useLibraryStore.getState().browse(shelf);
    }} onPointerMove={event => {
      const shelf = libraryShelfAtFace(event.object as Mesh, event.faceIndex);
      if (!shelf || !interactive) { clearHover(); return; }
      event.stopPropagation();
      hovered.current = true;
      setHoveredObject({ title: messages.books.statuses[shelf] });
      useCursorStore.getState().setHoveringClickable(true);
    }} onPointerLeave={clearHover} />
  </>;
}
