import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useGLBridge } from "@/store/core/gl";

/**
 * Place this component anywhere inside your R3F <Canvas>.
 * It runs inside the Three context and pushes `gl` into the bridge store
 * so that CameraApp (outside Canvas) can call gl.domElement.toDataURL().
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
  }, [gl, setGL]);

  return null;
}
