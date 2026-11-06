import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

/** Temporary local measurement probe, mounted only with the profile query flag. */
export function LibraryProfile() {
  const gl = useThree(state => state.gl);
  const label = useRef<HTMLPreElement>(null);
  const sample = useRef({ elapsed: 0, frames: 0, calls: 0, triangles: 0, results: [] as object[] });
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = previous; };
  }, [gl]);
  useFrame(() => { gl.info.reset(); }, -10);
  useFrame((_, delta) => {
    const s = sample.current;
    s.elapsed += delta; s.frames++; s.calls += gl.info.render.calls; s.triangles += gl.info.render.triangles;
    if (s.elapsed < 2) return;
    s.results.push({ fps: +(s.frames / s.elapsed).toFixed(1), calls: Math.round(s.calls / s.frames), triangles: Math.round(s.triangles / s.frames) });
    if (label.current) label.current.textContent = JSON.stringify(s.results.slice(-5));
    s.elapsed = 0; s.frames = 0; s.calls = 0; s.triangles = 0;
  }, 4);
  return <Html fullscreen><pre data-library-profile ref={label} style={{ position: "fixed", left: 12, top: 12, zIndex: 20000, background: "#000", color: "white", fontSize: 12, padding: 8, whiteSpace: "pre-wrap", pointerEvents: "none" }}>Measuring library</pre></Html>;
}
