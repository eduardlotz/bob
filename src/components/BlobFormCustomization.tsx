import { memo } from "react";
import { useCoreStore } from "@/store/core/store";
import {
  getSelectedBlobForm,
  getBlobFormType,
  FORM_PARAMETER_RANGES,
  getBlobFormParameterRange,
  type BlobFormParameters,
} from "@/types/blobForms";
import { AnimatedSegmentedControl } from "./AnimatedSegmentedControl";
import styled from "styled-components";
import { FloatingValueControl } from "./FloatingValueControl";
import { FloatingActionButton } from "./FloatingActionButton";
import { FormParameterIcon, ResetFormIcon } from "@/icons/formParameter";
import { FillColumn } from "@/layout";
import { useI18n } from "@/i18n";

export const BlobFormCustomization = memo(function BlobFormCustomization({
  section = "all",
}: { section?: "all" | "selector" | "parameters" }) {
  const blobForms = useCoreStore((state) => state.blobForms);
  const selectBlobForm = useCoreStore((state) => state.selectBlobForm);
  const updateParameters = useCoreStore((state) => state.updateBlobFormParameters);
  const resetParameters = useCoreStore((state) => state.resetBlobFormParameters);
  const { messages } = useI18n();
  const copy = messages.options.bobShape;
  const selectedForm = getSelectedBlobForm(blobForms);
  const formType = getBlobFormType(selectedForm.id);

  return (
    <FillColumn $gap="1rem" style={{ height: "fit-content" }}>
      {section !== "parameters" && (
        <AnimatedSegmentedControl
          options={blobForms.map((form) => ({
            value: form.id,
            label: copy.shapes[getBlobFormType(form.id)],
          }))}
          value={selectedForm.id}
          onChange={selectBlobForm}
          theme="light"
          size="sm"
        />
      )}
      {section !== "selector" && (
        <ParameterControls>
          {Object.keys(FORM_PARAMETER_RANGES[formType]).map((key) => {
            const range = getBlobFormParameterRange(formType, key, selectedForm.parameters);
            const parameter = key as keyof BlobFormParameters;
            const label = copy.parameters[key as keyof typeof copy.parameters];
            return (
              <FloatingValueControl
                key={key}
                spread={formType === "sphere"}
                variant="dark"
                label={label}
                icon={<FormParameterIcon parameter={parameter} />}
                value={selectedForm.parameters[parameter] ?? range.default}
                min={range.min}
                max={range.max}
                step={range.step}
                onChange={(value) => updateParameters(selectedForm.id, { [key]: value })}
              />
            );
          })}
          <ResetButton
            $variant="dark"
            type="button"
            onClick={() => resetParameters(selectedForm.id)}
            aria-label={copy.reset}
            title={copy.reset}
            data-ui-sound-id="ui-tap"
          >
            <ResetFormIcon />
          </ResetButton>
        </ParameterControls>
      )}
    </FillColumn>
  );
});

const ParameterControls = styled.div`
  display: grid;
  grid-template-columns: 160px clamp(12rem, 30vw, 24rem) 160px;
  justify-content: center;
  row-gap: 18px;
  column-gap: 0;
  > [role="group"]:nth-child(odd) { grid-column: 1; }
  > [role="group"]:nth-child(even) { grid-column: 3; }
  > [role="group"][data-spread="true"] { grid-column: 1 / -1; }
  padding: 3px 3px 8px;
  pointer-events: none;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, max-content);
    column-gap: 16px;
    row-gap: 12px;
    > [role="group"]:nth-child(odd) { grid-column: 1; }
    > [role="group"]:nth-child(even) { grid-column: 2; }
    > [role="group"]:first-child:nth-last-child(2) { grid-column: 1 / -1; justify-self: center; }
  }
  @media (max-width: 380px) { column-gap: 12px; }
  @media (max-width: 600px) and (max-height: 740px) {
    row-gap: 8px;
    padding-bottom: 6px;
  }
`;
const ResetButton = styled(FloatingActionButton)`
  grid-column: 1 / -1;
  justify-self: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 18px;
  @media (max-width: 600px) and (max-height: 740px) {
    width: 36px;
    height: 36px;
    svg { width: 18px; height: 18px; }
  }
`;
