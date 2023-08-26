import styled from "styled-components";

export const FullScreen = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: white;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

//MAYDO: extend with generic, fine-tuned and customizable elements
export const HugRow = styled.div<{
  $gap?: NumberWithMeasure;
  $align?: string;
  $justify?: string;
  $padding?: string;
  $wrap?: boolean;
}>`
  display: flex;
  align-items: ${(p) => (p.$align ? p.$align : "center")};
  justify-content: ${(p) => (p.$justify ? p.$justify : "space-between")};
  padding: ${(p) => (p.$padding ? p.$padding : "0px")};
  gap: ${(p) => (p.$gap ? p.$gap : "20px")};
  flex-wrap: ${(p) => p.$wrap && "wrap"};
`;

export const HugColumn = styled.div<{
  $gap?: NumberWithMeasure;
  $align?: string;
}>`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$align ? p.$align : "flex-start")};

  padding: 0;
  gap: ${(p) => (p.$gap ? p.$gap : "12px")};
`;

export const FillRow = styled.div<{
  $gap?: NumberWithMeasure;
  $align?: string;
  $justify?: string;
  $padding?: string;
  $wrap?: boolean;
}>`
  display: flex;
  align-items: ${(p) => (p.$align ? p.$align : "center")};
  justify-content: ${(p) => (p.$justify ? p.$justify : "space-between")};
  width: 100%;
  max-width: 100%;

  padding: ${(p) => (p.$padding ? p.$padding : "0px")};
  gap: ${(p) => (p.$gap ? p.$gap : "auto")};
  flex-wrap: ${(p) => p.$wrap && "wrap"};
`;

export const FillColumn = styled.div<{
  $gap?: NumberWithMeasure;
  $align?: string;
  $justify?: string;
  $padding?: string;
}>`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$align ? p.$align : "center")};
  justify-content: ${(p) => (p.$justify ? p.$justify : "space-between")};

  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;

  padding: ${(p) => (p.$padding ? p.$padding : "0px")};
  gap: ${(p) => (p.$gap ? p.$gap : "auto")};
`;

export const ContentWidth = styled(FillColumn)`
  max-width: 880px;
  margin: 0 auto;
`;
