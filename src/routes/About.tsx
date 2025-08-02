import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "Über mich — Eduard Lotz";
  }, []);

  return null;
}