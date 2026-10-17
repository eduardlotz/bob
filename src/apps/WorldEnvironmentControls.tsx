import { useEffect, useState } from "react";
import { HugColumn } from "@/layout";
import { SettingsWrapper, ToggleButton, SegmentedControl, SegmentedTrack, SegmentedOption, SegmentedThumb } from "./ui";
import { SegmentedValueSlider } from "@/components/SegmentedValueSlider";
import {
  useWorldEnvironmentStore,
  worldClock,
  WORLD_DAY_SECONDS,
} from "@/store/worldEnvironmentStore";

const formatTime = (seconds: number) => {
  const minutes = Math.floor((12 * 60 + seconds / WORLD_DAY_SECONDS * 1440) % 1440);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function WorldEnvironmentControls() {
  const { running, weather, seek, setRunning, setWeather } = useWorldEnvironmentStore();
  const [time, setTime] = useState(() => worldClock.elapsed % WORLD_DAY_SECONDS);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(worldClock.elapsed % WORLD_DAY_SECONDS), 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <SettingsWrapper>
        <HugColumn style={{ width: "100%", alignItems: "stretch" }}>
          <h5>Time · {formatTime(time)}</h5>
          <SegmentedValueSlider
            ariaLabel="Time of day"
            formatValue={formatTime}
            value={time}
            min={0}
            max={WORLD_DAY_SECONDS}
            step={1}
            onChange={(value) => { seek(value); setTime(value); }}
          />
        </HugColumn>
      </SettingsWrapper>
      <SettingsWrapper>
        <h5>Day/night cycle running</h5>
        <ToggleButton
          aria-label="Day/night cycle running"
          aria-pressed={running}
          $active={running}
          onClick={() => setRunning(!running)}
        >
          <span />
        </ToggleButton>
      </SettingsWrapper>
      <SettingsWrapper>
        <HugColumn style={{ width: "100%", alignItems: "stretch" }}>
          <h5>Weather</h5>
          <SegmentedControl>
            <SegmentedTrack>
              <SegmentedThumb
                animate={{ left: `${["auto", "clear", "rain"].indexOf(weather) * 100 / 3}%` }}
                style={{ width: "33.333333%" }}
              />
              {(["auto", "clear", "rain"] as const).map((value) => (
                <SegmentedOption
                  key={value}
                  $active={weather === value}
                  aria-pressed={weather === value}
                  onClick={() => setWeather(value)}
                >
                  {value === "auto" ? "Auto" : value === "clear" ? "Clear" : "Rain"}
                </SegmentedOption>
              ))}
            </SegmentedTrack>
          </SegmentedControl>
        </HugColumn>
      </SettingsWrapper>
    </>
  );
}
