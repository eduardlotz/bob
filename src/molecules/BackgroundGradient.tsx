import { useRoute } from "@/contexts/RouteContext";
import styled from "styled-components";

export function BackgroundGradient() {
  const { currentRoute } = useRoute();

  return (
    <GradientOverlay
      style={{
        background: currentRoute.backgroundGradient,
      }}
    />
  );
}

const GradientOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0.3;
  transition: background 0.5s ease-in-out;
`; 