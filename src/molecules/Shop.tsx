import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore, triggerStoreMigration } from "@/store/gameStore";
import { WORLD_SOUNDS, getWorldSoundById } from "@/utils/sound/configs";
import {
  setWorldEnabled as engineSetWorldEnabled,
  setTapEnabled as engineSetTapEnabled,
  setCurrentTapSound as engineSetCurrentTapSound,
  stopSoundsById,
  playWorldSound as enginePlayWorldSound,
  addSoundConfig as engineAddSoundConfig,
} from "@/utils/soundSystem";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { CartIcon } from "@/icons/cart";
import { ThemeIcon } from "@/icons/theme";
import { EffectsIcon } from "@/icons/effects";
import { EnvironmentIcon as EnvironmentIconComponent } from "@/icons/environment";
import { PagesIcon } from "@/icons/pages";
import { DebuggingIcon } from "@/icons/debugging";
import { useSoundSystem } from "@/hooks/useSoundSystem";

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShopTab = "themes" | "effects" | "environment" | "pages" | "dev";

export function Shop({ isOpen, onClose }: ShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>("pages");
  const sound = useSoundSystem();
  const { themes, upgrades, routes, taps, calculateOfflineTaps, addTaps } =
    useGameStore();
  // const isDevMode = process.env.NODE_ENV === "development";
  const isDevMode = true; // Force dev mode for testing

  // Calculate and add offline taps when shop opens
  useEffect(() => {
    if (isOpen) {
      const offlineTaps = calculateOfflineTaps();
      if (offlineTaps > 0) {
        addTaps(offlineTaps);
        console.log(`Added ${offlineTaps} offline taps`);
      }
    }
  }, [isOpen, calculateOfflineTaps, addTaps]);

  const tabs = [
    {
      id: "pages" as ShopTab,
      name: "Pages",
      icon: PagesIcon,
      progress: routes.filter((r) => r.purchased).length / routes.length,
    },
    {
      id: "themes" as ShopTab,
      name: "Themes",
      icon: ThemeIcon,
      progress: themes.filter((t) => t.purchased).length / themes.length, // Exclude default,
    },
    {
      id: "effects" as ShopTab,
      name: "Effects",
      icon: EffectsIcon,
      progress:
        upgrades.filter((u) => u.category === "tapEffects" && u.unlocked)
          .length / upgrades.filter((u) => u.category === "tapEffects").length,
      // Exclude default
    },
    {
      id: "environment" as ShopTab,
      name: "Weather",
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
            icon: DebuggingIcon,
            progress: 0, // Dev tab is always 100% complete
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
            key="shop-backdrop"
          />
          <ShopContainer
            key="shop-container"
            initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <ShopHeader>
              <ShopTitle>
                <CartIcon color="#FFD700" />
                Shop
              </ShopTitle>
              <TapCountDisplay>
                {Math.floor(taps).toLocaleString("de-DE")} taps
              </TapCountDisplay>
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
                        <tab.icon />
                      </TabIcon>
                      <TabName>{tab.name}</TabName>
                      <ProgressBar $progress={tab.progress} />
                    </TabContent>
                  </TabButton>
                ))}
              </TabPanel>

              <ContentView>
                <ContentItems>
                  <AnimatePresence mode="popLayout">
                    {activeTab === "themes" && (
                      <motion.div
                        key="themes"
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <ThemesView />
                      </motion.div>
                    )}
                    {activeTab === "effects" && (
                      <motion.div
                        key="effects"
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <EffectsView />
                      </motion.div>
                    )}
                    {activeTab === "environment" && (
                      <motion.div
                        key="environment"
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <EnvironmentView />
                      </motion.div>
                    )}
                    {activeTab === "pages" && (
                      <motion.div
                        key="routes"
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <RoutesView />
                      </motion.div>
                    )}
                    {activeTab === "dev" && (
                      <motion.div
                        key="dev"
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <DevView />
                        <Divider />
                        <SettingsGroup>
                          <GroupHeader>
                            <GroupTitle>Music & Sound</GroupTitle>
                            <ToggleSwitch
                              onClick={
                                sound.isEnabled ? sound.disable : sound.enable
                              }
                              $active={sound.isEnabled}
                            >
                              {sound.isEnabled ? "ON" : "OFF"}
                            </ToggleSwitch>
                          </GroupHeader>
                          <SliderRow>
                            <SliderLabel>Master</SliderLabel>
                            <Slider
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={sound.masterVolume}
                              onChange={(e) =>
                                sound.setMasterVolume(
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                            <SliderValue>
                              {Math.round(sound.masterVolume * 100)}%
                            </SliderValue>
                          </SliderRow>
                          <SliderRow>
                            <SliderLabel>World</SliderLabel>
                            <Slider
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={sound.worldVolume}
                              onChange={(e) =>
                                sound.setWorldVolume(parseFloat(e.target.value))
                              }
                            />
                            <SliderValue>
                              {Math.round(sound.worldVolume * 100)}%
                            </SliderValue>
                          </SliderRow>
                          <SliderRow>
                            <SliderLabel>Tap</SliderLabel>
                            <Slider
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={sound.tapVolume}
                              onChange={(e) =>
                                sound.setTapVolume(parseFloat(e.target.value))
                              }
                            />
                            <SliderValue>
                              {Math.round(sound.tapVolume * 100)}%
                            </SliderValue>
                          </SliderRow>
                        </SettingsGroup>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

  return (
    <ThemesContainer>
      <ThemesSection>
        <SectionTitle>Page Themes</SectionTitle>
        <ItemsGrid>
          {themes
            .filter((theme) => theme.id !== "custom")
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                $selected={currentTheme?.id === theme.id}
                $purchased={theme.purchased}
                $canAfford={canAfford(theme.cost)}
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
                    : `${theme.cost} taps`}
                </ThemeStatus>
              </ThemeCard>
            ))}
        </ItemsGrid>
      </ThemesSection>
    </ThemesContainer>
  );
}

