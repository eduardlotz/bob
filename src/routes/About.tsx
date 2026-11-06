import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { AnimatePresence } from "motion/react";
import { useCoreStore } from "@/store";
import { BookPortalOverlay } from "@/3d-objects/books/overlay";
import { SocialsPortalOverlay } from "@/3d-objects/socials/overlay";

export default function About() {
  const { messages } = useI18n();
  const ready = useCoreStore(state => state.isReady);

  useEffect(() => {
    document.title = messages.routeTitles.about;
  }, [messages.routeTitles.about]);

  return ready ? <AnimatePresence>
    <SocialsPortalOverlay key="socials" />
    <BookPortalOverlay key="books" />
  </AnimatePresence> : null;
}
