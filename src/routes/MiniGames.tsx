import { useEffect } from "react";
import { useI18n } from "@/i18n";

export default function MiniGames() {
  const { messages } = useI18n();

  useEffect(() => {
    document.title = messages.routeTitles.minigames;
  }, [messages.routeTitles.minigames]);

  return null;
}
