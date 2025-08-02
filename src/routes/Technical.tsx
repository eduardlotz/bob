import { useEffect } from "react";

export default function Technical() {
  useEffect(() => {
    document.title = "Technisches — Eduard Lotz";
  }, []);

  return null;
}