function EffectsView() {
  const {
    upgrades,
    selectTapEffect,
    purchaseUpgrade,
    canAfford,
    soundSystem,
    setTapEnabled,
  } = useGameStore();
  const tapEffects = upgrades.filter((u) => u.category === "tapEffects");

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
      <ToggleRow>
        <ToggleLabel>Enable Tap Sound</ToggleLabel>
        <ToggleSwitch
          onClick={() => {
            const next = !(soundSystem.tapEnabled !== false);
            setTapEnabled(next);
            engineSetTapEnabled(next);
          }}
          $active={soundSystem.tapEnabled !== false}
        >
          {soundSystem.tapEnabled !== false ? "ON" : "OFF"}
        </ToggleSwitch>
      </ToggleRow>

      <EffectsGrid>
        {tapEffects.map((effect) => (
          <EffectCard
            key={effect.id}
            $selected={effect.selected}
            $unlocked={effect.unlocked}
            $canAfford={canAfford(effect.baseCost)}
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
                : `${effect.baseCost} taps`}
            </EffectStatus>
          </EffectCard>
        ))}
      </EffectsGrid>
    </EffectsContainer>
  );
}

function EnvironmentView() {
  const {
    upgrades,
    toggleEnvironmentEffect,
    purchaseUpgrade,
    canAfford,
    soundSystem,
    audioSelections,
    setWorldEnabled,
    toggleWorldSoundId,
  } = useGameStore();
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
      <SectionTitle>World</SectionTitle>
      <ToggleRow>
        <ToggleLabel>Enable Music</ToggleLabel>
        <ToggleSwitch
          onClick={() => {
            const next = !(soundSystem.worldEnabled !== false);
            setWorldEnabled(next);
            engineSetWorldEnabled(next);
            // No primary/secondary: when enabling, resume layers via hook logic
          }}
          $active={soundSystem.worldEnabled !== false}
        >
          {soundSystem.worldEnabled !== false ? "ON" : "OFF"}
        </ToggleSwitch>
      </ToggleRow>
      <SectionSubtitle>Weather Effects</SectionSubtitle>
      <EnvironmentGrid>
        {environmentEffects.map((effect) => (
          <EnvironmentCard
            key={effect.id}
            $enabled={effect.selected}
            $unlocked={effect.unlocked}
            $canAfford={canAfford(effect.baseCost)}
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
                  ? "Selected"
                  : "Available"
                : `${effect.baseCost} taps`}
            </EnvironmentStatus>
          </EnvironmentCard>
        ))}
      </EnvironmentGrid>
      <SectionSubtitle>Music</SectionSubtitle>
      <EnvironmentGrid>
        {WORLD_SOUNDS.map((track) => {
          const isLayered = (audioSelections.worldSoundIds || []).includes(
            track.id
          );
          return (
            <EnvironmentCard
              key={track.id}
              $enabled={isLayered}
              $unlocked={true}
              $canAfford={true}
              onClick={() => {
                // Toggle layered selection in store
                toggleWorldSoundId?.(track.id);

                // Play or stop the clicked layer immediately
                if (!isLayered) {
                  try {
                    engineAddSoundConfig({
                      id: track.id,
                      filePath: track.filePath,
                      type: "world",
                      volume: 0.1,
                      loop: true,
                      stopPrevious: false,
                      distanceAttenuation: false,
                      detune: {
                        enabled: false,
                        minSemitones: 0,
                        maxSemitones: 0,
                      },
                      fadeIn: 2000,
                      fadeOut: 1000,
                    } as any);
                  } catch {}
                  enginePlayWorldSound(track.id, {
                    loop: true,
                    stopPrevious: false,
                  });
                } else {
                  try {
                    stopSoundsById(track.id);
                  } catch {}
                }
              }}
            >
              <EnvironmentIcon>{track.icon}</EnvironmentIcon>
              <EnvironmentName>{track.name}</EnvironmentName>
              <EnvironmentStatus $unlocked={true}>
                {isLayered ? "Layered" : "Available"}
              </EnvironmentStatus>
            </EnvironmentCard>
          );
        })}
      </EnvironmentGrid>
    </EnvironmentContainer>
  );
}

