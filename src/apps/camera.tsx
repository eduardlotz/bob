import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { useCameraStore, useViewStore, type CapturedPhoto } from "@/store";
import { isCameraFull, MAX_CAMERA_PHOTOS, type PhotoSaveResult } from "@/store/core/camera";
import { CameraPortal } from "@/components/CameraPortal";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useI18n } from "@/i18n";
import { PHOTO_VIEWFINDER } from "@/store/config/camera";

export const CameraIcon = () => <img src="/images/app-logos/camera.png" height={80} width={80} alt="" />;

function downloadPhoto(photo: CapturedPhoto) {
  const link = document.createElement("a");
  link.href = photo.dataUrl;
  link.download = `photo-${photo.id}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const CameraApp = () => {
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion();
  const { messages } = useI18n();
  const text = messages.camera;
  const { currentView, transitionToView } = useViewStore();
  const { photos, addPhoto, deletePhoto } = useCameraStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryButtonRef = useRef<HTMLButtonElement>(null);
  const photoButtons = useRef(new Map<string, HTMLButtonElement>());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Exclude<PhotoSaveResult, "saved"> | null>(null);
  const active = isPresent && currentView === "phone:photo";
  const full = isCameraFull(photos);
  const captureBlocked = full || error === "full";
  const lightboxPhoto = photos.find(photo => photo.id === lightboxId);
  const entrance = { opacity: 0, scale: reducedMotion ? 1 : 0.96 };
  const transition = { duration: reducedMotion ? 0 : 0.22, ease: "easeOut" as const };

  useEffect(() => {
    if (!isPresent) return;
    const framePhoto = () => { void transitionToView("phone:photo"); };
    framePhoto();
    window.addEventListener("resize", framePhoto);
    return () => window.removeEventListener("resize", framePhoto);
  }, [isPresent, transitionToView]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const closePhoto = useCallback(() => {
    if (lightboxId) photoButtons.current.get(lightboxId)?.focus();
    setLightboxId(null);
  }, [lightboxId]);

  const closeGallery = useCallback(() => {
    setLightboxId(null);
    setGalleryOpen(false);
    galleryButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!active || !galleryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      if (lightboxId) closePhoto(); else closeGallery();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, galleryOpen, lightboxId, closePhoto, closeGallery]);

  const capture = () => {
    if (!ready || !active || galleryOpen || !canvasRef.current || captureBlocked) return;
    try {
      const result = addPhoto(canvasRef.current.toDataURL("image/png"));
      if (result !== "saved") { setError(result); return; }
      setError(null);
      setFlash(true);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 300);
    } catch { setError("storage-error"); }
  };

  return (
    <CameraRoot data-camera-app>
      <PreviewLayer initial={entrance}
        animate={{ opacity: galleryOpen ? 0 : 1, scale: galleryOpen && !reducedMotion ? 0.96 : 1 }}
        transition={transition} aria-hidden={galleryOpen} inert={galleryOpen || !active}>
        <CameraPortal canvasRef={canvasRef} active={active && !galleryOpen} onReady={setReady} />
        <AnimatePresence>
          {flash && <Flash key="flash" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />}
        </AnimatePresence>
        <ShutterButton $variant="red" onClick={capture} disabled={!ready || captureBlocked}
          aria-label={text.capture} title={full ? text.gallery.full : text.capture}
          whileTap={{ scale: 0.94 }}>
          <ShutterRing />
        </ShutterButton>
      </PreviewLayer>

      <AnimatePresence>
        {galleryOpen && (
          <GalleryLayer key="gallery" initial={entrance} animate={{ opacity: 1, scale: 1 }} exit={entrance}
            transition={transition} aria-label={text.gallery.label}>
            <GalleryScroll inert={!!lightboxPhoto} aria-hidden={!!lightboxPhoto}>
              {photos.length ? <PhotoGrid>
                <AnimatePresence initial={false}>
                  {photos.map((photo, index) => <PhotoThumb key={photo.id} layout
                    ref={element => { if (element) photoButtons.current.set(photo.id, element); else photoButtons.current.delete(photo.id); }}
                    aria-label={`${text.gallery.photo} ${index + 1}`} onClick={() => setLightboxId(photo.id)}
                    initial={entrance} animate={{ opacity: 1, scale: 1 }} exit={entrance}>
                    <img src={photo.dataUrl} alt="" loading="lazy" />
                  </PhotoThumb>)}
                </AnimatePresence>
              </PhotoGrid> : <EmptyGallery>{text.gallery.empty}</EmptyGallery>}
            </GalleryScroll>
            <GalleryFade />
            <PhotoCount>{photos.length} / {MAX_CAMERA_PHOTOS}</PhotoCount>
          </GalleryLayer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxPhoto && galleryOpen && (
          <Lightbox key="photo-focus" role="dialog" aria-modal="true" aria-label={text.gallery.focus}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}
            onClick={closePhoto}
            onKeyDown={event => {
              if (event.key !== "Tab") return;
              const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
              const next = buttons.indexOf(document.activeElement as HTMLButtonElement) + (event.shiftKey ? -1 : 1);
              event.preventDefault();
              buttons[(next + buttons.length) % buttons.length]?.focus();
            }}>
            <FocusContent initial={entrance} animate={{ opacity: 1, scale: 1 }} exit={entrance} transition={transition}>
              <FocusImage src={lightboxPhoto.dataUrl} alt={text.gallery.focus} />
              <FocusActions onClick={event => event.stopPropagation()}>
                <PhotoAction $variant="blue" autoFocus onClick={() => downloadPhoto(lightboxPhoto)}>{text.download}</PhotoAction>
                <PhotoAction $variant="red" onClick={() => {
                  if (deletePhoto(lightboxPhoto.id)) { setError(null); setLightboxId(null); galleryButtonRef.current?.focus(); }
                  else setError("storage-error");
                }}>{text.delete}</PhotoAction>
              </FocusActions>
              <FocusClose $variant="white" aria-label={text.gallery.closePhoto} onClick={closePhoto}><CloseIcon /></FocusClose>
            </FocusContent>
          </Lightbox>
        )}
      </AnimatePresence>

      <CornerButton ref={galleryButtonRef} $variant="white" aria-expanded={galleryOpen}
        aria-label={galleryOpen ? text.gallery.close : text.gallery.label}
        onClick={() => { if (galleryOpen) closeGallery(); else setGalleryOpen(true); }}
        inert={!!lightboxPhoto} aria-hidden={!!lightboxPhoto} whileTap={{ scale: 0.94 }}>
        <AnimatePresence mode="wait" initial={false}>
          <CornerContent key={galleryOpen ? "close" : "thumb"} initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={transition}>
            {galleryOpen ? <CloseIcon /> : photos[0] ? <img src={photos[0].dataUrl} alt="" /> : <GalleryIcon />}
          </CornerContent>
        </AnimatePresence>
      </CornerButton>
      {(full || error) && <StorageNotice role="status">{error === "storage-error" ? text.gallery.storageError : text.gallery.full}</StorageNotice>}
    </CameraRoot>
  );
};

const CloseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>;
const GalleryIcon = () => <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8" cy="8" r="1" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>;

const CameraRoot = styled.div`
  position: relative;
  width: min(${PHOTO_VIEWFINDER.maxWidth}px, calc(100vw - ${PHOTO_VIEWFINDER.viewportPadding}px), calc((100dvh - ${PHOTO_VIEWFINDER.reservedHeight}px) * 0.75));
  height: min(${PHOTO_VIEWFINDER.maxHeight}px, calc((100vw - ${PHOTO_VIEWFINDER.viewportPadding}px) / 0.75), calc(100dvh - ${PHOTO_VIEWFINDER.reservedHeight}px));
  min-height: 120px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 18px;
  isolation: isolate;
  background: #b9b3c9;
`;
const PreviewLayer = styled(motion.div)`position: absolute; inset: 0;`;
const Flash = styled(motion.div)`position: absolute; inset: 0; background: white; pointer-events: none;`;
const ShutterButton = styled(FloatingActionButton)`
  position: absolute; bottom: 16px; left: 50%; margin-left: -27px;
  width: 54px; height: 54px; border-radius: 22px; padding: 0;
`;
const ShutterRing = styled.span`
  position: absolute; inset: 1px; border: 3px solid white; border-radius: 17px;
`;
const CornerButton = styled(FloatingActionButton)`
  position: absolute; z-index: 3; left: 12px; bottom: 14px;
  padding: 0; width: 56px; height: 58px; border-radius: 19px;
  border-color: #e8e8e8; --floating-button-edge: #e8e8e8;
  overflow: hidden;
`;
const CornerContent = styled(motion.span)`
  width: 100%; height: 100%; display: grid; place-items: center;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const GalleryLayer = styled(motion.div)`position: absolute; inset: 0; background: #f2f2f3;`;
const GalleryScroll = styled.div`
  position: absolute; inset: 0; overflow-y: auto; scrollbar-width: none;
  padding: 6px 6px 92px; overscroll-behavior: contain;
  &::-webkit-scrollbar { display: none; }
`;
const PhotoGrid = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;`;
const PhotoThumb = styled(motion.button)`
  padding: 0; overflow: hidden; border-radius: 14px; aspect-ratio: 1;
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  &:focus-visible { outline: 3px solid #4178f7; outline-offset: -3px; }
`;
const EmptyGallery = styled.p`
  display: grid; place-items: center; height: 100%; color: #78758d; font-size: 0.9rem; font-weight: 700;
`;
const GalleryFade = styled.div`
  position: absolute; inset: auto 0 0; height: 90px; pointer-events: none;
  background: linear-gradient(transparent, #f2f2f3 80%);
`;
const PhotoCount = styled.span`
  position: absolute; right: 16px; bottom: 25px; color: #78758d; font-size: 0.75rem; font-weight: 800;
`;
const Lightbox = styled(motion.div)`
  position: absolute; inset: 0; z-index: 4; padding: 16px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(242,242,243,0.6); backdrop-filter: blur(6px);
`;
const FocusContent = styled(motion.div)`
  position: relative; width: 100%; height: 100%; min-height: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
`;
const FocusImage = styled.img`
  display: block; min-height: 0; max-height: calc(100% - 64px); max-width: 100%;
  width: auto; height: auto; object-fit: contain; border-radius: 16px;
`;
const FocusActions = styled.div`display: flex; justify-content: center; flex-shrink: 0; gap: 16px; width: 100%; padding-bottom: 6px;`;
const PhotoAction = styled(FloatingActionButton)`padding: 12px 16px; font-size: 0.85rem; border-radius: 24px;`;
const FocusClose = styled(FloatingActionButton)`
  position: absolute; top: -8px; right: -8px; width: 32px; height: 32px; padding: 0; border-radius: 13px;
  svg { width: 16px; height: 16px; }
`;
const StorageNotice = styled.p`
  position: absolute; z-index: 5; top: 8px; left: 8px; right: 8px; padding: 8px 12px;
  border-radius: 12px; background: rgba(255,255,255,0.94); color: #212026;
  text-align: center; font-size: 0.7rem; line-height: 1.3; font-weight: 700; pointer-events: none;
`;
