import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/gameStore";
import { CartIcon } from "@/icons/cart";
import { ThemeIcon } from "@/icons/theme";
import { EffectsIcon } from "@/icons/effects";
import { EnvironmentIcon as EnvironmentIconComponent } from "@/icons/environment";
import { CloseIcon } from "@/icons/close";
import { HexColorPicker } from "react-colorful";

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShopTab = "themes" | "effects" | "environment" | "dev";

export function Shop({ isOpen, onClose }: ShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>("themes");
  const { themes, currentTheme, activateTheme, canAfford, upgrades } =
    useGameStore();
  const isDevMode = process.env.NODE_ENV === "development";

  const tabs = [
    {
      id: "themes" as ShopTab,
      name: "Themes",
      icon: ThemeIcon,
      progress: themes.filter((t) => t.purchased).length / themes.length,
    },
    {
      id: "effects" as ShopTab,
      name: "Effects",
      icon: EffectsIcon,
      progress:
        upgrades.filter((u) => u.category === "tapEffects" && u.unlocked)
          .length / upgrades.filter((u) => u.category === "tapEffects").length,
    },
    {
      id: "environment" as ShopTab,
      name: "Environment",
      icon: EnvironmentIconComponent,
      progress:
        upgrades.filter((u) => u.category === "environment" && u.unlocked)
          .length / upgrades.filter((u) => u.category === "environment").length,
    },
    ...(isDevMode
      ? [
          {
            id: "dev" as ShopTab,
            name: "Dev",
            icon: () => <span style={{ fontSize: "20px" }}>🔧</span>,
            progress: 1, // Dev tab is always 100% complete
          },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <ShopContainer
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ShopHeader>
              <ShopTitle>
                <CartIcon color="#FFD700" />
                Shop
              </ShopTitle>
              <CloseButton onClick={onClose}>
                <CloseIcon color="#ffffff" />
              </CloseButton>
            </ShopHeader>

            <ShopContent>
              <TabPanel>
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    $active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <TabContent>
                      <TabIcon>
                        <tab.icon
                          color={activeTab === tab.id ? "#FFD700" : "#666666"}
                        />
                      </TabIcon>
                      <TabName>{tab.name}</TabName>
                      <ProgressBar $progress={tab.progress} />
                    </TabContent>
                  </TabButton>
                ))}
              </TabPanel>

              <ContentView>
                <ContentHeader>
                  <ContentTitle>
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </ContentTitle>
                  <ContentSubtitle>
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </ContentSubtitle>
                </ContentHeader>

                <ContentItems>
                  {activeTab === "themes" && <ThemesView />}
                  {activeTab === "effects" && <EffectsView />}
                  {activeTab === "environment" && <EnvironmentView />}
                  {activeTab === "dev" && <DevView />}
                </ContentItems>
              </ContentView>
            </ShopContent>
          </ShopContainer>
        </>
      )}
    </AnimatePresence>
  );
}

