import { FileOrbit } from "@/components/FileOrbit";
import { ROUTE_PATHS, useCoreStore } from "@/store";
import { useAppStore } from "@/store";
import { useViewStore } from "@/store/viewStore";

import { Stars } from "@react-three/drei";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PortfolioScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const navigate = useNavigate();
  const showOptions = useAppStore((state) => state.showOptions);
  const currentView = useViewStore((state) => state.currentView);

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.PORTFOLIO);
  const showHeavyPortfolioLayer = !showOptions && currentView === "portfolio";

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  return (
    <>
      <Stars radius={70} depth={100} count={1000} factor={3} speed={0.5} fade />
      {showHeavyPortfolioLayer && <FileOrbit />}
      <color attach="background" args={["#0e0e0e"]} />
    </>
  );
}
