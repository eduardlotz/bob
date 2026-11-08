import { useEffect } from "react";
import CameraControls from "camera-controls";
import { useViewStore } from "@/store/viewStore";
import { LIBRARY_SHELF_MIN_DISTANCE, LIBRARY_SHELF_MAX_DISTANCE } from "@/store/config/library";
import { useLibraryStore } from "@/store/exploration";
import { getLibraryWorldTransform } from "@/store/config/libraryFraming";

export function useLibraryControls() {
  const currentView = useViewStore(state => state.currentView);
  const transitioning = useViewStore(state => state.isTransitioning);
  const ref = useViewStore(state => state.cameraControlsRef);
  const status = useLibraryStore(state => state.status);
  const bookId = useLibraryStore(state => state.bookId);
  useEffect(() => {
    const controls = ref?.current;
    if (!controls || !status || currentView !== `library:${status}`) return;
    const focused = bookId !== null || transitioning;
    controls.mouseButtons.left = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.TRUCK;
    controls.mouseButtons.middle = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.DOLLY;
    controls.mouseButtons.right = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.TRUCK;
    controls.mouseButtons.wheel = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.DOLLY;
    controls.touches.one = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.TOUCH_TRUCK;
    controls.touches.two = focused ? CameraControls.ACTION.NONE : CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
    const { scale } = getLibraryWorldTransform();
    controls.minDistance = LIBRARY_SHELF_MIN_DISTANCE * scale;
    controls.maxDistance = LIBRARY_SHELF_MAX_DISTANCE * scale;
    return () => {
      const state = useViewStore.getState();
      state.applyViewModeToControls(state.viewMode);
    };
  }, [currentView, transitioning, ref, status, bookId]);
}
