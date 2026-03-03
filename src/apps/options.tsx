import { usePagination } from "@/hooks/usePagination";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { FillColumn } from "@/layout";
import { CameraViewId, useCoreStore, useViewStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

export const OptionsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 24C0 10.7452 10.7452 0 24 0H56C69.2548 0 80 10.7452 80 24V56C80 69.2548 69.2548 80 56 80H24C10.7452 80 0 69.2548 0 56V24Z"
      fill="#6B6E75"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M38.8815 20.7139H41.1215C41.9596 20.7156 42.7778 20.9694 43.4697 21.4422C44.1617 21.9151 44.6954 22.5851 45.0015 23.3653L46.0272 25.971L49.1415 27.7682L51.9015 27.3482C52.7317 27.2231 53.5803 27.3512 54.3366 27.7156C55.093 28.08 55.7219 28.6638 56.1415 29.391L57.2587 31.3224C57.6795 32.0493 57.8711 32.8863 57.8084 33.7239C57.7457 34.5615 57.4316 35.3606 56.9072 36.0167L55.1644 38.1967V41.8024L56.8958 43.9824C57.4187 44.6393 57.7319 45.4382 57.7946 46.2755C57.8572 47.1127 57.6665 47.9494 57.2472 48.6767L56.133 50.6082C55.7131 51.335 55.084 51.9187 54.3278 52.283C53.5715 52.6474 52.7231 52.7756 51.893 52.651L49.1301 52.231L46.013 54.031L44.993 56.631C44.6873 57.4117 44.1538 58.0824 43.4618 58.5558C42.7698 59.0292 41.9514 59.2834 41.113 59.2853H38.8758C38.0374 59.2834 37.219 59.0292 36.527 58.5558C35.835 58.0824 35.3015 57.4117 34.9958 56.631L33.9758 54.031L30.8587 52.231L28.0958 52.651C27.2659 52.7763 26.4176 52.6487 25.6613 52.2848C24.905 51.9209 24.2758 51.3376 23.8558 50.611L22.7415 48.6767C22.3207 47.9498 22.1291 47.1128 22.1918 46.2753C22.2545 45.4377 22.5686 44.6386 23.093 43.9824L24.8358 41.8024V38.1967L23.093 36.0167C22.5689 35.3605 22.2547 34.5616 22.1915 33.7242C22.1283 32.8868 22.319 32.0498 22.7387 31.3224L23.853 29.391C24.2727 28.6633 24.9022 28.0792 25.6591 27.7147C26.416 27.3503 27.2652 27.2225 28.0958 27.3482L30.8501 27.7682L33.9758 25.9567L35.0015 23.3653C35.307 22.5847 35.8405 21.9142 36.5326 21.4412C37.2247 20.9683 38.0433 20.7148 38.8815 20.7139ZM45.7015 39.9996C45.7015 43.6482 43.6472 45.7024 39.9987 45.7024C36.3501 45.7024 34.2958 43.6482 34.2958 39.9996C34.2958 36.351 36.3501 34.2967 39.9987 34.2967C43.6472 34.2967 45.7015 36.351 45.7015 39.9996Z"
      fill="#D7D8DD"
    />
  </svg>
);

type OptionsTab = "general" | "audio";

const tabs = [
  {
    id: "general" as OptionsTab,
    name: "General",
  },
  {
    id: "audio" as OptionsTab,
    name: "Audio",
  },
];

const APP_ID: CameraViewId = "phone:options";

