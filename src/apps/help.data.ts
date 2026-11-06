import type { Locale } from "@/i18n/types";

export type HelpTopicId = "taps" | "upgrades" | "quests" | "rewards" | "bob" | "shape" | "shop" | "preview" | "camera" | "photos" | "settings" | "sound";
interface HelpEntry {
  question: string;
  answer: string;
  next: HelpTopicId[];
}
export const HELP_START_TOPICS: HelpTopicId[] = ["taps", "quests", "bob", "shop", "camera", "settings"];
export const helpCopy = {
  en: {
    greeting: "Hey! Need a hand? Pick a question and we’ll take it from there.",
    topics: "What would you like to know?",
    more: "Another topic",
    conversation: "Help conversation",
    writing: "Bob is typing",
  },
  de: {
    greeting: "Hey! Brauchst du Hilfe? Wähle eine Frage und wir schauen zusammen weiter.",
    topics: "Was möchtest du wissen?",
    more: "Anderes Thema",
    conversation: "Hilfegespräch",
    writing: "Bob schreibt",
  },
};

export const helpDataset: Record<Locale, Record<HelpTopicId, HelpEntry>> = {
  en: {
    taps: {
      question: "How do I earn taps?",
      answer: "Tap Bob on Home to collect taps. Spend them on upgrades, shop items, or new places in the menu. Upgrades can increase what each tap earns and add automatic taps.",
      next: ["upgrades", "shop", "quests"],
    },
    upgrades: {
      question: "How do upgrades work?",
      answer: "You’ll find upgrades at the bottom of Home when the menu and phone are closed. Tap upgrades increase your earnings per tap; automatic upgrades earn taps over time. Each level shows its price and effect, and more upgrades appear as you progress.",
      next: ["taps", "quests"],
    },
    quests: {
      question: "What can I do with quests?",
      answer: "Open Quests on the phone to see your tasks and progress. Some are about tapping or upgrades, others reward exploring and interacting with things. Check a quest’s description for what to do next.",
      next: ["rewards", "upgrades", "shop"],
    },
    rewards: {
      question: "How do I collect quest rewards?",
      answer: "Quest rewards are applied automatically when you complete the task. Depending on the quest, you can receive taps or unlock an item, shape, or skin. Some skins stay locked until you discover and complete their hidden quest.",
      next: ["quests", "bob", "shop"],
    },
    bob: {
      question: "How can I customize Bob?",
      answer: "The Bob app is for changing Bob’s shape. For hats, skins, accessories, tap effects, and worlds, open Shop. You can combine your shape with the things you own.",
      next: ["shape", "shop", "preview"],
    },
    shape: {
      question: "How do I change Bob’s shape?",
      answer: "Open Bob on the phone, choose an available shape, and use the controls around Bob to adjust it. The reset action restores the shape’s parameters. Some shapes need to be unlocked first.",
      next: ["bob", "rewards"],
    },
    shop: {
      question: "Where is the shop?",
      answer: "Shop now has its own phone app. Browse hats, skins, accessories, effects, and worlds using the categories at the bottom. Buy items with taps, then equip what you own. Your balance is shown above the catalogue.",
      next: ["preview", "rewards", "taps"],
    },
    preview: {
      question: "Can I try an item before buying?",
      answer: "Yes! Tap the eye beside an item to preview it on Bob or in the world. Use the arrows to browse, then buy or equip it if you like. Back to Shop returns to the catalogue; leaving a preview clears the temporary look.",
      next: ["shop", "bob"],
    },
    camera: {
      question: "How do I take a photo?",
      answer: "Open Camera, frame Bob with the scene controls, then press the red shutter button. The photo goes to your gallery. Use the small gallery button in Camera or open Photos directly from the phone.",
      next: ["photos", "bob"],
    },
    photos: {
      question: "Where are my photos saved?",
      answer: "Camera and Photos share the same gallery in this browser. Open a photo to download or delete it. There’s room for up to 24 photos or 3 MB; download photos you want to keep before making space. Photos opens straight into the gallery, with no camera toggle.",
      next: ["camera", "settings"],
    },
    settings: {
      question: "What can I change in Options?",
      answer: "Options lets you switch between English and German, adjust sound volumes, and change visual preferences such as tap animations, particles, outlines, and fisheye. You can change these whenever you like.",
      next: ["sound", "photos"],
    },
    sound: {
      question: "How do I turn sound on or off?",
      answer: "Use the sound switch at the top of the phone’s home screen. Green means sound is on; gray means it’s off. For a finer mix, open Options and adjust the master, music, effects, UI, and message volumes.",
      next: ["settings", "taps"],
    },
  },
  de: {
    taps: {
      question: "Wie sammle ich Taps?",
      answer: "Tippe auf Bob auf der Startseite, um Taps zu sammeln. Damit kaufst du Upgrades, Shop-Artikel oder neue Orte im Menü. Upgrades erhöhen deinen Ertrag pro Tap und können automatisch Taps sammeln.",
      next: ["upgrades", "shop", "quests"],
    },
    upgrades: {
      question: "Wie funktionieren Upgrades?",
      answer: "Upgrades findest du unten auf der Startseite, wenn Menü und Phone geschlossen sind. Tap-Upgrades erhöhen deinen Ertrag pro Tap; automatische Upgrades sammeln mit der Zeit Taps. Jede Stufe zeigt ihren Preis und Effekt. Mit deinem Fortschritt erscheinen weitere Upgrades.",
      next: ["taps", "quests"],
    },
    quests: {
      question: "Was kann ich mit Quests machen?",
      answer: "Öffne Quests auf dem Phone, um Aufgaben und Fortschritt zu sehen. Manche drehen sich um Taps oder Upgrades, andere ums Erkunden und Entdecken. In der Beschreibung steht, was als Nächstes zu tun ist.",
      next: ["rewards", "upgrades", "shop"],
    },
    rewards: {
      question: "Wie bekomme ich Quest-Belohnungen?",
      answer: "Belohnungen erhältst du automatisch, sobald du eine Quest abschließt. Je nach Aufgabe bekommst du Taps oder schaltest einen Artikel, eine Form oder einen Skin frei. Manche Skins bleiben gesperrt, bis du ihre geheime Quest entdeckst und abschließt.",
      next: ["quests", "bob", "shop"],
    },
    bob: {
      question: "Wie kann ich Bob anpassen?",
      answer: "In der Bob-App veränderst du Bobs Form. Hüte, Skins, Accessoires, Tap-Effekte und Welten findest du im Shop. Deine Form lässt sich mit den Dingen kombinieren, die du besitzt.",
      next: ["shape", "shop", "preview"],
    },
    shape: {
      question: "Wie ändere ich Bobs Form?",
      answer: "Öffne Bob auf dem Phone, wähle eine verfügbare Form und passe sie mit den Reglern rund um Bob an. Zurücksetzen stellt die Parameter der Form wieder her. Manche Formen musst du erst freischalten.",
      next: ["bob", "rewards"],
    },
    shop: {
      question: "Wo ist der Shop?",
      answer: "Der Shop hat jetzt eine eigene Phone-App. Unten wechselst du zwischen Hüten, Skins, Accessoires, Effekten und Welten. Kaufe Artikel mit Taps und rüste Dinge aus, die du besitzt. Dein Guthaben steht über dem Katalog.",
      next: ["preview", "rewards", "taps"],
    },
    preview: {
      question: "Kann ich Artikel vor dem Kauf ausprobieren?",
      answer: "Ja! Tippe auf das Auge neben einem Artikel, um ihn an Bob oder in der Welt anzusehen. Mit den Pfeilen blätterst du weiter und kannst Artikel kaufen oder ausrüsten. Zurück zum Shop bringt dich zum Katalog. Beim Verlassen wird die vorübergehende Vorschau entfernt.",
      next: ["shop", "bob"],
    },
    camera: {
      question: "Wie mache ich ein Foto?",
      answer: "Öffne Kamera, richte das Bild mit der Szenensteuerung aus und drücke auf den roten Auslöser. Das Foto landet in deiner Galerie. Du erreichst sie über den kleinen Galerie-Button in der Kamera oder direkt über Fotos auf dem Phone.",
      next: ["photos", "bob"],
    },
    photos: {
      question: "Wo werden meine Fotos gespeichert?",
      answer: "Kamera und Fotos teilen sich eine Galerie in diesem Browser. Öffne ein Foto, um es herunterzuladen oder zu löschen. Es gibt Platz für bis zu 24 Fotos oder 3 MB. Lade Fotos, die du behalten möchtest, herunter, bevor du Platz schaffst. Fotos öffnet direkt die Galerie, ohne Kamera-Umschalter.",
      next: ["camera", "settings"],
    },
    settings: {
      question: "Was kann ich in Optionen ändern?",
      answer: "Hier wechselst du zwischen Deutsch und Englisch, passt Lautstärken an und änderst visuelle Optionen wie Tap-Animationen, Partikel, Konturen und Fisheye. Du kannst alles jederzeit anpassen.",
      next: ["sound", "photos"],
    },
    sound: {
      question: "Wie schalte ich den Ton ein oder aus?",
      answer: "Nutze den Sound-Schalter oben auf der Phone-Startseite. Grün bedeutet an, Grau bedeutet aus. Für einzelne Lautstärken öffnest du Optionen: Dort regelst du Gesamtlautstärke, Musik, Effekte, UI und Nachrichten.",
      next: ["settings", "taps"],
    },
  },
};
