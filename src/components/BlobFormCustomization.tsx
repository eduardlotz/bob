import { memo } from "react";
import { useCoreStore } from "@/store/core/store";
import {
  getSelectedBlobForm,
  getBlobFormType,
  FORM_PARAMETER_RANGES,
  type BlobFormParameters,
} from "@/types/blobForms";
import { AnimatedSegmentedControl } from "./AnimatedSegmentedControl";
import { SegmentedValueSlider } from "./SegmentedValueSlider";
import { FillColumn, FillRow } from "@/layout";
import { RowLabel } from "@/layout/atoms";
import { ActionButton } from "@/apps/ui";
import { useI18n } from "@/i18n";

export const BlobFormCustomization = memo(function BlobFormCustomization() {
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
      {Object.entries(FORM_PARAMETER_RANGES[formType]).map(([key, range]) => {
        const parameter = key as keyof BlobFormParameters;
        const label = copy.parameters[key as keyof typeof copy.parameters];
        return (
          <FillRow key={key} $gap="1rem" $align="center">
            <RowLabel style={{ flex: "0 0 5.5rem" }}>{label}</RowLabel>
            <SegmentedValueSlider
              ariaLabel={label}
              value={selectedForm.parameters[parameter] ?? range.default}
              min={range.min}
              max={range.max}
              step={range.step}
              onChange={(value) => updateParameters(selectedForm.id, { [key]: value })}
            />
          </FillRow>
        );
      })}
      <FillRow $justify="flex-end">
        <ActionButton type="button" onClick={() => resetParameters(selectedForm.id)}>
          {copy.reset}
        </ActionButton>
      </FillRow>
    </FillColumn>
  );
});
