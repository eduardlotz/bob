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
  background-color: rgba(33, 33, 33, 0.1);
  border-radius: 0.75rem;

  color: #212121;
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
  gap: 40px;

  pointer-events: auto;
`;

export const ItemStatusChip = styled(motion.div)<{
  $variant?: "light" | "dark" | "accent" | "inverted" | "dark-accent";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  background-color: rgba(33, 33, 33, 0.1);
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
  background: rgba(33, 33, 33, 0.05);

  ${(p) =>
    p.$variant === "destructive" &&
    `
    background: rgba(255,0,0,0.2);
  `}

  h5 {
    font-size: 1rem;
    font-weight: 600;
    color: #212121;
  }

  p {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    opacity: 0.6;
    color: #212121;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0;
  width: 52px;
  height: 32px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  outline: none;
  width: ${(p) => (p.$fillRow ? "100%" : "52px")};

  background: ${(p) => (p.$active ? "#007AFF" : "rgba(33,33,33,0.1)")};

  transition: background 0.25s ease;

  span {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 26px;
    height: 26px;
    border-radius: 2rem;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

    transform: ${(p) => (p.$active ? "translateX(20px)" : "translateX(0)")};

    transition: 0.15s ease-out;
    transition-property: transform width;
    transform-origin: ${(p) => (p.$active ? "right" : "left")};
  }

  &:active span {
    width: 28px;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.4);
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

  background-color: #212121;
  color: #ffffff;

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(33, 33, 33, 0.9);
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
  bottom: calc(env(safe-area-inset-bottom) + 190px);
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100vw - 40px);
`;

export const TabPanel = styled(FillRow)`
  gap: 4px;
  border-radius: 6rem;
`;

export const TabButton = styled(motion.button)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  width: 100%;

  border: none;
  color: ${(p) => (p.$active ? "#ffffff" : "#212121")};
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  background: ${(p) => (p.$active ? "#212121" : "rgba(33,33,33,0.05)")};

  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(33,33,33,0.9)" : "rgba(33,33,33,0.1)"};
    /* color: ${(p) =>
      p.$active ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)"}; */
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
  gap: 0.75rem;
  padding: 4px;
  border-radius: 50px;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  > div > div {
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

  height: 2.5rem;
  width: 2.5rem;

  border-radius: 20rem;
  /* background: var(--blob-color); */
  background: transparent;
  color: white;
  transition: background-color 0.1s ease-out;
  z-index: 0;

  svg {
    height: 1.5rem;
    width: 1.5rem;
  }

  &:hover {
    background-color: rgba(33, 33, 33, 0.1);
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
    p.$selected ? "rgba(33, 33, 33, 0.2)" : "#4178F7"};

  color: ${(p) => (p.$selected ? "#ffffff" : "#ffffff")};
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
  min-width: 180px;

  &:hover {
    background-color: ${(p) =>
      p.$selected ? "rgba(33,33,33,0.5)" : "#376ae0"};
  }
`;

export const StatusPillButton = styled(motion.button)<{ $active: boolean }>`
  font-size: 1rem;
  color: ${(p) => (p.$active ? "#4178F7" : "#21212178")};
  background: ${(p) =>
    p.$active ? "rgba(65, 120, 247, 0.1)" : "rgba(33, 33, 33, 0.1)"};
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;

  > * {
    height: 1.25rem;
  }
`;

// segmented control -- unfinished

export const SegmentedControl = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(118, 118, 128, 0.12);
  border-radius: 20rem;
  padding: 2px;
  width: 100%;
  position: relative;
`;

export const SegmentedTrack = styled.div`
  display: flex;
  width: 100%;
  position: relative;
`;

export const SegmentedThumb = styled(motion.div)`
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 20rem;
  background: #ffffff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08);
`;

export const SegmentedOption = styled.button<{ $active: boolean }>`
  flex: 1;
  z-index: 1;
  position: relative;
  padding: 6px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? "#000000" : "#3c3c43")};
  transition:
    color 0.2s ease,
    font-weight 0.2s ease;
  border-radius: 20rem;
  white-space: nowrap;
`;
