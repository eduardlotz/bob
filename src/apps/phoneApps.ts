import type { ComponentType } from "react";
import { createLazyModule } from "@/utils/lazyModule";

export const PHONE_APP_IDS = ["camera", "photos", "help", "bob", "quests", "shop", "credits", "settings", "debug"] as const;
export type PhoneAppId = (typeof PHONE_APP_IDS)[number];

export interface PhoneAppModule {
  View: ComponentType<{ onPreviewChange: (preview: boolean) => void; galleryOnly?: boolean }>;
  Action?: ComponentType;
}

// Camera and Photos use the same implementation and share one download/cache.
const camera = createLazyModule<PhoneAppModule>(() => import("./camera").then(module => ({ View: module.CameraApp })));

export const PHONE_APP_MODULES = {
  camera,
  photos: camera,
  help: createLazyModule<PhoneAppModule>(() => import("./help").then(module => ({ View: module.HelpApp }))),
  bob: createLazyModule<PhoneAppModule>(() => import("./bob").then(module => ({ View: module.BobApp, Action: module.BobResetButton }))),
  quests: createLazyModule<PhoneAppModule>(() => import("./quests").then(module => ({ View: module.QuestsApp, Action: module.QuestsCompletionChip }))),
  shop: createLazyModule<PhoneAppModule>(() => import("./shop").then(module => ({ View: module.ShopApp, Action: module.ShopBalance }))),
  credits: createLazyModule<PhoneAppModule>(() => import("./credits").then(module => ({ View: module.CreditsApp }))),
  settings: createLazyModule<PhoneAppModule>(() => import("./options").then(module => ({ View: module.OptionsApp }))),
  debug: createLazyModule<PhoneAppModule>(() => import("./debug").then(module => ({ View: module.DebugApp }))),
} satisfies Record<PhoneAppId, ReturnType<typeof createLazyModule<PhoneAppModule>>>;
