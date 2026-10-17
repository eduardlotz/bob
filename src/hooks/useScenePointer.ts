import { useEffect, useRef } from "react";
import { useFrame, useThree, type RootState } from "@react-three/fiber";
import { Vector3 } from "three";
import { useCoreStore } from "@/store";
import { FISHEYE_CONFIG } from "@/store/config/themes";
/** Keep scene picking in the same live fisheye projection as the rendered objects.
 * Drei's fisheye event closure retains its initial sphere radius after a resize.
 */
export function useScenePointer() {
    const computeRef = useRef<RootState["events"]["compute"]>(undefined);
    useFrame(state => { if (computeRef.current) state.events.compute = computeRef.current; });
    const get = useThree(s => s.get);
    const setEvents = useThree(s => s.setEvents);
    useEffect(() => {
        const previous = get().events.compute;
        const direction = new Vector3();
        setEvents({ compute: (event, state) => {
                const { width, height } = state.size;
                const { fisheyeEnabled } = useCoreStore.getState().graphicPreferences;
                state.pointer.set(event.offsetX / width * 2 - 1, 1 - event.offsetY / height * 2);
                if (!fisheyeEnabled) {
                    state.raycaster.setFromCamera(state.pointer, state.camera);
                    return;
                }
                const radius = Math.hypot(width, height) * (0.5 + FISHEYE_CONFIG.MIN / 2);
                const nx = (event.offsetX - width / 2) / radius;
                const ny = (height / 2 - event.offsetY) / radius;
                const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
                state.pointer.set(event.offsetX / width * 2 - 1, 1 - event.offsetY / height * 2);
                state.camera.getWorldPosition(state.raycaster.ray.origin);
                direction.set(2 * nx * nz, 2 * ny * nz, 1 - 2 * nz * nz).applyQuaternion(state.camera.quaternion).normalize();
                state.raycaster.camera = state.camera;
                state.raycaster.ray.direction.copy(direction);
            } });
        computeRef.current = get().events.compute;
        return () => { computeRef.current = undefined; setEvents({ compute: previous }); };
    }, [get, setEvents]);
}
