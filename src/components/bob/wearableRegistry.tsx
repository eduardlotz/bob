import { ToonWardrobe, type WardrobeKind } from "@/3d-objects/models/toonWardrobe";
import type { ComponentProps, ComponentType } from "react";
import type { BlobFormType } from "@/types/blobForms";
import { KrustyKrabHat } from "@/3d-objects/models/krustyKrabHat";
import { RoundGlasses } from "@/3d-objects/models/roundGlasses";
import { AfroHair } from "@/3d-objects/models/afroHair";
import { BuilderHelmet } from "@/3d-objects/models/builderHelmet";
import { ToonHat } from "@/3d-objects/models/toonHats";
import { BobMoustache } from "@/3d-objects/models/bobMoustache";
import { BlackCap } from "@/3d-objects/models/blackCap";
import { AstronautHelmet } from "@/3d-objects/models/astronaut";
import { RastaBeanie } from "@/3d-objects/models/rastaBeanie";
import type { BobBodyFit, Vec3, WearableMount } from "./wearableFit";

interface ModelProps {
  position: Vec3;
  scale: Vec3;
  rotation?: Vec3;
  preview: boolean;
  outlineColor?: string;
  formType: BlobFormType;
  body: BobBodyFit;
}

export interface WearableDefinition {
  Model: ComponentType<ModelProps>;
  /** Asset units/pivot/orientation, calibrated only once on the default Ball. */
  calibration: { position: Vec3; scale: Vec3; rotation?: Vec3 };
  mount: WearableMount;
  /** Shift the whole Bob, including body and face, while this item is attached. */
  bobOffset?: Vec3;
  /** Preserve models that use their own outline color. Defaults to true. */
  useThemeOutline?: boolean;
}

const toonHat = (kind: ComponentProps<typeof ToonHat>["kind"]): ComponentType<ModelProps> =>
  function HatModel(props) { return <ToonHat {...props} kind={kind} />; };

const wardrobe = (kind: WardrobeKind): ComponentType<ModelProps> =>
  function WardrobeModel(props) { return <ToonWardrobe {...props} kind={kind} />; };

const RainbowAfro: ComponentType<ModelProps> = (props) => <AfroHair {...props} rainbow />;

const Moustache: ComponentType<ModelProps> = ({ formType, ...props }) =>
  <BobMoustache {...props} curved={formType === "sphere" || formType === "egg"} />;

/**
 * Add a wearable by registering its model, default-Ball calibration and mount.
 * Crown bottoms are measured in calibrated Bob units, including asset offsets.
 * Decorations are deliberately absent: this catalogue contains wearables only.
 */
export const BOB_WEARABLES: Readonly<Record<string, WearableDefinition>> = {
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
    useThemeOutline: false,
    calibration: { position: [0, -0.7, -0.05], scale: [0.9, 0.9, 0.9], rotation: [Math.PI * 0.075, 0, 0] },
    mount: { kind: "hair", bottom: -0.770111, scaling: "horizontal", cubeDepthScale: 1.5 },
  },
  builderHelmet: {
    Model: BuilderHelmet,
    useThemeOutline: false,
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
    useThemeOutline: false,
    calibration: { position: [0, -0.7, -0.05], scale: [0.9, 0.9, 0.9], rotation: [Math.PI * 0.075, 0, 0] },
    mount: { kind: "hair", bottom: -0.770111, scaling: "horizontal", cubeDepthScale: 1.5 },
  },
  chickenLittleGlasses: {
    Model: RoundGlasses,
    useThemeOutline: false,
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
