import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3 } from "three";
import { useAppStore, useViewStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";
import { BOOKS } from "@/store/books";
import { LIBRARY_SHELVES } from "@/store/config/library";
import { useLibraryStore } from "@/store/exploration";
import { useFloatingBar } from "@/layout/FloatingBar";
import { shelfBookLayout } from "./libraryLayout";

const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = Math.ceil(BOOKS.length / ATLAS_COLUMNS);
const SLOTS = BOOKS.map(book => {
  const shelf = LIBRARY_SHELVES.find(candidate => candidate.status === book.status)!;
  const index = BOOKS.filter(candidate => candidate.status === book.status).findIndex(candidate => candidate.id === book.id);
  const { height, position } = shelfBookLayout(book, index);
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), shelf.rotation);
  const world = new Vector3(...position).applyQuaternion(rotation).add(new Vector3(...shelf.position));
  const spine = new Vector3(0, 0, 0.237).applyQuaternion(rotation).add(world);
  return { height, position: world, spine, rotation };
});

/** Every shelf book stays individually pickable, with one body draw and one atlas draw. */
export function ShelfBooks() {
  const selected = useLibraryStore(state => state.bookId);
  const showOptions = useAppStore(state => state.showOptions);
  const currentView = useViewStore(state => state.currentView);
  const interactive = !showOptions && selected === null && currentView.startsWith("library");
  const bodies = useRef<InstancedMesh>(null!);
  const spines = useRef<InstancedMesh>(null!);
  const { setHoveredObject } = useFloatingBar();
  const atlas = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = ATLAS_COLUMNS * 64; canvas.height = ATLAS_ROWS * 256;
    const ctx = canvas.getContext("2d")!;
    BOOKS.forEach((book, index) => {
      const x = index % ATLAS_COLUMNS * 64, y = Math.floor(index / ATLAS_COLUMNS) * 256;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = book.fallbackBackgroundColor; ctx.fillRect(0, 0, 64, 256);
      ctx.fillStyle = book.fallbackTextColor; ctx.font = "800 13px Nunito, sans-serif";
      ctx.save(); ctx.translate(40, 238); ctx.rotate(-Math.PI / 2); ctx.fillText(book.title, 0, 0, 215); ctx.restore();
      ctx.fillRect(8, 12, 48, 2); ctx.fillRect(8, 20, 48, 1); ctx.restore();
    });
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    const geometry = new PlaneGeometry(1, 1);
    const offsets = new Float32Array(BOOKS.length * 2);
    BOOKS.forEach((_, index) => {
      offsets[index * 2] = index % ATLAS_COLUMNS / ATLAS_COLUMNS;
      offsets[index * 2 + 1] = 1 - (Math.floor(index / ATLAS_COLUMNS) + 1) / ATLAS_ROWS;
    });
    geometry.setAttribute("atlasOffset", new InstancedBufferAttribute(offsets, 2));
    return { texture, geometry };
  }, []);
  useEffect(() => () => { atlas.texture.dispose(); atlas.geometry.dispose(); }, [atlas]);
  useLayoutEffect(() => {
    const matrix = new Matrix4(), scale = new Vector3();
    BOOKS.forEach((book, index) => {
      const slot = SLOTS[index]; const hidden = selected === book.id;
      scale.set(hidden ? 0 : 1, hidden ? 0 : slot.height, hidden ? 0 : 1);
      bodies.current.setMatrixAt(index, matrix.compose(slot.position, slot.rotation, scale));
      bodies.current.setColorAt(index, new Color(book.fallbackBackgroundColor));
      scale.set(hidden ? 0 : 0.174, hidden ? 0 : slot.height, hidden ? 0 : 1);
      spines.current.setMatrixAt(index, matrix.compose(slot.spine, slot.rotation, scale));
    });
    bodies.current.instanceMatrix.needsUpdate = spines.current.instanceMatrix.needsUpdate = true;
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    bodies.current.computeBoundingSphere(); spines.current.computeBoundingSphere();
  }, [selected]);
  return <group
    onClick={event => {
      if (!interactive || event.instanceId === undefined) return;
      if (event.delta > 5) return;
      event.stopPropagation(); useLibraryStore.getState().openBook(BOOKS[event.instanceId].id); setHoveredObject(null);
      useCursorStore.getState().setHoveringClickable(false);
    }}
    onPointerMove={event => {
      if (!interactive || event.instanceId === undefined) return;
      event.stopPropagation(); setHoveredObject({ title: BOOKS[event.instanceId].title });
      useCursorStore.getState().setHoveringClickable(true);
    }} onPointerLeave={() => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); }}>
    <instancedMesh ref={bodies} args={[undefined, undefined, BOOKS.length]} castShadow receiveShadow
      userData={{ foregroundOutline: "foreground", outlineThickness: 0.003 }}>
      <boxGeometry args={[0.175, 1, 0.47]} /><meshStandardMaterial color="white" roughness={0.85} />
    </instancedMesh>
    <instancedMesh ref={spines} args={[atlas.geometry, undefined, BOOKS.length]} userData={{ foregroundOutline: false }}>
      <meshBasicMaterial map={atlas.texture}
        customProgramCacheKey={() => "library-spine-atlas-v1"}
        onBeforeCompile={shader => {
          shader.vertexShader = `attribute vec2 atlasOffset;\n${shader.vertexShader}`.replace("#include <uv_vertex>",
            `#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv / vec2(${ATLAS_COLUMNS}.0, ${ATLAS_ROWS}.0) + atlasOffset;\n#endif`);
        }} />
    </instancedMesh>
  </group>;
}
