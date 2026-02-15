import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { CloseIcon } from "@/icons/close";
import { NavButton } from "./BottomNavigation";
import { Magnetic } from "@/layout/Magnetic";
import { FillColumn, FillRow, HugColumn } from "@/layout";
import { format } from "date-fns/format";

import { PhoneMenuIcon } from "@/icons/phoneMenu";
import { useCoreStore, useViewStore } from "@/store";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";
import { ShopApp, ShopIcon, TapCounterChip } from "@/apps/shop";
import { ArrowLeftIcon, SmallArrowLeftIcon } from "@/icons/arrow";
import { useKeyPress } from "@/hooks/useKeyPress";
import { DebugApp, DebugIcon } from "@/apps/debug";
import { useClickOutside } from "@/hooks/useClickOutside";
import { QuestsApp, QuestsIcon } from "@/apps/quests";
import { OptionsApp, OptionsIcon } from "@/apps/options";
import { playUISound } from "@/utils/soundSystem";
import { ChatApp, ChatIcon } from "@/apps/chat";
import { CreditsApp, CreditsIcon } from "@/apps/credits";
import { StatusPillButton } from "@/apps/ui";

type AppId = "shop" | "options" | "chat" | "quests" | "credits" | "debug";

const AppNameMap: Record<AppId, string> = {
  shop: "Shop",
  options: "Optionen",
  chat: "Chat",
  quests: "Quests",
  credits: "Credits",
  debug: "Debug",
};

interface BobAppData {
  id: AppId;
  icon: any; // fix type, jsx not working
  view: React.JSX.Element;
  bottomAction?: React.JSX.Element;
  hideStatusBar?: boolean;
}

const BOB_APPS: Array<BobAppData> = [
  {
    id: "chat",
    icon: ChatIcon,
    view: <ChatApp />,
  },
  {
    id: "shop",
    icon: ShopIcon,
    view: <ShopApp />,
    bottomAction: <TapCounterChip />,
    hideStatusBar: true,
  },
  {
    id: "quests",
    icon: QuestsIcon,
    view: <QuestsApp />,
  },
  {
    id: "options",
    icon: OptionsIcon,
    view: <OptionsApp />,
    // bottomAction: <AppInfo style={{ marginRight: "0.5rem" }}>Beta</AppInfo>,
    hideStatusBar: true,
  },
  {
    id: "credits",
    icon: CreditsIcon,
    view: <CreditsApp />,
  },
  {
    id: "debug",
    icon: DebugIcon,
    view: <DebugApp />,
  },
];

