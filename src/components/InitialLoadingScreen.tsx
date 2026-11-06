import { useEffect, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import styled from "styled-components";
import { LOCALE_LABELS, SUPPORTED_LOCALES, useI18n } from "@/i18n";
import { PhoneSoundToggle } from "@/components/PhoneSoundToggle";
import { useCoreStore } from "@/store";
import {
  FloatingActionButton,
  FLOATING_CONTROL_SPRING as CONTROL_SPRING,
} from "@/components/FloatingActionButton";
import {
  LoadingLogo,
  LOADING_LOGO_LANDING_TIME,
} from "@/components/LoadingLogo";

function LocaleFlag({ locale }: { locale: "de" | "en" }) {
  if (locale === "de") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path fill="#151515" d="M0 0h32v11H0z" />
        <path fill="#d32630" d="M0 11h32v10H0z" />
        <path fill="#f4d32f" d="M0 21h32v11H0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#eee" d="M0 0h32v32H0z" />
      {Array.from({ length: 7 }, (_, row) => (
        <rect
          key={row}
          y={(row * 64) / 13}
          width="32"
          height={32 / 13}
          fill="#b33b50"
        />
      ))}
      <path fill="#25456a" d="M0 0h16v17.23H0z" />
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={1.3 + col * 2.65 + (row % 2 ? 1.3 : 0)}
            cy={1.3 + row * 1.8}
            r=".55"
            fill="#fff"
          />
        )),
      )}
    </svg>
  );
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function InitialLoadingScreen({
  progress,
  finished,
  onStart,
}: {
  progress: number;
  finished: boolean;
  onStart: () => void;
}) {
  const { locale, setLocale, messages } = useI18n();
  const reducedMotion = useReducedMotion();
  const soundSettingsReady = useCoreStore((state) => state.isHydrated);
  const [messageIndex, setMessageIndex] = useState(
    randomIntFromInterval(0, messages.loader.loadingMessages.length - 1),
  );
  const percentage = finished ? 100 : Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => {
      setMessageIndex(
        (index) => (index + 1) % messages.loader.loadingMessages.length,
      );
    }, 2500);
    return () => window.clearInterval(timer);
  }, [finished, messages.loader.loadingMessages.length]);

  return (
    <LoadingWrapper aria-label={messages.loader.loading}>
      <LoadingLayout>
        <LoadingContent>
          <LogoPosition>
            <LoadingLogo
              progress={percentage}
              finished={finished}
              label={messages.loader.loading}
              interactionLabel={messages.loader.celebrate}
            />
          </LogoPosition>

          <ActionSlot>
            {finished ? (
              <StartButton
                type="button"
                onClick={onStart}
                initial={{ opacity: 0, scale: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        scale: {
                          type: "spring",
                          stiffness: 300,
                          damping: 13,
                          delay: LOADING_LOGO_LANDING_TIME,
                        },
                        opacity: {
                          duration: 0.12,
                          delay: LOADING_LOGO_LANDING_TIME,
                        },
                      }
                }
              >
                {messages.loader.start}
              </StartButton>
            ) : (
              <LoadingMessage role="status" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={messageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  >
                    {messages.loader.loadingMessages[messageIndex]}
                  </motion.span>
                </AnimatePresence>
              </LoadingMessage>
            )}
          </ActionSlot>
        </LoadingContent>

        <Footer>
          <Settings>
            <SoundSwitchSlot
              whileTap={reducedMotion ? undefined : { scale: 0.88 }}
              transition={CONTROL_SPRING}
            >
              {soundSettingsReady && <PhoneSoundToggle />}
            </SoundSwitchSlot>
            <LayoutGroup id="initial-loader-language">
              <LanguageOptions
                role="group"
                aria-label={messages.loader.language}
              >
                {SUPPORTED_LOCALES.map((value) => (
                  <FlagButton
                    key={value}
                    type="button"
                    aria-label={LOCALE_LABELS[value].long}
                    aria-pressed={locale === value}
                    $selected={locale === value}
                    onClick={() => setLocale(value)}
                    whileTap={reducedMotion ? undefined : { scale: 0.85 }}
                    transition={CONTROL_SPRING}
                  >
                    {locale === value && (
                      <FlagOutline
                        layoutId="active-language-outline"
                        initial={false}
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : { ...CONTROL_SPRING, damping: 28 }
                        }
                      />
                    )}
                    <LocaleFlag locale={value} />
                  </FlagButton>
                ))}
              </LanguageOptions>
            </LayoutGroup>
          </Settings>
          <Credit>
            {messages.loader.credit}{" "}
            <a href="https://eduardlotz.de" target="_blank" rel="noreferrer">
              Eduard Lotz
            </a>
          </Credit>
        </Footer>
      </LoadingLayout>
    </LoadingWrapper>
  );
}

const LoadingWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99998;
  width: 100%;
  height: 100dvh;
  overflow-y: auto;
  background: #000;
  color: #fff;

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 7px;
  }
`;

const LoadingLayout = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
`;

// Anchor the action itself to the screen center, independent of logo/footer size.
const LoadingContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100% - 40px), 400px);
`;

const LogoPosition = styled.div`
  position: absolute;
  bottom: calc(100% + 44px);
  left: 50%;
  transform: translateX(-50%);

  @media (max-height: 600px) {
    bottom: calc(100% + 24px);
  }
`;

const Footer = styled.div`
  position: absolute;
  bottom: max(38px, env(safe-area-inset-bottom));
  left: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;

  @media (max-height: 600px) {
    bottom: max(20px, env(safe-area-inset-bottom));
    gap: 24px;
  }
`;

const Settings = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
`;

const SoundSwitchSlot = styled(motion.div)`
  width: 70px;
  height: 38px;
`;

const LanguageOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const FlagButton = styled(motion.button)<{ $selected: boolean }>`
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 12px;
  background: transparent;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    opacity: ${({ $selected }) => ($selected ? 1 : 0.55)};
    transition: opacity 0.2s ease;
  }

  &:hover svg {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`;

const FlagOutline = styled(motion.span)`
  position: absolute;
  inset: -5px;
  border: 2px solid #fff;
  border-radius: 16px;
  pointer-events: none;
`;

const ActionSlot = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 60px;
`;

const LoadingMessage = styled.div`
  width: 100%;
  color: #808080;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
`;

const StartButton = styled(FloatingActionButton)`
  min-width: 150px;
  height: 55px;
  padding: 12px 24px;
  border-radius: 25px;
`;

const Credit = styled.p`
  margin: 0;
  color: #808080;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;