function RoutesView() {
  const { routes, purchaseRoute, canAfford } = useGameStore();

  const handleRoutePurchase = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route && !route.purchased && canAfford(route.cost)) {
      purchaseRoute(routeId);
    }
  };

  return (
    <ThemesContainer>
      <ThemesSection>
        <SectionTitle>Unlockable Pages</SectionTitle>
        <ItemsGrid>
          {routes
            .filter((route) => route.id !== "route_home") // Don't show home in shop
            .map((route) => (
              <ThemeCard
                key={route.id}
                $selected={route.purchased}
                $purchased={route.purchased}
                $canAfford={canAfford(route.cost)}
                onClick={() => handleRoutePurchase(route.id)}
              >
                <div style={{ fontSize: "32px" }}>{route.icon}</div>
                <div>
                  <ThemeName>{route.name}</ThemeName>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666666",
                      textAlign: "center",
                    }}
                  >
                    {route.description}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#FFD700",
                      textAlign: "center",
                      marginTop: "4px",
                    }}
                  >
                    {route.cost} taps
                  </div>
                </div>
                <ThemeStatus $purchased={route.purchased}></ThemeStatus>
              </ThemeCard>
            ))}
        </ItemsGrid>
      </ThemesSection>
    </ThemesContainer>
  );
}

