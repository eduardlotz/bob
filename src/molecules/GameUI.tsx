import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import { useGameStore, startAutoTap, stopAutoTap } from "@/store/gameStore";
import { MenuButton } from "@/layout/atoms";
import { FISHEYE_CONFIG } from "@/store/upgradesConfig";
import { Statistics } from "./Statistics";

interface GameUIProps {
  tapCount: number;
  emotionState: string;
  showOptions?: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return Math.ceil(num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return Math.ceil(num / 1000).toFixed(1) + "K";
  }
  return Math.ceil(num).toString();
};

const getTapMultiplier = (): number => {
  const store = useGameStore.getState();
  return store.getTotalTapMultiplier();
};

const getTapsPerSecond = (): number => {
  const store = useGameStore.getState();
  return store.getTotalTapsPerSecond();
};

export function GameUI({ tapCount, emotionState, showOptions }: GameUIProps) {
  const [activeTab, setActiveTab] = useState<
    | "upgrades"
    | "decorations"
    | "themes"
    | "effects"
    | "tapEffects"
    | "environment"
    | "dev"
  >("upgrades");
  const [showGameUI, setShowGameUI] = useState(false);

  const {
    taps,
    upgrades,
    decorations,
    themes,
    currentTheme,
    animationsEnabled,
    statisticsVisible,
    addTaps,
    purchaseUpgrade,
    purchaseDecoration,
    purchaseTheme,
    activateTheme,
    toggleDecoration,
    selectTapEffect,
    toggleEnvironmentEffect,
    addDevTaps,
    buyAllUpgrades,
    toggleAnimations,
    toggleStatistics,
    canAfford,
  } = useGameStore();

  // Start auto-tap when component mounts
  useEffect(() => {
    startAutoTap();
    return () => stopAutoTap();
  }, []);

  // Sync tap count with game store
  useEffect(() => {
    if (tapCount > taps) {
      addTaps(tapCount - taps);
    }
  }, [tapCount, taps, addTaps]);

  const handlePurchaseUpgrade = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  const handlePurchaseDecoration = (decorationId: string) => {
    purchaseDecoration(decorationId);
  };

  const handlePurchaseTheme = (themeId: string) => {
    purchaseTheme(themeId);
  };

  const handleActivateTheme = (themeId: string) => {
    console.log("Activating theme:", themeId);
    activateTheme(themeId);
  };

  const handleToggleEffect = (decorationId: string) => {
    toggleDecoration(decorationId);
  };

  const handleSelectTapEffect = (upgradeId: string) => {
    selectTapEffect(upgradeId);
  };

  const handleToggleEnvironmentEffect = (upgradeId: string) => {
    toggleEnvironmentEffect(upgradeId);
  };

  // Dev action handlers
  const handleAddDevTaps = () => {
    addDevTaps(100);
  };

  const handleBuyAllUpgrades = () => {
    buyAllUpgrades();
  };

  const handleToggleAnimations = () => {
    toggleAnimations();
  };

  const handleToggleStatistics = () => {
    toggleStatistics();
  };

  const getUpgradeCost = (upgrade: any): number => {
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level)
    );
  };

  const isDevMode = process.env.NODE_ENV === "development";

  return (
    <GameUIContainer>
      {/* Statistics Component */}
      <Statistics visible={statisticsVisible} />

      {/* Game Menu */}
      <AnimatePresence>
        {showGameUI && (
          <>
            <GameMenu
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <MenuHeader>
                <MenuTitle>Game Menu</MenuTitle>
                <CloseButton onClick={() => setShowGameUI(false)}>
                  ×
                </CloseButton>
              </MenuHeader>

              <TabContainer>
                <TabButton
                  $active={activeTab === "upgrades"}
                  onClick={() => setActiveTab("upgrades")}
                >
                  Upgrades
                </TabButton>
                <TabButton
                  $active={activeTab === "decorations"}
                  onClick={() => setActiveTab("decorations")}
                >
                  Decorations
                </TabButton>
                <TabButton
                  $active={activeTab === "themes"}
                  onClick={() => setActiveTab("themes")}
                >
                  Themes
                </TabButton>
                <TabButton
                  $active={activeTab === "effects"}
                  onClick={() => setActiveTab("effects")}
                >
                  Effects
                </TabButton>
                <TabButton
                  $active={activeTab === "tapEffects"}
                  onClick={() => setActiveTab("tapEffects")}
                >
                  Tap Effects
                </TabButton>
                <TabButton
                  $active={activeTab === "environment"}
                  onClick={() => setActiveTab("environment")}
                >
                  Environment
                </TabButton>
                {isDevMode && (
                  <TabButton
                    $active={activeTab === "dev"}
                    onClick={() => setActiveTab("dev")}
                  >
                    Dev
                  </TabButton>
                )}
              </TabContainer>

              <TabContent>
                {activeTab === "upgrades" && (
                  <UpgradesTab
                    upgrades={upgrades}
                    onPurchase={handlePurchaseUpgrade}
                    canAfford={canAfford}
                    getUpgradeCost={getUpgradeCost}
                  />
                )}

                {activeTab === "decorations" && (
                  <DecorationsTab
                    decorations={decorations}
                    onPurchase={handlePurchaseDecoration}
                    canAfford={canAfford}
                  />
                )}

                {activeTab === "themes" && (
                  <ThemesTab
                    themes={themes}
                    currentTheme={currentTheme}
                    onPurchase={handlePurchaseTheme}
                    onActivate={handleActivateTheme}
                    canAfford={canAfford}
                  />
                )}

                {activeTab === "effects" && (
                  <EffectsTab
                    decorations={decorations}
                    onToggle={handleToggleEffect}
                  />
                )}

                {activeTab === "tapEffects" && (
                  <TapEffectsTab
                    upgrades={upgrades.filter(
                      (u) => u.category === "tapEffects"
                    )}
                    onSelect={handleSelectTapEffect}
                    canAfford={canAfford}
                    getUpgradeCost={getUpgradeCost}
                  />
                )}

                {activeTab === "environment" && (
                  <EnvironmentTab
                    upgrades={upgrades.filter(
                      (u) => u.category === "environment"
                    )}
                    onToggle={handleToggleEnvironmentEffect}
                    canAfford={canAfford}
                    getUpgradeCost={getUpgradeCost}
                  />
                )}

                {activeTab === "dev" && isDevMode && (
                  <DevTab
                    onPause={() => stopAutoTap()}
                    onResume={() => startAutoTap()}
                    onReset={() => {
                      const store = useGameStore.getState();
                      store.resetGame();
                    }}
                    onAddTaps={handleAddDevTaps}
                    onBuyAll={handleBuyAllUpgrades}
                    onToggleAnimations={handleToggleAnimations}
                    onToggleStatistics={handleToggleStatistics}
                    animationsEnabled={animationsEnabled}
                    statisticsVisible={statisticsVisible}
                  />
                )}
              </TabContent>
            </GameMenu>
          </>
        )}
      </AnimatePresence>
    </GameUIContainer>
  );
}

