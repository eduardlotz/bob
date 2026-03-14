import { CameraViewId, CapturedPhoto, useViewStore } from "@/store";

import styled, { keyframes } from "styled-components";
import {
  AnimatePresence,
  motion,
  LayoutGroup,
  useAnimationFrame,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useCameraStore } from "@/store";
import { useGLBridge } from "@/store/core/gl";
import { createPortal } from "react-dom";
import { AppInfo, TabButton, TabPanel } from "./ui";
import { FillColumn, FillRow } from "@/layout";

export const CameraIcon = () => (
  <img src={"/images/app-logos/camera.png"} height={80} width={80} />
);

const FINDER_GAP = 60; // gap between phone body top and viewfinder bottom
const FINDER_ASPECT = 5 / 4; // portrait aspect ratio (w:h = 3:4)

interface FinderRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

type AppView = "camera" | "gallery";

interface OverlayProps {
  phoneBodyRef: React.RefObject<HTMLDivElement>;
  flash: boolean;
  onFinderRect: (rect: FinderRect | null) => void;
}

function ViewfinderOverlay({
  phoneBodyRef,
  flash,
  onFinderRect,
}: OverlayProps) {
  const [finder, setFinder] = useState<FinderRect | null>(null);

  useAnimationFrame(() => {
    const compute = () => {
      const body = phoneBodyRef.current;
      if (!body) {
        onFinderRect(null);
        return;
      }
      const br = body.getBoundingClientRect();

      const width = br.width;
      const height = width * FINDER_ASPECT;

      const rect: FinderRect = {
        left: br.left,
        top: br.top - FINDER_GAP - height,
        right: br.right,
        bottom: br.top - FINDER_GAP,
        width,
        height,
      };
      setFinder(rect);
      onFinderRect(rect);
    };

    compute();
    window.addEventListener("resize", compute);
    // Poll briefly after mount for layout settling
    const iv = setInterval(compute, 60);
    const t = setTimeout(() => clearInterval(iv), 600);
    return () => {
      window.removeEventListener("resize", compute);
      clearInterval(iv);
      clearTimeout(t);
    };
  });

  if (!finder) return null;

  const { left, top, right, bottom, width, height } = finder;
  const br = 14; // border-radius of the viewfinder window

  // Even-odd fill rule punches the viewfinder out cleanly
  const cutoutPath = `
    M 0 0 L ${window.innerWidth} 0 L ${window.innerWidth} ${window.innerHeight} L 0 ${window.innerHeight} Z
    M ${left + br} ${top}
    Q ${left} ${top} ${left} ${top + br}
    L ${left} ${bottom - br}
    Q ${left} ${bottom} ${left + br} ${bottom}
    L ${right - br} ${bottom}
    Q ${right} ${bottom} ${right} ${bottom - br}
    L ${right} ${top + br}
    Q ${right} ${top} ${right - br} ${top}
    Z
  `;

  return createPortal(
    <OverlayRoot>
      {/* Dim mask with SVG cutout — clean, no polygon artifacts */}
      <DimSvg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={cutoutPath} fill="rgba(0,0,0,0.65)" fillRule="evenodd" />
      </DimSvg>

      {/* Viewfinder border */}
      <ViewfinderBorder
        style={{
          left,
          top,
          width,
          height,
          borderRadius: br,
        }}
      />

      {/* Shutter flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            style={{
              position: "absolute",
              inset: 0,
              background: "white",
              zIndex: 10,
              borderRadius: br,
              left,
              top,
              width,
              height,
            }}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </OverlayRoot>,
    document.body,
  );
}

// ─── Download helper ───────────────────────────────────────────────────────────

function downloadPhoto(photo: CapturedPhoto) {
  const a = document.createElement("a");
  a.href = photo.dataUrl;
  a.download = `photo-${photo.id}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Main CameraApp ────────────────────────────────────────────────────────────

const APP_ID: CameraViewId = "phone:camera";

export const CameraApp = () => {
  const gl = useGLBridge((s) => s.gl);
  const { transitionToView } = useViewStore();
  const { addPhoto, photos, deletePhoto } = useCameraStore();

  const phoneBodyRef = useRef<HTMLDivElement>(null);
  const finderRectRef = useRef<FinderRect | null>(null);

  const [flash, setFlash] = useState(false);
  const [view, setView] = useState<AppView>("camera");
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  useEffect(() => {
    transitionToView(APP_ID);
  }, []);

  const handleFinderRect = useCallback((rect: FinderRect | null) => {
    finderRectRef.current = rect;
  }, []);

  // ── Capture: crop the WebGL canvas to the viewfinder rect ─────────────────
  const handleCapture = useCallback(() => {
    if (!gl) return;
    const finder = finderRectRef.current;
    if (!finder) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 400);

    const glCanvas = gl.domElement;
    const canvasRect = glCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Map finder viewport coords → GL canvas pixel coords
    const scaleX = glCanvas.width / canvasRect.width;
    const scaleY = glCanvas.height / canvasRect.height;
    const sx = (finder.left - canvasRect.left) * scaleX;
    const sy = (finder.top - canvasRect.top) * scaleY;
    const sw = finder.width * scaleX;
    const sh = finder.height * scaleY;

    const tmp = document.createElement("canvas");
    tmp.width = finder.width * dpr;
    tmp.height = finder.height * dpr;
    const ctx = tmp.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(glCanvas, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);

    addPhoto(tmp.toDataURL("image/png"));
  }, [gl, addPhoto]);

  // ── Lightbox helpers ───────────────────────────────────────────────────────
  const openLightbox = (id: string) => {
    setLightboxId(id);
  };

  const closeLightbox = () => {
    setLightboxId(null);
  };

  const handleDelete = useCallback(
    (id: string) => {
      deletePhoto(id);
      // If deleted photo was open in lightbox, close it
      if (lightboxId === id) setLightboxId(null);
    },
    [deletePhoto, lightboxId],
  );

  const lightboxPhoto = lightboxId
    ? photos.find((p) => p.id === lightboxId)
    : null;
  const isLightboxOpen = lightboxPhoto != null;

  return (
    <>
      {/* Viewfinder overlay — only shown in camera mode */}
      {view === "camera" && (
        <ViewfinderOverlay
          phoneBodyRef={phoneBodyRef}
          flash={flash}
          onFinderRect={handleFinderRect}
        />
      )}

      <CameraRoot ref={phoneBodyRef}>
        {/* ══ CAMERA VIEW ══════════════════════════════════════════════════ */}
        {view === "camera" && (
          <ControlRow>
            {/* Last photo thumbnail — opens gallery */}
            <GalleryThumb
              onClick={() => setView("gallery")}
              disabled={photos.length === 0}
            >
              {photos[0] ? (
                <img
                  src={photos[0].dataUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <GalleryTabIcon />
              )}
            </GalleryThumb>
            <FillRow $align="center" $justify="center">
              <ShutterButton
                onClick={handleCapture}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.6, duration: 0.2 }}
              >
                <ShutterInner />
              </ShutterButton>
            </FillRow>
          </ControlRow>
        )}

        {/* ══ GALLERY VIEW ═════════════════════════════════════════════════ */}
        {view === "gallery" && (
          <FillColumn
            style={{
              maxWidth: "300px",
              height: "420px",
              minHeight: "100px",
              overflow: "auto",
              // height: isLightboxOpen ? "340px" : "auto",
            }}
          >
            {photos.length > 0 ? (
              <PhotoGrid>
                <AnimatePresence mode="popLayout">
                  {photos.map((photo) => (
                    <PhotoThumb
                      key={photo.id}
                      layoutId={`photo-${photo.id}`}
                      onClick={() => openLightbox(photo.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <img
                        src={photo.dataUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </PhotoThumb>
                  ))}
                </AnimatePresence>
              </PhotoGrid>
            ) : (
              <FillColumn $justify="center" $align="center" style={{ flex: 1 }}>
                <AppInfo
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Noch nichts hier..
                </AppInfo>
              </FillColumn>
            )}

            {/* ── Lightbox ──────────────────────────────────────────────── */}
            <AnimatePresence>
              {isLightboxOpen && lightboxPhoto && (
                <LightboxOverlay
                  key="lightbox-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={closeLightbox}
                >
                  <motion.div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <LightboxImageWrap
                      layoutId={`photo-${lightboxPhoto.id}`}
                      transition={{
                        type: "spring",
                        bounce: 0.25,
                        visualDuration: 0.28,
                      }}
                      onClick={closeLightbox}
                    >
                      <img
                        src={lightboxPhoto.dataUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </LightboxImageWrap>

                    <FillColumn $gap={"8px"} $padding="0 1rem">
                      <IconAction
                        $variant="download"
                        onClick={() => downloadPhoto(lightboxPhoto)}
                        title="Download"
                        whileTap={{ scale: 0.9 }}
                      >
                        Download
                      </IconAction>
                      <IconAction
                        $variant="delete"
                        onClick={() => handleDelete(lightboxPhoto.id)}
                        title="Delete"
                        whileTap={{ scale: 0.9 }}
                      >
                        Löschen
                      </IconAction>
                    </FillColumn>
                  </motion.div>
                </LightboxOverlay>
              )}
            </AnimatePresence>
          </FillColumn>
        )}

        <TabPanel>
          <TabButton
            $active={view === "camera"}
            onClick={() => setView("camera")}
          >
            Kamera
          </TabButton>
          <TabButton
            $active={view === "gallery"}
            onClick={() => setView("gallery")}
          >
            Fotos
          </TabButton>
        </TabPanel>
      </CameraRoot>
    </>
  );
};

const GalleryTabIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ─── Styled components ─────────────────────────────────────────────────────────

const OverlayRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 998;
  pointer-events: none;
`;

const DimSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const ViewfinderBorder = styled.div`
  position: absolute;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.1);
  pointer-events: none;
`;

const CameraRoot = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 4px;
  position: relative;
`;

const GalleryThumb = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;

  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  margin: auto 0;

  border: 1.5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  padding: 0;
  transition:
    border-color 0.15s,
    opacity 0.15s;
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
  &:not(:disabled):hover {
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const ShutterButton = styled(motion.button)`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: 3px solid rgba(0, 0, 0, 0.75);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    > div {
      transform: scale(1.05);
    }
  }
`;

const ShutterInner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #000000;
  transition: transform 0.1s ease-out;
`;

// Gallery
const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 100%;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PhotoThumb = styled(motion.div)`
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);

  &:hover {
    img {
      transform: scale(1.15);
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.15s ease-out;
  }
`;
// Lightbox
const LightboxOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(33, 33, 33, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
`;

const LightboxImageWrap = styled(motion.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  max-height: 80%;
  padding: 16px;

  & img {
    border-radius: 10px;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const IconAction = styled(motion.button)<{ $variant?: "delete" | "download" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  width: 100%;
  padding: 0 16px;
  border-radius: 50px;
  background: ${({ $variant }) =>
    $variant === "delete"
      ? "#FF0000"
      : $variant === "download"
        ? "#4178F7"
        : "rgba(33,33,33,0.15)"};
  color: ${({ $variant }) =>
    $variant === "delete"
      ? "#ffffff"
      : $variant === "download"
        ? "#ffffff"
        : "rgba(33,33,33,1)"};
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  transition: background 0.15s;
  &:hover {
    background: ${({ $variant }) =>
      $variant === "delete"
        ? "#ff0000e1"
        : $variant === "download"
          ? "#4178f7d4"
          : "rgba(33,33,33,0.08)"};
  }
`;
