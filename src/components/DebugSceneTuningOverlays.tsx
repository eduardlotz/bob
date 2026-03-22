import { ActionButton } from "@/apps/ui";
import {
  SegmentedValueSlider,
  formatSegmentedSliderValue,
} from "@/components/SegmentedValueSlider";
import { ChevronRightIcon } from "@/icons/chevron";
import { HugColumn } from "@/layout";
import {
  DebugCameraSettings,
  DebugLightSettings,
  useCoreStore,
} from "@/store";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useState } from "react";
import styled from "styled-components";

type SliderSpec<T extends string> = {
  key: T;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
};

const cameraSliderSpecs: SliderSpec<keyof DebugCameraSettings>[] = [
  { key: "truckSpeed", label: "Truck", min: 0.5, max: 12, step: 0.1 },
  {
    key: "azimuthRotateSpeed",
    label: "Azimuth",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "perspectiveCameraZ",
    label: "3D Cam Z",
    min: 1,
    max: 8,
    step: 0.1,
  },
  {
    key: "canvasDesktopCameraZ",
    label: "Desk Z",
    min: 1,
    max: 4,
    step: 0.1,
  },
  {
    key: "canvasMobileCameraZ",
    label: "Mobile Z",
    min: 1,
    max: 4,
    step: 0.1,
  },
  { key: "cameraFov", label: "FOV", min: 20, max: 100, step: 1 },
];

const lightSliderSpecs: SliderSpec<keyof DebugLightSettings>[] = [
  {
    key: "ambientIntensityMultiplier",
    label: "Ambient x",
    min: 0,
    max: 3,
    step: 0.05,
  },
  {
    key: "directionalIntensityMultiplier",
    label: "Direct x",
    min: 0,
    max: 3,
    step: 0.05,
  },
  { key: "homeLightRadius", label: "Radius", min: 1, max: 15, step: 0.1 },
  {
    key: "homeLightAzimuth",
    label: "Azimuth",
    min: -3.14,
    max: 3.14,
    step: 0.01,
  },
  {
    key: "homeLightElevation",
    label: "Elevation",
    min: -1.57,
    max: 1.57,
    step: 0.01,
  },
  { key: "homeLightTargetX", label: "Target X", min: -10, max: 10, step: 0.1 },
  { key: "homeLightTargetY", label: "Target Y", min: -10, max: 10, step: 0.1 },
  { key: "homeLightTargetZ", label: "Target Z", min: -10, max: 10, step: 0.1 },
  { key: "routeLightX", label: "Route X", min: -10, max: 10, step: 0.1 },
  { key: "routeLightY", label: "Route Y", min: -10, max: 10, step: 0.1 },
  { key: "routeLightZ", label: "Route Z", min: -10, max: 10, step: 0.1 },
  {
    key: "routeLightIntensity",
    label: "Route Int",
    min: 0,
    max: 4,
    step: 0.05,
  },
  { key: "fakeShadowY", label: "Shadow Y", min: -4, max: 1, step: 0.01 },
  {
    key: "fakeShadowOpacity",
    label: "Shadow Op",
    min: 0,
    max: 1,
    step: 0.01,
  },
];

export const DebugSceneTuningOverlays = () => {
  const cameraVisible = useCoreStore(
    (state) => state.cameraSettingsOverlayVisible,
  );
  const lightVisible = useCoreStore((state) => state.lightSettingsOverlayVisible);

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

  return (
    <DebugOverlayPanel
      title="Camera Settings"
      description="Live scene camera values from the main canvas."
      visible={visible}
      top={84}
      right={16}
      specs={cameraSliderSpecs}
      values={values as Record<keyof DebugCameraSettings, number>}
      onUpdate={(updates) =>
        updateValues(updates as Partial<DebugCameraSettings>)
      }
      onReset={resetValues}
    />
  );
};

const LightSettingsOverlay = ({ visible }: { visible: boolean }) => {
  const values = useCoreStore((state) => state.debugLightSettings);
  const updateValues = useCoreStore((state) => state.updateDebugLightSettings);
  const resetValues = useCoreStore((state) => state.resetDebugLightSettings);

  return (
    <DebugOverlayPanel
      title="Light Settings"
      description="Ambient, directional, fallback route light and fake shadow tuning."
      visible={visible}
      top={84}
      left={16}
      specs={lightSliderSpecs}
      values={values as Record<keyof DebugLightSettings, number>}
      onUpdate={(updates) =>
        updateValues(updates as Partial<DebugLightSettings>)
      }
      onReset={resetValues}
    />
  );
};

const DebugOverlayPanel = <T extends string>({
  title,
  description,
  visible,
  top,
  left,
  right,
  specs,
  values,
  onUpdate,
  onReset,
}: {
  title: string;
  description: string;
  visible: boolean;
  top: number;
  left?: number;
  right?: number;
  specs: SliderSpec<T>[];
  values: Record<T, number>;
  onUpdate: (updates: Partial<Record<T, number>>) => void;
  onReset: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const dragControls = useDragControls();

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
        onPointerDown={(event) => {
          dragControls.start(event);
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
          formatValue={spec.format ?? ((next) => formatSegmentedSliderValue(next))}
          onChange={(next) =>
            onUpdate({
              [spec.key]: next,
            } as Partial<Record<T, number>>)
          }
        />
      </SliderRow>
    );
  });

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

const OverlayBody = styled(motion.div)`
  overflow: hidden;
`;

const SliderGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: min(60vh, 540px);
  padding-right: 0.125rem;
  overflow-y: auto;
`;

const SliderRow = styled.div`
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.08);
`;

const SliderLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
`;
