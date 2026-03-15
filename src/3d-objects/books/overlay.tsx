import { Book, BOOK_BY_ID, useAppStore, useBooksStore } from "@/store";
import { create } from "zustand";
import { _moveCameraToStack } from "./utils";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BookItemMeta,
  BookListItem,
  CloseBtn,
  HeartsContainer,
  HeroAuthor,
  HeroRow,
  HeroTitle,
  Panel,
  PanelScroll,
  ReviewText,
  Rule,
  SectionLabel,
  TagPill,
  TagsWrap,
} from "./components";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { StackData, STACKS, STACKS_BY_STATUS, STATUS_LABELS, TAG_PAL } from ".";
import { CoverCanvas } from "./bookCover";
import { CloseIcon } from "@/icons/close";
import { HeartIcon } from "@/icons/heart";
import { FillColumn, HugColumn, HugRow } from "@/layout";
import styled from "styled-components";

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function stackForBookIdx(booksIdx: number | null): StackData | null {
  if (booksIdx === null) return null;
  return STACKS.find((s) => s.bookIndices.includes(booksIdx)) ?? null;
}

const STATUS_COLORS: Record<
  Book["status"],
  { bg: string; fg: string; bd: string }
> = {
  "have-read": {
    bg: "rgba(52,199,89,.13)",
    fg: "#1D7A38",
    bd: "rgba(52,199,89,.3)",
  },
  "currently-reading": {
    bg: "rgba(0,122,255,.11)",
    fg: "#0055B8",
    bd: "rgba(0,122,255,.25)",
  },
  "will-read": {
    bg: "rgba(255,204,0,.14)",
    fg: "#8C6C00",
    bd: "rgba(255,204,0,.3)",
  },
  "wanna-buy": {
    bg: "rgba(175,82,222,.11)",
    fg: "#7B3FA8",
    bd: "rgba(175,82,222,.25)",
  },
};

function urlLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("goodreads")) return "Goodreads";
    if (host.includes("amazon")) return "Amazon";
    if (host.includes("thalia")) return "Thalia";
    if (host.includes("buecher")) return "Bücher.de";
    if (host.includes("dnb")) return "Deutsche Nationalbibliothek";
    return host;
  } catch {
    return "Link";
  }
}

