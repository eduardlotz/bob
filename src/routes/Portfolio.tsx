import { useEffect } from "react";
import { useI18n } from "@/i18n";

export default function Portfolio() {
  const { messages } = useI18n();

  useEffect(() => {
    document.title = messages.routeTitles.portfolio;
  }, [messages.routeTitles.portfolio]);

  return null;
}