function UpgradesTab({ upgrades, onPurchase, canAfford, getUpgradeCost }: any) {
  return (
    <UpgradesContainer>
      {upgrades.map((upgrade: any) => (
        <UpgradeItem key={upgrade.id}>
          <UpgradeHeader>
            <UpgradeIcon>{upgrade.icon}</UpgradeIcon>
            <UpgradeInfo>
              <UpgradeName>{upgrade.name}</UpgradeName>
              <UpgradeDescription>{upgrade.description}</UpgradeDescription>
            </UpgradeInfo>
          </UpgradeHeader>

          <UpgradeStats>
            <UpgradeLevel>
              Level: {upgrade.level}/{upgrade.maxLevel}
            </UpgradeLevel>
            <UpgradeEffect>
              {upgrade.effect.type === "autoTap" &&
                `+${upgrade.effect.value} taps/sec`}
              {upgrade.effect.type === "tapMultiplier" &&
                `×${upgrade.effect.value} multiplier`}
            </UpgradeEffect>
          </UpgradeStats>

          <UpgradeButton
            disabled={
              !upgrade.unlocked ||
              upgrade.level >= upgrade.maxLevel ||
              !canAfford(getUpgradeCost(upgrade))
            }
            onClick={() => onPurchase(upgrade.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {upgrade.level >= upgrade.maxLevel
              ? "MAXED"
              : `Buy (${formatNumber(getUpgradeCost(upgrade))})`}
          </UpgradeButton>
        </UpgradeItem>
      ))}
    </UpgradesContainer>
  );
}

function DecorationsTab({ decorations, onPurchase, canAfford }: any) {
  return (
    <DecorationsContainer>
      {decorations.map((decoration: any) => (
        <DecorationItem key={decoration.id}>
          <DecorationHeader>
            <DecorationIcon>{decoration.icon}</DecorationIcon>
            <DecorationInfo>
              <DecorationName>{decoration.name}</DecorationName>
              <DecorationDescription>
                {decoration.description}
              </DecorationDescription>
            </DecorationInfo>
          </DecorationHeader>

          <DecorationButton
            disabled={decoration.purchased || !canAfford(decoration.cost)}
            onClick={() => onPurchase(decoration.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {decoration.purchased
              ? "OWNED"
              : `Buy (${formatNumber(decoration.cost)})`}
          </DecorationButton>
        </DecorationItem>
      ))}
    </DecorationsContainer>
  );
}

function ThemesTab({
  themes,
  currentTheme,
  onPurchase,
  onActivate,
  canAfford,
}: any) {
  return (
    <ThemesContainer>
      {themes.map((theme: any) => (
        <ThemeItem key={theme.id}>
          <ThemeHeader>
            <ThemeIcon>{theme.icon}</ThemeIcon>
            <ThemeInfo>
              <ThemeName>{theme.name}</ThemeName>
              <ThemeDescription>{theme.description}</ThemeDescription>
            </ThemeInfo>
          </ThemeHeader>

          <ThemeActions>
            {!theme.purchased ? (
              <ThemeButton
                disabled={!canAfford(theme.cost)}
                onClick={() => onPurchase(theme.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Buy ({formatNumber(theme.cost)})
              </ThemeButton>
            ) : (
              <ThemeButton
                $active={theme.active}
                onClick={() => onActivate(theme.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {theme.active ? "ACTIVE" : "Activate"}
              </ThemeButton>
            )}
          </ThemeActions>
        </ThemeItem>
      ))}
    </ThemesContainer>
  );
}

function EffectsTab({ decorations, onToggle }: any) {
  const { fisheyeIntensity, setFisheyeIntensity } = useGameStore();

  const effectDecorations = decorations.filter(
    (d: any) =>
      d.id === "rain_particles" ||
      d.id === "cloud_particles" ||
      d.id === "confetti" ||
      d.id === "fisheye_intensity"
  );

  const fisheyeDecoration = decorations.find(
    (d: any) => d.id === "fisheye_intensity"
  );

  return (
    <EffectsContainer>
      {effectDecorations.map((decoration: any) => (
        <EffectItem key={decoration.id}>
          <EffectHeader>
            <EffectIcon>{decoration.icon}</EffectIcon>
            <EffectInfo>
              <EffectName>{decoration.name}</EffectName>
              <EffectDescription>{decoration.description}</EffectDescription>
            </EffectInfo>
          </EffectHeader>

          <EffectStatus>
            <EffectStatusText>
              {decoration.purchased ? "Purchased" : "Not Available"}
            </EffectStatusText>
            {decoration.purchased && (
              <EffectToggle
                enabled={decoration.enabled}
                onClick={() => onToggle(decoration.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {decoration.enabled ? "ON" : "OFF"}
              </EffectToggle>
            )}
          </EffectStatus>

          {/* Fisheye Slider */}
          {decoration.id === "fisheye_intensity" &&
            decoration.purchased &&
            decoration.enabled && (
              <FisheyeSliderContainer>
                <FisheyeSliderLabel>
                  Intensity: {Math.round(fisheyeIntensity * 100)}%
                </FisheyeSliderLabel>
                <FisheyeSlider
                  type="range"
                  min={FISHEYE_CONFIG.MIN}
                  max={FISHEYE_CONFIG.MAX}
                  step={FISHEYE_CONFIG.STEP}
                  value={fisheyeIntensity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFisheyeIntensity(parseFloat(e.target.value))
                  }
                />
              </FisheyeSliderContainer>
            )}
        </EffectItem>
      ))}
    </EffectsContainer>
  );
}

function DevTab({
  onPause,
  onResume,
  onReset,
  onAddTaps,
  onBuyAll,
  onToggleAnimations,
  onToggleStatistics,
  animationsEnabled,
  statisticsVisible,
}: any) {
  return (
    <DevContainer>
      <DevItem>
        <DevTitle>Development Controls</DevTitle>
        <DevDescription>
          These controls are only available in development mode
        </DevDescription>
      </DevItem>

      <DevControls>
        <DevButton
          onClick={onPause}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ⏸️ Pause Auto-Tap
        </DevButton>

        <DevButton
          onClick={onResume}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ▶️ Resume Auto-Tap
        </DevButton>

        <DevButton
          onClick={onAddTaps}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ backgroundColor: "#28a745" }}
        >
          💰 Add 100 Taps
        </DevButton>

        <DevButton
          onClick={onBuyAll}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ backgroundColor: "#17a2b8" }}
        >
          🛒 Buy All Upgrades
        </DevButton>

        <DevButton
          onClick={onToggleAnimations}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            backgroundColor: animationsEnabled ? "#ffc107" : "#6c757d",
            color: animationsEnabled ? "#000" : "#fff",
          }}
        >
          {animationsEnabled ? "🎬" : "⏸️"}{" "}
          {animationsEnabled ? "Disable" : "Enable"} Animations
        </DevButton>

        <DevButton
          onClick={onToggleStatistics}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            backgroundColor: statisticsVisible ? "#6f42c1" : "#6c757d",
            color: statisticsVisible ? "#fff" : "#fff",
          }}
        >
          📊 {statisticsVisible ? "Hide" : "Show"} Statistics
        </DevButton>

        <DevButton
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ backgroundColor: "#dc3545" }}
        >
          🔄 Reset Game
        </DevButton>
      </DevControls>
    </DevContainer>
  );
}

