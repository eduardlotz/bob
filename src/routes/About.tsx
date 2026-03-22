import { useEffect } from "react";
import { useI18n } from "@/i18n";

export default function About() {
  const { messages } = useI18n();

  useEffect(() => {
    document.title = messages.routeTitles.about;
  }, [messages.routeTitles.about]);

  return null; // Scene is rendered in MainLayout
}