function ThemesView() {
  const { themes, currentTheme, activateTheme, purchaseTheme, canAfford } =
    useGameStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#2979FF");
  const [colorType, setColorType] = useState<
    "primary" | "secondary" | "accent"
  >("primary");

  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme && theme.purchased) {
      activateTheme(themeId);
    }
  };

  const handleThemePurchase = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme && !theme.purchased && canAfford(theme.cost)) {
      purchaseTheme(themeId);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    // Here you would update the theme colors in the store
    // For now, we'll just update the local state
  };

  return (
    <ThemesContainer>
      <ThemesSection>
        <SectionTitle>Available Themes</SectionTitle>
        <ItemsGrid>
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              $selected={currentTheme?.id === theme.id}
              $purchased={theme.purchased}
              onClick={() =>
                theme.purchased
                  ? handleThemeSelect(theme.id)
                  : handleThemePurchase(theme.id)
              }
            >
              <ThemePreview $colors={theme.colors}>
                <ThemeGradient $colors={theme.colors} />
              </ThemePreview>
              <ThemeName>{theme.name}</ThemeName>
              <ThemeStatus $purchased={theme.purchased}>
                {theme.purchased
                  ? currentTheme?.id === theme.id
                    ? "Active"
                    : "Available"
                  : `Locked - ${theme.cost}`}
              </ThemeStatus>
              {!theme.purchased && (
                <PurchaseButton
                  $canAfford={canAfford(theme.cost)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThemePurchase(theme.id);
                  }}
                >
                  {canAfford(theme.cost) ? "Buy" : "Can't Afford"}
                </PurchaseButton>
              )}
            </ThemeCard>
          ))}
        </ItemsGrid>
      </ThemesSection>

      <ColorCustomizationSection>
        <SectionTitle>Color Customization</SectionTitle>
        <ColorControls>
          <ColorTypeSelector>
            <ColorTypeButton
              $active={colorType === "primary"}
              onClick={() => setColorType("primary")}
            >
              Primary
            </ColorTypeButton>
            <ColorTypeButton
              $active={colorType === "secondary"}
              onClick={() => setColorType("secondary")}
            >
              Secondary
            </ColorTypeButton>
            <ColorTypeButton
              $active={colorType === "accent"}
              onClick={() => setColorType("accent")}
            >
              Accent
            </ColorTypeButton>
          </ColorTypeSelector>

          <ColorPickerContainer>
            <ColorPreview $color={selectedColor} />
            <ColorPickerButton
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {showColorPicker ? "Hide" : "Show"} Color Picker
            </ColorPickerButton>
          </ColorPickerContainer>

          <AnimatePresence>
            {showColorPicker && (
              <ColorPickerWrapper
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HexColorPicker
                  color={selectedColor}
                  onChange={handleColorChange}
                />
              </ColorPickerWrapper>
            )}
          </AnimatePresence>
        </ColorControls>
      </ColorCustomizationSection>
    </ThemesContainer>
  );
}

function EffectsView() {
  const { upgrades, selectTapEffect, purchaseUpgrade, canAfford } =
    useGameStore();
  const tapEffects = upgrades.filter((u) => u.category === "tapEffects");
  const selectedEffect = tapEffects.find((effect) => effect.selected);

  const handleEffectSelect = (effectId: string) => {
    const effect = tapEffects.find((e) => e.id === effectId);
    if (effect && effect.unlocked) {
      selectTapEffect(effectId);
    }
  };

  const handleEffectPurchase = (effectId: string) => {
    const effect = tapEffects.find((e) => e.id === effectId);
    if (effect && !effect.unlocked && canAfford(effect.baseCost)) {
      purchaseUpgrade(effectId);
    }
  };

  return (
    <EffectsContainer>
      <SectionTitle>Tap Effects</SectionTitle>
      <EffectsGrid>
        {tapEffects.map((effect) => (
          <EffectCard
            key={effect.id}
            $selected={effect.selected}
            $unlocked={effect.unlocked}
            onClick={() =>
              effect.unlocked
                ? handleEffectSelect(effect.id)
                : handleEffectPurchase(effect.id)
            }
          >
            <EffectIcon>{effect.icon}</EffectIcon>
            <EffectName>{effect.name}</EffectName>
            <EffectStatus $unlocked={effect.unlocked}>
              {effect.unlocked
                ? effect.selected
                  ? "Selected"
                  : "Available"
                : `Locked - ${effect.baseCost}`}
            </EffectStatus>
            {!effect.unlocked && (
              <PurchaseButton
                $canAfford={canAfford(effect.baseCost)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEffectPurchase(effect.id);
                }}
              >
                {canAfford(effect.baseCost) ? "Buy" : "Can't Afford"}
              </PurchaseButton>
            )}
          </EffectCard>
        ))}
      </EffectsGrid>
    </EffectsContainer>
  );
}

