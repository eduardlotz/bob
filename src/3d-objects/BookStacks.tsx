import * as THREE from "three";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import { Book, BOOK_BY_ID, BOOKS, useBooksStore, useViewStore } from "@/store";
import { useAppStore } from "@/store";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { HugRow } from "@/layout";
import { PaginationDots, PaginationButton } from "@/apps/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Book geometry constants — real-world proportions, units ≈ metres
// ─────────────────────────────────────────────────────────────────────────────

const BW = 0.14; // spine width  (X) — ~14 cm
const BD = 0.025; // thickness    (Y) — ~2.5 cm per book  ← was 0.14, 14cm is a brick
const BH = 0.2; // page length  (Z) — ~20 cm

// ─────────────────────────────────────────────────────────────────────────────
// Stack layout — tweak x/z/rotY/count to fit your table surface
// ─────────────────────────────────────────────────────────────────────────────

interface StackDef {
  x: number;
  z: number;
  rotY: number;
  count: number;
}

const STACK_DEFS: StackDef[] = [
  { x: -0.55, z: 0.0, rotY: 0.12, count: 4 },
  { x: -0.25, z: 0.04, rotY: -0.08, count: 3 },
  { x: 0.05, z: -0.02, rotY: 0.18, count: 5 },
  { x: 0.38, z: 0.03, rotY: -0.14, count: 3 },
  { x: 0.65, z: 0.0, rotY: 0.06, count: 4 },
];

const MICRO_XZ: [number, number][] = [
  [0.0, 0.0],
  [0.006, -0.004],
  [-0.005, 0.006],
  [0.008, -0.002],
  [-0.003, 0.007],
];
const MICRO_ROT = [0, 0.04, -0.06, 0.03, -0.04];

