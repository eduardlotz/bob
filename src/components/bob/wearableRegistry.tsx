import type { WardrobeKind } from "@/3d-objects/models/toonWardrobe";
import type { PlayfulWardrobeKind } from "@/3d-objects/models/playfulWardrobe";
import { lazy, type ComponentProps, type ComponentType } from "react";
import type { BlobFormType } from "@/types/blobForms";
import type { BobBodyFit, Vec3, WearableMount } from "./wearableFit";

// Keep fitting metadata available without importing or downloading unused models.
const ToonWardrobe = lazy(() => import("@/3d-objects/models/toonWardrobe").then(module => ({ default: module.ToonWardrobe })));
const PlayfulWardrobe = lazy(() => import("@/3d-objects/models/playfulWardrobe").then(module => ({ default: module.PlayfulWardrobe })));
const KrustyKrabHat = lazy(() => import("@/3d-objects/models/krustyKrabHat").then(module => ({ default: module.KrustyKrabHat })));
const RoundGlasses = lazy(() => import("@/3d-objects/models/roundGlasses").then(module => ({ default: module.RoundGlasses })));
const AfroHair = lazy(() => import("@/3d-objects/models/afroHair").then(module => ({ default: module.AfroHair })));
const BuilderHelmet = lazy(() => import("@/3d-objects/models/builderHelmet").then(module => ({ default: module.BuilderHelmet })));
const ToonHat = lazy(() => import("@/3d-objects/models/toonHats").then(module => ({ default: module.ToonHat })));
const BobMoustache = lazy(() => import("@/3d-objects/models/bobMoustache").then(module => ({ default: module.BobMoustache })));
const BlackCap = lazy(() => import("@/3d-objects/models/blackCap").then(module => ({ default: module.BlackCap })));
const AstronautHelmet = lazy(() => import("@/3d-objects/models/astronaut").then(module => ({ default: module.AstronautHelmet })));
const RastaBeanie = lazy(() => import("@/3d-objects/models/rastaBeanie").then(module => ({ default: module.RastaBeanie })));

interface ModelProps {
  position: Vec3;
  scale: Vec3;
  rotation?: Vec3;
  preview: boolean;
  formType: BlobFormType;
  body: BobBodyFit;
  moustacheEquipped?: boolean;
}

export interface WearableDefinition {
  Model: ComponentType<ModelProps>;
  /** Asset units/pivot/orientation, calibrated only once on the default Ball. */
  calibration: { position: Vec3; scale: Vec3; rotation?: Vec3 };
  mount: WearableMount;
  /** Shift the whole Bob, including body and face, while this item is attached. */
  bobOffset?: Vec3;
}

const toonHat = (kind: ComponentProps<typeof ToonHat>["kind"]): ComponentType<ModelProps> =>
  function HatModel(props) { return <ToonHat {...props} kind={kind} />; };

const wardrobe = (kind: WardrobeKind): ComponentType<ModelProps> =>
  function WardrobeModel(props) { return <ToonWardrobe {...props} kind={kind} />; };

const playfulWardrobe = (kind: PlayfulWardrobeKind): ComponentType<ModelProps> =>
  function PlayfulModel(props) { return <PlayfulWardrobe {...props} kind={kind} />; };

const RainbowAfro: ComponentType<ModelProps> = (props) => <AfroHair {...props} rainbow />;

const Moustache: ComponentType<ModelProps> = ({ formType, ...props }) =>
  <BobMoustache {...props} curved={formType === "sphere" || formType === "egg"} />;

/**
 * Add a wearable by registering its model, default-Ball calibration and mount.
 * Crown bottoms are measured in calibrated Bob units, including asset offsets.
 * Decorations are deliberately absent: this catalogue contains wearables only.
 */
