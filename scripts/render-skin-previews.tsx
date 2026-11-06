import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BlobForm } from "../src/components/BlobForm";
import { SceneLens } from "../src/components/SceneLens";
import { BOB_SKINS, type BobSkin } from "../src/components/bob/skins/registry";
import { BOB_CAMERA_POSE } from "../src/store/config/camera";
import { DEFAULT_WORLD_LIGHTING } from "../src/store/core/store";
import { DEFAULT_FORM_PARAMETERS, getBobEyePosition } from "../src/types/blobForms";

// Development-only. Capture the real production lens at the Shop camera pose.
// Crop completed pixels afterward; never zoom the lens or move the camera to
// fill a thumbnail, as doing so changes the face's fisheye projection.
const results: Record<string, string> = {};
const size = 160;
const parameters = DEFAULT_FORM_PARAMETERS.sphere;

function savePreview(skin: BobSkin, png: string) {
  results[skin.id] = png;
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = png;
  img.alt = skin.name.en;
  const label = document.createElement("figcaption");
  label.textContent = skin.name.en;
  figure.append(img, label);
  document.querySelector("main")!.append(figure);
  if (Object.keys(results).length === BOB_SKINS.length) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(results)], { type: "application/json" }));
    link.download = "skin-previews.json";
    link.textContent = "Download skin thumbnails";
    document.body.append(link);
  }
}

function Capture({ skin, onCapture }: { skin: BobSkin; onCapture: () => void }) {
  const state = useRef({ id: "", frames: 0, captured: false });
  const setFrameloop = useThree(s => s.setFrameloop);
  useFrame(({ clock }) => { clock.elapsedTime = 1.4; }, -3);
  // SceneLens presents at priority 2. Read that completed render, after the
  // material and foreground outline updates have settled for this skin.
  useFrame(({ gl }) => {
    if (state.current.id !== skin.id) state.current = { id: skin.id, frames: 0, captured: false };
    if (state.current.captured || ++state.current.frames < 4) return;
    const source = gl.domElement;
    const staging = document.createElement("canvas");
    staging.width = source.width;
    staging.height = source.height;
    const context = staging.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(source, 0, 0);
    const { data } = context.getImageData(0, 0, staging.width, staging.height);
    let left = staging.width, top = staging.height, right = -1, bottom = -1;
    for (let y = 0; y < staging.height; y++) {
      for (let x = 0; x < staging.width; x++) {
        if (data[(y * staging.width + x) * 4 + 3] === 0) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) throw new Error(`Empty thumbnail render: ${skin.id}`);
    const extent = Math.max(right - left + 1, bottom - top + 1) * 1.2;
    const output = document.createElement("canvas");
    output.width = output.height = size;
    output.getContext("2d")!.drawImage(staging,
      (left + right + 1 - extent) / 2, (top + bottom + 1 - extent) / 2, extent, extent,
      0, 0, size, size);
    state.current.captured = true;
    savePreview(skin, output.toDataURL("image/png"));
    if (skin === BOB_SKINS[BOB_SKINS.length - 1]) setFrameloop("never");
    else onCapture();
  }, 3);
  return null;
}

function ThumbnailScene() {
  const [index, setIndex] = useState(0);
  const skin = BOB_SKINS[index];
  // Default home studio light, using the same sun direction as Scene.
  const horizontalRadius = Math.cos(0.64) * 6.7;
  return <>
    <SceneLens enabled transparent bobOutlineColor={skin.outline}>
      <ambientLight intensity={DEFAULT_WORLD_LIGHTING.ambientIntensity} />
      <directionalLight intensity={DEFAULT_WORLD_LIGHTING.directionalIntensity}
        position={[Math.sin(0.38) * horizontalRadius, 0.7 + Math.sin(0.64) * 6.7, Math.cos(0.38) * horizontalRadius]} />
      {/* Shop's standard desktop rest pose and scale; no wardrobe or idle effects. */}
      <group scale={1.2} rotation={[-0.15, 0, 0]} userData={{ foregroundOutline: "bob" }}>
        <BlobForm formType="sphere" parameters={parameters} blobColor={skin.body} skin={skin} />
        <group position={getBobEyePosition([0, 0.2, 0.85], "sphere", parameters)} userData={{ foregroundOutline: false }}>
          {[-0.45, 0.45].map(x => <mesh key={x} position={[x, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshToonMaterial color={skin.eyes} />
          </mesh>)}
        </group>
      </group>
    </SceneLens>
    <Capture skin={skin} onCapture={() => setIndex(index + 1)} />
  </>;
}

createRoot(document.getElementById("renderer")!).render(
  <Canvas flat dpr={1} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
    camera={{ position: BOB_CAMERA_POSE.position, fov: 50 }}
    onCreated={({ camera }) => { camera.lookAt(...BOB_CAMERA_POSE.target); camera.updateMatrixWorld(); }}>
    <ThumbnailScene />
  </Canvas>,
);
