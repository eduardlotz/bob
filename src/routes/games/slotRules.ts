export const SPIN_COST = 5_000;
export const SLOT_SYMBOLS = ["🍒", "🍋", "🍉", "🍇", "🍓", "🔔", "⭐", "💎"];
export const SLOT_PAYOUTS = [
  { id: "pair", points: 1, taps: 100_000, de: "Ein Paar", en: "Any pair" },
  { id: "mixed", points: 2, taps: 250_000, de: "Drei verschiedene Früchte", en: "Three different fruits" },
  { id: "fruit", points: 3, taps: 1_000_000, de: "Drei gleiche Früchte", en: "Three matching fruits" },
  { id: "bells", points: 5, taps: 2_000_000, de: "Drei Glocken", en: "Three bells" },
  { id: "stars", points: 10, taps: 3_000_000, de: "Drei Sterne", en: "Three stars" },
  { id: "diamonds", points: 20, taps: 5_000_000, de: "Drei Diamanten", en: "Three diamonds" },
] as const;

export function getSlotPayout(symbols: readonly number[]) {
  const [a, b, c] = symbols;
  if (a === b && b === c) return SLOT_PAYOUTS[a < 5 ? 2 : a - 2];
  if (a < 5 && b < 5 && c < 5 && a !== b && b !== c && a !== c) return SLOT_PAYOUTS[1];
  if (a === b || b === c || a === c) return SLOT_PAYOUTS[0];
  return null;
}

/** A pair highlights only the matching reels; all other wins use all three. */
export function getWinningReels(symbols: readonly number[]) {
  const payout = getSlotPayout(symbols);
  if (!payout) return [];
  if (payout.id !== "pair") return [0, 1, 2];
  return symbols.map((symbol, index) => symbols.some((other, otherIndex) => otherIndex !== index && other === symbol) ? index : -1).filter((index) => index >= 0);
}
