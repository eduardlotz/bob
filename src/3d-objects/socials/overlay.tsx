import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import styled, { css } from "styled-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppStore } from "@/store";
import { useSocialsStore } from "@/store/socials";
import { CloseIcon } from "@/icons/close";
import { OVERLAY_ROOT_ID } from "@/3d-objects/books/overlay";
import { useI18n } from "@/i18n";

import { THRONE_BY_ID } from "./data";
import { socialsMessages } from "./socials.messages";

const PANEL_W = "400px";
const PANEL_MIN_H = "440px";
const PANEL_MAX_H = "780px";
const MOBILE_PEEK_MAX_OFFSET = 220;
const MOBILE_PEEK_MIN_OFFSET = 96;
const MOBILE_PEEK_DISMISS_DISTANCE = 56;
const MOBILE_EXPAND_DISTANCE = 36;
const MOBILE_DOWN_VELOCITY_DISMISS = 300;
const MOBILE_UP_VELOCITY_EXPAND = -300;
const MOBILE_FULL_COLLAPSE_RATIO = 0.35;

const Panel = styled(motion.aside)<{
  $mobile: boolean;
  $panelWidth?: string;
  $minHeight?: string;
  $maxHeight?: string;
}>`
  position: fixed;
  z-index: 40;
  pointer-events: auto;
  border-radius: 20px;
  background: #f2f2f3;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${({ $mobile, $panelWidth, $minHeight, $maxHeight }) =>
    $mobile
      ? css`
          inset: 0;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -18px 56px rgba(0, 0, 0, 0.24);
          padding-top: max(env(safe-area-inset-top), 8px);
        `
      : css`
          top: 4px;
          right: 4px;
          bottom: 4px;
          margin: auto clamp(4px, 5vw, 6rem);
          width: ${$panelWidth ?? PANEL_W};
          max-width: 90vw;
          height: fit-content;
          min-height: ${$minHeight ?? PANEL_MIN_H};
          max-height: ${$maxHeight ?? PANEL_MAX_H};
          box-shadow: -10px 0 52px rgba(0, 0, 0, 0.13);
        `}
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
`;

const MobileDragZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 4px 0 2px;
  cursor: grab;
  touch-action: none;
`;

const MobileHandle = styled.span`
  width: 38px;
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  color: #212121;
  letter-spacing: -1.5%;
  margin: 0;
  line-height: 1.15;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #212121;
  opacity: 0.6;
  margin: 0;
`;

const PanelScroll = styled.div<{ $mobile: boolean; $fullScreen: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: ${({ $mobile, $fullScreen }) =>
    $mobile && !$fullScreen ? "hidden" : "auto"};
  padding: 10px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overscroll-behavior-y: contain;

  ${({ $mobile }) =>
    $mobile &&
    css`
      padding:
        8px 16px
        calc(92px + env(safe-area-inset-bottom))
        16px;
    `}

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
`;

const CloseBtn = styled.button<{ $mobile: boolean; $fullScreen: boolean }>`
  position: absolute;
  top: ${({ $mobile }) =>
    $mobile ? "calc(max(env(safe-area-inset-top), 8px) + 10px)" : "4px"};
  right: ${({ $mobile }) => ($mobile ? "12px" : "4px")};
  z-index: 10;
  width: 48px;
  height: 40px;
  border-radius: 10rem;
  background: rgba(229, 229, 234, 0.7);
  border: none;
  font-size: 1.15rem;
  color: #212121;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.14);
  }
`;

const SLIDE_VARIANTS = {
  initial: { filter: "blur(12px)", opacity: 0, scale: 0.95 },
  animate: { filter: "blur(0px)", opacity: 1, scale: 1 },
  exit: { filter: "blur(12px)", opacity: 0, scale: 1.05 },
  transition: { duration: 0.3 },
};

