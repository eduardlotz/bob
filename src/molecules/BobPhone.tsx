import React, { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "motion/react";
import { CloseIcon } from "@/icons/close";
import { NavButton } from "./BottomNavigation";
import { Magnetic } from "@/layout/Magnetic";
import { FillRow, HugColumn } from "@/layout";
import { useClickOutside } from "@/hooks/useClickOutside";
import { PhoneMenuIcon } from "@/icons/phoneMenu";
import { useGameStore, useViewStore } from "@/store";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";

const ShopIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 2H56C68.1503 2 78 11.8497 78 24V56C78 68.1503 68.1503 78 56 78H24C11.8497 78 2 68.1503 2 56V24C2 11.8497 11.8497 2 24 2Z"
      fill="#A6D4A6"
      stroke="#518F57"
      strokeWidth={4}
    />
    <path
      d="M60.1512 27.5167C59.7198 32.08 58.5344 35.9741 57.4127 38.6759C56.5402 40.777 54.7069 42.2579 52.4741 42.695C50.1866 43.1428 46.7196 43.5921 42.0173 43.5921C38.7083 43.5921 35.9066 43.3696 33.6663 43.0817C29.7228 42.575 26.9419 39.3495 26.3077 35.4245L24.4531 23.9492H56.7494C58.7219 23.9492 60.3369 25.553 60.1512 27.5167Z"
      fill="#C3F1C4"
    />
    <path
      d="M60.1512 27.5167C59.7198 32.08 58.5344 35.9741 57.4127 38.6759C56.5402 40.777 54.7069 42.2579 52.4741 42.695C50.1866 43.1428 46.7196 43.5921 42.0173 43.5921C38.7083 43.5921 35.9066 43.3696 33.6663 43.0817C29.7228 42.575 26.9419 39.3495 26.3077 35.4245L24.4531 23.9492H56.7494C58.7219 23.9492 60.3369 25.553 60.1512 27.5167Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M54.9654 52.5202H35.1504C31.6468 52.5202 28.6605 49.979 28.0997 46.5206L24.6883 25.4839C24.1275 22.0255 21.1411 19.4844 17.6375 19.4844H15.6797"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M31.2313 60.5141C33.4387 60.5141 35.2282 58.7248 35.2282 56.5173C35.2282 54.3098 33.4387 52.5205 31.2313 52.5205C29.0238 52.5205 27.2344 54.3098 27.2344 56.5173C27.2344 58.7248 29.0238 60.5141 31.2313 60.5141Z"
      fill="#518F57"
    />
    <path
      d="M31.2313 60.5141C33.4387 60.5141 35.2282 58.7248 35.2282 56.5173C35.2282 54.3098 33.4387 52.5205 31.2313 52.5205C29.0238 52.5205 27.2344 54.3098 27.2344 56.5173C27.2344 58.7248 29.0238 60.5141 31.2313 60.5141Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M54.9655 60.5141C57.173 60.5141 58.9623 58.7248 58.9623 56.5173C58.9623 54.3098 57.173 52.5205 54.9655 52.5205C52.758 52.5205 50.9688 54.3098 50.9688 56.5173C50.9688 58.7248 52.758 60.5141 54.9655 60.5141Z"
      fill="#518F57"
    />
    <path
      d="M54.9655 60.5141C57.173 60.5141 58.9623 58.7248 58.9623 56.5173C58.9623 54.3098 57.173 52.5205 54.9655 52.5205C52.758 52.5205 50.9688 54.3098 50.9688 56.5173C50.9688 58.7248 52.758 60.5141 54.9655 60.5141Z"
      stroke="#518F57"
      strokeWidth={3.57143}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

const ChatIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x={1}
      y={1}
      width={78}
      height={78}
      rx={23}
      fill="#4277F7"
      stroke="#4147D5"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2704)">
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        fill="#D7E0FF"
      />
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.1914 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.5312 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48.875 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2704">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(19.6641 20.416)"
        />
      </clipPath>
    </defs>
  </svg>
);

const BOB_APPS = [
  {
    name: "Shop",
    icon: ShopIcon,
  },
  {
    name: "Settings",
    icon: SettingsIcon,
  },
  {
    name: "Chat",
    icon: ChatIcon,
  },
];

export const BobPhone = () => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { transitionToView } = useViewStore();

  const { toggle, isMuted, isEnabled } = useSoundSystem();
  const { setSoundEnabled } = useGameStore();

  const handleAudioButtonClick = () => {
    toggle();
    setSoundEnabled(isEnabled);
  };

  const onTriggerClick = useCallback(() => {
    if (isOpen) transitionToView("phone");
    else transitionToView("default");

    setIsOpen((prev) => !prev);
  }, []);

  const currentTime = new Date().toLocaleTimeString("de", {
    hour: "2-digit",
    minute: "2-digit",
  });

  useClickOutside([containerRef, triggerRef], () => setIsOpen(false));

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
            // duration: 0.25,
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
                <CloseIcon color="#ffffff" />
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

      <AnimatePresence>
        {isOpen && (
          <BobPhoneBody
            key="bob-phone-body"
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            ref={containerRef}
          >
            <HugColumn $gap={0}>
              <FillRow>
                <StatusPill>{currentTime}</StatusPill>
                <StatusPillButton
                  $active={!isMuted}
                  onClick={handleAudioButtonClick}
                >
                  <AnimatePresence mode="popLayout">
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
                  </AnimatePresence>
                </StatusPillButton>
              </FillRow>
              <AppGrid>
                {BOB_APPS.map((app) => (
                  <HugColumn $align="center">
                    {app.icon()}
                    <AppLabel>{app.name}</AppLabel>
                  </HugColumn>
                ))}
              </AppGrid>
            </HugColumn>
          </BobPhoneBody>
        )}
      </AnimatePresence>
    </>
  );
};

const BobPhoneBody = styled(motion.div)`
  position: fixed;
  bottom: 90px;
  left: 0;
  right: 0;
  margin: 0 auto;

  width: 333px;
  max-width: calc(100vw - 40px);
  background: var(--primary-color);
  padding: 4px;
  border-radius: 24px;
  z-index: 999;
  pointer-events: auto;
`;

const AppGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 8px;
`;

const AppLabel = styled.span`
  font-size: 0.75rem;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
`;

const StatusPill = styled.div`
  font-size: 1rem;
  color: white;
  background: rgba(0, 0, 0, 0.25);
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;
`;

const StatusPillButton = styled.button<{ $active: boolean }>`
  font-size: 1rem;
  color: ${(p) => (p.$active ? "#212121" : "#ffffff9a")};
  background: ${(p) => (p.$active ? "#ffffff" : "rgba(0, 0, 0, 0.25)")};
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;

  > * {
    height: 1.25rem;
  }
`;
