import { useEffect } from "react";

export default function MiniGames() {
  useEffect(() => {
    document.title = "Minispiele — Eduard Lotz";
  }, []);

  return null;
}
