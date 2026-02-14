import { FillRow } from "@/layout";
import { motion } from "motion/react";
import styled from "styled-components";

export const AppInfo = styled.p`
  opacity: 0.5;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;

  font-size: 0.75rem;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;

  color: #ffffff;
  font-weight: 600;
  word-break: keep-all;
  white-space: nowrap;
`;

// TODO: refactor/split + design system
export const ShopContainer = styled(motion.div)`
  width: 300px;
  padding: 4px;
  max-width: 100%;

  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;

  pointer-events: auto;
`;

export const ItemStatusChip = styled(motion.div)<{
  $variant?: "light" | "dark" | "accent" | "inverted" | "dark-accent";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  background-color: #ffff54;
  color: #212121;

  font-size: 0.875rem;
  font-weight: 900;
  height: 1.375rem;

  padding: 4px 8px;
  border-radius: 0.625rem;
  box-shadow:
    0px 0.5px 2px rgba(0, 0, 0, 0.07),
    0 1.5px 5px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  // TODO: move to reset.scss and check padding
  span {
    line-height: 1.25;
  }

  ${(p) =>
    p.$variant === "light" &&
    `
    background-color: #fff;
    color: #212121;
    
  `}

  ${(p) =>
    p.$variant === "inverted" &&
    `
    background-color: rgba(0,0,0,0.25);
    color: #fff;
    font-weight: 700;
  `}
  
  ${(p) =>
    p.$variant === "dark" &&
    `
    background-color: #212121;
    color: white;
    gap: 0.25rem;

    font-weight: 700;
    span:nth-child(2) {opacity: 0.5;font-weight: 500;}
  `}
 
 ${(p) =>
    p.$variant === "dark-accent" &&
    `
    color: var(--accent-color);
    border: 1.5px solid var(--accent-color);
    background-color: #212121;
    
    gap: 0.25rem;
    padding: 0 0.75rem;
    height: 2rem;
    border-radius: 20px;
    
    font-weight: 700;
  `}

${(p) =>
    p.$variant === "accent" &&
    `
    background-color: var(--secondary-color);
    color: var(--text-color);
    border: 1.5px solid var(--text-color);
    gap: 0.25rem;
    
    font-weight: 700;

  `}
`;

export const SettingsWrapper = styled(FillRow)<{
  $variant?: "destructive" | "default";
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  padding: 1rem;
  pointer-events: auto;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.05);

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background: rgba(255,0,0,0.2);
  `}

  h5 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    opacity: 0.6;
    color: var(--text-color);
  }

  b {
    font-weight: 600;
    opacity: 1;
  }
`;

export const ToggleButton = styled(motion.button)<{
  $active: boolean;
  $fillRow?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background: ${(p) =>
    p.$active ? "var(--text-color)" : "rgba(255, 255, 255, 0.1)"};
  border: none;
  color: ${(p) => (p.$active ? "var(--primary-color)" : "#ffffff")};
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  width: ${(p) => (p.$fillRow ? "100%" : "auto")};

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--text-color)" : "rgba(147, 147, 147, 0.25)"};
  }
`;

export const ActionButton = styled(motion.button)<{
  $variant?: "destructive" | "default";
}>`
  display: flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;

  background-color: #fff;
  color: #212121;

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
  }

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background-color: #ff0000;
    color: #ffffff;

     &:hover:not(:disabled) {
      background: #d60000
  }
  `}
`;

export const FixedAnchor = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom) + 188px);
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100vw - 40px);
`;

export const TabPanel = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 4px;
  background: var(--primary-color);
  width: 100%;
  border-radius: 6rem;
`;

export const TabButton = styled(motion.button)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border: none;
  color: ${(p) => (p.$active ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)")};
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.05)"};

  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)"};
    color: ${(p) => (p.$active ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)")};
  }
`;

export const ContentControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  margin: 0 auto;
`;

export const PaginationDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  border-radius: 50px;
  background: rgba(0, 0, 0, 0.15);

  > * {
    height: 8px;
    width: 8px;
    background: #fff;
    opacity: 0.25;
    border-radius: 50px;
  }
`;

export const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 3rem;
  width: 3rem;

  border-radius: 1rem;
  background: var(--blob-color);
  color: var(--outline-color);
  box-shadow:
    0px 0px 4px rgba(0, 0, 0, 0.15),
    0px 0px 8px rgba(0, 0, 0, 0.1);
  z-index: 0;

  svg {
    height: 20px;
    width: 20px;
  }

  &:disabled {
    opacity: 0.25;
  }
`;

export const ShopItemButton = styled(motion.button)<{
  $selected: boolean;
  $purchased: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0.5rem 0.75rem;
  border-radius: 0.875rem;

  background-color: ${(p) =>
    p.$selected ? "rgba(255,255,255,1)" : "rgba(0,0,0,0.25)"};
  color: ${(p) => (p.$selected ? "#212121" : "#ffffff")};
  border: ${(p) =>
    p.$selected
      ? "2px solid rgba(255,255,255,0)"
      : p.$purchased
        ? "2px solid rgba(255,255,255,0.5)"
        : "2px solid transparent"};
  font-size: 1rem;
  font-weight: 600;

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: ${(props) => (props.$purchased || props.$canAfford ? 1 : 0.5)};

  width: fit-content;

  &:hover {
    background-color: ${(p) =>
      p.$selected ? "rgba(255,255,255,1)" : "rgba(0,0,0,0.5)"};
  }
`;

export const StatusPillButton = styled(motion.button)<{ $active: boolean }>`
  font-size: 1rem;
  color: ${(p) =>
    p.$active ? "rgba(255,255,255,1)" : "rgba(255,255,255,.75)"};
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.25)"};
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;

  > * {
    height: 1.25rem;
  }
`;
