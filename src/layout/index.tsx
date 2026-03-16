import { motion } from "framer-motion";
import styled from "styled-components";

export const FullScreen = styled.div`
  height: 100dvh;
  width: 100vw;
  background-color: white;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

//MAYDO: extend with generic, fine-tuned and customizable elements
export const HugRow = styled(motion.div)<{
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
  position: relative;
`;

export const HugColumn = styled(motion.div)<{
  $gap?: NumberWithMeasure;
  $align?: string;
  $justify?: string;
  $reverse?: boolean;
}>`
  display: flex;
  flex-direction: ${(p) => (p.$reverse ? "column-reverse" : "column")};
  align-items: ${(p) => (p.$align ? p.$align : "flex-start")};
  justify-content: ${(p) => (p.$justify ? p.$justify : "space-between")};
  padding: 0;
  gap: ${(p) => (p.$gap !== undefined ? p.$gap : "12px")};
`;

export const FillRow = styled(motion.div)<{
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
  gap: ${(p) => (p.$gap ? p.$gap : "0")};
  flex-wrap: ${(p) => p.$wrap && "wrap"};
`;

export const FillColumn = styled(motion.div)<{
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
  gap: ${(p) => (p.$gap ? p.$gap : "0px")};
`;

export const ContentWidth = styled(FillColumn)`
  max-width: 880px;
  margin: 0 auto;
`;

export const ListItemContainer = styled(motion.div)<{
  $gridTemplateColumns?: string;
  $gap?: NumberWithMeasure;
  $align?: string;
  $justify?: string;
  $width?: string;
}>`
  display: grid;
  grid-template-columns: ${(p) => p.$gridTemplateColumns ?? "auto 1fr"};
  align-items: center;
  width: ${(p) => p.$width ?? "100%"};
  align-items: ${(p) => (p.$align ? p.$align : "center")};
  justify-content: ${(p) => (p.$justify ? p.$justify : "space-between")};
  grid-gap: ${(p) => (p.$gap ? p.$gap : "0px")};
`;

export const ScrollArea = styled(motion.div)<{
  $direction?: "vertical" | "horizontal" | "both";
}>`
  all: inherit;
  /* overflow: ${(p) => (p.$direction === "both" ? "scroll" : "hidden")}; */
  overflow-y: ${(p) =>
    p.$direction === "vertical" || p.$direction === "both"
      ? "scroll"
      : "hidden"};
  overflow-x: ${(p) =>
    p.$direction === "horizontal" || p.$direction === "both"
      ? "scroll"
      : "hidden"};
`;
