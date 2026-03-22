import { useEffect } from "react";
import { useI18n } from "@/i18n";

export default function Home() {
  const { messages } = useI18n();

  useEffect(() => {
    document.title = messages.routeTitles.home;
  }, [messages.routeTitles.home]);

  return null; // Scene is rendered in MainLayout
}
