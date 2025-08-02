import { useEffect } from "react";

export default function Guestbook() {
  useEffect(() => {
    document.title = "Gästebuch — Eduard Lotz";
  }, []);

  return null;
}