// ─────────────────────────────────────────────────────────────────────────────
// Cover painter
// ─────────────────────────────────────────────────────────────────────────────

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 255) + amt)},${Math.min(255, ((n >> 8) & 255) + amt)},${Math.min(255, (n & 255) + amt)})`;
}

function paintCover(
  ctx: CanvasRenderingContext2D,
  book: Book,
  W: number,
  H: number,
) {
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, lighten(book.bg, 35));
  grd.addColorStop(1, book.bg);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.26, W * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = `${book.fg}25`;
  ctx.fill();

  ctx.strokeStyle = `${book.fg}40`;
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.beginPath();
  ctx.moveTo(14, H * 0.64);
  ctx.lineTo(W - 14, H * 0.64);
  ctx.strokeStyle = `${book.fg}50`;
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W - 14 - i * 8, 14, 2, 0, Math.PI * 2);
    ctx.fillStyle = i < book.rating ? `${book.fg}cc` : `${book.fg}22`;
    ctx.fill();
  }

  if (book.favorite) {
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = `${book.fg}bb`;
    ctx.textAlign = "left";
    ctx.fillText("♥", 10, 16);
  }

  const words = book.title.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > 11 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const fs = lines.length > 2 ? 16 : 20;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "left";
  lines.forEach((l, i) => ctx.fillText(l, 14, H * 0.68 + i * (fs + 4)));

  ctx.font = "12px sans-serif";
  ctx.fillStyle = `${book.fg}cc`;
  ctx.fillText(book.author, 14, H - 12);
}

const coverCache = new Map<number, THREE.CanvasTexture>();
function getCoverTexture(book: Book): THREE.CanvasTexture {
  if (!coverCache.has(book.id)) {
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 192;
    paintCover(cv.getContext("2d")!, book, 128, 192);
    coverCache.set(book.id, new THREE.CanvasTexture(cv));
  }
  return coverCache.get(book.id)!;
}

const solidCache = new Map<string, THREE.MeshStandardMaterial>();
function getSolid(hex: string): THREE.MeshStandardMaterial {
  if (!solidCache.has(hex))
    solidCache.set(
      hex,
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.82,
        metalness: 0,
      }),
    );
  return solidCache.get(hex)!;
}

// Lying flat: X = spine width, Y = thickness (stacking axis), Z = page length
const BOOK_GEO = new THREE.BoxGeometry(BW, BD, BH);

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────────────────────────────────────

const CoverCanvas = memo(
  ({ book, width, height }: { book: Book; width: number; height: number }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (!ref.current) return;
      paintCover(ref.current.getContext("2d")!, book, width, height);
    }, [book.id]);
    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        style={{ borderRadius: 3 }}
      />
    );
  },
);

const RelatedRow = memo(
  ({ book, onClick }: { book: Book; onClick: () => void }) => (
    <RelatedItem onClick={onClick}>
      <CoverCanvas book={book} width={32} height={48} />
      <RelatedMeta>
        <span className="title">{book.title}</span>
        <span className="author">{book.author}</span>
      </RelatedMeta>
    </RelatedItem>
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Book detail overlay — <Html> from drei, same pattern as PortfolioMetaOverlay
//
// No isActive prop — parent already conditionally mounts BookStacks, so this
// component only exists when we're in the right view. AnimatePresence drives
// the panel entirely off focusedBook state.
// ─────────────────────────────────────────────────────────────────────────────

const BookOverlay = ({ anchorY }: { anchorY: number }) => {
  const { isMobile } = useAppStore();

  const focusedBook = useBooksStore((s) => s.focusedBook);
  const focusedIdx = useBooksStore((s) => s.focusedIdx);
  const clearFocus = useBooksStore((s) => s.clearFocus);
  const navigateNext = useBooksStore((s) => s.navigateNext);
  const navigatePrev = useBooksStore((s) => s.navigatePrev);
  const navigateToBookId = useBooksStore((s) => s.navigateToBookId);
  const canNext = useBooksStore((s) => s.canNavigateNext());
  const canPrev = useBooksStore((s) => s.canNavigatePrev());

  const total = BOOKS.length;
  const handleNext = () => {
    if (canNext) navigateNext();
    else useBooksStore.getState().setFocused(0);
  };
  const handlePrev = () => {
    if (canPrev) navigatePrev();
    else useBooksStore.getState().setFocused(total - 1);
  };

  const overlayTransform = isMobile ? "-50%, 40vh" : "50%, 0";

  return (
    <group position={[0, anchorY, 0]}>
      <Html
        style={{
          width: "20rem",
          maxWidth: "92vw",
          pointerEvents: focusedBook ? "auto" : "none",
          transform: `translate3d(${overlayTransform}, 0)`,
        }}
        transform
        zIndexRange={[20, 0]}
        position={[0, -2, 10]}
        rotation={[0, (Math.PI / 2) * 2, 0]}
        distanceFactor={isMobile ? 60 : 4}
      >
        <AnimatePresence mode="popLayout">
          {focusedBook && focusedIdx !== null && (
            <PanelContainer
              key={`book-panel-${focusedBook.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.93, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 14, scale: 0.93, filter: "blur(8px)" }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
            >
              <PanelSwatch>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`swatch-${focusedBook.id}`}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.35 }}
                    style={{
                      boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
                      borderRadius: 3,
                    }}
                  >
                    <CoverCanvas book={focusedBook} width={72} height={108} />
                  </motion.div>
                </AnimatePresence>
              </PanelSwatch>

              <PanelBody>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`meta-${focusedBook.id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <BookTitle>{focusedBook.title}</BookTitle>
                    <BookAuthor>{focusedBook.author}</BookAuthor>

                    <RatingRow>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} $on={i < focusedBook.rating}>
                          ★
                        </Star>
                      ))}
                      {focusedBook.favorite && <FavHeart>♥</FavHeart>}
                    </RatingRow>

                    <SectionLabel>Review</SectionLabel>
                    <ReviewText>{focusedBook.review}</ReviewText>

                    {focusedBook.related.length > 0 && (
                      <>
                        <Divider />
                        <SectionLabel>Ähnliche Bücher</SectionLabel>
                        {focusedBook.related.map((rid) => {
                          const rb = BOOK_BY_ID.get(rid);
                          return rb ? (
                            <RelatedRow
                              key={rid}
                              book={rb}
                              onClick={() => navigateToBookId(rid)}
                            />
                          ) : null;
                        })}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Divider />

                <PaginationDots>
                  <PaginationButton onClick={handlePrev} disabled={total === 1}>
                    <ChevronLeftIcon />
                  </PaginationButton>

                  <HugRow $gap="4px">
                    {BOOKS.map((_, i) => (
                      <motion.div
                        key={`book_dot_${i}`}
                        animate={{
                          width: focusedIdx === i ? "18px" : "7px",
                          opacity: focusedIdx === i ? 1 : 0.25,
                          background:
                            focusedIdx === i
                              ? "rgba(255,255,255,0.9)"
                              : "rgba(255,255,255,0.35)",
                        }}
                        style={{ height: 7, borderRadius: 4 }}
                      />
                    ))}
                  </HugRow>

                  <PaginationButton onClick={handleNext} disabled={total === 1}>
                    <ChevronRightIcon />
                  </PaginationButton>
                </PaginationDots>

                <PageCounter>
                  {focusedIdx + 1} / {total}
                </PageCounter>

                <CloseButton onClick={clearFocus}>Schließen</CloseButton>
              </PanelBody>
            </PanelContainer>
          )}
        </AnimatePresence>
      </Html>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Single book mesh — no isActive guard, handlers always attached
// ─────────────────────────────────────────────────────────────────────────────

interface SingleBookProps {
  book: Book;
  bookIdx: number;
  pos: [number, number, number];
  rotY: number;
  isTop: boolean;
}

const SingleBook = memo(
  ({ book, bookIdx, pos, rotY, isTop }: SingleBookProps) => {
    const setFocused = useBooksStore((s) => s.setFocused);
    const setHovered = useBooksStore((s) => s.setHoveredBook);

    const materials = useMemo(() => {
      const solid = getSolid(book.bg);
      if (!isTop) return solid;
      // BoxGeometry face index 2 = +Y face = top of lying book = cover art
      return [
        solid,
        solid,
        new THREE.MeshStandardMaterial({
          map: getCoverTexture(book),
          roughness: 0.65,
          metalness: 0,
        }),
        solid,
        solid,
        solid,
      ];
    }, [book.id, isTop]);

    const handleClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setFocused(bookIdx);
      },
      [bookIdx, setFocused],
    );

    const handleOver = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(book);
        document.body.style.cursor = "pointer";
      },
      [book, setHovered],
    );

    const handleOut = useCallback(() => {
      setHovered(null);
      document.body.style.cursor = "default";
    }, [setHovered]);

    return (
      <mesh
        geometry={BOOK_GEO}
        material={materials}
        position={pos}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// One stack
// ─────────────────────────────────────────────────────────────────────────────

const BookStack = memo(
  ({
    def,
    books,
    startIdx,
  }: {
    def: StackDef;
    books: Book[];
    startIdx: number;
  }) => (
    <group position={[def.x, 0, def.z]} rotation={[0, def.rotY, 0]}>
      {books.map((book, i) => {
        const [ox, oz] = MICRO_XZ[i % MICRO_XZ.length];
        return (
          <SingleBook
            key={book.id}
            book={book}
            bookIdx={startIdx + i}
            pos={[ox, BD * 0.5 + i * BD, oz]}
            rotY={MICRO_ROT[i % MICRO_ROT.length]}
            isTop={i === books.length - 1}
          />
        );
      })}
    </group>
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// BookStacks — goes inside <Canvas>, render it only when in the right view:
//
//   {getCurrentViewConfig()?.id === "desk" && (
//     <BookStacks
//       viewId="desk"
//       position={[TABLE_X, TABLE_TOP_Y, TABLE_Z]}
//       rotation={[0, 0.3, 0]}
//     />
//   )}
// ─────────────────────────────────────────────────────────────────────────────

interface BookStacksProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  viewId: string;
  /**
   * Y offset in local space (before scale) where the Html panel anchors.
   * With BD=0.025 and up to 5 books, tallest stack is ~0.15 units.
   * Default 0.3 floats the panel visibly above.
   */
  overlayAnchorY?: number;
}

export function BookStacks({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  viewId,
  overlayAnchorY = 0.8,
}: BookStacksProps) {
  const currentView = useViewStore((s) => s.currentView);
  const clearFocus = useBooksStore((s) => s.clearFocus);

  useEffect(() => {
    if (currentView !== viewId) clearFocus();
  }, [currentView, viewId, clearFocus]);

  const stacks = useMemo(() => {
    let idx = 0;
    return STACK_DEFS.map((def) => {
      const books = BOOKS.slice(idx, idx + def.count);
      const startIdx = idx;
      idx += def.count;
      return { def, books, startIdx };
    });
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {stacks.map(({ def, books, startIdx }, i) => (
        <BookStack key={i} def={def} books={books} startIdx={startIdx} />
      ))}
      <BookOverlay anchorY={overlayAnchorY} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styled components
// ─────────────────────────────────────────────────────────────────────────────

const PanelContainer = styled(motion.div)`
  background: rgba(10, 8, 20, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(160, 120, 50, 0.22);
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(160, 120, 50, 0.2);
    border-radius: 2px;
  }
