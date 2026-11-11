import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { BlenderRoomPart } from "./BlenderRoomPart";
import { BookshelfNotes } from "./BookshelfNotes";
import { ShelfBooks } from "../books/ShelfBooks";
import { ABOUT_BOOKSHELF } from "../books/shelfLayout";
import { useSocialCorner } from "./useSocialCorner";
import { useAppStore, useBooksStore, useViewStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";

export function AboutBookshelf() {
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const enterShelf = useSocialCorner("bookshelf");
  const clear = () => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); };
  return <>
    <group onClick={event => {
      event.stopPropagation();
      if (event.delta > 5) return;
      clear(); enterShelf();
    }} onPointerMove={event => {
      event.stopPropagation();
      const view = useViewStore.getState();
      if (useAppStore.getState().showOptions || view.isTransitioning || useBooksStore.getState().focusedBook) return;
      if (view.currentView !== "bookshelf") {
        setHoveredObject({ title: viewControlsMessages[locale].viewTitles.bookshelf });
        useCursorStore.getState().setHoveringClickable(true);
      }
    }} onPointerLeave={clear}>
      <group>
        <group position-y={ABOUT_BOOKSHELF.position[1]}><BlenderRoomPart name="Bookshelf" /></group>
      </group>
      <mesh position={[2.65, ABOUT_BOOKSHELF.position[1] + 1.925, -4.66]}>
        <planeGeometry args={[2.5, 3.85]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
    <ShelfBooks />
    <BookshelfNotes />
    <RigidBody type="fixed" colliders={false} position={ABOUT_BOOKSHELF.position}>
      <CuboidCollider args={[1.25, 1.925, .24]} position={[0, 1.925, 0]} />
    </RigidBody>
  </>;
}
