import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SegmentedValueSlider } from "@/components/SegmentedValueSlider";
import { LocaleSegmentedControl } from "@/components/LocaleSegmentedControl";
import { FillColumn, FillRow } from "@/layout";
import { DividerWithLabel, RowLabel } from "@/layout/atoms";
import { CameraViewId, useCoreStore, useViewStore } from "@/store";
import { useEffect } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n";
import { ToggleButton } from "./ui";

export const OptionsIcon = () => (
  <img src="/images/app-logos/options.png" height={80} width={80} />
);

const APP_ID: CameraViewId = "phone:options";

interface VolumeItemProps {
  label: string;
  value: number; // 0–1
  onChange: (value: number) => void;
}

function VolumeItem({ label, value, onChange }: VolumeItemProps) {
  const pct = Math.round(value * 100);

  return (
    <VolumeRow>
      <RowLabel>{label}</RowLabel>
      <SegmentedValueSlider
        value={value}
        min={0}
        max={1}
        step={0.1}
        onChange={onChange}
        formatValue={() => `${pct}%`}
      />
    </VolumeRow>
  );
}

export function OptionsApp() {
  const { locale, setLocale, messages } = useI18n();
  const sound = useSoundSystem();
  const reducedTapMotion = useCoreStore(
    (state) => state.graphicPreferences.reducedTapMotion,
  );
  const tapParticlesEnabled = useCoreStore(
    (state) => state.graphicPreferences.effectsEnabled,
  );
  const toggleReducedTapMotion = useCoreStore(
    (state) => state.toggleReducedTapMotion,
  );
  const toggleParticleEffects = useCoreStore(
    (state) => state.toggleParticleEffects,
  );

  const { transitionToView } = useViewStore();

  useEffect(() => {
    transitionToView(APP_ID);
  }, [transitionToView]);

  const normalizeVolumeValue = (next: number) =>
    Math.min(1, Math.max(0, Math.round(next * 100) / 100));

  const rows: VolumeItemProps[] = [
    {
      label: messages.options.audio.master,
      value: sound.masterVolume,
      onChange: (value) => sound.setMasterVolume(normalizeVolumeValue(value)),
    },
    {
      label: messages.options.audio.music,
      value: sound.worldVolume,
      onChange: (value) => sound.setWorldVolume(normalizeVolumeValue(value)),
    },
    {
      label: messages.options.audio.effects,
      value: sound.tapVolume,
      onChange: (value) => sound.setTapVolume(normalizeVolumeValue(value)),
    },
    {
      label: messages.options.audio.ui,
      value: sound.uiVolume,
      onChange: (value) => sound.setUIVolume(normalizeVolumeValue(value)),
    },
    {
      label: messages.options.audio.chat,
      value: sound.textVolume,
      onChange: (value) => sound.setTextVolume(normalizeVolumeValue(value)),
    },
  ];

  return (
    <FillColumn
      style={{
        maxWidth: "100%",
        maxHeight: "23rem",
        overflowY: "auto",

        borderRadius: "1.25rem",
        background: "rgba(33, 33, 33, 0.05)",
        padding: "1rem",
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
    >
      <FillColumn $gap="1rem" style={{ height: "fit-content", width: "24rem" }}>
        <FillRow $align="center" $justify="space-between" $gap="1rem">
          <RowLabel>{messages.options.audio.language}</RowLabel>
          <LocaleSegmentedControl
            value={locale}
            onChange={setLocale}
            compact
            layoutId="options-language-segmented"
            labelForm="long"
            theme="light"
          />
        </FillRow>

        <DividerWithLabel>{messages.options.sections.effects}</DividerWithLabel>

        <PreferenceRow $align="center" $justify="space-between" $gap="1rem">
          <FillColumn
            $align="flex-start"
            $justify="center"
            $gap="0.4rem"
            style={{ flex: 1 }}
          >
            <RowLabel>{messages.options.audio.tapAnimation}</RowLabel>
            <PreferenceText>
              {messages.options.audio.tapAnimationDescription}
            </PreferenceText>
          </FillColumn>
          <ToggleButton
            $active={!reducedTapMotion}
            onClick={toggleReducedTapMotion}
            aria-label={messages.options.audio.tapAnimation}
          >
            <span />
          </ToggleButton>
        </PreferenceRow>

        <PreferenceRow $align="center" $justify="space-between" $gap="1rem">
          <RowLabel>{messages.options.audio.tapParticles}</RowLabel>
          <ToggleButton
            $active={tapParticlesEnabled}
            onClick={toggleParticleEffects}
            aria-label={messages.options.audio.tapParticles}
          >
            <span />
          </ToggleButton>
        </PreferenceRow>

        <DividerWithLabel>{messages.options.sections.audio}</DividerWithLabel>
        {/* <FillRow $align="center" $justify="center" $gap="1rem">
            <AppInfo>
              {messages.options.audio.status}:{" "}
              {messages.options.audio.states[sound.audioStatus]}
            </AppInfo>
            <Divider />
          </FillRow> */}

        <FillColumn $gap="1.5rem">
          {rows.map((row) => (
            <VolumeItem key={row.label} {...row} />
          ))}
        </FillColumn>
      </FillColumn>
    </FillColumn>
  );
}

const VolumeRow = styled.div`
  display: grid;
  grid-template-columns: 0.25fr 1fr;
  align-items: center;
  justify-content: space-between;
  grid-gap: 1rem;
  width: 100%;
`;

const PreferenceRow = styled(FillRow)`
  align-items: center;
`;

const PreferenceText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25;
  color: rgba(33, 33, 33, 0.55);
`;