// Styled Components
const GameUIContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
`;

const GameStatsContainer = styled.div`
  position: absolute;
  top: unset;
  bottom: 20px;
  left: 16px;
  right: 0;
  margin: 0;

  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(16px) brightness(1.1);
  border-radius: 16px;
  padding: 16px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: fit-content;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  width: 100%;
  min-width: 160px;
  padding: 12px 0;
  gap: 24px;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-top: 1px solid #22222223;
    padding-bottom: 0;
  }
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #eeeef4;
  text-align: left;
  font-family: "Open Sauce Two";
  font-weight: 400;

  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const StatValue = styled.span`
  font-size: 14px;
  font-weight: bold;
  font-family: "Open Sauce Two";
  text-align: right;
  margin-left: auto;

  background: var(--primary-color);
  color: #fff;
  padding: 8px 10px;
  border-radius: 12px;
`;

const GameMenuButton = styled(MenuButton)`
  bottom: 16px;
  right: 0;
  top: unset;
  left: 0;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(16px);
`;

const GameMenu = styled(motion.div)`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  max-width: 800px;
  max-height: calc(100vh - 32px);
  min-width: 320px;
  min-height: 320px;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  overflow: hidden;
  pointer-events: auto;
  margin: 0 auto;

  @media (max-width: 768px) {
    max-height: calc(100vh - 32px);
    max-width: calc(100vw - 32px);

    margin: 0;
  }
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
`;

const MenuTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 16px;
  background: ${(props) =>
    props.$active ? "var(--primary-color, #2979FF)" : "transparent"};
  color: ${(props) => (props.$active ? "white" : "#666")};
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active ? "var(--primary-color, #2979FF)" : "#f5f5f5"};
  }
`;

const TabContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;

  @media (max-width: 768px) {
    max-height: 100%;
    padding: 16px;
  }
`;

const UpgradesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UpgradeItem = styled.div`
  background: var(--card-background, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const UpgradeHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const UpgradeIcon = styled.span`
  font-size: 24px;
  margin-right: 12px;
`;

const UpgradeInfo = styled.div`
  flex: 1;
`;

const UpgradeName = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const UpgradeDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

const UpgradeStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const UpgradeLevel = styled.span`
  font-size: 12px;
  color: #666;
`;

const UpgradeEffect = styled.span`
  font-size: 12px;
  color: var(--primary-color, #2979ff);
  font-weight: bold;
`;

const UpgradeActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const UpgradeButton = styled(motion.button)<{ disabled: boolean }>`
  width: 100%;
  padding: 12px;
  background: ${(props) =>
    props.disabled ? "#ccc" : "var(--primary-color, #2979FF)"};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: bold;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: var(--secondary-color, #4285f4);
  }
`;

const DecorationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DecorationItem = styled.div`
  background: var(--card-background, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const DecorationHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const DecorationIcon = styled.span`
  font-size: 24px;
  margin-right: 12px;
`;

const DecorationInfo = styled.div`
  flex: 1;
`;

const DecorationName = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const DecorationDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

const DecorationButton = styled(motion.button)<{ disabled: boolean }>`
  width: 100%;
  padding: 12px;
  background: ${(props) =>
    props.disabled ? "#ccc" : "var(--primary-color, #2979FF)"};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: bold;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: var(--secondary-color, #4285f4);
  }
`;

const ThemesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ThemeItem = styled.div`
  background: var(--card-background, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const ThemeHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ThemeIcon = styled.span`
  font-size: 24px;
  margin-right: 12px;
`;

const ThemeInfo = styled.div`
  flex: 1;
`;

const ThemeName = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const ThemeDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

const ThemeActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ThemeButton = styled(motion.button)<{
  disabled?: boolean;
  $active?: boolean;
}>`
  flex: 1;
  padding: 12px;
  background: ${(props) => {
    if (props.disabled) return "#ccc";
    if (props.$active) return "#4CAF50";
    return "var(--primary-color, #2979FF)";
  }};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: bold;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$active ? "#45a049" : "var(--secondary-color, #4285F4)"};
  }
