import { usePagination } from "@/hooks/usePagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillRow, HugColumn } from "@/layout";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import {
  CameraViewId,
  getShopItemType,
  ShopItem,
  useGameStore,
  useViewStore,
} from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { match } from "ts-pattern";

export const DebugIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#CEAE91"
      stroke="#91765D"
      strokeWidth={2}
    />
    <path
      d="M22.8164 46.2725H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 46.2725H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22.8164 34.5625H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 34.5625H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      fill="#F0D5BD"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M40.3359 43.2979H44.4724"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const APP_ID: CameraViewId = "phone:debug";

export const DebugApp = () => {
  const { statisticsVisible, toggleStatistics } = useGameStore();

  return (
    <SettingsWrapper>
      <h5>Performance Monitor</h5>

      <ToggleButton $active={statisticsVisible} onClick={toggleStatistics}>
        {statisticsVisible ? "AN" : "AUS"}
      </ToggleButton>
    </SettingsWrapper>
  );
};

const SettingsWrapper = styled(FillRow)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: auto;
  border-radius: 1.25rem;

  h5 {
    font-size: 1rem;
    font-weight: 600;
  }
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: none;
  color: #212121;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  opacity: ${(p) => (p.$active ? 1 : 0.5)};

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;
