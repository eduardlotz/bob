import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import { ViewControls } from "@/molecules/ViewControls";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppStore } from "@/store";

export default function MainLayout({ children }: any) {
  const { permissionGranted, setIsMobile } = useAppStore();

  useEffect(() => {
    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;

    setIsMobile(isMobile);
  }, []);

  return (
    <Container>
      <SceneWithLoader permissionGranted={permissionGranted} />
      <ViewControls />
      {children}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
`;
