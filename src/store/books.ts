import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────────────────────
// Book catalogue — edit this const to add / remove books
// ─────────────────────────────────────────────────────────────────────────────

export interface Book {
  id: number;
  title: string;
  author: string;
  /** CSS hex colour for the cover background */
  bg: string;
  /** CSS hex colour for cover accents and text */
  fg: string;
  rating: 1 | 2 | 3 | 4 | 5;
  favorite: boolean;
  review: string;
  related: number[]; // ids
  /** Optional external URL (used in panel CTA) */
  url?: string;
}

export const BOOKS: Book[] = [
  {
    id: 1,
    title: "Dune",
    author: "Frank Herbert",
    bg: "#a07020",
    fg: "#f0d080",
    rating: 5,
    favorite: true,
    review:
      "A masterwork of world-building. The ecology of Arrakis feels disturbingly real, and the political intrigue never lets up.",
    related: [4, 5, 23],
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    bg: "#1a4030",
    fg: "#70c890",
    rating: 5,
    favorite: false,
    review:
      "Still the most chilling vision of totalitarianism ever committed to paper. Doublethink has only gotten more relevant.",
    related: [8, 20, 21],
  },
  {
    id: 3,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    bg: "#5a2808",
    fg: "#d8b050",
    rating: 4,
    favorite: true,
    review:
      "Lighter in tone than LOTR but the sense of adventure is infectious. Riddles in the Dark remains one of the finest chapters in fantasy.",
    related: [4, 13, 17],
  },
  {
    id: 4,
    title: "Foundation",
    author: "Isaac Asimov",
    bg: "#0a2850",
    fg: "#5090d8",
    rating: 5,
    favorite: true,
    review:
      "The scope is staggering — thousands of years of civilisation compressed into something readable. Seldon's plan never stops being compelling.",
    related: [1, 7, 22],
  },
  {
    id: 5,
    title: "Ender's Game",
    author: "Orson Scott Card",
    bg: "#240638",
    fg: "#b050d8",
    rating: 4,
    favorite: false,
    review:
      "The twist hits like a freight train even when you see it coming. The moral weight it carries stays with you.",
    related: [1, 6, 12],
  },
  {
    id: 6,
    title: "Snow Crash",
    author: "Neal Stephenson",
    bg: "#081c28",
    fg: "#30b0e0",
    rating: 4,
    favorite: false,
    review:
      "Invented the metaverse before it was a buzzword. Raucous, dense, and funnier than it has any right to be.",
    related: [7, 11, 24],
  },
  {
    id: 7,
    title: "Neuromancer",
    author: "William Gibson",
    bg: "#04080e",
    fg: "#00ee78",
    rating: 5,
    favorite: true,
    review:
      "The prose is so compressed it feels like transmission noise. Invented cyberpunk's entire visual vocabulary in one shot.",
    related: [6, 24, 18],
  },
  {
    id: 8,
    title: "Brave New World",
    author: "Aldous Huxley",
    bg: "#504008",
    fg: "#e8c850",
    rating: 4,
    favorite: false,
    review:
      "The horror here is that everyone is happy. Its critique of pleasure as control feels more prescient every decade.",
    related: [2, 9, 16],
  },
  {
    id: 9,
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    bg: "#681010",
    fg: "#f07030",
    rating: 4,
    favorite: false,
    review:
      "Short but incendiary. The fireman burning books is a perfect image — the system destroys what threatens comfort.",
    related: [2, 8, 21],
  },
  {
    id: 10,
    title: "The Martian",
    author: "Andy Weir",
    bg: "#781808",
    fg: "#f05020",
    rating: 4,
    favorite: false,
    review:
      "Engineering problem-solving as survival narrative. Watney's voice is relentlessly likeable and the science holds up.",
    related: [11, 22, 4],
  },
  {
    id: 11,
    title: "Project Hail Mary",
    author: "Andy Weir",
    bg: "#064838",
    fg: "#30d8b0",
    rating: 5,
    favorite: true,
    review:
      "The best first-contact novel in years. Rocky is one of the most endearing alien characters in all of sci-fi.",
    related: [10, 4, 23],
  },
  {
    id: 12,
    title: "Mistborn",
    author: "Brandon Sanderson",
    bg: "#282c34",
    fg: "#909ab0",
    rating: 4,
    favorite: false,
    review:
      "The magic system is the most rigorously designed in fantasy. The heist structure keeps the epic stakes feeling personal.",
    related: [13, 3, 17],
  },
  {
    id: 13,
    title: "Way of Kings",
    author: "Brandon Sanderson",
    bg: "#0c3058",
    fg: "#70b0f8",
    rating: 5,
    favorite: true,
    review:
      "Intimidating in scope but worth every page. Kaladin's arc from slave to soldier is among the best in modern fantasy.",
    related: [12, 3, 17],
  },
  {
    id: 14,
    title: "Red Rising",
    author: "Pierce Brown",
    bg: "#680808",
    fg: "#f03030",
    rating: 4,
    favorite: false,
    review:
      "Hunger Games with more brutality and sharper class commentary. Darrow is one of the best action protagonists in recent memory.",
    related: [5, 1, 2],
  },
  {
    id: 15,
    title: "Atomic Habits",
    author: "James Clear",
    bg: "#803808",
    fg: "#f0a040",
    rating: 4,
    favorite: false,
    review:
      "The 1% improvement framework is deceptively simple. Its strength is that it makes change feel achievable rather than heroic.",
    related: [18, 19, 16],
  },
  {
    id: 16,
    title: "Sapiens",
    author: "Y.N. Harari",
    bg: "#083818",
    fg: "#50d870",
    rating: 4,
    favorite: false,
    review:
      "Wildly ambitious — the entire sweep of human history in one book. Some sections are more speculative than advertised, but the perspective it opens is worth it.",
    related: [15, 18, 8],
  },
  {
    id: 17,
    title: "Name of the Wind",
    author: "P. Rothfuss",
    bg: "#380660",
    fg: "#c070f8",
    rating: 5,
    favorite: true,
    review:
      "The prose alone earns its place. Kvothe telling his own legend with full knowledge of its unreliability is a clever frame.",
    related: [3, 13, 20],
  },
  {
    id: 18,
    title: "Think Fast & Slow",
    author: "D. Kahneman",
    bg: "#082040",
    fg: "#5090f0",
    rating: 4,
    favorite: false,
    review:
      "System 1 and System 2 is now part of how I think. Dense but the insights compound — each chapter reframes the last.",
    related: [15, 16, 19],
  },
  {
    id: 19,
    title: "Deep Work",
    author: "Cal Newport",
    bg: "#063430",
    fg: "#38c8b8",
    rating: 4,
    favorite: false,
    review:
      "The case for focused work in a distracted world. Somewhat preaching to the choir but the examples and frameworks are solid.",
    related: [15, 18, 16],
  },
  {
    id: 20,
    title: "Left Hand of Darkness",
    author: "U.K. Le Guin",
    bg: "#220a38",
    fg: "#a870f8",
    rating: 5,
    favorite: true,
    review:
      "A meditation on gender and identity wrapped in alien anthropology. Le Guin's world feels genuinely alien, not just Earth with different names.",
    related: [2, 17, 23],
  },
  {
    id: 21,
    title: "The Road",
    author: "Cormac McCarthy",
    bg: "#140e08",
    fg: "#b09860",
    rating: 5,
    favorite: false,
    review:
      "Brutal and beautiful in equal measure. The nameless man and boy carry the entire emotional weight of a dead world.",
    related: [9, 2, 22],
  },
  {
    id: 22,
    title: "Hyperion",
    author: "Dan Simmons",
    bg: "#081828",
    fg: "#3870b8",
    rating: 5,
    favorite: true,
    review:
      "The Canterbury Tales meets space opera. Each pilgrim's story is a different genre — together they form something far greater.",
    related: [4, 1, 21],
  },
  {
    id: 23,
    title: "Annihilation",
    author: "Jeff VanderMeer",
    bg: "#081e10",
    fg: "#38d888",
    rating: 4,
    favorite: false,
    review:
      "The horror here is in what's withheld. Area X is one of the most unsettling fictional places in recent memory.",
    related: [20, 7, 24],
  },
  {
    id: 24,
    title: "Dark Matter",
    author: "Blake Crouch",
    bg: "#04060e",
    fg: "#7070f8",
    rating: 3,
    favorite: false,
    review:
      "A propulsive thriller built around the quantum multiverse. The science is hand-wavy but the emotional stakes are real.",
    related: [6, 7, 11],
  },
];

