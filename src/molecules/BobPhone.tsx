import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import styled from "styled-components";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { CloseIcon } from "@/icons/close";
import { NavButton } from "./BottomNavigation";
import { Magnetic } from "@/layout/Magnetic";
import { FillColumn, FillRow, HugColumn } from "@/layout";
import { format } from "date-fns/format";

import { PhoneMenuIcon } from "@/icons/phoneMenu";
import { useGameStore, useViewStore } from "@/store";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";
import { ShopApp, ShopIcon, TapCounterChip } from "@/apps/shop";
import { ArrowLeftIcon } from "@/icons/arrow";
import { useKeyPress } from "@/hooks/useKeyPress";
import { DebugApp, DebugIcon } from "@/apps/debug";
import { useClickOutside } from "@/hooks/useClickOutside";
import { QuestsApp, QuestsIcon } from "@/apps/quests";
import { OptionsApp } from "@/apps/options";
import { playUISound } from "@/utils/soundSystem";
import { ChatApp, ChatIcon } from "@/apps/chat";

const SettingsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#6B6E75"
      stroke="#21212A"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2743)">
      <path
        d="M22.8633 53.6907C23.0079 56.4116 25.0932 58.9659 27.8179 58.9865C27.8428 58.9867 27.8677 58.9867 27.8926 58.9867C27.9176 58.9867 27.9425 58.9867 27.9674 58.9865C30.6921 58.9659 32.7774 56.4116 32.922 53.6907C32.9665 52.8536 32.9962 52.0045 32.9962 51.145C32.9962 49.4739 32.8839 47.8409 32.7689 46.2613C32.6699 44.9025 31.6366 43.7733 30.2784 43.6668C28.6537 43.5395 27.1316 43.5395 25.5069 43.6668C24.1487 43.7733 23.1154 44.9025 23.0164 46.2613C22.9014 47.8409 22.7891 49.4739 22.7891 51.145C22.7891 52.0045 22.8188 52.8536 22.8633 53.6907Z"
        fill="#D7D8DD"
      />
      <path
        d="M24.3395 28.0719C24.3851 30.0332 25.9289 31.6773 27.8908 31.6773C29.8527 31.6773 31.3965 30.0332 31.4421 28.0719C31.4702 26.8633 31.4594 25.6688 31.4098 24.4494C31.3538 23.0727 30.2741 21.9443 28.8982 21.8722C28.1985 21.8356 27.5831 21.8356 26.8834 21.8721C25.5074 21.944 24.4277 23.0724 24.3717 24.4491C24.3221 25.6686 24.3114 26.8632 24.3395 28.0719Z"
        fill="#D7D8DD"
      />
      <path
        d="M24.3395 28.0719C24.3851 30.0332 25.9289 31.6773 27.8908 31.6773C29.8527 31.6773 31.3965 30.0332 31.4421 28.0719C31.4702 26.8633 31.4594 25.6688 31.4098 24.4494C31.3538 23.0727 30.2741 21.9443 28.8982 21.8722C28.1985 21.8356 27.5831 21.8356 26.8834 21.8721C25.5074 21.944 24.4277 23.0724 24.3717 24.4491C24.3221 25.6686 24.3114 26.8632 24.3395 28.0719Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.8945 43.1928V31.7529"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.1115 22.2439C43.1115 27.9576 44.6759 29.3706 47.4573 29.3706C50.2387 29.3706 51.8029 27.9576 51.8029 22.2439C51.8029 22.0187 52.0141 21.8514 52.2307 21.9134C56.2215 23.0579 58.3989 25.8925 58.3989 30.1182C58.3989 34.0846 56.4804 36.8254 52.9447 38.0933C52.8144 38.14 52.7315 38.269 52.7392 38.4072C52.8464 40.2848 52.9424 44.3602 52.9424 46.332C52.9424 48.3039 52.8464 52.4263 52.7395 54.304C52.6118 56.5414 50.9972 58.6089 48.7703 58.8586C47.908 58.9554 47.0065 58.9554 46.1441 58.8586C43.9171 58.6089 42.3026 56.5414 42.1751 54.304C42.0681 52.4263 41.9721 48.3039 41.9721 46.332C41.9721 44.3602 42.0682 40.2848 42.1752 38.4072C42.1831 38.269 42.1 38.14 41.9697 38.0933C38.434 36.8254 36.5156 34.0846 36.5156 30.1182C36.5156 25.8925 38.6931 23.0579 42.6838 21.9134C42.9003 21.8514 43.1115 22.0187 43.1115 22.2439Z"
        fill="#D7D8DD"
      />
      <path
        d="M22.8633 53.6907C23.0079 56.4116 25.0932 58.9659 27.8179 58.9865C27.8428 58.9867 27.8677 58.9867 27.8926 58.9867C27.9176 58.9867 27.9425 58.9867 27.9674 58.9865C30.6921 58.9659 32.7774 56.4116 32.922 53.6907C32.9665 52.8536 32.9962 52.0045 32.9962 51.145C32.9962 49.4739 32.8839 47.8409 32.7689 46.2613C32.6699 44.9025 31.6366 43.7733 30.2784 43.6668C28.6537 43.5395 27.1316 43.5395 25.5069 43.6668C24.1487 43.7733 23.1154 44.9025 23.0164 46.2613C22.9014 47.8409 22.7891 49.4739 22.7891 51.145C22.7891 52.0045 22.8188 52.8536 22.8633 53.6907Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.1115 22.2439C43.1115 27.9576 44.6759 29.3706 47.4573 29.3706C50.2387 29.3706 51.8029 27.9576 51.8029 22.2439C51.8029 22.0187 52.0141 21.8514 52.2307 21.9134C56.2215 23.0579 58.3989 25.8925 58.3989 30.1182C58.3989 34.0846 56.4804 36.8254 52.9447 38.0933C52.8144 38.14 52.7315 38.269 52.7392 38.4072C52.8464 40.2848 52.9424 44.3602 52.9424 46.332C52.9424 48.3039 52.8464 52.4263 52.7395 54.304C52.6118 56.5414 50.9972 58.6089 48.7703 58.8586C47.908 58.9554 47.0065 58.9554 46.1441 58.8586C43.9171 58.6089 42.3026 56.5414 42.1751 54.304C42.0681 52.4263 41.9721 48.3039 41.9721 46.332C41.9721 44.3602 42.0682 40.2848 42.1752 38.4072C42.1831 38.269 42.1 38.14 41.9697 38.0933C38.434 36.8254 36.5156 34.0846 36.5156 30.1182C36.5156 25.8925 38.6931 23.0579 42.6838 21.9134C42.9003 21.8514 43.1115 22.0187 43.1115 22.2439Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2743">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(20.332 20.416)"
        />
      </clipPath>
    </defs>
  </svg>
);

const MoreAppsSoonIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M52 0V1H56C57.5373 1 59.0389 1.15039 60.4902 1.4375L60.6826 0.458008C63.8315 1.08082 66.7588 2.31897 69.334 4.04297L68.7783 4.87305C71.2869 6.55252 73.4475 8.71307 75.127 11.2217L75.9561 10.665C77.6802 13.2402 78.918 16.1674 79.541 19.3164L78.5625 19.5098C78.8496 20.9611 79 22.4627 79 24V28H80V36H79V44H80V52H79V56C79 57.5373 78.8496 59.0389 78.5625 60.4902L79.541 60.6826C78.9182 63.8317 77.6802 66.7587 75.9561 69.334L75.127 68.7783C73.4475 71.2869 71.2869 73.4475 68.7783 75.127L69.334 75.9561C66.7587 77.6802 63.8317 78.9182 60.6826 79.541L60.4902 78.5625C59.0389 78.8496 57.5373 79 56 79H52V80H44V79H36V80H28V79H24C22.4627 79 20.9611 78.8496 19.5098 78.5625L19.3164 79.541C16.1674 78.918 13.2402 77.6802 10.665 75.9561L11.2217 75.127C8.71307 73.4475 6.55252 71.2869 4.87305 68.7783L4.04297 69.334C2.31897 66.7588 1.08082 63.8315 0.458008 60.6826L1.4375 60.4902C1.1863 59.2205 1.03962 57.9121 1.00684 56.5752L1 56V52H0V44H1V36H0V28H1V24C1 22.4627 1.15039 20.9611 1.4375 19.5098L0.458008 19.3164C1.08094 16.1676 2.31891 13.2401 4.04297 10.665L4.87305 11.2217C6.55252 8.71307 8.71307 6.55252 11.2217 4.87305L10.665 4.04297C13.2401 2.31891 16.1676 1.08094 19.3164 0.458008L19.5098 1.4375C20.9611 1.15039 22.4627 1 24 1H28V0H36V1H44V0H52Z"
      fill="#373737"
      stroke="white"
      strokeWidth="2"
      strokeDasharray="8 8"
    />
    <path
      d="M38.4981 42.28C38.4981 41.4 38.6181 40.68 38.8581 40.12C39.0981 39.544 39.3781 39.096 39.6981 38.776C40.0341 38.456 40.4661 38.112 40.9941 37.744C41.3941 37.456 41.6981 37.224 41.9061 37.048C42.1141 36.856 42.2901 36.616 42.4341 36.328C42.5941 36.04 42.6741 35.696 42.6741 35.296C42.6741 34.608 42.4501 34.096 42.0021 33.76C41.5701 33.408 41.0021 33.232 40.2981 33.232C39.4981 33.232 38.8501 33.496 38.3541 34.024C37.8581 34.536 37.5781 35.288 37.5141 36.28H34.2261C34.2901 35.032 34.5941 33.96 35.1381 33.064C35.6821 32.168 36.4021 31.488 37.2981 31.024C38.2101 30.56 39.2341 30.328 40.3701 30.328C42.0341 30.328 43.4021 30.768 44.4741 31.648C45.5621 32.528 46.1061 33.808 46.1061 35.488C46.1061 36.208 46.0021 36.816 45.7941 37.312C45.6021 37.808 45.3621 38.208 45.0741 38.512C44.7861 38.8 44.3941 39.12 43.8981 39.472C43.5141 39.776 43.1941 40.04 42.9381 40.264C42.6981 40.488 42.4821 40.768 42.2901 41.104C42.1141 41.424 41.9941 41.824 41.9301 42.304L41.7381 43.408H38.4981V42.28ZM40.0821 49.288C39.5061 49.288 39.0101 49.08 38.5941 48.664C38.1941 48.248 37.9941 47.752 37.9941 47.176C37.9941 46.616 38.1941 46.136 38.5941 45.736C39.0101 45.32 39.5061 45.112 40.0821 45.112C40.6581 45.112 41.1461 45.312 41.5461 45.712C41.9621 46.112 42.1701 46.6 42.1701 47.176C42.1701 47.752 41.9621 48.248 41.5461 48.664C41.1461 49.08 40.6581 49.288 40.0821 49.288Z"
      fill="white"
    />
  </svg>
);

