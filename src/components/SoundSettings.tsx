import React from "react";
import styled from "styled-components";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { testSoundSystem, debugSoundSystem } from "@/utils/soundSystem";
import { motion } from "motion/react";
import { DEFAULT_TEXT_VOLUME } from "@/utils/sound/defaults";

interface SoundSettingsProps {
  visible?: boolean;
  onClose?: () => void;
}

export function SoundSettings({
  visible = false,
  onClose,
}: SoundSettingsProps) {
  const {
    isEnabled,
    isMuted,
    audioStatus,
    masterVolume,
    tapVolume,
    worldVolume,
    textVolume,
    setTextVolume,
    setMasterVolume,
    setTapVolume,
    setWorldVolume,
    enable,
    disable,
    mute,
    unmute,
    toggleMute,
    playTapSound,
  } = useSoundSystem();

  if (!visible) return null;

  return (
    <SettingsOverlay onClick={onClose}>
      <SettingsPanel
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(10px)" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <SettingsHeader>
          <h3>Sound Settings</h3>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </SettingsHeader>

        <SettingsContent>
          {/* System Power (Stop/Start) */}
          <SettingGroup>
            <SettingLabel>
              <span>Sound System</span>
              <ToggleButton
                $active={isEnabled}
                onClick={() => (isEnabled ? disable() : enable())}
              >
                {isEnabled ? "ON" : "OFF"}
              </ToggleButton>
            </SettingLabel>
          </SettingGroup>

          {/* Mute/Unmute */}
          <SettingGroup>
            <SettingLabel>
              <span>Mute</span>
              <ToggleButton
                $active={!isMuted}
                onClick={() => (isMuted ? unmute() : mute())}
              >
                {isMuted ? "MUTED" : "SOUND"}
              </ToggleButton>
            </SettingLabel>
          </SettingGroup>

          {/* Master Volume */}
          <SettingGroup>
            <SettingLabel>Master Volume</SettingLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              $disabled={!isEnabled}
            />
            <VolumeValue>{Math.round(masterVolume * 100)}%</VolumeValue>
          </SettingGroup>

          {/* Tap Sound Volume */}
          <SettingGroup>
            <SettingLabel>Tap Sounds</SettingLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={tapVolume}
              onChange={(e) => setTapVolume(parseFloat(e.target.value))}
              $disabled={!isEnabled}
            />
            <VolumeValue>{Math.round(tapVolume * 100)}%</VolumeValue>
          </SettingGroup>

          {/* World Sound Volume */}
          <SettingGroup>
            <SettingLabel>World Sounds</SettingLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={worldVolume}
              onChange={(e) => setWorldVolume(parseFloat(e.target.value))}
              $disabled={!isEnabled}
            />
            <VolumeValue>{Math.round(worldVolume * 100)}%</VolumeValue>
          </SettingGroup>

          {/* Text Sound Volume */}
          <SettingGroup>
            <SettingLabel>Text Sounds</SettingLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={typeof textVolume === "number" ? textVolume : 0.8}
              onChange={(e) => setTextVolume?.(parseFloat(e.target.value))}
              $disabled={!isEnabled}
            />
            <VolumeValue>
              {Math.round((textVolume ?? DEFAULT_TEXT_VOLUME) * 100)}%
            </VolumeValue>
          </SettingGroup>

          {/* Test Button */}
          <SettingGroup>
            <TestButton
              onClick={() => {
                testSoundSystem();
              }}
              $disabled={!isEnabled}
            >
              Test Sound System
            </TestButton>
            <TestButton
              onClick={() => {
                debugSoundSystem();
              }}
              $disabled={!isEnabled}
            >
              Debug Sound System
            </TestButton>
          </SettingGroup>

          {/* Sound Info */}
          <SoundInfo>
            <p>Status: {audioStatus}</p>
            <p>
              Master: {Math.round(masterVolume * 100)}% | Tap:{" "}
              {Math.round(tapVolume * 100)}% | World:{" "}
              {Math.round(worldVolume * 100)}%
            </p>
          </SoundInfo>
        </SettingsContent>
      </SettingsPanel>
    </SettingsOverlay>
  );
}

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SettingsPanel = styled(motion.div)`
  position: fixed;
  left: 0;
  right: 0;
  top: 40px;
  margin: 0 auto;
  width: 520px;
  max-width: calc(100% - 32px);
  transform: translateY(-50%);
  max-height: calc(100svh - 140px);
  background: rgba(20, 20, 20, 0.95);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  padding: 20px;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: #e3f2fd;
  }
`;

const SettingsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SettingLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #ffffff;
`;

const VolumeSlider = styled.input<{ $disabled: boolean }>`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: none;
  }
`;

const VolumeValue = styled.span`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.7;
  text-align: right;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? "var(--primary-color)" : "rgba(255,255,255,0.1)"};
  color: ${({ $active }) => ($active ? "#ffffff" : "#ffffff")};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const TestButton = styled.button<{ $disabled: boolean }>`
  background: var(--primary-color);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

const SoundInfo = styled.div`
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 12px;
  color: #ffffff;
  opacity: 0.9;

  p {
    margin: 4px 0;
  }
`;
