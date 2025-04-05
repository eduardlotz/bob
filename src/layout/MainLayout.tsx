import { SceneWithLoader } from "@/molecules/SceneWithLoader";
import styled from "styled-components";

export default function MainLayout({ children }: any) {
  return (
    <Container>
      <Background>
        <SceneWithLoader />
      </Background>
      <Overlay>{children}</Overlay>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
`;

const Overlay = styled.div`
  position: relative;
  z-index: 10;
`;
