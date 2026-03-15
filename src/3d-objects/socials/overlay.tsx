import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import styled, { css } from "styled-components";
import { memo, useCallback } from "react";
import { useAppStore } from "@/store";
import { ThroneId, THRONE_ORDER, useSocialsStore } from "@/store/socials";
import {
  LINKS_DATA,
  JOURNEY_DATA,
  STACK_DATA,
  VIBES_DATA,
  THRONE_META,
} from "./data";
import { OVERLAY_ROOT_ID } from "@/3d-objects/books/overlay";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { CloseIcon } from "@/icons/close";

const PANEL_W = "400px";

const Panel = styled(motion.div)<{ $mobile: boolean }>`
  position: fixed;
  z-index: 40;
  pointer-events: auto;

  background: #f2f2f3;
  border-radius: 20px;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${({ $mobile }) =>
    $mobile
      ? css`
          left: 0;
          right: 0;
          bottom: 0;
          height: 74vh;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.14);
        `
      : css`
          top: 4px;
          right: 4px;
          bottom: 4px;
          margin: auto clamp(4px, 5vw, 6rem);
          width: ${PANEL_W};
          max-width: 90vw;
          height: 72vh;
          box-shadow: -10px 0 52px rgba(0, 0, 0, 0.13);
        `}
`;

// Scrollable body — explicit pointer-events so scroll registers inside portal
const PanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  pointer-events: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  pointer-events: auto;
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.12);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Hero chrome
// ─────────────────────────────────────────────────────────────────────────────

const HeroRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding-bottom: 14px;
  padding-top: 4px;
`;

const HeroEmoji = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${({ $color }) => $color}22;
  border: 1.5px solid ${({ $color }) => $color}44;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
`;

const HeroMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
`;

const HeroTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: -0.02em;
`;

const HeroSub = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
`;

const Rule = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  margin: 10px 0;
`;

const SectionLabel = styled.p`
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.35);
`;

// ─────────────────────────────────────────────────────────────────────────────
// Links
// ─────────────────────────────────────────────────────────────────────────────

const LinkCard = styled.a<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  margin-bottom: 7px;
  pointer-events: auto;
  transition:
    background 0.14s,
    transform 0.14s;
  &:hover {
    background: ${({ $color }) => $color}14;
    border-color: ${({ $color }) => $color}33;
    transform: translateX(2px);
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

const LinkDot = styled.span<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => $color}18;
  border: 1.5px solid ${({ $color }) => $color}30;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
`;

const LinkName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.78);
`;
const LinkUrl = styled.span`
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

const LinksContent = memo(() => (
  <>
    {LINKS_DATA.map((l) => (
      <LinkCard
        key={l.label}
        href={l.url}
        target="_blank"
        rel="noopener noreferrer"
        $color={l.color}
      >
        <LinkDot $color={l.color}>{l.emoji}</LinkDot>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <LinkName>{l.label}</LinkName>
          <LinkUrl>{l.url.replace(/^https?:\/\/(www\.)?/, "")}</LinkUrl>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "rgba(0,0,0,0.25)",
          }}
        >
          ↗
        </span>
      </LinkCard>
    ))}
  </>
));

// ─────────────────────────────────────────────────────────────────────────────
// Journey
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_META = {
  work: { emoji: "💼", color: "#4A9EFF" },
  edu: { emoji: "🎓", color: "#A78BFA" },
  project: { emoji: "🚀", color: "#34D399" },
} as const;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    left: 22px;
    top: 12px;
    bottom: 12px;
    width: 1.5px;
    background: rgba(0, 0, 0, 0.09);
  }
`;
const TimelineRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 8px 0;
  position: relative;
`;
const TimelineIcon = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: white;
  border: 1.5px solid ${({ $color }) => $color}40;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;
const TimelineBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
`;
const TimelineYear = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.35);
`;
const TimelineTitle = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.82);
  line-height: 1.2;
`;
const TimelineOrg = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.45);
`;
const TimelineDesc = styled.p`
  margin: 3px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.45;
