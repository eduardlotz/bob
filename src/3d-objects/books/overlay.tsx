import { Book, BOOK_BY_ID, useAppStore, useBooksStore } from "@/store";
import { create } from "zustand";
import { _moveCameraToStack } from "./utils";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BackBtn,
  BookItemMeta,
  BookListItem,
  ChevronIcon,
  CloseBtn,
  DotsRow,
  FloatArrow,
  FooterBtn,
  FooterNav,
  HeaderTitle,
  Heart,
  HeartsRow,
  HeroAuthor,
  HeroRow,
  HeroTitle,
  Panel,
  PanelFooter,
  PanelHeader,
  PanelScroll,
  ReviewText,
  Rule,
  SectionLabel,
  TagPill,
  TagsWrap,
} from "./components";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { memo, useCallback, useMemo } from "react";
import { StackData, STACKS, TAG_PAL } from ".";
import { CoverCanvas } from "./bookCover";

// ── Store ─────────────────────────────────────────────────────────────────
// Stripped down: we only need to know if the panel is open.
// Stack idx is purely a camera anchor — derived from the focused book.

export interface BookOverlayStore {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

export const useBookOverlay = create<BookOverlayStore>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => {
    useBooksStore.getState().clearFocus();
    set({ isOpen: false });
  },
}));

export const OVERLAY_ROOT_ID = "motion-root";

// ── Helper: find which stack a global book index belongs to ───────────────
function stackForBookIdx(booksIdx: number): StackData | null {
  return (
    STACKS.find(
      (s) => booksIdx >= s.startIdx && booksIdx < s.startIdx + s.books.length,
    ) ?? null
  );
}

// ── BookContent ───────────────────────────────────────────────────────────
const SLIDE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.17 },
};

