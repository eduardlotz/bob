import { useMemo } from "react";

export const useIsMobile = () => {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return typeof screen.orientation !== "undefined";
  }, []);
};
