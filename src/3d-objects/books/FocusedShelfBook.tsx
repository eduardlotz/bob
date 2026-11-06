import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Euler, MathUtils, Mesh, Quaternion, Vector3 } from "three";
import { BOOK_BY_ID, type Book } from "@/store/books";
import { useLibraryStore } from "@/store/exploration";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";
import { useAppStore, useCoreStore, useViewStore } from "@/store";
import { getCoverTex } from "./utils";
import { shelfBookWorldPose } from "./libraryLayout";
import { libraryBookFocusPose, libraryBookFlightProgress } from "./libraryFocus";

/** Fly from the shelf into a camera-attached orbit, before the fisheye capture. */
export function FocusedShelfBook() {
  const bookId = useLibraryStore(state => state.bookId);
  const openBook = useLibraryStore(state => state.openBook);
  const currentView = useViewStore(state => state.currentView);
  const showOptions = useAppStore(state => state.showOptions);
  const viewport = useThree(state => state.size);
  const camera = useThree(state => state.camera);
  const fisheye = useCoreStore(state => state.graphicPreferences.fisheyeEnabled);
  const [renderBook, setRenderBook] = useState<Book | null>(null);
  const mesh = useRef<Mesh>(null);
  const motion = useMemo(() => ({
    position: new Vector3(), rotation: new Quaternion(), scale: 0,
    origin: new Vector3(), originRotation: new Quaternion(), elapsed: 0, originScale: 1,
    spin: 0, yaw: 0, pitch: 0, dragging: false, moved: false, x: 0, y: 0,
    target: new Vector3(), cameraRotation: new Quaternion(),
    targetRotation: new Quaternion(), euler: new Euler(),
  }), []);

  useLayoutEffect(() => {
    const book = bookId === null ? null : BOOK_BY_ID.get(bookId);
    if (!book) { motion.dragging = false; return; }
    const source = shelfBookWorldPose(book);
    motion.origin.copy(source.position); motion.originRotation.copy(source.rotation);
    motion.position.copy(source.position); motion.rotation.copy(source.rotation); motion.scale = source.scale;
    motion.originScale = source.scale; motion.elapsed = 0;
    motion.spin = 0; motion.yaw = 0; motion.pitch = 0; motion.dragging = false; motion.moved = false;
    setRenderBook(book);
  }, [bookId, motion]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!motion.dragging) return;
      const dx = event.clientX - motion.x, dy = event.clientY - motion.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) motion.moved = true;
      motion.yaw += dx * 0.008; motion.pitch += dy * 0.008;
      motion.x = event.clientX; motion.y = event.clientY;
    };
    const release = () => { motion.dragging = false; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [motion]);

  useFrame(({ camera }, delta) => {
    if (!mesh.current || !renderBook) return;
    const focused = bookId === renderBook.id;
    const blend = 1 - Math.exp(-12 * Math.min(delta, 0.1));
    if (focused) {
      motion.elapsed += Math.min(delta, 0.1);
      const progress = libraryBookFlightProgress(motion.elapsed);
      const targetScale = libraryBookFocusPose(camera, viewport, motion.target, motion.cameraRotation, fisheye ? getSceneLensRadius(viewport.width, viewport.height) : undefined);
      // Interpolate the flight, then pin to the live camera anchor without follow lag.
      motion.position.lerpVectors(motion.origin, motion.target, progress);
      motion.scale = MathUtils.lerp(motion.originScale, targetScale, progress);
      if (!motion.dragging) motion.spin += delta * 0.16;
      motion.euler.set(motion.pitch - 0.1, motion.yaw + motion.spin - 0.18, -0.04);
      motion.targetRotation.setFromEuler(motion.euler).premultiply(motion.cameraRotation);
      motion.rotation.slerpQuaternions(motion.originRotation, motion.targetRotation, progress);
    } else {
      motion.scale = MathUtils.lerp(motion.scale, 0, blend);
    }
    mesh.current.position.copy(motion.position);
    mesh.current.parent?.worldToLocal(mesh.current.position);
    if (mesh.current.parent) {
      mesh.current.parent.getWorldQuaternion(motion.cameraRotation).invert();
      mesh.current.quaternion.copy(motion.cameraRotation).multiply(motion.rotation);
    } else mesh.current.quaternion.copy(motion.rotation);
    mesh.current.scale.setScalar(motion.scale);
    mesh.current.updateMatrixWorld(true);
    if (!focused && motion.scale < 0.005) setRenderBook(null);
  }, -1.5);

  if (!renderBook) return null;
  return createPortal(<mesh ref={mesh} renderOrder={1000} frustumCulled={false} visible={currentView.startsWith("library") && !showOptions}
    userData={{ foregroundOutline: "foreground", outlineThickness: 0.003 }}
    onPointerDown={event => {
      event.stopPropagation(); (event.target as Element).setPointerCapture(event.pointerId);
      motion.dragging = true; motion.moved = false; motion.x = event.clientX; motion.y = event.clientY;
    }}
    onPointerUp={event => { event.stopPropagation(); motion.dragging = false; }}
    onPointerCancel={() => { motion.dragging = false; }}
    onClick={event => { event.stopPropagation(); if (!motion.moved) openBook(null); }}>
    <boxGeometry args={[0.75, 1.08, 0.105]} />
    <meshStandardMaterial depthTest={false} depthWrite={false} attach="material-0" color={renderBook.fallbackBackgroundColor} roughness={0.85} />
    <meshStandardMaterial depthTest={false} depthWrite={false} attach="material-1" color={renderBook.fallbackBackgroundColor} roughness={0.85} />
    <meshStandardMaterial depthTest={false} depthWrite={false} attach="material-2" color="#f5f0e8" roughness={0.9} />
    <meshStandardMaterial depthTest={false} depthWrite={false} attach="material-3" color="#f5f0e8" roughness={0.9} />
    <meshBasicMaterial depthTest={false} depthWrite={false} attach="material-4" map={getCoverTex(renderBook)} />
    <meshStandardMaterial depthTest={false} depthWrite={false} attach="material-5" color={renderBook.fallbackBackgroundColor} roughness={0.85} />
  </mesh>, camera);
}
