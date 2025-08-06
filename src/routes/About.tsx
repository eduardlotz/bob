import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "About — Eduard Lotz";
  }, []);

  return null; // Scene is rendered in MainLayout
}
