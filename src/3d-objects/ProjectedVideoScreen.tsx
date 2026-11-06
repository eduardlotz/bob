import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useCoreStore } from "@/store/core/store";
import { useBobEditor } from "@/store/bobEditor";
import { projectSceneLabel } from "@/utils/sceneLabels";
import { screenQuadMatrix } from "@/utils/screenQuad";

export function ProjectedVideoScreen({ videoId, title }: { videoId: string; title: string }) {
  const anchor = useRef<Group>(null);
  const player = useRef<HTMLDivElement>(null);
  const scratch = useMemo(() => ({
    corners: [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
    normal: new Vector3(), toCamera: new Vector3(), position: new Vector3(),
  }), []);
  useFrame(({ camera, size }) => {
    if (!anchor.current || !player.current) return;
    anchor.current.updateWorldMatrix(true, false);
    const matrix = anchor.current.matrixWorld;
    scratch.position.setFromMatrixPosition(matrix);
    scratch.normal.set(0, 0, 1).transformDirection(matrix);
    scratch.toCamera.copy(camera.position).sub(scratch.position);
    const facingCamera = scratch.normal.dot(scratch.toCamera) > 0;
    player.current.style.visibility = facingCamera ? "visible" : "hidden";
    if (!facingCamera) return;
    const localCorners = [[-0.575, 0.415], [0.575, 0.415], [0.575, -0.415], [-0.575, -0.415]];
    const fisheye = useCoreStore.getState().graphicPreferences.fisheyeEnabled;
    const offset = useBobEditor.getState().screenOffset;
    const corners = scratch.corners.map((point, index) => {
      point.set(localCorners[index][0], localCorners[index][1], 0).applyMatrix4(matrix);
      return projectSceneLabel(point, camera, size.width, size.height, fisheye, offset) as [number, number];
    });
    const projection = screenQuadMatrix(corners, 480, 346);
    if (projection) player.current.style.transform = `matrix3d(${projection.join(",")})`;
  });
  return <group ref={anchor} position={[-0.15, 0.05, 0.57]}>
    <Html calculatePosition={() => [0, 0]} zIndexRange={[60, 60]} style={{ pointerEvents: "none" }}>
      <div ref={player} onPointerDown={event => event.stopPropagation()}
        style={{ position: "absolute", left: 0, top: 0, width: 480, height: 346,
          transformOrigin: "0 0", background: "#151b1b", overflow: "hidden", borderRadius: 18, pointerEvents: "auto" }}>
        <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
          allow="encrypted-media; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: 0 }} />
      </div>
    </Html>
  </group>;
}
