import { useFloatingBar } from "@/layout/FloatingBar";
import { Book, useBooksStore } from "@/store";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import {
  memo,
  useMemo,
  useCallback,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { makeMats } from "./utils";
import { BOOK_GEO, bookMeshRefs, STACKS } from ".";

export const SingleBook = memo(
  ({
    book,
    pos,
    rotY,
    isTop,
    booksIdx,
    hidden,
    canInteract,
  }: {
    book: Book;
    pos: [number, number, number];
    rotY: number;
    isTop: boolean;
    booksIdx: number;
    hidden: boolean;
    canInteract: boolean;
  }) => {
    const { setHoveredObject } = useFloatingBar();
    const setFocused = useBooksStore((s) => s.setFocused);
    const focusedBook = useBooksStore((s) => s.focusedBook);

    const mats = useMemo(
      () => makeMats(book, isTop, hidden ? 0 : 1),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [book.id, isTop, hidden],
    );

    const setRef = useCallback(
      (m: THREE.Mesh | null) => {
        if (m) bookMeshRefs.set(book.id, m);
        else bookMeshRefs.delete(book.id);
      },
      [book.id],
    );

    const onOver = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        // Don't interact with background books when one is focused
        if (!canInteract || focusedBook) return;
        e.stopPropagation();
        setHoveredObject({ title: book.title });
        document.body.style.cursor = "pointer";
      },
      [book.title, canInteract, focusedBook, setHoveredObject],
    );

    const onOut = useCallback(() => {
      setHoveredObject(null);
      document.body.style.cursor = "default";
    }, [setHoveredObject]);

    const onClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (!canInteract || focusedBook) return;
        e.stopPropagation();
        setFocused(booksIdx);
      },
      [booksIdx, canInteract, focusedBook, setFocused],
    );

    return (
      <mesh
        ref={setRef}
        geometry={BOOK_GEO}
        material={mats}
        position={pos}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      />
    );
  },
);

export const BOOK_W = 0.14; // spine width  X
export const BOOK_D = 0.025; // thickness    Y (stacking axis when flat)
export const BOOK_H = 0.2; // page height  Z

export const MICRO_XZ = [
  [0, 0],
  [0.006, -0.004],
  [-0.005, 0.006],
  [0.008, -0.002],
  [-0.003, 0.007],
] as const;
export const MICRO_ROT = [0, 0.04, -0.06, 0.03, -0.04] as const;

const FOCUS_SCALE = 1.1;
const FOCUS_DIST = 0.62;
const FOCUS_POS_LERP = 0.14;
const FOCUS_DISMISS_LERP = 0.22;

// Pre-allocated temporaries – avoids per-frame GC pressure
const _t = {
  invMat: new THREE.Matrix4(),
  pQuat: new THREE.Quaternion(),
  pScale: new THREE.Vector3(),
  pPos: new THREE.Vector3(),
  localPos: new THREE.Vector3(),
  localQuat: new THREE.Quaternion(),
  tQuat: new THREE.Quaternion(),
  toCamera: new THREE.Vector3(),
  camFwd: new THREE.Vector3(),
  camRight: new THREE.Vector3(),
  targetW: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, "XYZ"),
};

