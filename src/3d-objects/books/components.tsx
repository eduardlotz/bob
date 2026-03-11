import { HugRow } from "@/layout";
import { motion } from "motion/react";
import { css, styled } from "styled-components";

const PANEL_W = "340px";

export const Panel = styled(motion.aside)<{ $mobile: boolean }>`
  position: fixed;
  z-index: 40;
  pointer-events: auto;

  border-radius: 20px;
  background: #f2f2f3;

  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${({ $mobile }) =>
    $mobile
      ? css`
          left: 0;
          right: 0;
          bottom: 0;
          height: 60vh;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.22);
        `
      : css`
          top: 4px;
          right: 4px;
          bottom: 4px;
          margin: auto 4rem;
          width: ${PANEL_W};
          max-width: 90vw;
          height: 72vh;
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
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  z-index: 10;

  width: 48px;
  height: 40px;
  border-radius: 10rem;
  background: rgba(33, 33, 33, 0.1);
  border: none;
  font-size: 1.15rem;
  color: #212121;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  svg {
    width: 24px;
    height: 24px;
  }

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

export const HeartsContainer = styled(HugRow)`
  padding: 4px;
  border-radius: 20rem;
  background-color: rgba(33, 33, 33, 0.05);
  gap: 0;
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
  font-size: 1.5rem;
  font-weight: 900;
  color: #212121;
  letter-spacing: -1.5%;
  margin: 0;
  line-height: 1.15;
  max-width: 80%;
  hyphens: auto;
`;

export const HeroAuthor = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #212121;
  opacity: 0.6;
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
  /* padding: 0.25rem 0.625rem; */

  padding: 0.25rem 0.5rem 0.25rem 0.425rem;
  border-radius: 20rem;
  font-size: 0.75rem;
  font-weight: 700;
  /* background: ${({ $bg }) => $bg}; */
  background: rgba(33, 33, 33, 0.1);
  /* color: ${({ $fg }) => $fg}; */
  color: #212121;
  /* border: 1px solid ${({ $bd }) => $bd}; */
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  /* border: 1.5px solid #212121; */
  background: #f2f2f3;
  /* backdrop-filter: blur(12px); */
  color: #212121;
  cursor: pointer;

  svg {
    width: 24px;
    height: 24px;
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
      ${$side === "left" ? "left: 20vw;" : `right: calc(${PANEL_W} + 18vw);`}
      &:active {
        transform: translateY(-50%) scale(0.93);
      }
    `;
  }}
`;