const SLIDE_VARIANTS = {
  initial: { filter: "blur(12px)", opacity: 0, scale: 0.95 },
  animate: { filter: "blur(0px)", opacity: 1, scale: 1 },
  exit: { filter: "blur(12px)", opacity: 0, scale: 1.05 },
  transition: { duration: 0.3 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Styled primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sticky footer bar pinned to the bottom of the panel.
 * Sits above the scroll area via flex column layout in Panel.
 */
const NavBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
`;

const NavChevron = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: ${({ disabled }) =>
    disabled ? "transparent" : "rgba(0,0,0,0.05)"};
  color: ${({ disabled }) =>
    disabled ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.75)"};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.09);
  }
  &:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.13);
  }
`;

/** iOS-style dot track sitting between the two chevrons */
const DotTrack = styled.div`
  /* flex: 1; */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const DotRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? "16px" : "6px")};
  height: 6px;
  border-radius: 3px;
  background: ${({ $active }) =>
    $active ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.15)"};
  transition:
    width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.22s ease;
`;

const NavCounter = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.38);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
`;

/** Inline status pill shown in the nav — smaller than the hero pill */
const NavStatusPill = styled.span<{ $bg: string; $fg: string; $bd: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 1px solid ${({ $bd }) => $bd};
  white-space: nowrap;
`;

// ─────────────────────────────────────────────────────────────────────────────
// RatingStars
// ─────────────────────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <HeartsContainer>
      {Array.from({ length: 5 }, (_, i) => (
        <HeartIcon key={i} style={{ opacity: i < rating ? 1 : 0.18 }} />
      ))}
    </HeartsContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StackNav — iOS-style nav bar, stack-scoped, always visible
// ─────────────────────────────────────────────────────────────────────────────

interface StackNavProps {
  book: Book;
  /** 0-based position within the current stack */
  posInStack: number;
  /** Total books in the current stack */
  stackSize: number;
  onPrev: () => void;
  onNext: () => void;
}

const StackNav = memo(
  ({ book, posInStack, stackSize, onPrev, onNext }: StackNavProps) => {
    const sc = STATUS_COLORS[book.status];
    // Clamp dot display to max 7 — collapse beyond that
    const MAX_DOTS = 10;
    const showDots = stackSize <= MAX_DOTS;

    return (
      <NavBar>
        <NavChevron
          onClick={onPrev}
          // Always enabled — navigation loops infinitely
          aria-label="Previous book"
        >
          <ChevronLeftIcon />
        </NavChevron>

        <DotTrack>
          <NavStatusPill $bg={sc.bg} $fg={sc.fg} $bd={sc.bd}>
            {STATUS_LABELS[book.status]}
          </NavStatusPill>

          {showDots ? (
            <DotRow>
              {Array.from({ length: stackSize }, (_, i) => (
                <Dot key={i} $active={i === posInStack} />
              ))}
            </DotRow>
          ) : (
            <NavCounter>
              {posInStack + 1} / {stackSize}
            </NavCounter>
          )}
        </DotTrack>

        <NavChevron onClick={onNext} aria-label="Next book">
          <ChevronRightIcon />
        </NavChevron>
      </NavBar>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// BookContent
// ─────────────────────────────────────────────────────────────────────────────

const BookContent = memo(({ book }: { book: Book }) => {
  const navigateToBookId = useBooksStore((s) => s.navigateToBookId);
  const tags: string[] = (book.tags as unknown as string[]) ?? [];
  const sc = STATUS_COLORS[book.status];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        {...SLIDE_VARIANTS}
        key={`book-${book.id}`}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <PanelScroll>
          {/* Hero */}
          <HeroRow>
            <div
              style={{
                flexShrink: 0,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(0,0,0,.17)",
              }}
            >
              <CoverCanvas book={book} w={80} h={120} />
            </div>

            <FillColumn $gap="4px" $justify="center" $align="flex-start">
              {book.rating && <RatingStars rating={book.rating} />}
              <HugColumn $gap={0} style={{ width: "100%" }}>
                <HeroTitle>{book.title}</HeroTitle>
                <HeroAuthor>{book.author}</HeroAuthor>
              </HugColumn>
              {/* <TagPill $bg={sc.bg} $fg={sc.fg} $bd={sc.bd}>
                {STATUS_LABELS[book.status]}
              </TagPill> */}
            </FillColumn>
          </HeroRow>

          {/* Tags */}
          {tags.length > 0 && (
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
              </TagsWrap>
            </>
          )}

          {/* Review */}
          {book.review && (
            <>
              <Rule />
              <SectionLabel>Rezension</SectionLabel>
              <ReviewText>{book.review}</ReviewText>
            </>
          )}

          {/* External link */}
          {book.url && (
            <>
              <Rule />
              <SectionLabel>Mehr Info</SectionLabel>
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,.04)",
                  border: "1px solid rgba(0,0,0,.09)",
                  color: "#0055B8",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  marginTop: 4,
                  width: "fit-content",
                }}
              >
                {urlLabel(book.url)} ↗
              </a>
            </>
          )}

          {/* Related */}
          {book.related && book.related.length > 0 && (
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
    </AnimatePresence>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BookPortalOverlay
// ─────────────────────────────────────────────────────────────────────────────

export const BookPortalOverlay = () => {
  const { isMobile } = useAppStore();
  const focusedBook = useBooksStore((s) => s.focusedBook);
  const focusedIdx = useBooksStore((s) => s.focusedIdx);

  const activeStack = useMemo<StackData | null>(
    () => stackForBookIdx(focusedIdx),
    [focusedIdx],
  );

  // All books sharing the same status — this is the full loop domain
  const statusIndices = useMemo<number[]>(() => {
    if (!focusedBook) return [];
    const stacks = STACKS_BY_STATUS.get(focusedBook.status) ?? [];
    return stacks.flatMap((s) => s.bookIndices);
  }, [focusedBook?.status]);

  // Position of the focused book within its status group (0-based)
  const posInStack = useMemo<number>(() => {
    if (focusedIdx === null) return 0;
    const idx = statusIndices.indexOf(focusedIdx);
    return idx === -1 ? 0 : idx;
  }, [focusedIdx, statusIndices]);

  // Move camera whenever the active stack changes
  useEffect(() => {
    if (activeStack !== null) {
      _moveCameraToStack(activeStack.stackIdx);
    }
  }, [activeStack?.stackIdx]);

  const isOpen = !!focusedBook && activeStack !== null;

  // Infinite loop across all books in the same status group
  const prevBook = useCallback(() => {
    if (statusIndices.length === 0) return;
    const next = (posInStack - 1 + statusIndices.length) % statusIndices.length;
    useBooksStore.getState().setFocused(statusIndices[next]);
  }, [posInStack, statusIndices]);

  const nextBook = useCallback(() => {
    if (statusIndices.length === 0) return;
    const next = (posInStack + 1) % statusIndices.length;
    useBooksStore.getState().setFocused(statusIndices[next]);
  }, [posInStack, statusIndices]);

  const onClose = useCallback(() => {
    useBooksStore.getState().clearFocus();
  }, []);

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  const content = (
    <AnimatePresence>
      {isOpen && focusedBook && activeStack && (
        <Panel
          key="panel"
          $mobile={isMobile}
          layout
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
          <CloseBtn onClick={onClose} aria-label="Schließen">
            <CloseIcon />
          </CloseBtn>

          <BookContent book={focusedBook} />

          <StackNav
            book={focusedBook}
            posInStack={posInStack}
            stackSize={statusIndices.length}
            onPrev={prevBook}
            onNext={nextBook}
          />
        </Panel>
      )}
    </AnimatePresence>
  );

  if (!root) return null;
  return createPortal(content, root);
};