export const SocialsPortalOverlay = () => {
  const { locale } = useI18n();
  const localizedMessages =
    socialsMessages[locale as keyof typeof socialsMessages];
  const { isMobile } = useAppStore();
  const focusedThrone = useSocialsStore((state) => state.focusedThrone);
  const clearFocus = useSocialsStore((state) => state.clearFocus);
  const dragControls = useDragControls();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [mobileSheetMode, setMobileSheetMode] = useState<"peek" | "full">("peek");
  const contentTouchStartY = useRef<number | null>(null);

  const isOpen = focusedThrone !== null;
  const currentThrone = focusedThrone ? THRONE_BY_ID[focusedThrone] : null;

  const onClose = useCallback(() => clearFocus(), [clearFocus]);
  const expandMobileSheet = useCallback(() => {
    if (!isMobile) return;
    setMobileSheetMode("full");
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => window.removeEventListener("resize", updateViewportHeight);
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    setMobileSheetMode("peek");
  }, [focusedThrone, isMobile, isOpen]);

  const mobilePeekY = useMemo(() => {
    if (!isMobile) return 0;
    return Math.max(
      MOBILE_PEEK_MIN_OFFSET,
      Math.min(MOBILE_PEEK_MAX_OFFSET, Math.round(viewportHeight * 0.18)),
    );
  }, [isMobile, viewportHeight]);

  const resolveMobileSheetState = useCallback(
    (offsetY: number, velocityY: number) => {
      const draggedDown = Math.max(0, offsetY);
      const draggedUp = Math.max(0, -offsetY);

      if (mobileSheetMode === "full") {
        if (
          draggedDown >= mobilePeekY * MOBILE_FULL_COLLAPSE_RATIO ||
          velocityY >= MOBILE_DOWN_VELOCITY_DISMISS
        ) {
          setMobileSheetMode("peek");
          return;
        }

        setMobileSheetMode("full");
        return;
      }

      if (
        draggedUp >= MOBILE_EXPAND_DISTANCE ||
        velocityY <= MOBILE_UP_VELOCITY_EXPAND
      ) {
        setMobileSheetMode("full");
        return;
      }

      if (
        draggedDown >= MOBILE_PEEK_DISMISS_DISTANCE ||
        velocityY >= MOBILE_DOWN_VELOCITY_DISMISS
      ) {
        onClose();
        return;
      }

      setMobileSheetMode("peek");
    },
    [mobilePeekY, mobileSheetMode, onClose],
  );

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  if (!root) return null;

  const content = (
    <AnimatePresence>
      {isOpen && currentThrone &&
        (() => {
          const CurrentContent = currentThrone.overlay.Component;

          return (
            <>
              <Panel
                key="socials-panel"
                $mobile={isMobile}
                $panelWidth={currentThrone.overlay.preferredWidth}
                $minHeight={currentThrone.overlay.minHeight}
                $maxHeight={currentThrone.overlay.maxHeight}
                drag={isMobile ? "y" : false}
                dragListener={isMobile ? false : undefined}
                dragControls={dragControls}
                dragMomentum={false}
                dragConstraints={
                  isMobile
                    ? { top: 0, bottom: mobilePeekY + 96 }
                    : undefined
                }
                dragElastic={isMobile ? 0.16 : 0}
                onDragEnd={
                  isMobile
                    ? (_, info) => {
                        resolveMobileSheetState(info.offset.y, info.velocity.y);
                      }
                    : undefined
                }
                layout={!isMobile}
                initial={
                  isMobile
                    ? { y: viewportHeight || 900, opacity: 1 }
                    : { x: 80, opacity: 0, filter: "blur(6px)" }
                }
                animate={
                  isMobile
                    ? {
                        y: mobileSheetMode === "full" ? 0 : mobilePeekY,
                        opacity: 1,
                        borderTopLeftRadius: mobileSheetMode === "full" ? 0 : 24,
                        borderTopRightRadius: mobileSheetMode === "full" ? 0 : 24,
                      }
                    : { x: 0, opacity: 1, filter: "blur(0px)" }
                }
                exit={
                  isMobile
                    ? { y: viewportHeight || 900, opacity: 1 }
                    : { x: 80, opacity: 0, filter: "blur(6px)" }
                }
                transition={{ type: "spring", bounce: 0.2, duration: 0.42 }}
              >
                {isMobile && (
                  <MobileDragZone
                    onPointerDown={(event) => {
                      dragControls.start(event);
                    }}
                  >
                    <MobileHandle />
                  </MobileDragZone>
                )}

                <CloseBtn
                  $mobile={isMobile}
                  $fullScreen={isMobile && mobileSheetMode === "full"}
                  onClick={onClose}
                  aria-label={locale === "de" ? "Schließen" : "Close"}
                >
                  <CloseIcon />
                </CloseBtn>

                <Header
                  onPointerDown={
                    isMobile
                      ? (event) => {
                          dragControls.start(event);
                        }
                      : undefined
                  }
                >
                  <Title>
                    {
                      localizedMessages[
                        currentThrone.id as keyof typeof localizedMessages
                      ].label
                    }
                  </Title>
                  <Subtitle>
                    {
                      localizedMessages[
                        currentThrone.id as keyof typeof localizedMessages
                      ].subtitle
                    }
                  </Subtitle>
                </Header>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`socials-content-${currentThrone.id}`}
                    {...SLIDE_VARIANTS}
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 0,
                      pointerEvents: "auto",
                    }}
                  >
                    <PanelScroll
                      $mobile={isMobile}
                      $fullScreen={!isMobile || mobileSheetMode === "full"}
                      onWheel={
                        isMobile && mobileSheetMode === "peek"
                          ? (event) => {
                              if (event.deltaY > 8) {
                                expandMobileSheet();
                              }
                            }
                          : undefined
                      }
                      onTouchStart={
                        isMobile && mobileSheetMode === "peek"
                          ? (event) => {
                              contentTouchStartY.current =
                                event.touches[0]?.clientY ?? null;
                            }
                          : undefined
                      }
                      onTouchMove={
                        isMobile && mobileSheetMode === "peek"
                          ? (event) => {
                              const startY = contentTouchStartY.current;
                              const currentY = event.touches[0]?.clientY ?? null;
                              if (startY === null || currentY === null) return;

                              if (startY - currentY > 14) {
                                expandMobileSheet();
                                contentTouchStartY.current = null;
                              }
                            }
                          : undefined
                      }
                    >
                      <CurrentContent />
                    </PanelScroll>
                  </motion.div>
                </AnimatePresence>

              </Panel>
            </>
          );
        })()}
    </AnimatePresence>
  );

  return createPortal(content, root);
};