export const BOB_WEARABLES: Readonly<Record<string, WearableDefinition>> = {
  cigar: {
    Model: playfulWardrobe("cigar"),
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "face", eyeOffset: -.6, clearance: .025 },
  },
  bigSmile: {
    Model: playfulWardrobe("bigSmile"),
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "body" },
  },
  sleepingHat: {
    Model: playfulWardrobe("sleepingHat"),
    calibration: { position: [0, .6, 0], scale: [1, 1, 1] },
    mount: { kind: "crown", bottom: .53, scaling: "horizontal", cubeInset: .08 },
  },
  topHat: {
    Model: wardrobe("topHat"),
    calibration: { position: [0, 0.78, 0], scale: [1, 1, 1] },
    mount: { kind: "crown", bottom: 0.73, scaling: "horizontal" },
  },
  dimmadomeHat: {
    Model: wardrobe("dimmadomeHat"),
    calibration: { position: [0, 0.78, 0], scale: [1, 1, 1] },
    mount: { kind: "crown", bottom: 0.735, scaling: "horizontal", cubeInset: 0.07 },
  },
  toonSunglasses: {
    Model: wardrobe("toonSunglasses"),
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "eyes", front: 1.14, compactForward: 0.04, compactScale: 0.95 },
  },
  clownNose: {
    Model: wardrobe("clownNose"),
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "face", eyeOffset: -0.23, clearance: 0.04 },
  },
  rainbowAfro: {
    Model: RainbowAfro,
    calibration: { position: [0, -0.7, -0.05], scale: [0.9, 0.9, 0.9], rotation: [Math.PI * 0.075, 0, 0] },
    mount: { kind: "hair", bottom: -0.770111, scaling: "horizontal", cubeDepthScale: 1.5 },
  },
  builderHelmet: {
    Model: BuilderHelmet,
    calibration: { position: [0, 0.75, 0], scale: [1.22, 1.25, 1.25] },
    mount: { kind: "crown", bottom: 0.459315, scaling: "horizontal", cubeInset: 0.12 },
  },
  krustyKrabHat: {
    Model: KrustyKrabHat,
    calibration: { position: [0, 0.9, 0], scale: [0.006, 0.006, 0.006] },
    mount: { kind: "crown", bottom: 0.895456, scaling: "none" },
  },
  afroHair: {
    Model: AfroHair,
    calibration: { position: [0, -0.7, -0.05], scale: [0.9, 0.9, 0.9], rotation: [Math.PI * 0.075, 0, 0] },
    mount: { kind: "hair", bottom: -0.770111, scaling: "horizontal", cubeDepthScale: 1.5 },
  },
  chickenLittleGlasses: {
    Model: RoundGlasses,
    calibration: { position: [0, 0.1, 0.7], scale: [1.6, 1.6, 1.6] },
    mount: { kind: "eyes", front: 1.080128, compactForward: 0.05, compactScale: 0.95 },
  },
  blackCap: {
    Model: BlackCap,
    calibration: { position: [0, 0.45, 0], scale: [2, 2, 2], rotation: [0, -Math.PI / 2, 0] },
    mount: { kind: "crown", bottom: 0.322949, scaling: "horizontal", cubeInset: 0.14 },
  },
  flatCap: {
    Model: toonHat("flatCap"),
    calibration: { position: [0, 0.6, 0], scale: [1.15, 1.15, 1.15] },
    mount: { kind: "crown", bottom: 0.61725, scaling: "uniform", cubeInset: 0.10 },
  },
  bobMoustache: {
    Model: Moustache,
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "face", eyeOffset: -0.38, clearance: 0.015 },
  },
  propellerHat: {
    Model: toonHat("propellerHat"),
    calibration: { position: [0, 0.53, 0], scale: [1.15, 1.15, 1.15] },
    mount: { kind: "crown", bottom: 0.507, scaling: "horizontal", cubeInset: 0.08 },
  },
  rastaBeanie: {
    Model: RastaBeanie,
    calibration: { position: [0, -0.65, -0.1], scale: [4, 4, 4] },
    mount: { kind: "hair", scaling: "horizontal" },
  },
  wizardHat: {
    Model: toonHat("wizardHat"),
    calibration: { position: [0, 0.78, 0], scale: [1, 1, 1] },
    mount: { kind: "crown", bottom: 0.7375, scaling: "uniform", cubeInset: 0.07 },
  },
  royalCrown: {
    Model: toonHat("royalCrown"),
    calibration: { position: [0, 0.63, 0], scale: [1, 1, 1] },
    mount: { kind: "crown", bottom: 0.65, scaling: "uniform", cubeInset: 0.10 },
  },
  astronautHelmet: {
    Model: AstronautHelmet,
    bobOffset: [0, 0.18, 0],
    calibration: { position: [0, 0, 0], scale: [1, 1, 1] },
    mount: { kind: "body" },
  },
};