type AppId = "shop" | "options" | "chat" | "quests" | "debug";

const AppNameMap: Record<AppId, string> = {
  shop: "Shop",
  options: "Optionen",
  chat: "Chat",
  quests: "Quests",
  debug: "Debug",
};

interface BobAppData {
  id: AppId;
  icon: any; // fix type, jsx not working
  view: React.JSX.Element;
  bottomAction?: React.JSX.Element;
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
  },
  {
    id: "quests",
    icon: QuestsIcon,
    view: <QuestsApp />,
  },
  {
    id: "options",
    icon: SettingsIcon,
    view: <OptionsApp />,
  },
  {
    id: "debug",
    icon: DebugIcon,
    view: <DebugApp />,
  },
];

// MAYDO: check ref error
export const BobPhone = () => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { transitionToView, currentView, resetToDefaultView } = useViewStore();
  const [activeApp, setActiveApp] = useState<AppId | undefined>();

  const openApp = (appName: AppId) => {
    setActiveApp(appName);
  };

  const { toggle, isMuted, isEnabled } = useSoundSystem();
  const { setSoundEnabled } = useGameStore();

  const activeAppView = () => BOB_APPS.find((a) => a.id === activeApp)?.view;
  const activeAppBottomAction = () =>
    BOB_APPS.find((a) => a.id === activeApp)?.bottomAction;
  const activeAppName = activeApp ? AppNameMap[activeApp] : "";

  const showStatusBar = ["", "quests", "chat", "debug"].includes(
    activeApp ?? ""
  );

  const handleAudioButtonClick = () => {
    toggle();
    setSoundEnabled(isEnabled);
  };

  const goToHomeScreen = () => {
    setActiveApp(undefined);
    transitionToView("phone:home");
  };

  const onTriggerClick = () => {
    isOpen ? resetToDefaultView() : transitionToView("phone:home");
    setIsOpen((prev) => !prev);
    console.info(
      isOpen
        ? "resetToDefaultView(); in BOBPHONE.tsx"
        : "TRANSITION_TO_VIEW(PHONE_HOME) in BOBPHONE.tsx"
    );
  };

  const currentHour = format(new Date(), "HH");
  const currentMinutes = format(new Date(), "mm");

  useKeyPress("Escape", () => {
    if (isOpen) {
      onTriggerClick();
      playUISound("ui-tap-close");
    }
  });

  useClickOutside([containerRef, triggerRef], () => {
    if (currentView === "phone:home" && isOpen) onTriggerClick();
  });

  useEffect(() => {
    if (currentView.startsWith("phone:")) setIsOpen(true);
    else setIsOpen(false);
  }, [currentView]);

  return (
    <>
      <Magnetic key="bob-phone-trigger-magnet">
        <NavButton
          layout="position"
          key="bob-phone-trigger"
          onClick={onTriggerClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={isOpen}
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.5,
            delay: 0.1,
          }}
          ref={triggerRef}
        >
          <AnimatePresence mode="popLayout">
            {isOpen ? (
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
      </Magnetic>

      <AnimatePresence mode="wait">
        {isOpen && (
          <BobPhoneBody
            key="bob-phone-body"
            initial={{ opacity: 0, scaleX: 0.95, y: 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scaleX: 0.95, y: 40, filter: "blur(6px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
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
            }}
            layout
          >
            <HugColumn
              $gap={activeApp ? "4px" : "0"}
              layout="position"
              $align="center"
            >
              {showStatusBar && (
                <FillRow>
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
              <FillColumn
                key={activeApp}
                $gap={activeApp ? "4px" : "0"}
                $align="center"
                $justify="center"
                // key="shop-app-container"
                initial={{
                  opacity: 0,
                  scaleX: 0.95,
                  y: 40,
                  filter: "blur(6px)",
                }}
                animate={{
                  opacity: 1,
                  scaleX: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  scaleX: 0.95,
                  y: 80,
                  filter: "blur(6px)",
                }}
                transition={{
                  type: "spring" as const,
                  bounce: 0.4,
                }}
              >
                {activeApp ? (
                  activeAppView()
                ) : (
                  <AppGrid
                    key="app-grid"
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      filter: "blur(4px)",
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      filter: "blur(0px)",
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      filter: "blur(4px)",
                      y: 12,
                    }}
                    transition={{
                      // type: "spring",
                      // bounce: 0.4,
                      duration: 0.2,
                      ease: "easeInOut",
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
                    <AppContainer disabled>
                      <MoreAppsSoonIcon />
                      <AppLabel>In Arbeit</AppLabel>
                    </AppContainer>
                  </AppGrid>
                )}
                {activeApp && (
                  <AppBottomActions key="app_bottom_actions">
                    <BackHomeButton onClick={goToHomeScreen}>
                      <ArrowLeftIcon />
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

const OverflowClip = styled.div`
  /* overflow: clip; */
  overflow-clip-margin: 0.25rem;
  position: relative;
`;

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

  padding: 8px 12px;
  height: 2.5rem;
  border-radius: 50px;
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
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

export const StatusPill = styled(motion.div)`
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

export const StatusPillButton = styled(motion.button)<{ $active: boolean }>`
  font-size: 1rem;
  color: ${(p) =>
    p.$active ? "rgba(255,255,255,1)" : "rgba(255,255,255,.75)"};
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.25)"};
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;

  > * {
    height: 1.25rem;
  }
`;

export const Blinking = styled.span`
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
