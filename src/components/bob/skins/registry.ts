import { THEME_CONFIG } from "@/store/config/themes";

export type SkinId = "white" | "dark" | "pastel" | "peach" | "mint" | "lilac" | "sky"
  | "neon-lime" | "neon-pink" | "neon-cyan" | "moon" | "denim" | "leather" | "glass" | "gold" | "wood" | "water" | "tnt" | "sponge" | "lightbulb" | "bush";
export type SkinUnlock = { quest: string } | { stack: string };
export interface BobSkin {
  id: SkinId;
  name: { de: string; en: string };
  material: "solid" | "moon" | "disco" | "watermelon" | "glass" | "gold" | "wood" | "water" | "jelly" | "sponge" | "lightbulb";
  body: string;
  eyes: string;
  secondary?: string;
  unlock?: SkinUnlock;
  cost?: number;
}
const palette = (id: "DEFAULT" | "DARK" | "PASTEL" | "NEON") => {
  const theme = THEME_CONFIG[id];
  return { body: theme.blobColor, eyes: theme.eyeColor };
};

/** Authored skins stay separate from saved ownership and the overall UI theme.
 * Add a material recipe and an optional quest/stack gate to extend the catalogue.
 */
export const BOB_SKINS: readonly BobSkin[] = [
  { id: "white", name: { de: "Weiß", en: "White" }, material: "solid", ...palette("DEFAULT") },
  { id: "dark", name: { de: "Schwarz", en: "Black" }, material: "solid", body: "#292a30", eyes: "#ffffff" },
  { id: "pastel", name: { de: "Pastell", en: "Pastel" }, material: "solid", ...palette("PASTEL"), eyes: "#000000", cost: 50 },
  { id: "peach", name: { de: "Pfirsich", en: "Peach" }, material: "solid", body: "#ffc5ad", eyes: "#000000", cost: 50 },
  { id: "mint", name: { de: "Minze", en: "Mint" }, material: "solid", body: "#b9ebce", eyes: "#000000", cost: 50 },
  { id: "lilac", name: { de: "Flieder", en: "Lilac" }, material: "solid", body: "#d7c3f2", eyes: "#000000", cost: 50 },
  { id: "sky", name: { de: "Himmelblau", en: "Sky blue" }, material: "solid", body: "#b5ddfa", eyes: "#000000", cost: 50 },
  { id: "neon-lime", name: { de: "Neon-Limette", en: "Neon lime" }, material: "solid", body: "#baff17", eyes: "#101600", cost: 500 },
  { id: "neon-pink", name: { de: "Neon-Pink", en: "Neon pink" }, material: "solid", body: "#ff37b6", eyes: "#20051a", cost: 500 },
  { id: "neon-cyan", name: { de: "Neon-Cyan", en: "Neon cyan" }, material: "solid", body: "#13edfa", eyes: "#042023", cost: 500 },
  { id: "moon", name: { de: "Mond", en: "Moon" }, material: "moon", body: "#e2dfcf", secondary: "#9b978b", eyes: "#08090b", cost: 1_000 },
  // Keep these saved IDs so existing selections and quest rewards carry over.
  { id: "denim", name: { de: "Disco", en: "Disco" }, material: "disco", body: "#c2c9db", secondary: "#cbe4ff", eyes: "#10131d", unlock: { quest: "routes_purchased_3" } },
  { id: "leather", name: { de: "Wassermelone", en: "Watermelon" }, material: "watermelon", body: "#86bf49", secondary: "#246333", eyes: "#07160c", unlock: { quest: "total_taps_1000" } },
  { id: "glass", name: { de: "Glas", en: "Glass" }, material: "glass", body: "#c0f9e8", secondary: "#21bdd6", eyes: "#123c46", unlock: { stack: "shop_item_categories" } },
  { id: "gold", name: { de: "Chrom", en: "Chrome" }, material: "gold", body: "#bec6d0", secondary: "#ffffff", eyes: "#10141b", unlock: { quest: "total_taps_10000" }, cost: 500_000 },
  { id: "wood", name: { de: "Holz", en: "Wood" }, material: "wood", body: "#bd834b", secondary: "#704123", eyes: "#211409", cost: 5_000 },
  { id: "water", name: { de: "Wasser", en: "Water" }, material: "water", body: "#c6f4ff", secondary: "#159ed9", eyes: "#082d46", cost: 10_000 },
  { id: "tnt", name: { de: "Gelee", en: "Jelly" }, material: "jelly", body: "#c7ff64", secondary: "#49bc25", eyes: "#153807", cost: 50_000 },
  { id: "sponge", name: { de: "Schwamm", en: "Sponge" }, material: "sponge", body: "#ffdb46", secondary: "#b98a21", eyes: "#161305", cost: 1_000 },
  { id: "lightbulb", name: { de: "Glühbirne", en: "Lightbulb" }, material: "lightbulb", body: "#fff2b0", secondary: "#ffca54", eyes: "#29200c", cost: 100_000 },
  { id: "bush", name: { de: "Busch", en: "Bush" }, material: "solid", body: "#416537", eyes: "#0a1409", cost: 2_500 },
];
export const getBobSkin = (id: unknown): BobSkin => BOB_SKINS.find(skin => skin.id === (id === "neon" ? "moon" : id === "stripes" ? "denim" : id)) ?? BOB_SKINS[0];
export function isBobSkinUnlocked(skin: BobSkin, quests: readonly { id: string; stackId?: string; completed: boolean }[]) {
  const gate = skin.unlock;
  if (!gate) return true;
  if ("quest" in gate) return quests.some(quest => quest.id === gate.quest && quest.completed);
  const stack = quests.filter(quest => quest.stackId === gate.stack);
  return stack.length > 0 && stack.every(quest => quest.completed);
}

/** A shop preview may show an unearned skin; ordinary rendering always enforces its gate. */
export function isBobSkinAvailable(skin: BobSkin, quests: Parameters<typeof isBobSkinUnlocked>[1], purchased: readonly SkinId[] = []) {
  return isBobSkinUnlocked(skin, quests) && (!skin.cost || purchased.includes(skin.id));
}

export function resolveBobSkin(selectedId: unknown, quests: Parameters<typeof isBobSkinUnlocked>[1], previewId: SkinId | null = null, purchased: readonly SkinId[] = []) {
  if (previewId) return getBobSkin(previewId);
  const selected = getBobSkin(selectedId);
  return isBobSkinAvailable(selected, quests, purchased) ? selected : getBobSkin("white");
}