const BookContent = memo(
  ({ book, stack }: { book: Book; stack: StackData }) => {
    const navigateToBookId = useBooksStore((s) => s.navigateToBookId);
    const tags: string[] = (book as any).tags ?? [];

    return (
      <motion.div
        {...SLIDE_VARIANTS}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <PanelScroll>
          <HeroRow>
            <div
              style={{
                flexShrink: 0,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(0,0,0,.17)",
              }}
            >
              <CoverCanvas book={book} w={72} h={108} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <HeartsRow>
                {Array.from({ length: 5 }, (_, i) => (
                  <Heart key={i} $on={i < book.rating}>
                    ♥
                  </Heart>
                ))}
              </HeartsRow>
              <HeroTitle>{book.title}</HeroTitle>
              <HeroAuthor>{book.author}</HeroAuthor>
            </div>
          </HeroRow>

          {(tags.length > 0 || book.favorite) && (
            <>
              <Rule />
              <SectionLabel>Tags</SectionLabel>
              <TagsWrap>
                {tags.map((t, i) => {
                  const p = TAG_PAL[i % TAG_PAL.length];
                  return (
                    <TagPill key={t} $bg={p.bg} $fg={p.fg} $bd={p.bd}>
                      {t}
                    </TagPill>
                  );
                })}
                {book.favorite && (
                  <TagPill
                    $bg={TAG_PAL[4].bg}
                    $fg={TAG_PAL[4].fg}
                    $bd={TAG_PAL[4].bd}
                  >
                    ♥ Favorit
                  </TagPill>
                )}
              </TagsWrap>
            </>
          )}

          <Rule />
          <SectionLabel>Rezension</SectionLabel>
          <ReviewText>{book.review}</ReviewText>

          {book.related.length > 0 && (
            <>
              <Rule />
              <SectionLabel>Ähnliche Themen</SectionLabel>
              {book.related.map((rid) => {
                const rb = BOOK_BY_ID.get(rid);
                return rb ? (
                  <BookListItem key={rid} onClick={() => navigateToBookId(rid)}>
                    <div
                      style={{
                        flexShrink: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <CoverCanvas book={rb} w={32} h={48} />
                    </div>
                    <BookItemMeta>
                      <span className="title">{rb.title}</span>
                      <span className="author">{rb.author}</span>
                    </BookItemMeta>
                  </BookListItem>
                ) : null;
              })}
            </>
          )}
        </PanelScroll>
      </motion.div>
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// BookPortalOverlay — DOM overlay, mount OUTSIDE <Canvas>
//
// Design:
//  • No "root" or "stack list" page — stacks are purely 3-D camera anchors.
//  • Panel is visible only when a book is focused.
//  • activeStack is always derived from focusedIdx (not from a separate
//    stackIdx state) so clicking any book in any stack works correctly.
//  • Prev/next arrows navigate within the active stack.
//  • When a new book is focused the camera moves to its stack automatically.
// ═══════════════════════════════════════════════════════════════════════════

export const BookPortalOverlay = () => {
  const { isMobile } = useAppStore();
  const focusedBook = useBooksStore((s) => s.focusedBook);
  const focusedIdx = useBooksStore((s) => s.focusedIdx);

  // ── Derive active stack from the focused book's global index ─────────────
  const activeStack = useMemo<StackData>(() => {
    if (focusedIdx !== null) {
      const s = stackForBookIdx(focusedIdx);
      if (s) return s;
    }
    return STACKS[0];
  }, [focusedIdx]);

  // Move camera to the stack whenever the active stack changes
  // (triggered by focusedIdx changing to a book in a different stack)
  const activeStackIdx = activeStack.stackIdx;
  useMemo(() => {
    if (focusedIdx !== null) {
      _moveCameraToStack(activeStackIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStackIdx]);

  const isOpen = !!focusedBook;

  // ── Book position within its stack ───────────────────────────────────────
  const posInStack =
    focusedIdx !== null ? focusedIdx - activeStack.startIdx : 0;

  const prevBook = useCallback(() => {
    const next =
      ((posInStack - 1 + activeStack.books.length) % activeStack.books.length) +
      activeStack.startIdx;
    useBooksStore.getState().setFocused(next);
  }, [posInStack, activeStack]);

  const nextBook = useCallback(() => {
    const next =
      ((posInStack + 1) % activeStack.books.length) + activeStack.startIdx;
    useBooksStore.getState().setFocused(next);
  }, [posInStack, activeStack]);

  const onClose = useCallback(() => {
    useBooksStore.getState().clearFocus();
  }, []);

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  const content = (
    <>
      <AnimatePresence>
        {isOpen && focusedBook && (
          <Panel
            key="panel"
            $mobile={isMobile}
            initial={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { x: 80, opacity: 0, filter: "blur(6px)" }
            }
            animate={
              isMobile
                ? { y: "0%", opacity: 1 }
                : { x: 0, opacity: 1, filter: "blur(0px)" }
            }
            exit={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { x: 80, opacity: 0, filter: "blur(6px)" }
            }
            transition={{ type: "spring", bounce: 0.2, duration: 0.42 }}
          >
            <PanelHeader>
              {/* Stack name as breadcrumb label — no navigation, just context */}
              <HeaderTitle>{activeStack.def.label}</HeaderTitle>
              <CloseBtn onClick={onClose} aria-label="Schließen">
                ×
              </CloseBtn>
            </PanelHeader>

            <AnimatePresence mode="wait" initial={false}>
              <BookContent
                key={`book-${focusedBook.id}`}
                book={focusedBook}
                stack={activeStack}
              />
            </AnimatePresence>

            <PanelFooter>
              <FooterNav>
                <FooterBtn onClick={prevBook}>
                  <ChevronLeftIcon />
                </FooterBtn>

                {/* Dots — one per book in the current stack */}
                <DotsRow>
                  {Array.from({ length: activeStack.books.length }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === posInStack ? "18px" : "6px",
                        opacity: i === posInStack ? 1 : 0.18,
                        background: i === posInStack ? "#111" : "#aaa",
                      }}
                      style={{ height: 6, borderRadius: 3 }}
                    />
                  ))}
                </DotsRow>

                <FooterBtn onClick={nextBook}>
                  <ChevronRightIcon />
                </FooterBtn>
              </FooterNav>
            </PanelFooter>
          </Panel>
        )}
      </AnimatePresence>

      {/* Floating prev/next arrows — only shown when a book is focused */}
      <AnimatePresence>
        {isOpen && (
          <>
            <FloatArrow
              key="prev"
              $side="left"
              $mobile={isMobile}
              onClick={prevBook}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <ChevronLeftIcon />
            </FloatArrow>
            <FloatArrow
              key="next"
              $side="right"
              $mobile={isMobile}
              onClick={nextBook}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <ChevronRightIcon />
            </FloatArrow>
          </>
        )}
      </AnimatePresence>
    </>
  );

  if (!root) return null;
  return createPortal(content, root);
};
