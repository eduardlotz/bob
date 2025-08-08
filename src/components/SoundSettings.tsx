import React from "react";
import styled from "styled-components";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { testSoundSystem, debugSoundSystem } from "@/utils/soundSystem";

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
    masterVolume,
    tapVolume,
    worldVolume,
    setMasterVolume,
    setTapVolume,
    setWorldVolume,
    enable,
    disable,
    playTapSound,
  } = useSoundSystem();

  if (!visible) return null;

  return (
    <SettingsOverlay onClick={onClose}>
      <SettingsPanel onClick={(e) => e.stopPropagation()}>
        <SettingsHeader>
          <h3>Sound Settings</h3>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </SettingsHeader>

        <SettingsContent>
          {/* Master Sound Toggle */}
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
            <p>Current sound: bing-bong.mp3</p>
            <p>Features: Detune randomization, stop previous sounds</p>
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

const SettingsPanel = styled.div`
  background: white;
  border: 1px solid #2979ff;
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #2979ff;

  h3 {
    margin: 0;
    color: #333;
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
  color: #333;
`;

const VolumeSlider = styled.input<{ $disabled: boolean }>`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2979ff;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2979ff;
    cursor: pointer;
    border: none;
  }
`;

const VolumeValue = styled.span`
  font-size: 12px;
  color: #333;
  opacity: 0.7;
  text-align: right;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#2979ff" : "#e0e0e0")};
  color: ${({ $active }) => ($active ? "white" : "#333")};
  border: 1px solid #2979ff;
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
  background: #2979ff;
  color: white;
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
  background: #e3f2fd;
  border-radius: 8px;
  font-size: 12px;
  color: #333;
  opacity: 0.8;

  p {
    margin: 4px 0;
  }
`;
