import {
  ActionButton,
  SegmentedControl,
  SegmentedOption,
  SegmentedTrack,
} from "@/apps/ui";
import {
  SegmentedValueSlider,
  formatSegmentedSliderValue,
} from "@/components/SegmentedValueSlider";
import { ChevronRightIcon } from "@/icons/chevron";
import { FillColumn, HugColumn } from "@/layout";
import { DebugCameraSettings, DebugLightSettings, useCoreStore } from "@/store";
import { useCursorStore } from "@/store/core/cursor";
import { CAMERA_VIEWS, useViewStore } from "@/store/viewStore";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

type SliderSpec<T extends string> = {
  key: T;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
};

type CameraSliderKey = keyof DebugCameraSettings;
type LightSliderKey =
  | "ambientIntensityMultiplier"
  | "directionalIntensityMultiplier"
  | "lightAngle";

const cameraSliderSpecs: SliderSpec<CameraSliderKey>[] = [
  { key: "truckSpeed", label: "Truck Speed", min: 0.5, max: 12, step: 0.5 },
  {
    key: "azimuthRotateSpeed",
    label: "Azimuth Speed",
    min: 0,
    max: 2,
    step: 0.1,
  },
];

const lightSliderSpecs: SliderSpec<LightSliderKey>[] = [
  {
    key: "ambientIntensityMultiplier",
    label: "Ambient",
    min: 0,
    max: 3,
    step: 0.1,
  },
  {
    key: "directionalIntensityMultiplier",
    label: "Direct",
    min: 0,
    max: 3,
    step: 0.1,
  },
  {
    key: "lightAngle",
    label: "Angle",
    min: -3.14,
    max: 3.14,
    step: 0.1,
  },
];

export const DebugSceneTuningOverlays = () => {
  const cameraVisible = useCoreStore(
    (state) => state.cameraSettingsOverlayVisible,
  );
  const lightVisible = useCoreStore(
    (state) => state.lightSettingsOverlayVisible,
  );

  return (
    <>
      <CameraSettingsOverlay visible={cameraVisible} />
      <LightSettingsOverlay visible={lightVisible} />
    </>
  );
};

const CameraSettingsOverlay = ({ visible }: { visible: boolean }) => {
  const values = useCoreStore((state) => state.debugCameraSettings);
  const updateValues = useCoreStore((state) => state.updateDebugCameraSettings);
  const resetValues = useCoreStore((state) => state.resetDebugCameraSettings);
  const setRuntimeViewModeOverride = useViewStore(
    (state) => state.setRuntimeViewModeOverride,
  );
  const resetRuntimeOrbitOverrides = useViewStore(
    (state) => state.resetRuntimeOrbitOverrides,
  );

  return (
    <DebugOverlayPanel
      kind="camera"
      title="Camera Controls"
      description="Movement speed and runtime orbit controls."
      visible={visible}
      top={84}
      right={16}
      specs={cameraSliderSpecs}
      values={values}
      onUpdate={updateValues}
      onReset={() => {
        resetValues();
        setRuntimeViewModeOverride(null);
        resetRuntimeOrbitOverrides();
      }}
    />
  );
};

const LightSettingsOverlay = ({ visible }: { visible: boolean }) => {
  const values = useCoreStore((state) => state.debugLightSettings);
  const updateValues = useCoreStore((state) => state.updateDebugLightSettings);
  const resetValues = useCoreStore((state) => state.resetDebugLightSettings);

  return (
    <DebugOverlayPanel
      kind="light"
      title="Scene Lighting"
      description="Ambient, direct light, angle and color."
      visible={visible}
      top={84}
      left={16}
      specs={lightSliderSpecs}
      values={{
        ambientIntensityMultiplier: values.ambientIntensityMultiplier,
        directionalIntensityMultiplier: values.directionalIntensityMultiplier,
        lightAngle: values.lightAngle,
      }}
      lightColor={values.lightColor}
      onUpdate={updateValues}
      onLightColorChange={(lightColor) => updateValues({ lightColor })}
      onReset={resetValues}
    />
  );
};

