import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { motion } from "motion/react";
import { useGameStore } from "@/store/gameStore";
import { MigrationDebugger } from "@/components/MigrationDebugger";
import StorageDebugger from "@/components/StorageDebugger";

interface StatisticsProps {
  visible: boolean;
}

interface PerformanceStats {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  renderTime: number;
  frameCount: number;
}

export function Statistics({ visible }: StatisticsProps) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memory: { used: 0, total: 0 },
    renderTime: 0,
    frameCount: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!visible) return;

    let animationFrameId: number;

    const updateStats = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;

      frameCountRef.current++;

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        fpsRef.current.push(fps);
        if (fpsRef.current.length > 10) {
          fpsRef.current.shift();
        }

        const avgFps = Math.round(
          fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
        );

        // Get memory info if available
        const memory = (performance as any).memory
          ? {
              used: Math.round(
                (performance as any).memory.usedJSHeapSize / 1024 / 1024
              ),
              total: Math.round(
                (performance as any).memory.totalJSHeapSize / 1024 / 1024
              ),
            }
          : { used: 0, total: 0 };

        setStats({
          fps: avgFps,
          memory,
          renderTime: deltaTime,
          frameCount: frameCountRef.current,
        });

        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateStats);
    };

    animationFrameId = requestAnimationFrame(updateStats);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <StatsContainer
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <StatsHeader>Performance Statistics</StatsHeader>

      <StatsGrid>
        <StatItem>
          <StatLabel>FPS</StatLabel>
          <StatValue
            $color={
              stats.fps > 50
                ? "#4CAF50"
                : stats.fps > 30
                ? "#FF9800"
                : "#F44336"
            }
          >
            {stats.fps}
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>Memory</StatLabel>
          <StatValue $color="#2196F3">
            {stats.memory.used}MB / {stats.memory.total}MB
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>Frame Time</StatLabel>
          <StatValue $color="#9C27B0">
            {stats.renderTime.toFixed(1)}ms
          </StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>Frames</StatLabel>
          <StatValue $color="#607D8B">{stats.frameCount}</StatValue>
        </StatItem>
      </StatsGrid>

      <GameStatsSection>
        <StatsHeader>Game Statistics</StatsHeader>
        <GameStats />
      </GameStatsSection>
    </StatsContainer>
  );
}

// Helper function to format numbers with proper rounding down
function formatNumber(num: number): string {
  if (num < 1000) {
    return Math.floor(num).toString();
  } else if (num < 1000000) {
    return Math.floor(num / 1000) + "k";
  } else if (num < 1000000000) {
    return Math.floor(num / 1000000) + "M";
  } else {
    return Math.floor(num / 1000000000) + "B";
  }
}

function GameStats() {
  const {
    taps,
    manualTaps,
    manualTapsPerSecond,
    upgrades,
    decorations,
    themes,
    getAutoTapRateUncached,
    getTotalTapMultiplierUncached,
  } = useGameStore();

  const totalUpgrades = upgrades.length;
  const unlockedUpgrades = upgrades.filter((u) => u.unlocked).length;
  const totalDecorations = decorations.length;
  const purchasedDecorations = decorations.filter((d) => d.purchased).length;
  const totalThemes = themes.length;
  const purchasedThemes = themes.filter((t) => t.purchased).length;

  // Memoize computed values to avoid calling setState during render
  const { autoTapRate, tapMultiplier, totalTapsPerSecond } = useMemo(() => {
    const autoTapRate = getAutoTapRateUncached();
    const tapMultiplier = getTotalTapMultiplierUncached();
    const totalTapsPerSecond = autoTapRate + manualTapsPerSecond;
    return { autoTapRate, tapMultiplier, totalTapsPerSecond };
  }, [
    getAutoTapRateUncached,
    getTotalTapMultiplierUncached,
    manualTapsPerSecond,
    upgrades, // Add upgrades as dependency so calculation updates when upgrades change
  ]);

  return (
    <StatsGrid>
      <StatItem>
        <StatLabel>Total Taps</StatLabel>
        <StatValue $color="#4CAF50">{formatNumber(taps)}</StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Manual Taps</StatLabel>
        <StatValue $color="#FF5722">{formatNumber(manualTaps)}</StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Taps/Second</StatLabel>
        <StatValue $color="#E91E63">{totalTapsPerSecond.toFixed(1)}</StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Tap Multiplier</StatLabel>
        <StatValue $color="#FF9800">x{tapMultiplier}</StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Auto Tap Rate</StatLabel>
        <StatValue $color="#2196F3">{autoTapRate.toFixed(1)}/s</StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Manual Tap Rate</StatLabel>
        <StatValue $color="#FF5722">
          {manualTapsPerSecond.toFixed(1)}/s
        </StatValue>
      </StatItem>

      <StatItem>
        <StatLabel>Upgrades</StatLabel>
        <StatValue $color="#9C27B0">
          {unlockedUpgrades}/{totalUpgrades}
        </StatValue>
      </StatItem>
    </StatsGrid>
  );
}

// Styled Components
const StatsContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-family: monospace;
  font-size: 12px;
  z-index: 2000;
  min-width: 250px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatsHeader = styled.div`
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 12px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div<{ $color: string }>`
  color: ${(props) => props.$color};
  font-weight: bold;
  font-size: 11px;
`;

const GameStatsSection = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 12px;
`;