interface BobPhoneProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// MAYDO: check ref error
export const BobPhone = (props: BobPhoneProps) => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const { transitionToView, currentView, resetToDefaultView } = useViewStore();
  const [activeApp, setActiveApp] = useState<AppId | undefined>();

  const openApp = (appName: AppId) => {
    setActiveApp(appName);
  };

  const { toggle, isMuted, isEnabled } = useSoundSystem();
  const { setSoundEnabled, resetPreview } = useCoreStore();

  const activeAppView = () => BOB_APPS.find((a) => a.id === activeApp)?.view;
  const hideStatusBar = BOB_APPS.find((a) => a.id === activeApp)?.hideStatusBar;
  const activeAppBottomAction = () =>
    BOB_APPS.find((a) => a.id === activeApp)?.bottomAction;
  const activeAppName = activeApp ? AppNameMap[activeApp] : "";

  const handleAudioButtonClick = () => {
    toggle();
    setSoundEnabled(isEnabled);
  };

  const goToHomeScreen = () => {
    setActiveApp(undefined);
    transitionToView("phone:home");
  };

  const onTriggerClick = () => {
    setActiveApp(undefined);
    if (props.isOpen) {
      resetToDefaultView();
      props.setIsOpen(false);
    } else {
      props.setIsOpen(true);
      transitionToView("phone:home");
    }
  };

  const currentHour = format(new Date(), "HH");
  const currentMinutes = format(new Date(), "mm");

  useKeyPress("Escape", () => {
    if (props.isOpen) {
      onTriggerClick();
      playUISound("ui-tap-close");
    }
  });

  useClickOutside([containerRef, triggerRef], () => {
    if (currentView === "phone:home" && props.isOpen) {
      onTriggerClick();
      playUISound("ui-tap-close");
    }
  });

  useEffect(() => {
    if (currentView.startsWith("phone:")) {
      // setIsOpen(true);
      resetPreview();
    }
    //  else {
    //   setIsOpen(false);
    // }
  }, [currentView]);

  return (
    <>
      <NavButton
        key="bob-phone-trigger"
        onClick={onTriggerClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        $isActive={props.isOpen}
        initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.5,
          delay: 0.1,
        }}
        ref={triggerRef}
        layout="position"
      >
        <AnimatePresence mode="popLayout">
          {props.isOpen ? (
            <motion.span
              key="close-phone-icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.25,
                type: "spring" as const,
                bounce: 0.5,
              }}
            >
              <CloseIcon />
            </motion.span>
          ) : (
            <motion.span
              key="show-phone-icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.25,
                type: "spring" as const,
                bounce: 0.5,
              }}
            >
              <PhoneMenuIcon />
            </motion.span>
          )}
        </AnimatePresence>
        <span>Phone</span>
      </NavButton>

      <AnimatePresence mode="wait">
        {props.isOpen && (
          <BobPhoneBody
            key="bob-phone-body"
            initial={{
              opacity: 0,
              scaleX: 1.05,
              rotateX: -15,
              y: 12,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              scaleX: 1,
              rotateX: 0,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              scaleX: 0.95,
              rotateX: -5,
              y: -12,
              filter: "blur(6px)",
              // transition: {
              //   ease: "circOut",
              //   duration: 0.1,
              // },
            }}
            transition={{
              // duration: 0.2,
              // ease: "easeInOut",
              type: "spring" as const,
              bounce: 0.5,
              visualDuration: 0.3,
              // ease: "circOut",
              // duration: 0.2,
              layout: {
                type: "spring",
                mass: 0.5,
                damping: 12,
                bounceDamping: 20,
              },
            }}
            ref={containerRef}
            style={{
              borderRadius: "24px",
              opacity: 0,
              transformPerspective: 900,
              transformStyle: "preserve-3d",
            }}
            layout
          >
            <HugColumn
              $gap={activeApp ? "4px" : "0"}
              // layout
              layout="position"
              $align="center"
            >
              <AnimatePresence mode="popLayout">
                {!hideStatusBar && (
                  <FillRow
                    key={"bob-phone-statusbar"}
                    initial={{ filter: "blur(4px)", opacity: 0 }}
                    animate={{ filter: "blur(0px)", opacity: 1 }}
                    exit={{ filter: "blur(4px)", opacity: 0 }}
                    transition={{
                      ease: "easeOut",
                    }}
                  >
                    <StatusPill layout="position">
                      {currentHour}
                      <Blinking
                        style={{
                          paddingLeft: "0.1ch",
                          paddingRight: "0.05ch",
                        }}
                      >
                        :
                      </Blinking>
                      {currentMinutes}
                    </StatusPill>

                    <StatusPillButton
                      $active={!isMuted}
                      onClick={handleAudioButtonClick}
                      layout="position"
                    >
                      <motion.div
                        key={!isMuted ? "on" : "off"}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          duration: 0.2,
                          type: "spring",
                          bounce: 0.7,
                        }}
                      >
                        <SpeakerIcon muted={isMuted} />
                      </motion.div>
                    </StatusPillButton>
                  </FillRow>
                )}
              </AnimatePresence>
              <FillColumn
                key={activeApp ?? "app-grid-wrapper"}
                $gap={activeApp ? "4px" : "0"}
                $align="center"
                $justify="center"
                initial={{
                  opacity: 0,
                  scaleY: 1.05,
                }}
                animate={{
                  opacity: 1,
                  scaleY: 1,
                }}
                exit={{
                  opacity: 0,
                  scaleY: 1.05,
                }}
                transition={{
                  ease: "circOut",
                  duration: 0.2,
                }}
                layout
              >
                <AnimatePresence mode="popLayout">
                  {activeApp ? (
                    activeAppView()
                  ) : (
                    <AppGrid
                      key="app-grid"
                      initial={{
                        opacity: 0,
                        scaleX: 1.05,
                        filter: "blur(4px)",
                      }}
                      animate={{
                        opacity: 1,
                        scaleX: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        scaleX: 1.05,
                        filter: "blur(4px)",
                      }}
                      transition={{
                        type: "spring" as const,
                        bounce: 0.5,
                        visualDuration: 0.3,
                      }}
                    >
                      {BOB_APPS.map((app) => (
                        <AppContainer
                          key={app.id}
                          onClick={() => openApp(app.id)}
                        >
                          {app.icon()}
                          <AppLabel>{AppNameMap[app.id]}</AppLabel>
                        </AppContainer>
                      ))}
                    </AppGrid>
                  )}
                </AnimatePresence>

                {activeApp && (
                  <AppBottomActions
                    key="app_bottom_actions"
                    initial={{
                      opacity: 0,
                      scaleX: 1.25,
                    }}
                    animate={{
                      opacity: 1,
                      scaleX: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scaleX: 1.25,
                    }}
                    transition={{
                      type: "spring" as const,
                      bounce: 0.2,
                      visualDuration: 0.3,
                    }}
                    layout
                  >
                    <BackHomeButton
                      onClick={goToHomeScreen}
                      data-ui-sound-id="ui-tap-close"
                    >
                      <SmallArrowLeftIcon />
                    </BackHomeButton>

                    <AppName>{activeAppName}</AppName>

                    <AppAction>{activeAppBottomAction()}</AppAction>
                  </AppBottomActions>
                )}
              </FillColumn>
            </HugColumn>
          </BobPhoneBody>
        )}
      </AnimatePresence>
    </>
  );
};

