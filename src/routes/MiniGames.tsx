import { useEffect } from "react";

export default function MiniGames() {
  useEffect(() => {
    document.title = "Mini Games — Eduard Lotz";
  }, []);

  return null;
}
