import { cameraMessages } from "@/apps/camera.messages";
import { chatMessages } from "@/apps/chat.messages";
import { creditsMessages } from "@/apps/credits.messages";
import { optionsMessages } from "@/apps/options.messages";
import { questsMessages } from "@/apps/quests.messages";
import { shopMessages } from "@/apps/shop.messages";
import { booksMessages } from "@/3d-objects/books/books.messages";
import { musicMessages } from "@/layout/game-ui/music.messages";
import { mainMessages } from "@/main.messages";
import { bobPhoneMessages } from "@/molecules/BobPhone.messages";
import { bottomNavigationMessages } from "@/molecules/BottomNavigation.messages";
import { sceneWithLoaderMessages } from "@/molecules/SceneWithLoader.messages";
import { routeTitlesMessages } from "@/routes/routeTitles.messages";
import { routeMessages } from "@/store/config/routes.messages";
import { themeMessages } from "@/store/config/themes.messages";
import { commonUiMessages } from "@/ui/common.messages";
import { defineMessages } from "./defineMessages";

export const i18nRegistry = defineMessages({
  de: {
    books: booksMessages.de,
    camera: cameraMessages.de,
    chat: chatMessages.de,
    credits: creditsMessages.de,
    main: mainMessages.de,
    music: musicMessages.de,
    navigation: bottomNavigationMessages.de,
    options: optionsMessages.de,
    phone: bobPhoneMessages.de,
    quests: questsMessages.de,
    routes: routeMessages.de,
    routeTitles: routeTitlesMessages.de,
    shop: shopMessages.de,
    themes: themeMessages.de,
    loader: sceneWithLoaderMessages.de,
    ui: commonUiMessages.de,
  },
  en: {
    books: booksMessages.en,
    camera: cameraMessages.en,
    chat: chatMessages.en,
    credits: creditsMessages.en,
    main: mainMessages.en,
    music: musicMessages.en,
    navigation: bottomNavigationMessages.en,
    options: optionsMessages.en,
    phone: bobPhoneMessages.en,
    quests: questsMessages.en,
    routes: routeMessages.en,
    routeTitles: routeTitlesMessages.en,
    shop: shopMessages.en,
    themes: themeMessages.en,
    loader: sceneWithLoaderMessages.en,
    ui: commonUiMessages.en,
  },
});

export type I18nMessages = (typeof i18nRegistry)["de"];
