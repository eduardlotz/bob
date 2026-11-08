import { DataTexture, NearestFilter, RedFormat, UnsignedByteType } from "three";

/** Shared three-band lighting for the library's stone and book surfaces. */
export const libraryToonRamp = new DataTexture(
  new Uint8Array([115, 185, 245]), 3, 1, RedFormat, UnsignedByteType,
);
libraryToonRamp.minFilter = libraryToonRamp.magFilter = NearestFilter;
libraryToonRamp.generateMipmaps = false;
libraryToonRamp.unpackAlignment = 1;
libraryToonRamp.needsUpdate = true;