`;

const JourneyContent = memo(() => (
  <Timeline>
    {JOURNEY_DATA.map((entry, i) => {
      const m = TYPE_META[entry.type];
      return (
        <TimelineRow key={i}>
          <TimelineIcon $color={m.color}>{m.emoji}</TimelineIcon>
          <TimelineBody>
            <TimelineYear>{entry.year}</TimelineYear>
            <TimelineTitle>{entry.title}</TimelineTitle>
            <TimelineOrg>{entry.org}</TimelineOrg>
            {entry.desc && <TimelineDesc>{entry.desc}</TimelineDesc>}
          </TimelineBody>
        </TimelineRow>
      );
    })}
  </Timeline>
));

// ─────────────────────────────────────────────────────────────────────────────
// Stack
// ─────────────────────────────────────────────────────────────────────────────

const AppGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;
const AppTile = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 6px 8px;
  border-radius: 13px;
  background: ${({ $color }) => $color}0f;
  border: 1px solid ${({ $color }) => $color}28;
  cursor: default;
  transition: transform 0.13s;
  &:hover {
    transform: scale(1.04);
  }
`;
const AppEmoji = styled.span`
  font-size: 22px;
  line-height: 1;
`;
const AppName = styled.span`
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  text-align: center;
  line-height: 1.2;
`;
const AppCat = styled.span`
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.3);
`;

const StackContent = memo(() => (
  <AppGrid>
    {STACK_DATA.map((app) => (
      <AppTile key={app.name} $color={app.color}>
        <AppEmoji>{app.emoji}</AppEmoji>
        <AppName>{app.name}</AppName>
        <AppCat>{app.category}</AppCat>
      </AppTile>
    ))}
  </AppGrid>
));

// ─────────────────────────────────────────────────────────────────────────────
// Vibes
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_COLOR: Record<string, string> = {
  spotify: "#1DB954",
  soundcloud: "#FF5500",
  youtube: "#FF0000",
};

const TrackList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;
const TrackCard = styled.a<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  pointer-events: auto;
  transition:
    background 0.13s,
    transform 0.13s;
  &:hover {
    background: ${({ $color }) => $color}12;
    border-color: ${({ $color }) => $color}30;
    transform: translateX(2px);
  }
`;
const VinylThumb = styled.div<{ $color: string }>`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 60% 35%,
    ${({ $color }) => $color}55,
    #111 72%
  );
  border: 2px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 15px;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #222;
    border: 1.5px solid rgba(255, 255, 255, 0.12);
  }
`;
const TrackMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;
const TrackTitle = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const TrackArtist = styled.span`
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.42);
  font-weight: 500;
`;
const PlatformBadge = styled.span<{ $color: string }>`
  margin-left: auto;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const VibesContent = memo(() => (
  <TrackList>
    {VIBES_DATA.map((track) => {
      const pc = PLATFORM_COLOR[track.platform] ?? "#888";
      return (
        <TrackCard
          key={track.title}
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          $color={pc}
        >
          <VinylThumb $color={pc}>{track.emoji}</VinylThumb>
          <TrackMeta>
            <TrackTitle>{track.title}</TrackTitle>
            <TrackArtist>{track.artist}</TrackArtist>
          </TrackMeta>
          <PlatformBadge $color={pc}>{track.platform}</PlatformBadge>
        </TrackCard>
      );
    })}
  </TrackList>
));

// ─────────────────────────────────────────────────────────────────────────────
// Content switcher
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_MAP: Record<ThroneId, React.ComponentType> = {
  links: LinksContent,
  journey: JourneyContent,
  stack: StackContent,
  vibes: VibesContent,
};

