import { useEffect, useRef, type RefObject } from "react";
import { subscribeCameraPreview, useGLBridge } from "@/store/core/gl";
import { useViewStore } from "@/store/viewStore";
import { ditherCameraImage, getCameraDitherPixelSize } from "@/utils/cameraDither";

/** A camera window owned by the app, with a local filter and capture surface.
 * The scene itself stays clean. Copying after presentation also preserves the
 * exact fisheye projection and crop without mounting another copy of the world.
 */
export function CameraPortal({ canvasRef, active, onReady }: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  active: boolean;
  onReady: (ready: boolean) => void;
}) {
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const gl = useGLBridge(s => s.gl);
  const controls = useViewStore(s => s.cameraControlsRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const input = scratch.current ?? (scratch.current = document.createElement("canvas"));
    const sourceContext = input.getContext("2d", { willReadFrequently: true });
    const outputContext = canvas.getContext("2d");
    if (!sourceContext || !outputContext) return;
    let ready = false;
    const unsubscribe = subscribeCameraPreview(source => {
      const rect = canvas.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || !sourceRect.width || !sourceRect.height) return;
      // Logical pixels keep the dither grid independent of adaptive WebGL DPR.
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      if (input.width !== width || input.height !== height) {
        input.width = canvas.width = width;
        input.height = canvas.height = height;
      }
      sourceContext.clearRect(0, 0, width, height);
      sourceContext.drawImage(source,
        (rect.left - sourceRect.left) * source.width / sourceRect.width,
        (rect.top - sourceRect.top) * source.height / sourceRect.height,
        rect.width * source.width / sourceRect.width,
        rect.height * source.height / sourceRect.height, 0, 0, width, height);
      const frame = sourceContext.getImageData(0, 0, width, height);
      ditherCameraImage(frame.data, width, height,
        getCameraDitherPixelSize(navigator.platform, window.devicePixelRatio, navigator.maxTouchPoints));
      outputContext.putImageData(frame, 0, 0);
      if (!ready) { ready = true; onReady(true); }
    });
    return () => { unsubscribe(); onReady(false); };
  }, [active, canvasRef, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cameraControls = controls?.current;
    if (!active || !canvas || !cameraControls || !gl) return;
    // Orbit/pinch gestures belong to the app's camera window while it is open.
    cameraControls.disconnect();
    cameraControls.connect(canvas);
    return () => {
      cameraControls.disconnect();
      cameraControls.connect(gl.domElement);
    };
  }, [active, canvasRef, controls, gl]);

  return <canvas ref={canvasRef} aria-label="Camera preview" data-camera-portal
    style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated", touchAction: "none" }} />;
}
