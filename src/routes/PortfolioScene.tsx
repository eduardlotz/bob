import { FileOrbit } from "@/components/FileOrbit";
import { ROUTE_PATHS, useCoreStore, useViewStore } from "@/store";

import { Stars } from "@react-three/drei";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PortfolioScene() {
  const { checkUnlockedRoutes } = useCoreStore();
  const { resetToDefaultView, setDefaultViewMode, isDefaultView } =
    useViewStore();
  const navigate = useNavigate();

  const isAllowedToAcces = checkUnlockedRoutes(ROUTE_PATHS.PORTFOLIO);

  useEffect(() => {
    if (!isAllowedToAcces) {
      console.warn("not allowd to access this route");
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAllowedToAcces]);

  useEffect(() => {
    setDefaultViewMode("object");
    setTimeout(() => {
      if (!isDefaultView()) resetToDefaultView();
    }, 300);
  }, []);

  return (
    <>
      <Stars radius={70} depth={100} count={1000} factor={3} speed={0.5} fade />
      <FileOrbit />
      <color attach="background" args={["#0e0e0e"]} />
    </>
  );
}