function EnvironmentView() {
  const { upgrades, toggleEnvironmentEffect, purchaseUpgrade, canAfford } =
    useGameStore();
  const environmentEffects = upgrades.filter(
    (u) => u.category === "environment"
  );

  const handleEnvironmentToggle = (effectId: string) => {
    const effect = environmentEffects.find((e) => e.id === effectId);
    if (effect && effect.unlocked) {
      toggleEnvironmentEffect(effectId);
    }
  };

  const handleEnvironmentPurchase = (effectId: string) => {
    const effect = environmentEffects.find((e) => e.id === effectId);
    if (effect && !effect.unlocked && canAfford(effect.baseCost)) {
      purchaseUpgrade(effectId);
    }
  };

  return (
    <EnvironmentContainer>
      <SectionTitle>Environment Effects</SectionTitle>
      <EnvironmentGrid>
        {environmentEffects.map((effect) => (
          <EnvironmentCard
            key={effect.id}
            $enabled={effect.selected}
            $unlocked={effect.unlocked}
            onClick={() =>
              effect.unlocked
                ? handleEnvironmentToggle(effect.id)
                : handleEnvironmentPurchase(effect.id)
            }
          >
            <EnvironmentIcon>{effect.icon}</EnvironmentIcon>
            <EnvironmentName>{effect.name}</EnvironmentName>
            <EnvironmentStatus $unlocked={effect.unlocked}>
              {effect.unlocked
                ? effect.selected
                  ? "Enabled"
                  : "Disabled"
                : `Locked - ${effect.baseCost}`}
            </EnvironmentStatus>
            {!effect.unlocked && (
              <PurchaseButton
                $canAfford={canAfford(effect.baseCost)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnvironmentPurchase(effect.id);
                }}
              >
                {canAfford(effect.baseCost) ? "Buy" : "Can't Afford"}
              </PurchaseButton>
            )}
          </EnvironmentCard>
        ))}
      </EnvironmentGrid>
    </EnvironmentContainer>
  );
}

function DevView() {
  const {
    addDevTaps,
    buyAllUpgrades,
    toggleAnimations,
    toggleStatistics,
    animationsEnabled,
    statisticsVisible,
    pauseGame,
    resumeGame,
    resetGame,
    isPaused,
  } = useGameStore();

  return (
    <DevContainer>
      <SectionTitle>Development Controls</SectionTitle>
      <DevGrid>
        <DevButton onClick={() => addDevTaps(100)}>💰 Add 100 Taps</DevButton>
        <DevButton onClick={buyAllUpgrades}>🛒 Buy All Upgrades</DevButton>
        <DevButton onClick={toggleAnimations} $active={animationsEnabled}>
          {animationsEnabled ? "🎬" : "⏸️"} Toggle Animations
        </DevButton>
        <DevButton onClick={toggleStatistics} $active={statisticsVisible}>
          📊 Toggle Statistics
        </DevButton>
        <DevButton
          onClick={isPaused ? resumeGame : pauseGame}
          $active={!isPaused}
        >
          {isPaused ? "▶️" : "⏸️"} {isPaused ? "Resume" : "Pause"}
        </DevButton>
        <DevButton onClick={resetGame}>🔄 Reset Game</DevButton>
      </DevGrid>
    </DevContainer>
  );
}

// Styled Components
const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 999;
  pointer-events: auto;
`;

const ShopContainer = styled(motion.div)`
  position: fixed;
  left: 0;
  right: 0;
  top: 40px;
  margin: 0 auto;
  width: 90vw;
  max-width: calc(100% - 32px);
  min-width: 320px;
  transform: translateY(-50%);
  height: 80vh;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
`;

const ShopHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ShopTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ShopContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;

  @media (max-width: 768px) {
    flex: 1;
    order: 1;
    flex-direction: column;
  }
`;

const TabPanel = styled.div`
  width: 200px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    flex-direction: row;
    width: 100%;
    overflow-x: auto;
    padding: 12px;

    order: 2;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: ${(props) =>
    props.$active ? "rgba(255, 215, 0, 0.1)" : "transparent"};
  border: none;
  color: ${(props) => (props.$active ? "#FFD700" : "#666666")};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  transition: all 0.2s;
  border-radius: 12px;
  width: 100%;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${(props) => (props.$active ? "#FFD700" : "#ffffff")};
  }

  @media (max-width: 768px) {
    padding: 12px 10px;
    border-left: none;
  }
`;

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const TabIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TabName = styled.div`
  font-size: 12px;
  font-weight: 500;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) => props.$progress * 100}%;
    background: #ffd700;
    transition: width 0.3s ease;
  }
`;

