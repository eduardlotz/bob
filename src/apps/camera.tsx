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
import { TabButton, TabPanel } from "./ui";
import { FillRow } from "@/layout";

// ─── Camera icon ───────────────────────────────────────────────────────────────

export const CameraIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3736_1492)">
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="#CEAE91"
      />
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="url(#paint0_radial_3736_1492)"
      />
    </g>
    <g filter="url(#filter1_ii_3736_1492)">
      <path
        d="M50.4707 23.75C56.8431 23.75 62.7124 27.2141 65.792 32.793L66.1602 33.46C67.2142 33.5488 68.2687 33.6394 69.3223 33.7305C73.8013 34.1177 77.488 37.5689 78.1445 42.0166C78.7389 46.0465 79.2754 50.1987 79.2754 54.4375C79.2753 58.6759 78.7389 62.8259 78.1445 66.8555C77.4883 71.3034 73.8015 74.7553 69.3223 75.1426C62.8951 75.6976 56.4583 76.25 50.002 76.25C43.5456 76.25 37.1089 75.6976 30.6816 75.1426C26.2018 74.7557 22.5128 71.3037 21.8564 66.8555C21.2619 62.8259 20.7267 58.6758 20.7266 54.4375C20.7266 50.1987 21.2618 46.0465 21.8564 42.0166C22.513 37.5685 26.202 34.1173 30.6816 33.7305C31.7289 33.64 32.783 33.5493 33.8428 33.46L34.2109 32.793C37.2906 27.2141 43.1598 23.75 49.5322 23.75H50.4707ZM50.0029 42.5176C43.2583 42.5177 39.464 46.3121 39.4639 53.0566C39.464 59.8013 43.2583 63.5956 50.0029 63.5957C56.7476 63.5956 60.5419 59.8013 60.542 53.0566C60.5419 46.3121 56.7475 42.5177 50.0029 42.5176ZM69.3789 38.75C68.3434 38.75 67.5039 39.5895 67.5039 40.625C67.5039 41.6605 68.3434 42.5 69.3789 42.5C70.4144 42.5 71.2539 41.6605 71.2539 40.625C71.2539 39.5895 70.4144 38.75 69.3789 38.75Z"
        fill="url(#paint1_radial_3736_1492)"
      />
    </g>
    <defs>
      <filter
        id="filter0_ii_3736_1492"
        x={0}
        y={-2.5}
        width={100}
        height={102.5}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3736_1492"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.866667 0 0 0 0 0.278431 0 0 0 0 0.329412 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3736_1492"
          result="effect2_innerShadow_3736_1492"
        />
      </filter>
      <filter
        id="filter1_ii_3736_1492"
        x={20.7266}
        y={21.4628}
        width={58.5469}
        height={54.7872}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.28723} />
        <feGaussianBlur stdDeviation={3.43085} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3736_1492"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.14362} />
        <feGaussianBlur stdDeviation={1.14362} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.8 0 0 0 0 0.729412 0 0 0 0 0.929412 0 0 0 0.68 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3736_1492"
          result="effect2_innerShadow_3736_1492"
        />
      </filter>
      <radialGradient
        id="paint0_radial_3736_1492"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(50 50) rotate(90) scale(50 127.014)"
      >
        <stop stopColor="#C5B1EC" />
        <stop offset={1} stopColor="#EDEAF2" />
      </radialGradient>
      <radialGradient
        id="paint1_radial_3736_1492"
        cx={0}
        cy={0}
        r={1}
        gradientTransform="matrix(-0.00203496 36.0174 -73.0896 -0.0022773 50.0029 40.2326)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FBD4EC" />
        <stop offset={1} stopColor="#FDFBFC" />
      </radialGradient>
    </defs>
  </svg>
);

// ─── Constants ─────────────────────────────────────────────────────────────────

const FINDER_GAP = 60; // gap between phone body top and viewfinder bottom
const FINDER_ASPECT = 5 / 4; // portrait aspect ratio (w:h = 3:4)

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FinderRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

type AppView = "camera" | "gallery";

// ─── Viewfinder overlay ────────────────────────────────────────────────────────

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
        <AnimatePresence mode="popLayout" initial={false}>
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
            <div
              style={{
                width: "100%",
                // position: "relative",
                maxWidth: "300px",
                height: "420px",
                overflow: "auto",
              }}
            >
              {photos.length === 0 ? (
                <EmptyGallery>
                  <GalleryTabIcon />
                  <span>Noch nichts hier...</span>
                </EmptyGallery>
              ) : (
                <PhotoGrid>
                  {photos.map((photo) => (
                    <PhotoThumb
                      key={photo.id}
                      layoutId={`photo-${photo.id}`}
                      onClick={() => openLightbox(photo.id)}
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
                </PhotoGrid>
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

                      <LightboxActions>
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
                      </LightboxActions>
                    </motion.div>
                  </LightboxOverlay>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>

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

const CameraRoot = styled.div`
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
  gap: 3px;
  width: 100%;
  overflow-y: auto;
  border-radius: 10px;
  overflow-x: hidden;
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

const EmptyGallery = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
`;

// Lightbox
const LightboxOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 10px;
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

const LightboxTimestamp = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 50px;
  white-space: nowrap;
  pointer-events: none;
`;

const LightboxActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const IconAction = styled(motion.button)<{ $variant?: "delete" | "download" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
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
