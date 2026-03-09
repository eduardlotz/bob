import { motion } from "motion/react";
import { css, styled } from "styled-components";

const PANEL_W = "340px";

export const Panel = styled(motion.aside)<{ $mobile: boolean }>`
  position: fixed;
  z-index: 40;
  pointer-events: auto;
  background: rgba(248, 246, 241, 0.97);
  backdrop-filter: blur(30px) saturate(1.6);
  -webkit-backdrop-filter: blur(30px) saturate(1.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${({ $mobile }) =>
    $mobile
      ? css`
          left: 0;
          right: 0;
          bottom: 0;
          height: 72vh;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.22);
        `
      : css`
          top: 0;
          right: 0;
          bottom: 0;
          width: ${PANEL_W};
          max-width: 90vw;
          border-left: 1px solid rgba(0, 0, 0, 0.07);
          box-shadow: -10px 0 52px rgba(0, 0, 0, 0.13);
        `}
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
`;

export const HeaderTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 1px;
  background: none;
  border: none;
  color: #007aff;
  font-size: 0.96rem;
  cursor: pointer;
  padding: 0;
  svg {
    width: 16px;
    height: 16px;
    color: #007aff;
  }
`;

export const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  font-size: 1.15rem;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.14);
  }
`;

export const PanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
`;

export const PanelFooter = styled.div`
  flex-shrink: 0;
  padding: 10px 16px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
`;

export const FooterNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const FooterBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #444;
  transition: background 0.15s;
  svg {
    width: 14px;
    height: 14px;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.09);
  }
`;

export const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  max-width: 180px;
`;

export const StackListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const StackMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  .name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #111;
  }
  .count {
    font-size: 0.75rem;
    color: #999;
  }
`;

export const ChevronIcon = styled.div`
  svg {
    width: 14px;
    height: 14px;
    color: #ccc;
  }
`;

export const BookListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const BookItemMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  .title {
    font-size: 0.83rem;
    font-weight: 600;
    color: #222;
  }
  .author {
    font-size: 0.72rem;
    color: #999;
  }
`;

export const HeroRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 4px;
`;

export const HeartsRow = styled.div`
  display: flex;
  gap: 3px;
`;

export const Heart = styled.span<{ $on: boolean }>`
  font-size: 14px;
  color: ${({ $on }) => ($on ? "#FF3B30" : "rgba(0,0,0,.1)")};
`;

export const HeroTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
  margin: 0;
  line-height: 1.3;
`;

export const HeroAuthor = styled.p`
  font-size: 0.8rem;
  color: #888;
  margin: 0;
`;

export const Rule = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: 14px 0;
`;

export const SectionLabel = styled.p`
  font-size: 0.59rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #aaa;
  margin: 0 0 6px;
`;

export const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

export const TagPill = styled.span<{ $bg: string; $fg: string; $bd: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 500;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 1px solid ${({ $bd }) => $bd};
`;

export const ReviewText = styled.p`
  font-size: 0.78rem;
  line-height: 1.72;
  color: #555;
  font-style: italic;
  margin: 0;
`;

export const FloatArrow = styled(motion.button)<{
  $side: "left" | "right";
  $mobile: boolean;
}>`
  position: fixed;
  z-index: 41;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(14, 12, 8, 0.52);
  backdrop-filter: blur(14px);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
  svg {
    width: 18px;
    height: 18px;
  }
  &:hover {
    background: rgba(35, 28, 18, 0.7);
    border-color: rgba(255, 255, 255, 0.4);
  }

  ${({ $side, $mobile }) => {
    if ($mobile)
      return css`
        bottom: calc(72vh + 1.5rem);
        ${$side === "left" ? "left: 1.25rem;" : "right: 1.25rem;"}
      `;
    return css`
      top: 50%;
      transform: translateY(-50%);
      ${$side === "left"
        ? "left: 1.25rem;"
        : `right: calc(${PANEL_W} + 1.25rem);`}
      &:active {
        transform: translateY(-50%) scale(0.93);
      }
    `;
  }}
`;