const ContentView = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const ContentHeader = styled.div`
  margin-bottom: 24px;
`;

const ContentTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 4px 0;
`;

const ContentSubtitle = styled.p`
  font-size: 14px;
  color: #666666;
  margin: 0;
`;

const ContentItems = styled.div`
  flex: 1;
`;

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

const ThemeCard = styled.div<{ $selected: boolean; $purchased: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: ${(props) => (props.$purchased ? "pointer" : "not-allowed")};
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$selected ? "#ffffff" : "transparent")};
  background: ${(props) =>
    props.$selected
      ? "rgba(255, 255, 255, 0.1)"
      : props.$purchased
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$purchased ? 1 : 0.5)};

  &:hover {
    background: ${(props) =>
      props.$purchased ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

const ThemePreview = styled.div<{ $colors: any }>`
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const ThemeGradient = styled.div<{ $colors: any }>`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    ${(props) => props.$colors.primary} 0%,
    ${(props) => props.$colors.secondary} 50%,
    ${(props) => props.$colors.accent} 100%
  );
`;

const ThemeName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const ThemeStatus = styled.div<{ $purchased: boolean }>`
  font-size: 10px;
  color: ${(props) => (props.$purchased ? "#4CAF50" : "#FF9800")};
  text-align: center;
  font-weight: 500;
`;

const EffectIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const EffectName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const EnvironmentIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const EnvironmentName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
`;

const EffectStatus = styled.div<{ $unlocked: boolean }>`
  font-size: 10px;
  color: ${(props) => (props.$unlocked ? "#4CAF50" : "#F44336")};
  text-align: center;
  font-weight: 500;
`;

const EnvironmentStatus = styled.div<{ $unlocked: boolean }>`
  font-size: 10px;
  color: ${(props) => (props.$unlocked ? "#4CAF50" : "#F44336")};
  text-align: center;
  font-weight: 500;
`;

// Color customization styled components
const ThemesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const ThemesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 16px 0;
`;

const ColorCustomizationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ColorControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ColorTypeSelector = styled.div`
  display: flex;
  gap: 8px;
`;

const ColorTypeButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: ${(props) =>
    props.$active ? "#FFD700" : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => (props.$active ? "#000000" : "#ffffff")};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$active ? "#FFD700" : "rgba(255, 255, 255, 0.2)"};
  }
`;

const ColorPickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorPreview = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => props.$color};
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const ColorPickerButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ColorPickerWrapper = styled(motion.div)`
  display: flex;
  justify-content: center;
  padding: 16px 0;
  overflow: hidden;
`;

// Effects and Environment styled components
const EffectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EffectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

const EffectCard = styled.div<{ $selected?: boolean; $unlocked: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: ${(props) => (props.$unlocked ? "pointer" : "not-allowed")};
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$selected ? "#FFD700" : "transparent")};
  background: ${(props) =>
    props.$selected
      ? "rgba(255, 215, 0, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : 0.5)};

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

const EnvironmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EnvironmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

const EnvironmentCard = styled.div<{ $enabled?: boolean; $unlocked: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: ${(props) => (props.$unlocked ? "pointer" : "not-allowed")};
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$enabled ? "#4CAF50" : "transparent")};
  background: ${(props) =>
    props.$enabled
      ? "rgba(76, 175, 80, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : 0.5)};

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

// Dev styled components
const DevContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DevGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const DevButton = styled.button<{ $active?: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  background: ${(props) =>
    props.$active ? "#FFD700" : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => (props.$active ? "#000000" : "#ffffff")};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$active ? "#FFD700" : "rgba(255, 255, 255, 0.2)"};
  }
`;

const PurchaseButton = styled.button<{ $canAfford: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  background: ${(props) => (props.$canAfford ? "#4CAF50" : "#666666")};
  color: white;
  cursor: ${(props) => (props.$canAfford ? "pointer" : "not-allowed")};
  font-size: 10px;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: 4px;

  &:hover {
    background: ${(props) => (props.$canAfford ? "#45a049" : "#666666")};
  }
`;
