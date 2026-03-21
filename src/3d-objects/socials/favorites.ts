import albumArt from "album-art";

import { FAVORITE_FALLBACK_GRADIENTS, FAVORITES } from "./contentData";
import type {
  FavoriteEntry,
  FavoriteFallbackGradient,
  ResolvedFavoriteEntry,
} from "./types";

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getFavoriteGradient(entry: FavoriteEntry): FavoriteFallbackGradient {
  const hash = Array.from(entry.id).reduce(
    (accumulator, character) =>
      (accumulator * 31 + character.charCodeAt(0)) | 0,
    0,
  );

  return FAVORITE_FALLBACK_GRADIENTS[
    Math.abs(hash) % FAVORITE_FALLBACK_GRADIENTS.length
  ]!;
}

function createFallbackTextureUrl(
  entry: FavoriteEntry,
  gradient: FavoriteFallbackGradient,
) {
  const [startColor, midColor, endColor] = gradient.colors;
  const gradientId = `grad-${gradient.id}`;
  const safeTitle = escapeSvgText(entry.title);
  const safeArtist = escapeSvgText(entry.artist);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="50%" stop-color="${midColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
        <radialGradient id="paper" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stop-color="#fffaf3" />
          <stop offset="100%" stop-color="#efe6da" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="48" fill="url(#paper)" />
      <circle cx="256" cy="208" r="142" fill="url(#${gradientId})" />
      <circle cx="214" cy="168" r="56" fill="#ffffff" opacity="0.2" />
      <circle cx="256" cy="208" r="140" fill="none" stroke="#ffffff" opacity="0.18" />
      <text x="44" y="416" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#161616">
        ${safeTitle}
      </text>
      <text x="44" y="454" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="600" fill="#5f5a55">
        ${safeArtist}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createFallbackFavoriteEntry(
  entry: FavoriteEntry,
): ResolvedFavoriteEntry {
  const fallbackGradient = getFavoriteGradient(entry);

  return {
    ...entry,
    artworkUrl: null,
    textureUrl: createFallbackTextureUrl(entry, fallbackGradient),
    fallbackGradient,
  };
}

function withResolvedArtwork(
  entry: FavoriteEntry,
  artworkUrl: string | null,
): ResolvedFavoriteEntry {
  const fallbackEntry = createFallbackFavoriteEntry(entry);

  if (!artworkUrl) {
    return fallbackEntry;
  }

  return {
    ...fallbackEntry,
    artworkUrl,
    textureUrl: artworkUrl,
  };
}

export function createInitialResolvedFavorites() {
  return FAVORITES.map(createFallbackFavoriteEntry);
}

export async function resolveResolvedFavoritesArtwork() {
  return Promise.all(
    FAVORITES.map(async (entry) => {
      try {
        const artworkUrl = await albumArt(entry.artist, {
          album: entry.album,
          size: "large",
        });

        return withResolvedArtwork(entry, artworkUrl);
      } catch {
        return createFallbackFavoriteEntry(entry);
      }
    }),
  );
}
