import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, CanvasTexture, Color, DynamicDrawUsage, Euler, InstancedBufferAttribute, InstancedMesh, MathUtils, Matrix4, PlaneGeometry, Quaternion, SRGBColorSpace, Sphere, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";
import { BOOKS } from "@/store/books";
import { useBooksStore } from "@/store/books";
import { useSocialCorner } from "../about/useSocialCorner";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";
import { useFloatingBar } from "@/layout/FloatingBar";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";
import { BOOK_SIZE, shelfBookWorldPose } from "./shelfLayout";
import { roomObjectFlightProgress, roomObjectFocusPose } from "../about/roomObjectFocus";
import { getCoverTex, loadCoverFonts } from "./utils";

const COLUMNS = 8;
const ROWS = Math.ceil(BOOKS.length / COLUMNS);
const TILE = 192;
const COVER_WIDTH = 128;

/** One model and two instanced draws for both the shelf and the flying books. */
export function ShelfBooks() {
  const selected = useBooksStore(state => state.focusedBook?.id ?? null);
  const showOptions = useAppStore(state => state.showOptions);
  const currentView = useViewStore(state => state.currentView);
  const transitioning = useViewStore(state => state.isTransitioning);
  const fisheye = useCoreStore(state => state.graphicPreferences.fisheyeEnabled);
  const viewport = useThree(state => state.size);
  const { setHoveredObject } = useFloatingBar();
  const enterShelf = useSocialCorner("bookshelf");
  const hovered = useRef(-1);
  const { locale } = useI18n();
  const bodies = useRef<InstancedMesh>(null!);
  const jackets = useRef<InstancedMesh>(null!);
  const drag = useRef({ index: -1, x: 0, y: 0, moved: false });
  const interactive = !showOptions && currentView === "bookshelf" && !transitioning;
  const slots = useMemo(() => BOOKS.map(book => {
    const home = shelfBookWorldPose(book);
    return { home, position: home.position.clone(), rotation: home.rotation.clone(), scale: home.scale,
      from: home.position.clone(), fromRotation: home.rotation.clone(), fromScale: home.scale,
      elapsed: 1, pull: 0, focused: false, yaw: 0, pitch: 0, spin: 0 };
  }), []);
  useEffect(() => {
    useViewStore.getState().setCameraEnabled(selected === null);
    const key = (event: KeyboardEvent) => {
      if (selected === null) return;
      if (event.key === "Escape") {
        event.preventDefault(); event.stopImmediatePropagation();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const book = BOOKS.find(candidate => candidate.id === selected);
        const peers = BOOKS.filter(candidate => candidate.status === book?.status);
        const index = peers.findIndex(candidate => candidate.id === selected);
        const next = peers[(index + (event.key === "ArrowLeft" ? -1 : 1) + peers.length) % peers.length];
        if (next) useBooksStore.getState().navigateToBookId(next.id);
      }
    };
    const release = (event: KeyboardEvent) => {
      if (selected === null || event.key !== "Escape") return;
      event.preventDefault(); event.stopImmediatePropagation(); useBooksStore.getState().clearFocus();
    };
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", release, true);
    return () => {
      window.removeEventListener("keydown", key, true); window.removeEventListener("keyup", release, true);
      useViewStore.getState().setCameraEnabled(true);
    };
  }, [selected]);
  useEffect(() => {
    if (currentView !== "bookshelf") useBooksStore.getState().clearFocus();
  }, [currentView]);
  useEffect(() => () => useBooksStore.getState().clearFocus(), []);
  const scratch = useMemo(() => ({ matrix: new Matrix4(), scale: new Vector3(), target: new Vector3(),
    cameraRotation: new Quaternion(), targetRotation: new Quaternion(), euler: new Euler() }), []);
  const atlas = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = COLUMNS * TILE; canvas.height = ROWS * TILE;
    const ctx = canvas.getContext("2d")!;
    const covers = BOOKS.map(getCoverTex);
    const versions = BOOKS.map(() => -1);
    const paintSpine = (index: number) => {
      const book = BOOKS[index];
      const x = index % COLUMNS * TILE + COVER_WIDTH, y = Math.floor(index / COLUMNS) * TILE;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = book.fallbackBackgroundColor; ctx.fillRect(0, 0, 64, TILE);
      ctx.fillStyle = book.fallbackTextColor;
      ctx.save(); ctx.translate(27, 179); ctx.rotate(-Math.PI / 2);
      ctx.font = "800 14px Nunito, sans-serif"; ctx.fillText(book.title, 0, 0, 164);
      ctx.font = "600 9px Nunito, sans-serif"; ctx.fillText(book.author, 0, 17, 164); ctx.restore();
      ctx.fillRect(7, 8, 50, 2); ctx.restore();
    };
    BOOKS.forEach((_, i) => paintSpine(i));
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    const cover = new PlaneGeometry(BOOK_SIZE[0], BOOK_SIZE[1]); cover.translate(0, 0, BOOK_SIZE[2] / 2 + 0.001);
    const spine = new PlaneGeometry(BOOK_SIZE[2], BOOK_SIZE[1]);
    spine.rotateY(-Math.PI / 2); spine.translate(-BOOK_SIZE[0] / 2 - 0.001, 0, 0);
    [cover, spine].forEach((geometry, i) => {
      const uv = geometry.getAttribute("uv");
      for (let j = 0; j < uv.count; j++) uv.setXY(j, (uv.getX(j) * ((i ? 64 : COVER_WIDTH) - 1) + (i ? COVER_WIDTH : 0) + 0.5) / TILE, (uv.getY(j) * (TILE - 1) + 0.5) / TILE);
    });
    const geometry = mergeGeometries([cover, spine])!;
    cover.dispose(); spine.dispose();
    const offsets = new Float32Array(BOOKS.length * 2);
    BOOKS.forEach((_, i) => { offsets[i * 2] = i % COLUMNS / COLUMNS; offsets[i * 2 + 1] = 1 - (Math.floor(i / COLUMNS) + 1) / ROWS; });
    geometry.setAttribute("atlasOffset", new InstancedBufferAttribute(offsets, 2));
    return { texture, geometry, body: new BoxGeometry(...BOOK_SIZE), ctx, covers, versions, paintSpine };
  }, []);
  useEffect(() => {
    let disposed = false;
    void Promise.all(BOOKS.map(loadCoverFonts)).then(() => {
      if (disposed) return;
      BOOKS.forEach((_, i) => atlas.paintSpine(i)); atlas.texture.needsUpdate = true;
    }).catch(() => {});
    return () => { disposed = true; atlas.texture.dispose(); atlas.geometry.dispose(); atlas.body.dispose(); };
  }, [atlas]);
  useLayoutEffect(() => {
    slots.forEach((slot, i) => {
      const focused = BOOKS[i].id === selected;
      if (focused === slot.focused) return;
      slot.from.copy(slot.position); slot.fromRotation.copy(slot.rotation); slot.fromScale = slot.scale;
      slot.elapsed = 0; slot.focused = focused;
      if (focused) { slot.yaw = -.12; slot.pitch = -.05; slot.spin = 0; }
    });
    drag.current.index = -1;
  }, [selected, slots]);
  useLayoutEffect(() => {
    for (const mesh of [bodies.current, jackets.current]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      // Include the moving camera anchor as well as every shelf for ray picking.
      mesh.boundingSphere = new Sphere(new Vector3(), Math.max(20, ...slots.map(slot => slot.home.position.length() + 2)));
    }
    BOOKS.forEach((book, i) => bodies.current.setColorAt(i, new Color(book.fallbackBackgroundColor)));
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
  }, [slots]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const state = drag.current;
      if (state.index < 0) return;
      const dx = event.clientX - state.x, dy = event.clientY - state.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) state.moved = true;
      slots[state.index].yaw += dx * .009;
      slots[state.index].pitch = MathUtils.clamp(slots[state.index].pitch + dy * .009, -1.2, 1.2);
      state.x = event.clientX; state.y = event.clientY;
    };
    const release = () => { drag.current.index = -1; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); };
  }, [slots]);
  useEffect(() => {
    hovered.current = -1;
    setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false);
    return () => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); };
  }, [selected, currentView, showOptions, setHoveredObject]);
  useFrame(({ camera }, delta) => {
    let repainted = false;
    atlas.covers.forEach((cover, i) => {
      if (atlas.versions[i] === cover.version) return;
      atlas.ctx.drawImage(cover.image, i % COLUMNS * TILE, Math.floor(i / COLUMNS) * TILE, COVER_WIDTH, TILE);
      atlas.versions[i] = cover.version; repainted = true;
    });
    if (repainted) atlas.texture.needsUpdate = true;
    slots.forEach((slot, i) => {
      slot.elapsed += Math.min(delta, 0.1);
      const progress = roomObjectFlightProgress(slot.elapsed);
      if (slot.focused) {
        const scale = roomObjectFocusPose(camera, viewport, scratch.target, scratch.cameraRotation, BOOK_SIZE[0], BOOK_SIZE[1],
          fisheye ? getSceneLensRadius(viewport.width, viewport.height) : undefined, BOOK_SIZE[2]);
        if (drag.current.index !== i) slot.spin += delta * .12;
        scratch.euler.set(slot.pitch, slot.yaw + slot.spin, -.025);
        scratch.targetRotation.setFromEuler(scratch.euler).premultiply(scratch.cameraRotation);
        slot.position.lerpVectors(slot.from, scratch.target, progress);
        slot.rotation.slerpQuaternions(slot.fromRotation, scratch.targetRotation, progress);
        slot.scale = slot.fromScale + (scale - slot.fromScale) * progress;
      } else {
        slot.pull = MathUtils.damp(slot.pull, selected === null && hovered.current === i ? .10 : 0, 16, delta);
        scratch.target.copy(slot.home.position); scratch.target.z += slot.pull;
        slot.position.lerpVectors(slot.from, scratch.target, progress);
        slot.rotation.slerpQuaternions(slot.fromRotation, slot.home.rotation, progress);
        slot.scale = slot.fromScale + (slot.home.scale - slot.fromScale) * progress;
      }
      scratch.scale.setScalar(slot.scale);
      scratch.matrix.compose(slot.position, slot.rotation, scratch.scale);
      bodies.current.setMatrixAt(i, scratch.matrix); jackets.current.setMatrixAt(i, scratch.matrix);
    });
    bodies.current.instanceMatrix.needsUpdate = jackets.current.instanceMatrix.needsUpdate = true;
  }, -1.5);
  return <group
    onPointerDown={event => {
      if (!interactive || event.instanceId === undefined || BOOKS[event.instanceId].id !== selected) return;
      event.stopPropagation(); (event.target as Element).setPointerCapture(event.pointerId);
      drag.current = { index: event.instanceId, x: event.clientX, y: event.clientY, moved: false };
    }}
    onClick={event => {
      if (showOptions || event.instanceId === undefined || event.delta > 5) return;
      event.stopPropagation();
      const book = BOOKS[event.instanceId]; const state = useBooksStore.getState();
      if (selected === null && !enterShelf()) return;
      hovered.current = -1;
      if (selected === book.id) { if (!drag.current.moved) state.clearFocus(); }
      else if (selected === null) {
        state.navigateToBookId(book.id);
      }
      setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false);
    }}
    onPointerMove={event => {
      if (showOptions || transitioning || selected !== null || event.instanceId === undefined) return;
      const book = BOOKS[event.instanceId];
      if (selected !== null && selected !== book.id) return;
      event.stopPropagation();
      hovered.current = interactive && selected === null ? event.instanceId : -1;
      setHoveredObject({ title: interactive ? book.title : viewControlsMessages[locale].viewTitles.bookshelf });
      useCursorStore.getState().setHoveringClickable(true);
    }} onPointerLeave={() => { hovered.current = -1; setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); }}>
    <instancedMesh ref={bodies} args={[atlas.body, undefined, BOOKS.length]} castShadow receiveShadow frustumCulled={false}
     >
      <meshStandardMaterial color="white" roughness={.68} />
    </instancedMesh>
    <instancedMesh ref={jackets} args={[atlas.geometry, undefined, BOOKS.length]} frustumCulled={false}>
      <meshStandardMaterial map={atlas.texture} roughness={.5} customProgramCacheKey={() => "about-book-jacket-atlas-v1"}
        onBeforeCompile={shader => {
          shader.vertexShader = `attribute vec2 atlasOffset;\n${shader.vertexShader}`.replace("#include <uv_vertex>",
            `#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv / vec2(${COLUMNS}.0, ${ROWS}.0) + atlasOffset;\n#endif`);
        }} />
    </instancedMesh>
  </group>;
}