export const FocusedBookMesh = ({
  groupRef,
}: {
  groupRef: RefObject<THREE.Group | null>;
}) => {
  const focusedBook = useBooksStore((s) => s.focusedBook);

  const [renderBook, setRenderBook] = useState<Book | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const curWorldPos = useRef(new THREE.Vector3());
  const curWorldQuat = useRef(new THREE.Quaternion());
  const curScale = useRef(0);
  const targetScale = useRef(0);
  const isDismissing = useRef(false);
  const active = useRef(false);

  const spin = useRef(0);
  const dragYaw = useRef(0);
  const dragPitch = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // ── Global pointer listeners so drag continues outside the mesh ──────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      // in the global pointermove listener:
      dragYaw.current = Math.max(
        -1.2,
        Math.min(1.2, dragYaw.current + dx * 0.005),
      );
      dragPitch.current = Math.max(
        -0.6,
        Math.min(0.6, dragPitch.current + dy * 0.005),
      );
      lastX.current = e.clientX;
      lastY.current = e.clientY;
    };

    const onUp = () => {
      dragging.current = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useEffect(() => {
    if (focusedBook) {
      const src = bookMeshRefs.get(focusedBook.id);
      if (src) {
        src.getWorldPosition(curWorldPos.current);
        src.getWorldQuaternion(curWorldQuat.current);
      } else if (groupRef.current) {
        groupRef.current.updateWorldMatrix(true, false);
        const st = STACKS.find((s) =>
          s.books.some((b) => b.id === focusedBook.id),
        );
        if (st) {
          const idx = st.books.findIndex((b) => b.id === focusedBook.id);
          const [ox, oz] = MICRO_XZ[idx % MICRO_XZ.length];
          groupRef.current.localToWorld(
            curWorldPos.current.set(
              st.def.x + ox,
              BOOK_D * 0.5 + idx * BOOK_D,
              st.def.z + oz,
            ),
          );
        }
        curWorldQuat.current.identity();
      }

      curScale.current = 1;
      targetScale.current = FOCUS_SCALE;
      isDismissing.current = false;
      active.current = true;

      // Reset drag state for new book
      spin.current = 0;
      dragYaw.current = 0;
      dragPitch.current = 0;
      dragging.current = false;

      setRenderBook(focusedBook);
    } else {
      isDismissing.current = true;
      targetScale.current = 0;
      dragging.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBook?.id]);

  useFrame(({ camera }) => {
    if (!meshRef.current || !groupRef.current || !active.current) return;

    const lf = isDismissing.current ? FOCUS_DISMISS_LERP : FOCUS_POS_LERP;
    curScale.current += (targetScale.current - curScale.current) * lf;

    if (!isDismissing.current) {
      camera.getWorldDirection(_t.camFwd);
      _t.camRight.crossVectors(_t.camFwd, camera.up).normalize();

      _t.targetW
        .copy(camera.position)
        .addScaledVector(_t.camFwd, FOCUS_DIST)
        .addScaledVector(_t.camRight, -0.2);

      curWorldPos.current.lerp(_t.targetW, FOCUS_POS_LERP);

      if (!dragging.current) {
        spin.current = Math.max(-1.2, Math.min(1.2, spin.current + 0.001));
      }

      _t.toCamera.copy(camera.position).sub(curWorldPos.current).normalize();

      const yaw = Math.atan2(_t.toCamera.x, _t.toCamera.z);
      const baseX = Math.PI / 2 - 1 + 0.5;
      const baseY = yaw;

      _t.euler.set(
        baseX + dragPitch.current,
        0,
        baseY + spin.current + dragYaw.current,
        "XYZ",
      );

      _t.tQuat.setFromEuler(_t.euler);
      curWorldQuat.current.slerp(_t.tQuat, FOCUS_POS_LERP * 1.8);
    }

    groupRef.current.updateWorldMatrix(true, false);
    _t.invMat.copy(groupRef.current.matrixWorld).invert();
    _t.localPos.copy(curWorldPos.current).applyMatrix4(_t.invMat);

    groupRef.current.matrixWorld.decompose(_t.pPos, _t.pQuat, _t.pScale);
    _t.localQuat.copy(_t.pQuat).invert().multiply(curWorldQuat.current);

    meshRef.current.position.copy(_t.localPos);
    meshRef.current.quaternion.copy(_t.localQuat);
    meshRef.current.scale.setScalar(curScale.current);

    if (isDismissing.current && curScale.current < 0.008) {
      active.current = false;
      isDismissing.current = false;
      setRenderBook(null);
    }
  });

  const mats = useMemo(
    () => (renderBook ? makeMats(renderBook, true) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderBook?.id],
  );

  if (!renderBook || !mats) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={BOOK_GEO}
      material={mats}
      castShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        // Capture pointer so move/up fire even outside the mesh
        (e.target as Element).setPointerCapture(e.pointerId);
        dragging.current = true;
        lastX.current = e.clientX;
        lastY.current = e.clientY;
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    />
  );
};