const DebugOverlayPanel = <T extends string>({
  kind,
  title,
  description,
  visible,
  top,
  left,
  right,
  specs,
  values,
  lightColor,
  onUpdate,
  onLightColorChange,
  onReset,
}: {
  kind: "camera" | "light";
  title: string;
  description: string;
  visible: boolean;
  top: number;
  left?: number;
  right?: number;
  specs: SliderSpec<T>[];
  values: Record<T, number>;
  lightColor?: string;
  onUpdate: (updates: Partial<Record<T, number>>) => void;
  onLightColorChange?: (lightColor: string) => void;
  onReset: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const dragControls = useDragControls();
  const hoveringGrabberRef = useRef(false);
  const draggingGrabberRef = useRef(false);

  return (
    <OverlayRoot
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.98,
        filter: visible ? "blur(0px)" : "blur(8px)",
      }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        top,
        left,
        right,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <OverlayGrabBar
        onPointerEnter={() => {
          hoveringGrabberRef.current = true;
          useCursorStore.setState({ variant: "grab" });
        }}
        onPointerLeave={() => {
          hoveringGrabberRef.current = false;
          useCursorStore.setState({ variant: "default" });
        }}
        onPointerDown={(event) => {
          draggingGrabberRef.current = true;
          useCursorStore.setState({ variant: "grabbing" });
          dragControls.start(event);
        }}
        onPointerUp={() => {
          draggingGrabberRef.current = false;
          useCursorStore.setState({
            variant: hoveringGrabberRef.current ? "grab" : "default",
          });
        }}
      >
        <OverlayGrabHandle />
      </OverlayGrabBar>

      <OverlayToolbar>
        <OverlayHeader>
          <h5>{title}</h5>
          <p>{description}</p>
        </OverlayHeader>

        <OverlayActions $gap={"0.5rem"}>
          <OverlayToggleButton
            type="button"
            onClick={() => setIsOpen((open) => !open)}
          >
            <motion.span
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <ChevronRightIcon />
            </motion.span>
            <span>{isOpen ? "Hide" : "Show"}</span>
          </OverlayToggleButton>

          <ActionButton
            $variant="destructive"
            type="button"
            onClick={() => {
              onReset();
              setIsOpen(true);
            }}
          >
            Reset
          </ActionButton>
        </OverlayActions>
      </OverlayToolbar>

      <AnimatePresence initial={false}>
        {isOpen && (
          <OverlayBody
            key={`${title}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.18, ease: "easeOut" },
            }}
          >
            {kind === "camera" && <RuntimeCameraSection />}
            {kind === "light" && (
              <LightColorControl
                value={lightColor ?? "#ffffff"}
                onChange={(next) => onLightColorChange?.(next)}
              />
            )}
            <SliderGroup>
              {renderSliderGroup(specs, values, onUpdate)}
            </SliderGroup>
          </OverlayBody>
        )}
      </AnimatePresence>
    </OverlayRoot>
  );
};

const renderSliderGroup = <T extends string>(
  specs: SliderSpec<T>[],
  values: Record<T, number>,
  onUpdate: (updates: Partial<Record<T, number>>) => void,
) =>
  specs.map((spec) => {
    const value = values[spec.key];
    return (
      <SliderRow key={spec.key}>
        <SliderLabel>{spec.label}</SliderLabel>
        <SegmentedValueSlider
          value={value}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          tone="dark"
          formatValue={
            spec.format ?? ((next) => formatSegmentedSliderValue(next))
          }
          onChange={(next) =>
            onUpdate({
              [spec.key]: next,
            } as Partial<Record<T, number>>)
          }
        />
      </SliderRow>
    );
  });

const RuntimeCameraSection = () => {
  const currentView = useViewStore((state) => state.currentView);
  const runtimeViewModeOverride = useViewStore(
    (state) => state.runtimeViewModeOverride,
  );
  const setRuntimeViewModeOverride = useViewStore(
    (state) => state.setRuntimeViewModeOverride,
  );
  const runtimeOrbitOverrides = useViewStore(
    (state) => state.runtimeOrbitOverrides,
  );
  const setRuntimeOrbitOverrides = useViewStore(
    (state) => state.setRuntimeOrbitOverrides,
  );
  const currentViewOrbit = CAMERA_VIEWS[currentView]?.orbit;

  const currentMinPolar =
    runtimeOrbitOverrides.minPolarAngle ??
    currentViewOrbit?.minPolarAngle ??
    0.2;
  const currentMaxPolar =
    runtimeOrbitOverrides.maxPolarAngle ?? currentViewOrbit?.maxPolarAngle ?? 2;
  const currentMinAzimuth =
    runtimeOrbitOverrides.minAzimuthAngle ??
    currentViewOrbit?.minAzimuthAngle ??
    -3.14;
  const currentMaxAzimuth =
    runtimeOrbitOverrides.maxAzimuthAngle ??
    currentViewOrbit?.maxAzimuthAngle ??
    3.14;
  const currentMinDistance =
    runtimeOrbitOverrides.minDistance ?? currentViewOrbit?.minDistance ?? 1;
  const currentMaxDistance =
    runtimeOrbitOverrides.maxDistance ?? currentViewOrbit?.maxDistance ?? 7;

  return (
    <RuntimeSection $gap={"0.625rem"}>
      <ViewModeSegmented
        value={runtimeViewModeOverride ?? "default"}
        onChange={(next) => {
          setRuntimeViewModeOverride(
            next === "default" ? null : (next as "fixed" | "object"),
          );
        }}
      />

      <RuntimeSliderGroup $gap={"0.5rem"}>
        <RuntimeSliderRow>
          <SliderLabel>Polar Min</SliderLabel>
          <SegmentedValueSlider
            value={currentMinPolar}
            min={0}
            max={3.14}
            step={0.1}
            tone="dark"
            onChange={(next) =>
              setRuntimeOrbitOverrides({ minPolarAngle: next })
            }
          />
        </RuntimeSliderRow>

        <RuntimeSliderRow>
          <SliderLabel>Polar Max</SliderLabel>
          <SegmentedValueSlider
            value={currentMaxPolar}
            min={0}
            max={3.14}
            step={0.1}
            tone="dark"
            onChange={(next) =>
              setRuntimeOrbitOverrides({ maxPolarAngle: next })
            }
          />
        </RuntimeSliderRow>

        <RuntimeSliderRow>
          <SliderLabel>Azimuth Min</SliderLabel>
          <SegmentedValueSlider
            value={currentMinAzimuth}
            min={-3.14}
            max={3.14}
            step={0.1}
            tone="dark"
            onChange={(next) =>
              setRuntimeOrbitOverrides({ minAzimuthAngle: next })
            }
          />
        </RuntimeSliderRow>

        <RuntimeSliderRow>
          <SliderLabel>Azimuth Max</SliderLabel>
          <SegmentedValueSlider
            value={currentMaxAzimuth}
            min={-3.14}
            max={3.14}
            step={0.1}
            tone="dark"
            onChange={(next) =>
              setRuntimeOrbitOverrides({ maxAzimuthAngle: next })
            }
          />
        </RuntimeSliderRow>

        <RuntimeSliderRow>
          <SliderLabel>Zoom Min</SliderLabel>
          <SegmentedValueSlider
            value={currentMinDistance}
            min={0.5}
            max={75}
            step={0.5}
            tone="dark"
            onChange={(next) => setRuntimeOrbitOverrides({ minDistance: next })}
          />
        </RuntimeSliderRow>

        <RuntimeSliderRow>
          <SliderLabel>Zoom Max</SliderLabel>
          <SegmentedValueSlider
            value={currentMaxDistance}
            min={0.5}
            max={75}
            step={0.5}
            tone="dark"
            onChange={(next) => setRuntimeOrbitOverrides({ maxDistance: next })}
          />
        </RuntimeSliderRow>
      </RuntimeSliderGroup>
    </RuntimeSection>
  );
};

const ViewModeSegmented = ({
  value,
  onChange,
}: {
  value: "default" | "fixed" | "object";
  onChange: (value: "default" | "fixed" | "object") => void;
}) => {
  const options = ["default", "fixed", "object"] as const;

  return (
    <DarkSegmentedControl>
      <SegmentedTrack>
        {options.map((option) => (
          <DarkSegmentedOption
            key={option}
            type="button"
            $active={value === option}
            onClick={() => onChange(option)}
          >
            {value === option && (
              <DarkSegmentedHighlight
                layoutId="debug-view-mode-highlight"
                transition={{ type: "spring", bounce: 0.22, duration: 0.45 }}
                style={{ borderRadius: 9999 }}
              />
            )}
            <DarkSegmentedLabel $hidden={value === option}>
              {option}
            </DarkSegmentedLabel>
            {value === option && (
              <DarkSegmentedActiveLabel>{option}</DarkSegmentedActiveLabel>
            )}
          </DarkSegmentedOption>
        ))}
      </SegmentedTrack>
    </DarkSegmentedControl>
  );
};

const LightColorControl = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <RuntimeSection>
    <RuntimeRow>
      <RuntimeLabel>Color</RuntimeLabel>
      <ColorControlWrap>
        <ColorInput
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <RuntimeValue>{value}</RuntimeValue>
      </ColorControlWrap>
    </RuntimeRow>
  </RuntimeSection>
);

const OverlayRoot = styled(motion.div)`
  position: fixed;
  z-index: 1002;
  width: min(360px, calc(100vw - 32px));
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.875rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(16, 16, 16, 0.68);
  color: #ffffff;
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const OverlayGrabBar = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.125rem 0 0;
  border: none;
  background: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const OverlayGrabHandle = styled.span`
  display: block;
  width: 3rem;
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
`;

const OverlayToolbar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const OverlayHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  h5 {
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
  }

  p {
    font-size: 0.875rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.64);
  }
`;

const OverlayActions = styled(HugColumn)`
  flex-shrink: 0;
  align-items: stretch;

  button {
    width: 100%;
  }
`;

const OverlayToggleButton = styled(ActionButton)`
  gap: 0.375rem;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.18);
  }

  span {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const OverlayBody = styled(FillColumn)`
  overflow: hidden;

  > * {
    gap: 0.5rem;
    width: 100%;
  }
`;

const RuntimeSection = styled(FillColumn)`
  width: 100%;
  height: auto;
  max-height: none;
  align-items: stretch;
  justify-content: flex-start;
  margin-bottom: 0.75rem;
`;

const RuntimeSliderGroup = styled(FillColumn)`
  width: 100%;
  height: auto;
  max-height: none;
  align-items: stretch;
  justify-content: flex-start;
`;

const RuntimeRow = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.525rem 0.5rem 1rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.06);
`;

const RuntimeLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
`;

const RuntimeValue = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
`;

const RuntimeSliderRow = styled.div`
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.06);
`;

const DarkSegmentedControl = styled(SegmentedControl)`
  background: rgba(255, 255, 255, 0.08);
`;

const DarkSegmentedHighlight = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 20rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08);
  pointer-events: none;
`;

const DarkSegmentedOption = styled(SegmentedOption)`
  overflow: hidden;
  color: ${({ $active }) =>
    $active ? "#111111" : "rgba(255, 255, 255, 0.74)"};
  text-transform: lowercase;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: ${({ $active }) =>
      $active ? "#111111" : "rgba(255, 255, 255, 0.92)"};
  }
`;

const DarkSegmentedLabel = styled.span<{ $hidden?: boolean }>`
  position: relative;
  z-index: 1;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity 0.18s ease;
`;

const DarkSegmentedActiveLabel = styled(motion.span)`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111111;
  text-transform: lowercase;
  pointer-events: none;
`;

const ColorControlWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const ColorInput = styled.input`
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`;

const SliderGroup = styled(FillColumn)`
  height: auto;
  max-height: min(60vh, 540px);
  align-items: stretch;
  justify-content: flex-start;
  max-height: min(60vh, 540px);
  padding-right: 0.125rem;
  overflow-y: auto;
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem 0.5rem 1rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.08);
`;

const SliderLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
`;
