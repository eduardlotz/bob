import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "Eduard Lotz";
  }, []);

  return null; // Scene is rendered in MainLayout
}