const SLIDE_VARIANTS = {
  initial: { filter: "blur(12px)", opacity: 0, scale: 0.95 },
  animate: { filter: "blur(0px)", opacity: 1, scale: 1 },
  exit: { filter: "blur(12px)", opacity: 0, scale: 1.05 },
  transition: { duration: 0.3 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ThroneNav — iOS bottom nav, matches StackNav from book overlay
// ─────────────────────────────────────────────────────────────────────────────

const NavBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
`;

const NavChevron = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.75);
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
  &:hover {
    background: rgba(0, 0, 0, 0.09);
  }
  &:active {
    background: rgba(0, 0, 0, 0.13);
  }
`;

const DotTrack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;
const DotRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Dot = styled.span<{ $active: boolean; $color: string }>`
  width: ${({ $active }) => ($active ? "16px" : "6px")};
  height: 6px;
  border-radius: 3px;
  background: ${({ $active, $color }) =>
    $active ? $color : "rgba(0,0,0,0.15)"};
  transition:
    width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.22s ease;
`;

const NavPill = styled.span<{ $bg: string; $fg: string; $bd: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 1px solid ${({ $bd }) => $bd};
  white-space: nowrap;
`;

const ThroneNav = memo(
  ({
    current,
    onPrev,
    onNext,
  }: {
    current: ThroneId;
    onPrev: () => void;
    onNext: () => void;
  }) => {
    const idx = THRONE_ORDER.indexOf(current);
    const meta = THRONE_META[current];
    const c = meta.accentColor;
    const bg = `${c}18`;
    const bd = `${c}40`;

    return (
      <NavBar>
        <NavChevron onClick={onPrev} aria-label="Previous">
          <ChevronLeftIcon />
        </NavChevron>
        <DotTrack>
          <NavPill $bg={bg} $fg={c} $bd={bd}>
            {meta.emoji} {meta.label}
          </NavPill>
          <DotRow>
            {THRONE_ORDER.map((id, i) => (
              <Dot
                key={id}
                $active={i === idx}
                $color={THRONE_META[id].accentColor}
              />
            ))}
          </DotRow>
        </DotTrack>
        <NavChevron onClick={onNext} aria-label="Next">
          <ChevronRightIcon />
        </NavChevron>
      </NavBar>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// SocialsPortalOverlay
// ─────────────────────────────────────────────────────────────────────────────

export const SocialsPortalOverlay = () => {
  const { isMobile } = useAppStore();
  const focusedThrone = useSocialsStore((s) => s.focusedThrone);
  const setFocused = useSocialsStore((s) => s.setFocused);
  const clearFocus = useSocialsStore((s) => s.clearFocus);

  const isOpen = focusedThrone !== null;

  const onClose = useCallback(() => clearFocus(), [clearFocus]);
  const prevThrone = useCallback(() => {
    if (!focusedThrone) return;
    const idx = THRONE_ORDER.indexOf(focusedThrone);
    setFocused(
      THRONE_ORDER[(idx - 1 + THRONE_ORDER.length) % THRONE_ORDER.length],
    );
  }, [focusedThrone, setFocused]);
  const nextThrone = useCallback(() => {
    if (!focusedThrone) return;
    const idx = THRONE_ORDER.indexOf(focusedThrone);
    setFocused(THRONE_ORDER[(idx + 1) % THRONE_ORDER.length]);
  }, [focusedThrone, setFocused]);

  const root =
    typeof document !== "undefined"
      ? document.getElementById(OVERLAY_ROOT_ID)
      : null;

  if (!root) return null;

  const content = (
    <AnimatePresence>
      {isOpen && focusedThrone && (
        <Panel
          key="socials-panel"
          $mobile={isMobile}
          layout
          initial={
            isMobile
              ? { y: "100%", opacity: 0 }
              : { x: 80, opacity: 0, filter: "blur(6px)" }
          }
          animate={
            isMobile
              ? { y: "0%", opacity: 1 }
              : { x: 0, opacity: 1, filter: "blur(0px)" }
          }
          exit={
            isMobile
              ? { y: "100%", opacity: 0 }
              : { x: 80, opacity: 0, filter: "blur(6px)" }
          }
          transition={{ type: "spring", bounce: 0.2, duration: 0.42 }}
        >
          <CloseBtn onClick={onClose} aria-label="Schließen">
            <CloseIcon />
          </CloseBtn>

          {/* Hero */}
          <div
            style={{
              padding: "16px 16px 0",
              flexShrink: 0,
              pointerEvents: "auto",
            }}
          >
            <HeroRow>
              <HeroEmoji $color={THRONE_META[focusedThrone].accentColor}>
                {THRONE_META[focusedThrone].emoji}
              </HeroEmoji>
              <HeroMeta>
                <HeroTitle>{THRONE_META[focusedThrone].label}</HeroTitle>
                <HeroSub>{THRONE_META[focusedThrone].description}</HeroSub>
              </HeroMeta>
            </HeroRow>
            <Rule />
          </div>

          {/* Content with blur-transition between thrones */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`socials-content-${focusedThrone}`}
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
              <PanelScroll>
                {(() => {
                  const C = CONTENT_MAP[focusedThrone];
                  return <C />;
                })()}
              </PanelScroll>
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          <ThroneNav
            current={focusedThrone}
            onPrev={prevThrone}
            onNext={nextThrone}
          />
        </Panel>
      )}
    </AnimatePresence>
  );

  return createPortal(content, root);
};