export const BOOK_BY_ID = new Map<number, Book>(BOOKS.map((b) => [b.id, b]));

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface BooksStore {
  focusedBook: Book | null;
  focusedIdx: number | null;
  hoveredBook: Book | null;

  // Actions
  setFocused: (idx: number) => void;
  clearFocus: () => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateToBookId: (id: number) => void;
  setHoveredBook: (book: Book | null) => void;

  // Selectors
  canNavigateNext: () => boolean;
  canNavigatePrev: () => boolean;
}

export const useBooksStore = create<BooksStore>()(
  devtools(
    (set, get) => ({
      focusedBook: null,
      focusedIdx: null,
      hoveredBook: null,

      setFocused: (idx) =>
        set({
          focusedIdx: idx,
          focusedBook: BOOKS[idx] ?? null,
        }),

      clearFocus: () =>
        set({
          focusedBook: null,
          focusedIdx: null,
        }),

      navigateNext: () => {
        const { focusedIdx } = get();
        if (focusedIdx === null) return;
        const next = focusedIdx + 1;
        if (next < BOOKS.length)
          set({ focusedIdx: next, focusedBook: BOOKS[next] });
      },

      navigatePrev: () => {
        const { focusedIdx } = get();
        if (focusedIdx === null) return;
        const prev = focusedIdx - 1;
        if (prev >= 0) set({ focusedIdx: prev, focusedBook: BOOKS[prev] });
      },

      navigateToBookId: (id) => {
        const idx = BOOKS.findIndex((b) => b.id === id);
        if (idx !== -1) set({ focusedIdx: idx, focusedBook: BOOKS[idx] });
      },

      setHoveredBook: (book) => set({ hoveredBook: book }),

      canNavigateNext: () => {
        const { focusedIdx } = get();
        return focusedIdx !== null && focusedIdx < BOOKS.length - 1;
      },

      canNavigatePrev: () => {
        const { focusedIdx } = get();
        return focusedIdx !== null && focusedIdx > 0;
      },
    }),
    { name: "books-store" },
  ),
);
