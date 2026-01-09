import { useEffect } from "react";

export default function Creative() {
  useEffect(() => {
    document.title = "Kreatives — Eduard Lotz";
  }, []);

  return null;
}
