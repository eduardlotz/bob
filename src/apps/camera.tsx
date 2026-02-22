import { CameraViewId, useViewStore } from "@/store";

import styled from "styled-components";
import { AnimatePresence, motion } from "motion/react";
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

const FINDER_HEIGHT = 240; // px — height of the viewfinder window
const FINDER_GAP = 12; // px — gap between bottom of finder and top of phone body
const FINDER_INSET = 0; // px — horizontal inset from phone body edges (0 = same width)

interface OverlayProps {
  phoneBodyRef: React.RefObject<HTMLDivElement>;
  flash: boolean;
}

function ViewfinderOverlay({ phoneBodyRef, flash }: OverlayProps) {
  const [finder, setFinder] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const compute = () => {
      const body = phoneBodyRef.current;
      if (!body) return;
      const br = body.getBoundingClientRect();

      // Viewfinder sits directly above the phone body, same width (± inset)
      setFinder(
        new DOMRect(
          br.left + FINDER_INSET,
          br.top - FINDER_GAP - FINDER_HEIGHT,
          br.width - FINDER_INSET * 2,
          FINDER_HEIGHT,
        ),
      );
    };

    compute();
    window.addEventListener("resize", compute);
    const iv = setInterval(compute, 80);
    const t = setTimeout(() => clearInterval(iv), 700);
    return () => {
      window.removeEventListener("resize", compute);
      clearInterval(iv);
      clearTimeout(t);
    };
  }, [phoneBodyRef]);

  if (!finder) return null;

  const { left, top, right, bottom, width, height } = finder;
  const cx = left + width / 2;
  const cy = top + height / 2;

  // Punch the finder rect out of the dim layer
  const cutout = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    0% 0%,
    ${left}px   ${top}px,
    ${left}px   ${bottom}px,
    ${right}px  ${bottom}px,
    ${right}px  ${top}px,
    ${left}px   ${top}px,
    0% 0%
  )`;

  return createPortal(
    <OverlayRoot>
      <DimLayer style={{ clipPath: cutout }} />

      {/* Shutter flash — fullscreen white */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            style={{
              position: "absolute",
              inset: 0,
              background: "white",
              zIndex: 10,
            }}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Corner brackets */}
      {(
        [
          { top: top + 8, left: left + 8, bw: "2px 0 0 2px", br: "5px 0 0 0" },
          {
            top: top + 8,
            left: right - 28,
            bw: "2px 2px 0 0",
            br: "0 5px 0 0",
          },
          {
            top: bottom - 28,
            left: left + 8,
            bw: "0 0 2px 2px",
            br: "0 0 0 5px",
          },
          {
            top: bottom - 28,
            left: right - 28,
            bw: "0 0 2px 2px",
            br: "0 0 5px 0",
          },
        ] as const
      ).map((s, i) => (
        <CornerBracket
          key={i}
          style={{
            top: s.top,
            left: s.left,
            borderWidth: s.bw,
            borderRadius: s.br,
          }}
        />
      ))}

      {/* Reticle */}
      <Reticle style={{ left: cx - 16, top: cy - 16 }}>
        <ReticleH />
        <ReticleV />
      </Reticle>
    </OverlayRoot>,
    document.body,
  );
}

interface CameraAppProps {
  onOpenGallery: () => void;
}

const APP_ID: CameraViewId = "phone:camera";

export const CameraApp = ({ onOpenGallery }: CameraAppProps) => {
  const gl = useGLBridge((s) => s.gl);
  const { setViewMode, transitionToView } = useViewStore();
  const { addPhoto, photos } = useCameraStore();

  const phoneBodyRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    transitionToView(APP_ID);
  }, []);

  // useEffect(() => {
  //   setViewMode("object");
  //   return () => setViewMode("fixed");
  // }, [setViewMode]);

  const handleCapture = useCallback(() => {
    if (!gl) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
    addPhoto(gl.domElement.toDataURL("image/png"));
  }, [gl, addPhoto]);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setLightboxIndex((i) => (i! + dir + photos.length) % photos.length);
    },
    [photos.length],
  );

  const isLightboxOpen = lightboxIndex !== null && photos.length > 0;

  return (
    <>
      {!isLightboxOpen && (
        <ViewfinderOverlay phoneBodyRef={phoneBodyRef} flash={flash} />
      )}

      {/* Controls — only as tall as needed */}
      <CameraRoot ref={phoneBodyRef}>
        <AnimatePresence mode="popLayout">
          {isLightboxOpen ? (
            // ── Lightbox ──────────────────────────────────────────────────────
            <motion.div
              key="lightbox"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", bounce: 0.3, visualDuration: 0.25 }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <LightboxFrame>
                <AnimatePresence custom={direction} mode="popLayout">
                  <motion.img
                    key={photos[lightboxIndex].id}
                    layoutId={`photo-${photos[lightboxIndex].id}`}
                    src={photos[lightboxIndex].dataUrl}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      visualDuration: 0.3,
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                      display: "block",
                      cursor: "grab",
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.15}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50) navigate(1);
                      else if (info.offset.x > 50) navigate(-1);
                    }}
                  />
                </AnimatePresence>
                <IndexPill>
                  {lightboxIndex + 1} / {photos.length}
                </IndexPill>
              </LightboxFrame>

              <LightboxControls>
                <NavButton
                  onClick={() => navigate(-1)}
                  disabled={photos.length <= 1}
                >
                  <Chevron dir="left" />
                </NavButton>
                <CloseButton onClick={() => setLightboxIndex(null)}>
                  <XIcon /> Close
                </CloseButton>
                <NavButton
                  onClick={() => navigate(1)}
                  disabled={photos.length <= 1}
                >
                  <Chevron dir="right" />
                </NavButton>
              </LightboxControls>
            </motion.div>
          ) : (
            // ── Camera controls ───────────────────────────────────────────────
            <motion.div
              key="controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: "100%" }}
            >
              <ControlRow>
                <GalleryButton
                  onClick={() => photos.length > 0 && setLightboxIndex(0)}
                  disabled={photos.length === 0}
                >
                  {photos[0] ? (
                    <motion.img
                      layoutId={`photo-${photos[0].id}`}
                      src={photos[0].dataUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <GalleryIconSvg />
                  )}
                  {photos.length > 0 && (
                    <PhotoBadge>
                      {photos.length > 9 ? "9+" : photos.length}
                    </PhotoBadge>
                  )}
                </GalleryButton>

                <ShutterButton
                  onClick={handleCapture}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", bounce: 0.6, duration: 0.25 }}
                >
                  <ShutterInner />
                </ShutterButton>

                {/* Balance spacer */}
                <div style={{ width: 44 }} />
              </ControlRow>
            </motion.div>
          )}
        </AnimatePresence>
      </CameraRoot>
    </>
  );
};

// ─── Animation variants ────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    {dir === "left" ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

const XIcon = () => (
  <svg
    width="12"
    height="12"
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

const GalleryIconSvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// ─── Styled ────────────────────────────────────────────────────────────────────

const OverlayRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 998;
  pointer-events: none;
`;
const DimLayer = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
`;
const CornerBracket = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.55);
`;
const Reticle = styled.div`
  position: absolute;
  width: 32px;
  height: 32px;
`;
const ReticleH = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%);
`;
const ReticleV = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-50%);
`;

// Phone body — only as tall as its content
const CameraRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 4px;
`;

const GalleryButton = styled.button`
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
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
const PhotoBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f87171;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;
const ShutterButton = styled(motion.button)`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 3px solid rgba(255, 255, 255, 0.75);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
const ShutterInner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
`;
const LightboxFrame = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
`;
const IndexPill = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 50px;
  pointer-events: none;
  white-space: nowrap;
`;
const LightboxControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
  &:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.16);
  }
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;
const CloseButton = styled.button`
  flex: 1;
  height: 36px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 255, 255, 0.13);
  }
`;
