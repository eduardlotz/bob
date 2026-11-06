import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BOOKS, BOOK_BY_ID, ROUTE_PATHS, useAppStore, useCoreStore, useViewStore } from "@/store";
import type { CameraViewId } from "@/store/viewStore";
import { useLibraryStore } from "@/store/exploration";
import { LIBRARY_MEDIA_ENABLED } from "@/store/config/library";
import { useI18n } from "@/i18n";
import { libraryMedia } from "@/content/libraryMedia";
import { BookDetailsPanel } from "@/3d-objects/books/overlay";
import { TemplateCoverPreview } from "@/3d-objects/TemplateCover";
import { explorationMessages } from "./exploration.messages";
import { ExplorationButton, ExplorationPanel, ExplorationPanelHeader } from "./ExplorationUI";

export default function Literature() {
  const { locale, messages } = useI18n();
  const copy = explorationMessages[locale];
  const { status, bookId, media, mediaIndex, playingVideo, openBook, openMedia, playVideo, reset } = useLibraryStore();
  const currentView = useViewStore(state => state.currentView);
  const transitionToView = useViewStore(state => state.transitionToView);
  const showOptions = useAppStore(state => state.showOptions);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 759px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 759px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const allowed = useCoreStore(state => state.checkUnlockedRoutes(ROUTE_PATHS.LITERATURE));
  const hydrated = useCoreStore(state => state.isHydrated);
  const ready = useCoreStore(state => state.isReady);
  const navigate = useNavigate();
  const hidden = showOptions || currentView === "navigation" || currentView.startsWith("phone:") || currentView === "shop:preview" || !ready;
  const book = bookId === null ? null : BOOK_BY_ID.get(bookId);
  const entries = media ? libraryMedia[media] : [];
  const entry = entries[mediaIndex];

  useEffect(() => { document.title = messages.routeTitles.library; }, [messages.routeTitles.library]);
  useEffect(() => { if (hydrated && !allowed) navigate(ROUTE_PATHS.HOME, { replace: true }); }, [hydrated, allowed, navigate]);
  useEffect(() => () => useLibraryStore.getState().reset(), []);
  useEffect(() => { if (!LIBRARY_MEDIA_ENABLED && media) reset(); }, [media, reset]);
  useEffect(() => {
    if (!allowed || hidden) return;
    const target = LIBRARY_MEDIA_ENABLED && media ? `library:${media}` : status ? `library:${status}` : "library";
    if (currentView !== target) void transitionToView(target as CameraViewId);
  }, [status, media, currentView, allowed, hidden, transitionToView]);
  useEffect(() => {
    if (!book || hidden) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      useLibraryStore.getState().navigateBook(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [book, hidden]);
  if (!allowed || hidden) return null;
  const shelfBooks = status ? BOOKS.filter(candidate => candidate.status === status) : [];
  return <>
    <AnimatePresence mode="wait">
      {book ? <BookDetailsPanel key="focused-book" book={book} isMobile={mobile}
        posInStack={shelfBooks.findIndex(candidate => candidate.id === book.id)} stackSize={shelfBooks.length}
        onPrev={() => useLibraryStore.getState().navigateBook(-1)} onNext={() => useLibraryStore.getState().navigateBook(1)}
        onClose={() => openBook(null)} onSelectBook={openBook} compact /> : null}
      {LIBRARY_MEDIA_ENABLED && media && entry && <ExplorationPanel key={`media-${media}-${mediaIndex}`} aria-label={entry.title}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <ExplorationPanelHeader closeLabel={copy.close} onClose={reset}>{media === "blogs" ? copy.blogs : copy.videos} · {mediaIndex + 1}/{entries.length}</ExplorationPanelHeader>
        <h2>{entry.title}</h2><p>{copy.author} {entry.author}{entry.durationMinutes ? ` · ${entry.durationMinutes} min` : ""}</p>
        {media === "videos" && !playingVideo && <ExplorationButton onClick={playVideo}>{copy.play}</ExplorationButton>}
        <ExplorationButton as="a" href={entry.url} target="_blank" rel="noopener noreferrer">{media === "blogs" ? copy.read : copy.watch}</ExplorationButton>
        <div style={{ display: "flex", gap: 8 }}>
          <ExplorationButton onClick={() => openMedia(media, (mediaIndex + entries.length - 1) % entries.length)}>← {copy.previous}</ExplorationButton>
          <ExplorationButton onClick={() => openMedia(media, (mediaIndex + 1) % entries.length)}>{copy.next} →</ExplorationButton>
        </div>
        {media === "blogs" && <TemplateCoverPreview data={{ title: entry.title, author: entry.author, accent: ["#6d8b77", "#ac765f", "#6f8da4"][mediaIndex % 3] }} />}
      </ExplorationPanel>}
    </AnimatePresence>
  </>;
}