function DevView() {
  const {
    addDevTaps,
    buyAllUpgrades,
    toggleStatistics,
    statisticsVisible,
    pauseGame,
    resumeGame,
    resetGame,
    isPaused,
    routes,
    purchaseRoute,
  } = useGameStore();
  const { resetQuests } = useQuestSystem();

  const unlockAllRoutes = () => {
    routes.forEach((route) => {
      purchaseRoute(route.id, true);
    });
  };

  return (
    <DevContainer>
      <SectionTitle>Development</SectionTitle>
      <ContentSubtitle>
        For debugging or testing — use with caution
      </ContentSubtitle>
      <DevGrid>
        <DevButton onClick={() => addDevTaps(100)}>💰 Add 100 Taps</DevButton>
        <DevButton onClick={buyAllUpgrades}>🛒 Buy All Upgrades</DevButton>
        <DevButton onClick={unlockAllRoutes}>🌐 Unlock All Pages</DevButton>

        <Divider />

        <DevButton onClick={toggleStatistics} $active={statisticsVisible}>
          📊 Toggle Statistics
        </DevButton>
        <DevButton
          onClick={isPaused ? resumeGame : pauseGame}
          $active={!isPaused}
        >
          {isPaused ? "▶️" : "⏸️"}{" "}
          {isPaused ? "Resume Auto-Tap" : "Pause Auto-Tap"}
        </DevButton>

        <Divider />

        <DevButton onClick={triggerStoreMigration}>
          🔄 Migrate Version
        </DevButton>
        <DevButton
          onClick={() => {
            confirm("This will reset all quests.\nAre you sure?") &&
              resetQuests();
          }}
        >
          🎯 Reset Quests
        </DevButton>
        <DevButton
          $variant="destructive"
          onClick={() =>
            confirm("This will delete all your progress.\nAre you sure?") &&
            resetGame()
          }
        >
          🗑️ Reset Game
        </DevButton>
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
  -webkit-backdrop-filter: blur(8px);
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
  width: 880px;
  max-width: calc(100% - 32px);
  transform: translateY(-50%);
  height: 80dvh;
  max-height: calc(100svh - 140px);
  background: rgba(20, 20, 20, 0.95);
  -webkit-backdrop-filter: blur(16px);
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
  gap: 16px;
`;

const ShopTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
`;

const TapCountDisplay = styled.div`
  font-size: 14px;
  color: var(--accent-color);
  font-weight: 600;
  margin-left: auto;
  margin-right: 16px;
  text-align: right;
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
    props.$active ? "rgba(255, 255, 255, 0.1)" : "transparent"};
  border: none;
  color: ${(props) => (props.$active ? "var(--accent-color)" : "#666666")};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  transition: all 0.2s ease-in;
  border-radius: 12px;
  width: 100%;
  min-width: 80px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${(props) => (props.$active ? "var(--accent-color)" : "#ffffff")};
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
    background: var(--accent-color);
    transition: width 0.3s ease;
  }
`;

const ContentView = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ThemeCard = styled.div<{
  $selected: boolean;
  $purchased: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$selected ? "#ffffff" : "transparent")};
  background: ${(props) =>
    props.$selected
      ? "rgba(255, 255, 255, 0.1)"
      : props.$purchased
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$purchased ? 1 : props.$canAfford ? 1 : 0.5)};

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
  margin: 0;
`;

const SectionSubtitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 8px 0 0 0;
  opacity: 0.9;
`;

// Effects and Environment styled components
const EffectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ToggleLabel = styled.div`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const EffectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const EffectCard = styled.div<{
  $selected?: boolean;
  $unlocked: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid
    ${(props) => (props.$selected ? "var(--accent-color)" : "transparent")};
  background: ${(props) =>
    props.$selected
      ? "rgba(255, 215, 0, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : props.$canAfford ? 1 : 0.5)};

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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const EnvironmentCard = styled.div<{
  $enabled?: boolean;
  $unlocked: boolean;
  $canAfford: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${(props) => (props.$enabled ? "#4CAF50" : "transparent")};
  background: ${(props) =>
    props.$enabled
      ? "rgba(76, 175, 80, 0.2)"
      : props.$unlocked
      ? "rgba(0, 0, 0, 0.3)"
      : "rgba(0, 0, 0, 0.1)"};
  opacity: ${(props) => (props.$unlocked ? 1 : props.$canAfford ? 1 : 0.5)};

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
  gap: 12px;
  grid-template-columns: repeat(auto-fill, 1fr);
`;

// Settings styles
const SettingsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GroupTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  color: #ffffff;
`;

const ToggleSwitch = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${({ $active }) =>
    $active ? "var(--primary-color)" : "rgba(255,255,255,0.1)"};
  color: #ffffff;
  cursor: pointer;
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 50px;
  align-items: center;
  gap: 8px;
`;

const SliderLabel = styled.div`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
  }
`;

const SliderValue = styled.div`
  text-align: right;
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px 0;
`;

const DevButton = styled.button<{
  $active?: boolean;
  $variant?: "destructive" | "default";
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  max-width: 100%;

  border-radius: 8px;
  border: 1px solid transparent;
  background-color: rgba(255, 255, 255, 0.1);
  border-color: ${(props) =>
    props.$active ? "var(--text-color)" : "transparent"};
  color: ${(props) => (props.$active ? "var(--text-color)" : "#ffffff")};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: 0.2s;
  transition-property: background-color, border-color, color;

  ${(props) =>
    props.$variant === "destructive" &&
    `
    background-color: #b30f0f;
    color: #ffffff;
  `}

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;
