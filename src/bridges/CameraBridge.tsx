import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { renderCameraPreviews, useGLBridge } from "@/store/core/gl";

/**
 * Place this component anywhere inside your R3F <Canvas>.
 * Shares the renderer for camera gestures and publishes completed scene frames
 * to the app-owned camera preview.
 *
 * @example
 * <Canvas gl={{ preserveDrawingBuffer: true }}>
 *   <CameraGLBridge />
 *   <YourScene />
 * </Canvas>
 */
export function CameraGLBridge() {
  const { gl } = useThree();
  const setGL = useGLBridge((s) => s.setGL);

  useEffect(() => {
    setGL(gl);
    return () => setGL(null);
  }, [gl, setGL]);

  // Copy after SceneLens presents the clean frame, before the browser discards
  // its drawing buffer. No preview work runs when the camera app is closed.
  useFrame(() => renderCameraPreviews(gl.domElement), 3);

  return null;
}
