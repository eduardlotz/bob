import { motion, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { LOCALE_LABELS, SUPPORTED_LOCALES, useI18n } from "@/i18n";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useCoreStore } from "@/store";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { LoadingLogo, LOADING_LOGO_LANDING_TIME } from "@/components/LoadingLogo";

const CONTROL_SPRING = { type: "spring", stiffness: 420, damping: 14 } as const;

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
        <rect key={row} y={row * 64 / 13} width="32" height={32 / 13} fill="#b33b50" />
      ))}
      <path fill="#25456a" d="M0 0h16v17.23H0z" />
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={1.3 + col * 2.65 + (row % 2 ? 1.3 : 0)} cy={1.3 + row * 1.8} r=".55" fill="#fff" />
        )),
      )}
    </svg>
  );
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
  const { isActive, enable, unmute, mute } = useSoundSystem();
  const reducedMotion = useReducedMotion();
  const soundSettingsReady = useCoreStore((state) => state.isHydrated);
  const percentage = finished ? 100 : Math.min(100, Math.max(0, progress));

  const toggleSound = () => {
    if (isActive) mute();
    else {
      enable();
      unmute();
    }
  };

  return (
    <LoadingWrapper aria-label={messages.loader.loading}>
      <LoadingContent>
        <LoadingLogo progress={percentage} finished={finished} label={messages.loader.loading}
          interactionLabel={messages.loader.celebrate} />

        <Settings>
          <Setting>
            <SettingLabel id="loader-sound-label">{messages.loader.sound}</SettingLabel>
            <SoundSwitchSlot>
              {soundSettingsReady && (
                <SoundSwitch
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: .88 }}
                  transition={CONTROL_SPRING}
                  role="switch"
                  aria-checked={isActive}
                  aria-labelledby="loader-sound-label"
                  $enabled={isActive}
                  onClick={toggleSound}
                >
                  <SwitchThumb />
                </SoundSwitch>
              )}
            </SoundSwitchSlot>
          </Setting>
          <Setting>
            <SettingLabel id="loader-language-label">{messages.loader.language}</SettingLabel>
            <LanguageOptions role="group" aria-labelledby="loader-language-label">
              {SUPPORTED_LOCALES.map((value) => (
                <FlagButton
                  key={value}
                  type="button"
                  aria-label={LOCALE_LABELS[value].long}
                  aria-pressed={locale === value}
                  $selected={locale === value}
                  onClick={() => setLocale(value)}
                  whileTap={reducedMotion ? undefined : { scale: .85 }}
                  transition={CONTROL_SPRING}
                >
                  <LocaleFlag locale={value} />
                </FlagButton>
              ))}
            </LanguageOptions>
          </Setting>
        </Settings>

        <ActionSlot>
          {finished && (
            <StartButton
              type="button"
              onClick={onStart}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reducedMotion ? { duration: 0 } : {
                scale: { type: "spring", stiffness: 300, damping: 13, delay: LOADING_LOGO_LANDING_TIME },
                opacity: { duration: .12, delay: LOADING_LOGO_LANDING_TIME },
              }}
            >
              {messages.loader.start}
            </StartButton>
          )}
        </ActionSlot>
      </LoadingContent>

      <Credit>{messages.loader.credit} <a href="https://eduardlotz.de" target="_blank" rel="noreferrer">Eduard Lotz</a></Credit>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(48px, 15.3dvh, 160px) 20px max(30px, env(safe-area-inset-bottom));
  background: #000;
  color: #fff;

  button:focus-visible, a:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 7px;
  }

  @media (max-height: 600px) {
    padding-top: 32px;
    padding-bottom: 20px;
  }
`;

const LoadingContent = styled.div`
  width: min(100%, 400px);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const Settings = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  margin-top: 64px;

  @media (max-height: 600px) { margin-top: 32px; }
`;

const Setting = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const SettingLabel = styled.span`
  font-size: 16px;
  font-weight: 900;
  line-height: 1.3;
`;

const SwitchThumb = styled.span`
  display: block;
  width: 30px;
  height: 20px;
  border-radius: 20px;
  background: #fff;
  transition: transform .2s ease;
`;

const SoundSwitchSlot = styled.div`
  width: 64px;
  height: 32px;
`;

const SoundSwitch = styled(motion.button)<{ $enabled: boolean }>`
  display: flex;
  align-items: center;
  width: 64px;
  height: 32px;
  padding: 6px;
  border-radius: 32px;
  background: ${({ $enabled }) => $enabled ? '#3dcc46' : '#40403f'};
  transition: background .2s ease;

  ${SwitchThumb} { transform: translateX(${({ $enabled }) => $enabled ? '22px' : '0'}); }

  @media (prefers-reduced-motion: reduce) {
    &, ${SwitchThumb} { transition: none; }
  }
`;

const LanguageOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const FlagButton = styled(motion.button)<{ $selected: boolean }>`
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 12px;
  background: transparent;
  outline: ${({ $selected }) => $selected ? '1.5px solid #fff' : 'none'};
  outline-offset: 3px;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    opacity: ${({ $selected }) => $selected ? 1 : .55};
    transition: opacity .2s ease;
  }

  &:hover svg { opacity: 1; }
`;

const ActionSlot = styled.div`
  display: grid;
  place-items: start center;
  width: 100%;
  min-height: 60px;
  margin-top: 72px;
`;

const StartButton = styled(FloatingActionButton)`
  min-width: 150px;
  height: 55px;
  padding: 12px 24px;
  border-radius: 25px;
`;

const Credit = styled.p`
  margin: auto 0 0;
  padding-top: 48px;
  color: #808080;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;

  a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
`;