`;

const EffectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EffectItem = styled.div`
  background: var(--card-background, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const EffectHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const EffectIcon = styled.span`
  font-size: 24px;
  margin-right: 12px;
`;

const EffectInfo = styled.div`
  flex: 1;
`;

const EffectName = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const EffectDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

const EffectStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const EffectStatusText = styled.span`
  font-size: 14px;
  color: #666;
`;

const EffectToggle = styled(motion.button)<{ enabled: boolean }>`
  padding: 8px 12px;
  background: ${(props) =>
    props.enabled
      ? "var(--success-color, #4CAF50)"
      : "var(--danger-color, #dc3545)"};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;

  &:hover {
    background: ${(props) =>
      props.enabled
        ? "var(--success-color, #45a049)"
        : "var(--danger-color, #c82333)"};
  }
`;

const DevContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DevItem = styled.div`
  background: var(--card-background, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const DevTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
`;

const DevDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

const DevControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DevButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: var(--primary-color, #2979ff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;

  &:hover {
    background: var(--secondary-color, #4285f4);
  }
`;

const SelectButton = styled(motion.button)<{ selected: boolean }>`
  width: 100%;
  padding: 8px 16px;
  background: ${(props) =>
    props.selected
      ? "var(--success-color, #45a049)"
      : "var(--primary-color, #2979ff)"};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;

  &:hover {
    background: ${(props) =>
      props.selected
        ? "var(--success-color, #45a049)"
        : "var(--secondary-color, #4285f4)"};
  }
`;

const ToggleButton = styled(motion.button)<{ enabled: boolean }>`
  width: 100%;
  padding: 8px 16px;
  background: ${(props) =>
    props.enabled
      ? "var(--success-color, #45a049)"
      : "var(--danger-color, #c82333)"};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;

  &:hover {
    background: ${(props) =>
      props.enabled
        ? "var(--success-color, #45a049)"
        : "var(--danger-color, #c82333)"};
  }
`;

const PurchaseButton = styled(motion.button)<{ disabled: boolean }>`
  width: 100%;
  padding: 8px 16px;
  background: ${(props) =>
    props.disabled
      ? "var(--border-color, #e9ecef)"
      : "var(--primary-color, #2979ff)"};
  color: ${(props) => (props.disabled ? "#999" : "white")};
  border: none;
  border-radius: 6px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: bold;
  font-size: 12px;

  &:hover {
    background: ${(props) =>
      props.disabled
        ? "var(--border-color, #e9ecef)"
        : "var(--secondary-color, #4285f4)"};
  }
`;

const FisheyeSliderContainer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
`;

const FisheyeSliderLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const FisheyeSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-color, #2979ff);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-color, #2979ff);
    cursor: pointer;
    border: none;
  }
`;

// Tap Effects Tab Component
function TapEffectsTab({ upgrades, onSelect, canAfford, getUpgradeCost }: any) {
  return (
    <TabContainer>
      {upgrades.map((upgrade: any) => (
        <UpgradeItem key={upgrade.id}>
          <UpgradeHeader>
            <UpgradeIcon>{upgrade.icon}</UpgradeIcon>
            <UpgradeInfo>
              <UpgradeName>{upgrade.name}</UpgradeName>
              <UpgradeDescription>{upgrade.description}</UpgradeDescription>
            </UpgradeInfo>
          </UpgradeHeader>

          <UpgradeActions>
            {upgrade.unlocked ? (
              <SelectButton
                selected={upgrade.selected}
                onClick={() => onSelect(upgrade.id)}
              >
                {upgrade.selected ? "Selected" : "Select"}
              </SelectButton>
            ) : (
              <PurchaseButton
                disabled={!canAfford(getUpgradeCost(upgrade))}
                onClick={() => onSelect(upgrade.id)}
              >
                Purchase ({getUpgradeCost(upgrade)})
              </PurchaseButton>
            )}
          </UpgradeActions>
        </UpgradeItem>
      ))}
    </TabContainer>
  );
}

// Environment Tab Component
function EnvironmentTab({
  upgrades,
  onToggle,
  canAfford,
  getUpgradeCost,
}: any) {
  return (
    <TabContainer>
      {upgrades.map((upgrade: any) => (
        <UpgradeItem key={upgrade.id}>
          <UpgradeHeader>
            <UpgradeIcon>{upgrade.icon}</UpgradeIcon>
            <UpgradeInfo>
              <UpgradeName>{upgrade.name}</UpgradeName>
              <UpgradeDescription>{upgrade.description}</UpgradeDescription>
            </UpgradeInfo>
          </UpgradeHeader>

          <UpgradeActions>
            {upgrade.unlocked ? (
              <ToggleButton
                enabled={upgrade.selected}
                onClick={() => onToggle(upgrade.id)}
              >
                {upgrade.selected ? "Enabled" : "Disabled"}
              </ToggleButton>
            ) : (
              <PurchaseButton
                disabled={!canAfford(getUpgradeCost(upgrade))}
                onClick={() => onToggle(upgrade.id)}
              >
                Purchase ({getUpgradeCost(upgrade)})
              </PurchaseButton>
            )}
          </UpgradeActions>
        </UpgradeItem>
      ))}
    </TabContainer>
  );
}
