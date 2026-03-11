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
import { memo, useCallback, useEffect, useMemo } from "react";
import { StackData, STACKS, STACKS_BY_STATUS, STATUS_LABELS, TAG_PAL } from ".";
import { CoverCanvas } from "./bookCover";
import { CloseIcon } from "@/icons/close";
import { HeartIcon } from "@/icons/heart";
import { FillColumn, HugColumn, HugRow } from "@/layout";
import { PaginationDots, PaginationButton, FixedAnchor } from "@/apps/ui";

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

/** Find the stack that contains a given BOOKS-array index. */
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
// BookContent — animated panel body for one book
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
              <HugColumn $gap={0}>
                <HeroTitle>{book.title}</HeroTitle>
                <HeroAuthor>{book.author}</HeroAuthor>
              </HugColumn>
              <TagPill $bg={sc.bg} $fg={sc.fg} $bd={sc.bd}>
                {STATUS_LABELS[book.status]}
              </TagPill>
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
// StatusFloatingBar
//
// Shows:
//   • Status label badge  (left)
//   • One dot per STACK in the status (middle) — active dot widens + highlights,
//     clicking a dot jumps to that stack's first book
//   • Book counter  "3 / 12"  (right of dots)
//   • Prev / Next arrows that loop through ALL books of the status across stacks
// ─────────────────────────────────────────────────────────────────────────────

interface StatusFloatingBarProps {
  status: Book["status"];
  /** Index of the focused book within the flattened status book list. */
  posInStatus: number;
  /** Total books across all stacks of this status. */
  totalInStatus: number;
  /** Which stack (by stackIdx) currently contains the focused book. */
  activeStackIdx: number;
  /** All stacks belonging to this status. */
  statusStacks: StackData[];
  onPrev: () => void;
  onNext: () => void;
}

const StatusFloatingBar = memo(
  ({
    status,
    posInStatus,
    totalInStatus,
    activeStackIdx,
    statusStacks,
    onPrev,
    onNext,
  }: StatusFloatingBarProps) => {
    const sc = STATUS_COLORS[status];

    return (
      <FixedAnchor>
        <PaginationDots $contrastMode $mobileBottomAnchor>
          <PaginationButton onClick={onPrev} disabled={posInStatus === 0}>
            <ChevronLeftIcon />
          </PaginationButton>

          <HugRow $gap="10px" style={{ alignItems: "center" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                // color: "rgba(0,0,0,.45)",
                fontVariantNumeric: "tabular-nums",
                minWidth: 36,
                textAlign: "right",
              }}
            >
              {posInStatus + 1} / {totalInStatus}
            </p>
          </HugRow>

          {/* → Next */}
          <PaginationButton
            onClick={onNext}
            disabled={posInStatus === totalInStatus - 1}
          >
            <ChevronRightIcon />
          </PaginationButton>
        </PaginationDots>
      </FixedAnchor>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// BookPortalOverlay
// ─────────────────────────────────────────────────────────────────────────────

export const BookPortalOverlay = () => {
  const { isMobile } = useAppStore();
  const focusedBook = useBooksStore((s) => s.focusedBook);
  const focusedIdx = useBooksStore((s) => s.focusedIdx);

  // The stack that contains the currently focused book (null when nothing focused)
  const activeStack = useMemo<StackData | null>(
    () => stackForBookIdx(focusedIdx),
    [focusedIdx],
  );

  // All stacks that belong to the same status as the focused book
  const statusStacks = useMemo<StackData[]>(() => {
    if (!focusedBook) return [];
    return STACKS_BY_STATUS.get(focusedBook.status) ?? [];
  }, [focusedBook?.status]);

  // Flat ordered list of ALL book indices across every stack of this status.
  // Navigating prev/next moves through this list.
  const allStatusIndices = useMemo<number[]>(
    () => statusStacks.flatMap((s) => s.bookIndices),
    [statusStacks],
  );

  // Position of the focused book within that flat list (0-based, clamped)
  const posInStatus = useMemo<number>(() => {
    if (focusedIdx === null || allStatusIndices.length === 0) return 0;
    const idx = allStatusIndices.indexOf(focusedIdx);
    return idx === -1 ? 0 : idx;
  }, [focusedIdx, allStatusIndices]);

  // Move camera to the active stack whenever it changes
  useEffect(() => {
    if (activeStack !== null) {
      _moveCameraToStack(activeStack.stackIdx);
    }
  }, [activeStack?.stackIdx]);

  const isOpen = !!focusedBook && activeStack !== null;

  // Navigate to the previous book in this status (loops at start)
  const prevBook = useCallback(() => {
    if (allStatusIndices.length === 0) return;
    const next =
      (posInStatus - 1 + allStatusIndices.length) % allStatusIndices.length;
    useBooksStore.getState().setFocused(allStatusIndices[next]);
  }, [posInStatus, allStatusIndices]);

  // Navigate to the next book in this status (loops at end)
  const nextBook = useCallback(() => {
    if (allStatusIndices.length === 0) return;
    const next = (posInStatus + 1) % allStatusIndices.length;
    useBooksStore.getState().setFocused(allStatusIndices[next]);
  }, [posInStatus, allStatusIndices]);

  const onClose = useCallback(() => {
    useBooksStore.getState().clearFocus();
  }, []);

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  const content = (
    <>
      {/* ── Side panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && focusedBook && activeStack && (
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
            <CloseBtn onClick={onClose} aria-label="Schließen">
              <CloseIcon />
            </CloseBtn>
            <BookContent book={focusedBook} />
          </Panel>
        )}
      </AnimatePresence>

      {isOpen && focusedBook && activeStack && (
        <StatusFloatingBar
          status={focusedBook.status}
          posInStatus={posInStatus}
          totalInStatus={allStatusIndices.length}
          activeStackIdx={activeStack.stackIdx}
          statusStacks={statusStacks}
          onPrev={prevBook}
          onNext={nextBook}
        />
      )}
    </>
  );

  if (!root) return null;
  return createPortal(content, root);
};
