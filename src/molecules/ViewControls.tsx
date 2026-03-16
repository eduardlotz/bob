import { CameraViewId, useViewStore } from "@/store/viewStore";
import { useKeyPress } from "@/hooks/useKeyPress";
import { motion, AnimatePresence } from "motion/react";
import styled from "styled-components";
import { SmallArrowLeftIcon } from "@/icons/arrow";
import { playUISound } from "@/utils/soundSystem";
import {
  ROUTE_PATHS,
  useAppStore,
  useBooksStore,
  useMiniGameStore,
} from "@/store";
import { Magnetic } from "@/layout/Magnetic";
import { useSocialsStore } from "@/store/socials";

const VIEWID_TITLE_MAP = {
  desk: "Musik & Mixes",
  bookshelf: "Buchsammlung",
  computer: "Apps & Seiten",
  cardbox: "Interessen & Hobbies",
  socials: "Eddie's Ecke",
} satisfies Partial<Record<CameraViewId, string>>;

export function ViewControls() {
  const {
    currentView,
    isDefaultView,
    isAboutView,
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

  const activeGame = useMiniGameStore((s) => s.activeGame);

  const isDefault = isDefaultView();
  const isPhone = isPhoneView();
  const isCreative = isCreativeView();
  const isNavigation = isNavigationView();
  const isGameActive = activeGame !== "LOBBY";
  const isMinigamesRoute = currentRoute === ROUTE_PATHS.MINIGAMES;

  const shouldHide =
    isGameActive ||
    isMinigamesRoute ||
    isTransitioning ||
    focusedBook ||
    focusedThrone;
  const isViewEligible = !isDefault && !isPhone && !isCreative && !isNavigation;
  const showControls = !shouldHide && (isImageFocused || isViewEligible);

  // escape key to return to default view
  useKeyPress("Escape", () => {
    if (
      !isDefault &&
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

    resetToDefaultView();
  };

  const title = isImageFocused
    ? focusedImageTitle
    : (VIEWID_TITLE_MAP[currentView as keyof typeof VIEWID_TITLE_MAP] ?? "");

  return (
    <AnimatePresence>
      {showControls && (
        <ViewControlsWrapper>
          {/* <BackButton
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key="view-controls-back-button"
            initial={{ y: 120, filter: "blur(6px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 120, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: "circInOut" }}
            data-ui-sound-id="ui-tap-close"
          >
            <ArrowLeftIcon />
          </BackButton> */}

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
              <SmallArrowLeftIcon />

              <span>Zurück</span>
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
  min-width: fit-content;
  width: fit-content;
  max-width: calc(100vw - 32px);
  word-wrap: nowrap;

  color: #ffffff;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(0, 0, 0, 0.2);
  -webkit-backdrop-filter: blur(32px);
  backdrop-filter: blur(32px);
  border-radius: 50px;
  font-size: 16px;
  letter-spacing: -2%;
  font-weight: 600;
  z-index: 1000;
`;

const BackButton = styled(motion.button)`
  background: #ffffff;
  color: #121212;
  border: none;
  border-radius: 50px;
  height: 40px;
  width: 40px;
  aspect-ratio: 1/1;

  box-shadow: 0 -2px 10px 0 rgba(0, 0, 0, 0.1);

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    height: 14px;
  }
`;

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;
  gap: 0.5rem;

  span {
    max-height: 1.5rem;
  }
`;