export function OptionsApp() {
  const [activeTab, setActiveTab] = useState<OptionsTab>("general");

  const { themes, activateTheme, previewTheme, resetPreview, currentTheme } =
    useCoreStore();

  const { transitionToView } = useViewStore();

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(themes, 1);

  const initialIndex = useMemo(
    () => themes.findIndex((t) => t.active),
    [activeTab],
  );
  const currentItem = data[0];

  // Language state (local for now)
  const [language, setLanguage] = useState<"de" | "en">("de");
  // Auto-tap animation toggles
  const [autoTap1, setAutoTap1] = useState(true);
  const [autoTap2, setAutoTap2] = useState(false);

  useEffect(() => {
    transitionToView(APP_ID);
    goTo(initialIndex);

    return () => resetPreview();
  }, []);

  useEffect(() => {
    if (activeTab === "general") {
      // Preview current theme selection
    } else {
      resetPreview();
    }
  }, [page, activeTab]);

  const handleTabChange = (id: OptionsTab) => {
    setActiveTab(id);
  };

  const handleThemeSelect = (themeId: string) => {
    activateTheme(themeId);
  };

  const isDarkActive = currentTheme?.id === "DARK";

  const AudioView = useCallback(() => {
    const sound = useSoundSystem();

    return (
      <OptionsContent>
        <OptionsSection>
          <OptionRow>
            <OptionRowLabel>Master</OptionRowLabel>
            <OptionSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.masterVolume}
              onChange={(e) =>
                sound.setMasterVolume(parseFloat(e.target.value))
              }
            />
            <OptionValue>{Math.round(sound.masterVolume * 100)}%</OptionValue>
          </OptionRow>

          <OptionRow>
            <OptionRowLabel>Music</OptionRowLabel>
            <OptionSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.worldVolume}
              onChange={(e) => sound.setWorldVolume(parseFloat(e.target.value))}
            />
            <OptionValue>{Math.round(sound.worldVolume * 100)}%</OptionValue>
          </OptionRow>

          <OptionRow>
            <OptionRowLabel>Effects</OptionRowLabel>
            <OptionSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.tapVolume}
              onChange={(e) => sound.setTapVolume(parseFloat(e.target.value))}
            />
            <OptionValue>{Math.round(sound.tapVolume * 100)}%</OptionValue>
          </OptionRow>

          <OptionRow>
            <OptionRowLabel>UI</OptionRowLabel>
            <OptionSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.uiVolume}
              onChange={(e) => sound.setUIVolume(parseFloat(e.target.value))}
            />
            <OptionValue>{Math.round(sound.uiVolume * 100)}%</OptionValue>
          </OptionRow>

          <OptionRow>
            <OptionRowLabel>Chat</OptionRowLabel>
            <OptionSlider
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.textVolume}
              onChange={(e) => sound.setTextVolume(parseFloat(e.target.value))}
            />
            <OptionValue>{Math.round(sound.textVolume * 100)}%</OptionValue>
          </OptionRow>
        </OptionsSection>
      </OptionsContent>
    );
  }, []);

  const GeneralView = () => (
    <OptionsContent>
      <OptionsSection>
        <SettingItem>
          <SettingTextGroup>
            <SettingTitle>Auto-Tap Animation</SettingTitle>
            <SettingDescription>
              Auto-Taps werden auch{"\n"}ohne Animation gesammelt
            </SettingDescription>
          </SettingTextGroup>
          <IOSToggle $active={autoTap1} onClick={() => setAutoTap1(!autoTap1)}>
            <IOSToggleThumb $active={autoTap1} />
          </IOSToggle>
        </SettingItem>

        <SettingItem>
          <SettingTextGroup>
            <SettingTitle>Auto-Tap Animation</SettingTitle>
            <SettingDescription>
              Auto-Taps werden auch{"\n"}ohne Animation gesammelt
            </SettingDescription>
          </SettingTextGroup>
          <IOSToggle $active={autoTap2} onClick={() => setAutoTap2(!autoTap2)}>
            <IOSToggleThumb $active={autoTap2} />
          </IOSToggle>
        </SettingItem>
      </OptionsSection>

      <OptionsDivider />

      <SettingRow>
        <SettingRowLabel>Language</SettingRowLabel>
        <PillGroup>
          <PillOption
            $active={language === "de"}
            onClick={() => setLanguage("de")}
          >
            German
          </PillOption>
          <PillOption
            $active={language === "en"}
            onClick={() => setLanguage("en")}
          >
            English
          </PillOption>
        </PillGroup>
      </SettingRow>

      <SettingRow>
        <SettingRowLabel>Theme</SettingRowLabel>
        <PillGroup>
          <PillOption
            $active={!isDarkActive}
            onClick={() => handleThemeSelect("DEFAULT")}
          >
            Light
          </PillOption>
          <PillOption
            $active={isDarkActive}
            onClick={() => handleThemeSelect("DARK")}
          >
            Dark
          </PillOption>
        </PillGroup>
      </SettingRow>
    </OptionsContent>
  );

  return (
    <>
      <FillColumn
        style={{
          width: "22rem",
          maxWidth: "100%",
          maxHeight: "26rem",
          overflowY: "auto",
          gap: 0,
        }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        initial={{ y: 15, opacity: 0, filter: "blur(6px)" }}
        exit={{ y: 15, opacity: 0, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.1,
          visualDuration: 0.2,
          layout: {
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
          },
        }}
        key={activeTab + "-views-container"}
        layout
      >
        <AnimatePresence mode="popLayout">
          {activeTab === "audio" && (
            <motion.div
              key="audio-view"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: "spring", bounce: 0.2, visualDuration: 0.2 }}
              style={{ width: "100%" }}
            >
              <AudioView />
            </motion.div>
          )}
          {activeTab === "general" && (
            <motion.div
              key="general-view"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ type: "spring", bounce: 0.2, visualDuration: 0.2 }}
              style={{ width: "100%" }}
            >
              <GeneralView />
            </motion.div>
          )}
        </AnimatePresence>
      </FillColumn>

      <OptionsTabPanel
        layout
        transition={{
          type: "spring",
          bounce: 0.2,
          duration: 0.4,
          layout: {
            type: "spring",
            bounce: 0.2,
            visualDuration: 0.2,
          },
        }}
      >
        {tabs.map((tab) => (
          <OptionsTabButton
            layout="position"
            transition={{
              type: "spring",
              bounce: 0.2,
              duration: 0.4,
              layout: {
                type: "spring",
                bounce: 0.2,
                visualDuration: 0.2,
              },
            }}
            key={tab.id + "_options_tab"}
            $active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.name}
          </OptionsTabButton>
        ))}
      </OptionsTabPanel>
    </>
  );
}

