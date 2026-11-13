import { useVinylStore } from "@/store/vinyls";
import { useViewStore } from "@/store/viewStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { playUISound } from "@/utils/soundSystem";
import {
  ROUTE_PATHS,
  useAppStore,
  useBooksStore,
  useMiniGameStore,
} from "@/store";
import { Magnetic } from "@/layout/Magnetic";
import { useSocialsStore } from "@/store/socials";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "./ViewControls.messages";
import { floatingActionButtonStyles } from "@/components/FloatingActionButton";
import { getPanelItemMotion } from "@/styles/panelMotion";
import { sceneChipStyle } from "@/components/SceneChip";

export function ViewControls() {
  const reducedMotion = useReducedMotion();
  const {
    currentView,
    isDefaultView,
    isCreativeView,
    isPhoneView,
    isImageFocused,
    focusedImageTitle,
    isNavigationView,
    resetToDefaultView,
    isTransitioning,
  } = useViewStore();

  const currentRoute = useAppStore((s) => s.currentRoute);
  const { focusedBook } = useBooksStore();
  const { focusedThrone } = useSocialsStore();
  const vinyl = useVinylStore(state => state.selected);
  const { locale } = useI18n();
  const activeGame = useMiniGameStore((s) => s.activeGame);
  const viewTitles = viewControlsMessages[locale].viewTitles;

  const isDefault = isDefaultView();
  const isPhone = isPhoneView();
  const isCreative = isCreativeView();
  const isNavigation = isNavigationView();
  const isGameActive = activeGame !== "LOBBY";
  const isMinigamesRoute = currentRoute === ROUTE_PATHS.MINIGAMES;

  const isShopPreview = currentView === "shop:preview";
  const shouldHide =
    currentView === "loading" ||
    isShopPreview ||
    isGameActive ||
    isMinigamesRoute ||
    isTransitioning ||
    vinyl !== null ||
    focusedBook ||
    focusedThrone;
  const isViewEligible = !isDefault && !isPhone && !isCreative && !isNavigation;
  const showControls = !shouldHide && (isImageFocused || isViewEligible);

  // escape key to return to default view
  useKeyPress("Escape", () => {
    if (
      !isDefault &&
      !isPhone &&
      !isShopPreview &&
      !isCreative &&
      !isTransitioning &&
      !isNavigation &&
      !isMinigamesRoute
    ) {
      handleBackClick();
      playUISound("ui-tap-close");
    }
  });

  const handleBackClick = () => {
    if (isTransitioning) return;
    if (vinyl !== null) { useVinylStore.getState().select(null); return; }
    resetToDefaultView();
  };

  const title = isImageFocused
    ? focusedImageTitle
    : (viewTitles[currentView as keyof typeof viewTitles] ?? "");

  return (
    <AnimatePresence>
      {showControls && (
        <ViewControlsWrapper>
          <Magnetic>
            <TriggerContainer
              onClick={handleBackClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
              key="view-controls-back-button"
              {...getPanelItemMotion(0, reducedMotion)}
              $variant="muted"
              data-ui-sound-id="ui-tap-close"
              style={{ borderRadius: "50px" }}
            >
              <span>{viewControlsMessages[locale].backLabel}</span>
            </TriggerContainer>
          </Magnetic>

          <CurrentViewChip
            key="view-controls-current-view-chip"
            {...getPanelItemMotion(1, reducedMotion)}
          >
            {title}
          </CurrentViewChip>
        </ViewControlsWrapper>
      )}
    </AnimatePresence>
  );
}

const ViewControlsWrapper = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: fit-content;
  margin: 0 auto;
`;

const CurrentViewChip = styled(motion.div)`
  ${sceneChipStyle}
  position: relative;
  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;

  z-index: 1000;
`;

const TriggerContainer = styled(motion.button)<{ $variant: "muted" }>`
  ${floatingActionButtonStyles}
  height: 3rem; padding: 0.5rem 20px; border-radius: 50px;
  font-size: 1rem; font-weight: 900; letter-spacing: -0.02em; white-space: nowrap;
`;
