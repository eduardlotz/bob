import type { BlobFormParameters } from "@/types/blobForms";

export function FormParameterIcon({ parameter }: { parameter: keyof BlobFormParameters }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {parameter === "sphereRadius" && <>
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M4 4l5 5M20 4l-5 5M20 20l-5-5M4 20l5-5" />
        </>}
        {parameter === "cubeWidth" && <>
          <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4M3 4v2M21 4v2M3 18v2M21 18v2" />
        </>}
        {parameter === "cubeHeight" && <>
          <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4M4 3h2M18 3h2M4 21h2M18 21h2" />
        </>}
        {parameter === "cubeDepth" && <>
          <path d="m5 19 14-14M13 5h6v6M5 13v6h6M4 4l3 3M17 17l3 3" />
        </>}
        {parameter === "cubeRadius" && <>
          <path d="M5 20V12a8 8 0 0 1 8-8h7M11 20v-7a3 3 0 0 1 3-3h6" />
        </>}
      </g>
    </svg>
  );
}

export function ResetFormIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10a8 8 0 1 1 1.3 7M4 4v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