const AppBottomActions = styled(FillRow)`
  position: relative;

  align-items: center;
  justify-content: center;

  padding: 4px;
  height: 2.5rem;
`;

const AppAction = styled.div`
  position: absolute;
  right: 4px;
  margin: auto 0;
`;

const BackHomeButton = styled.button`
  display: flex;
  align-items: center;

  padding: 8px 16px;
  height: 2.5rem;
  border-radius: 50px;
  background-color: white;
  color: var(--primary-color);
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  margin: auto 0;
`;

const AppName = styled.h5`
  font-size: 1rem;
  font-weight: 600;
`;

const BobPhoneBody = styled(motion.div)`
  position: fixed;
  bottom: 94px;
  left: 0;
  right: 0;
  margin: 0 auto;

  overflow: clip;
  overflow-clip-margin: 0.25rem;
  transform-origin: bottom center;

  min-width: 18rem;
  width: fit-content;
  max-width: calc(100vw - 40px);
  background: var(--primary-color);
  padding: 4px;
  border-radius: 24px;
  z-index: 999;
  pointer-events: auto;
`;

const AppGrid = styled(motion.div)`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 1rem;
  padding: 8px;
  place-items: center;
  width: 18rem;
`;

const AppContainer = styled.button`
  position: relative;
  align-items: center;
  width: fit-content;
  background: none;
  border-radius: 24px;
  padding: 0px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &:after {
    content: "";
    position: absolute;
    margin: auto;
    top: 0px;
    bottom: 0px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    background: rgba(255, 255, 255, 0.15);
    opacity: 0;
    z-index: -1;
    border-radius: 24px;
    scale: 0.95;
    transition: 0.25s cubic-bezier(0.4, 0.9, 0.4, 1);
    transition-property: scale, opacity;
  }

  @media (hover: hover) {
    &:not(:disabled):hover {
      &:after {
        opacity: 1;
        scale: 1;
      }
    }
  }
`;

const AppLabel = styled.span`
  font-size: 0.75rem;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
`;

const StatusPill = styled(motion.div)`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;
  height: 2.25rem;
`;

const Blinking = styled.span`
  animation: blinking linear 3s infinite;

  @keyframes blinking {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 0;
    }

    51% {
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }
`;
