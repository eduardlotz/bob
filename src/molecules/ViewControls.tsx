import { useViewStore } from "@/store/viewStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence } from "motion/react";
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
import { ChevronLeftIcon } from "@/icons/chevron";
import { useLibraryStore } from "@/store/exploration";
import { sceneChipStyle } from "@/components/SceneChip";
import { explorationMessages } from "@/routes/exploration.messages";

export function ViewControls() {
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
  const { locale, messages } = useI18n();
  const libraryStatus = useLibraryStore(state => state.status);
  const libraryMedia = useLibraryStore(state => state.media);
  const libraryBook = useLibraryStore(state => state.bookId);
  const isLiterature = currentRoute === ROUTE_PATHS.LITERATURE;
  const isLiteratureDetail = isLiterature && (libraryStatus !== null || libraryMedia !== null);

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
    (isLiterature && (!isLiteratureDetail || libraryBook !== null || isPhone || isNavigation)) ||
    currentView === "loading" ||
    isShopPreview ||
    isGameActive ||
    isMinigamesRoute ||
    isTransitioning ||
    focusedBook ||
    focusedThrone;
  const isViewEligible = !isDefault && !isPhone && !isCreative && !isNavigation;
  const showControls = !shouldHide && (isLiteratureDetail || isImageFocused || isViewEligible);

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
      && currentRoute !== ROUTE_PATHS.LITERATURE
    ) {
      handleBackClick();
      playUISound("ui-tap-close");
    }
  });

  const handleBackClick = () => {
    if (isTransitioning) return;
    if (isLiterature) { useLibraryStore.getState().reset(); return; }
    resetToDefaultView();
  };

  const title = isLiterature && libraryStatus
    ? messages.books.statuses[libraryStatus]
    : isLiterature && libraryMedia
    ? explorationMessages[locale][libraryMedia]
    : isImageFocused
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
              initial={{ y: 120, filter: "blur(6px)" }}
              animate={{
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{ y: 120, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "circInOut" }}
              data-ui-sound-id="ui-tap-close"
              style={{ borderRadius: "50px" }}
            >
              <ChevronLeftIcon />

              <span>{viewControlsMessages[locale].backLabel}</span>
            </TriggerContainer>
          </Magnetic>

          <CurrentViewChip
            key="view-controls-current-view-chip"
            initial={{ y: 20, scale: 0.9, opacity: 0, filter: "blur(6px)" }}
            animate={{
              y: 0,
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
            }}
            exit={{ y: 120, scale: 0.9, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: "circInOut", delay: 0.15 }}
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

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  padding: 0.5rem 14px 0.5rem 8px;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;

  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;

  color: #212121;
  margin: 0 auto;
  overflow: clip;
  gap: 0.125rem;

  span {
    max-height: 1.5rem;
  }
`;
