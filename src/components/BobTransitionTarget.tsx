import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, Vector3 } from "three";
import { useCoreStore } from "@/store";
import { useBobEditor } from "@/store/bobEditor";
import { useScreenTransition } from "@/store/screenTransition";
import { bobTransitionFocus } from "@/utils/screenTransitionMask";
import { getSceneLensRadius } from "@/utils/sceneLensFraming";

/** Only body and eyes belong here: hats, hands and particles do not enlarge the aperture. */
export function BobTransitionTarget({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const body = useRef<Group>(null);
  const get = useThree(state => state.get);
  const scratch = useMemo(() => new Vector3(), []);

  const measure = () => {
    const request = useScreenTransition.getState().request;
    if (!enabled || !body.current || !(request?.keepBobVisible || request?.initial)) return;
    const { camera, size } = get();
    const offset = useBobEditor.getState().screenOffset;
    const fisheye = useCoreStore.getState().graphicPreferences.fisheyeEnabled;
    const lensRadius = getSceneLensRadius(size.width, size.height, offset);
    camera.updateWorldMatrix(true, false);
    body.current.updateWorldMatrix(true, true);
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    body.current.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const positions = object.geometry.getAttribute("position");
      if (!positions) return;
      for (let i = 0; i < positions.count; i++) {
        scratch.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        let x: number, y: number;
        if (fisheye) {
          scratch.applyMatrix4(camera.matrixWorldInverse).normalize();
          const nz = Math.sqrt((1 - scratch.z) / 2);
          if (nz < 0.0001) continue;
          x = size.width / 2 - offset.x + lensRadius * scratch.x / (2 * nz);
          y = size.height / 2 - offset.y - lensRadius * scratch.y / (2 * nz);
        } else {
          scratch.project(camera);
          x = (scratch.x + 1) * size.width / 2;
          y = (1 - scratch.y) * size.height / 2;
        }
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    });
    if (Number.isFinite(left) && right > left && bottom > top) {
      bobTransitionFocus.current = {
        x: (left + right) / 2, y: (top + bottom) / 2,
        halfWidth: (right - left) / 2 + 4, halfHeight: (bottom - top) / 2 + 4,
      };
    }
  };
  // Capture the outgoing face synchronously when a request starts, then follow
  // the camera and the incoming face until the transition finishes.
  useLayoutEffect(() => { measure(); return useScreenTransition.subscribe(measure); });
  // Fisheye captures the world at priority -1 using the camera copied at -2.
  // Measure that same pose, rather than the next animation pose at priority 0.
  useFrame(() => {
    if (useCoreStore.getState().graphicPreferences.fisheyeEnabled) measure();
  }, -1.5);
  useFrame(() => {
    if (!useCoreStore.getState().graphicPreferences.fisheyeEnabled) measure();
  }, 1.5);
  return <group ref={body}>{children}</group>;
}
