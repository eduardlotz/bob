const REVISION = "subtle-notes-20261111-1";
const asset = (name: string) => `/gltf/about-me/${name}?revision=${REVISION}`;
const bake = (surface: string, version = "v4") => ({
  lightning: asset(`about-${surface}-lightning-bake-${version}.png`),
  warm: asset(`about-${surface}-warm-bake-${version}.png`),
});

export const ABOUT_ROOM_MODEL = asset("about-me-shaded-v3.glb");
export const ABOUT_BAKE_MAPS = {
  room: bake("room"),
  seating: bake("seating"),
  bookshelf: bake("bookshelf"),
  plant: bake("plant"),
  cigarette: bake("cigarette"),
  rug: bake("rug", "v3"),
  socials: bake("socials", "v3"),
  frontwall: {
    lightning: asset("about-front-wall-lightning-v3.png"),
    warm: asset("about-front-wall-warm-v3.png"),
  },
};
export type AboutBakeKind = keyof typeof ABOUT_BAKE_MAPS;

const ROOM: AboutBakeKind[] = ["room"];
const SOCIALS: AboutBakeKind[] = ["socials"];
const PART_BAKES: Record<string, AboutBakeKind[]> = {
  RoomShell: ["room", "rug"],
  FrontWall: ["frontwall"],
  Armchair: ["seating"],
  Bookshelf: ["bookshelf"],
  Plant: ["plant"],
  CoffeeTable: ["room", "cigarette"],
};
export const aboutPartBakeKinds = (name: string) => name.startsWith("Social_") ? SOCIALS : PART_BAKES[name] ?? ROOM;