`;

const PanelSwatch = styled.div`
  width: 100%;
  padding: 18px 0 12px;
  display: flex;
  justify-content: center;
  background: rgba(6, 2, 14, 0.6);
`;

const PanelBody = styled.div`
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const BookTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: rgba(225, 198, 138, 0.95);
  margin: 0;
  line-height: 1.25;
`;

const BookAuthor = styled.p`
  font-size: 0.72rem;
  font-weight: 300;
  color: rgba(180, 150, 90, 0.45);
  margin: 0 0 4px;
`;

const RatingRow = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
  margin-bottom: 6px;
`;

const Star = styled.span<{ $on: boolean }>`
  font-size: 12px;
  color: ${({ $on }) =>
    $on ? "rgba(220,175,60,0.9)" : "rgba(160,120,50,0.2)"};
`;

const FavHeart = styled.span`
  margin-left: 4px;
  font-size: 10px;
  color: rgba(255, 140, 50, 0.9);
`;

const SectionLabel = styled.p`
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(160, 120, 50, 0.35);
  margin: 3px 0 2px;
`;

const ReviewText = styled.p`
  font-size: 0.7rem;
  font-weight: 300;
  line-height: 1.6;
  color: rgba(190, 160, 100, 0.6);
  font-style: italic;
  margin: 0 0 4px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(160, 120, 50, 0.1);
  margin: 5px 0;
`;

const RelatedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 5px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(160, 120, 50, 0.1);
  }
`;

const RelatedMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  .title {
    font-size: 0.68rem;
    font-weight: 500;
    color: rgba(200, 170, 110, 0.85);
  }
  .author {
    font-size: 0.62rem;
    color: rgba(160, 130, 80, 0.45);
  }
`;

const PageCounter = styled.p`
  font-size: 0.58rem;
  color: rgba(160, 120, 50, 0.4);
  text-align: center;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 100%;
  padding: 7px 0;
  background: rgba(160, 120, 50, 0.07);
  border: 1px solid rgba(160, 120, 50, 0.18);
  border-radius: 6px;
  color: rgba(190, 155, 90, 0.65);
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  margin-top: 2px;
  &:hover {
    background: rgba(160, 120, 50, 0.15);
    color: rgba(220, 185, 110, 0.95);
  }
`;