/* ── Options styled components ── */

const OptionsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0.75rem;
`;

const OptionsSection = styled.div`
  background: rgba(255, 255, 255, 0.65);
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OptionsDivider = styled.hr`
  border: none;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0.75rem 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const SettingTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SettingTitle = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a1a1a;
`;

const SettingDescription = styled.span`
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.3;
  white-space: pre-line;
`;

/* iOS-style toggle */
const IOSToggle = styled.button<{ $active: boolean }>`
  position: relative;
  width: 3.25rem;
  height: 2rem;
  border-radius: 1rem;
  background: ${(p) => (p.$active ? "#4178F7" : "rgba(0, 0, 0, 0.18)")};
  flex-shrink: 0;
  transition: background 0.25s ease;
  padding: 2px;
`;

const IOSToggleThumb = styled.div<{ $active: boolean }>`
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease;
  transform: translateX(${(p) => (p.$active ? "1.25rem" : "0")});
`;

/* Setting row with label + pills */
const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 1rem;
`;

const SettingRowLabel = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const PillGroup = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
  padding: 2px;
  gap: 2px;
`;

const PillOption = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.4375rem;
  font-size: 0.875rem;
  font-weight: ${(p) => (p.$active ? "700" : "500")};
  background: ${(p) => (p.$active ? "white" : "transparent")};
  color: ${(p) => (p.$active ? "#1a1a1a" : "rgba(0, 0, 0, 0.5)")};
  box-shadow: ${(p) => (p.$active ? "0 1px 3px rgba(0,0,0,0.1)" : "none")};
  transition: all 0.2s ease;
`;

/* Slider rows for audio */
const OptionRow = styled.div`
  display: grid;
  grid-template-columns: 4rem 1fr 2.5rem;
  align-items: center;
  gap: 0.75rem;
`;

const OptionRowLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
`;

const OptionValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  text-align: right;
`;

const OptionSlider = styled.input`
  width: 100%;
  height: 0.375rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.1);
  outline: none;
  appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    border: none;
  }

  &::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    border: none;
  }
`;

/* Options tab panel (light themed) */
const OptionsTabPanel = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 4px;
  width: 100%;
  padding: 4px;
`;

const OptionsTabButton = styled(motion.button)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border: none;
  color: ${(p) => (p.$active ? "#fff" : "rgba(0, 0, 0, 0.5)")};
  font-size: 1rem;
  font-weight: 700;
  border-radius: 5rem;
  background: ${(p) => (p.$active ? "#1a1a1a" : "rgba(0, 0, 0, 0.06)")};
  transition: all 0.2s ease;

  &:hover {
    background: ${(p) => (p.$active ? "#1a1a1a" : "rgba(0, 0, 0, 0.1)")};
  }
`;
