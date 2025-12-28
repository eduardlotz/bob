import React, { useMemo, useCallback } from "react";
import styled from "styled-components";
import { useGameStore } from "@/store/gameStore";
import {
  BlobFormConfig,
  getBlobFormType,
  FORM_PARAMETER_RANGES,
} from "@/types/blobForms";

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ResetButton = styled.button`
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FormGrid = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const FormCard = styled.button<{
  $selected: boolean;
  $unlocked: boolean;
  $canAfford: boolean;
}>`
  position: relative;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;

  background: ${({ $selected }) =>
    $selected ? "var(--primary-color)" : "transparent"};
  color: ${({ $selected }) =>
    $selected ? "var(--background-color)" : "var(--text-color)"};

  cursor: ${({ $unlocked, $canAfford }) =>
    $unlocked || $canAfford ? "pointer" : "not-allowed"};
  opacity: ${({ $unlocked, $canAfford }) =>
    $unlocked || $canAfford ? 1 : 0.5};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? "var(--primary-color)" : "rgba(255, 255, 255, 0.1)"};
  }

  font-size: 0.875rem;
  font-weight: ${({ $selected }) => ($selected ? "600" : "400")};
`;

const FormCost = styled.span`
  margin-left: 0.5rem;
  font-size: 0.65rem;
  background: var(--warning-color);
  color: var(--background-color);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
`;

const ParameterSection = styled.div`
  margin-top: 2rem;
`;

const ParameterGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ParameterRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ParameterHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
`;

const ParameterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
`;

const ParameterValue = styled.span`
  font-size: 0.75rem;
  color: var(--text-color);
  opacity: 0.5;
  font-family: monospace;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
`;

const ParameterSlider = styled.input`
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ParameterDescription = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.3;
`;

const PreviewCard = styled.div`
  padding: 1.5rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
`;

const PreviewTitle = styled.h4`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const PreviewDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const PreviewCost = styled.p`
  font-size: 0.875rem;
  color: var(--warning-color);
  margin: 0;
  font-weight: 500;
`;

interface BlobFormCustomizationProps {
  className?: string;
}

export const BlobFormCustomization = React.memo(
  ({ className }: BlobFormCustomizationProps) => {
    const {
      blobForms,
      purchaseBlobForm,
      selectBlobForm,
      updateBlobFormParameters,
      resetBlobFormParameters,
      canAfford,
    } = useGameStore();

    const selectedForm = useMemo(
      () => blobForms.find((form) => form.selected) || blobForms[0],
      [blobForms]
    );

    const formType = useMemo(
      () => getBlobFormType(selectedForm.id),
      [selectedForm.id]
    );

    const handleFormSelect = useCallback(
      (form: BlobFormConfig) => {
        if (!form.unlocked) {
          if (canAfford(form.cost)) {
            purchaseBlobForm(form.id);
            selectBlobForm(form.id);
          }
        } else {
          selectBlobForm(form.id);
        }
      },
      [canAfford, purchaseBlobForm, selectBlobForm]
    );

    const handleParameterChange = useCallback(
      (paramKey: string, value: number) => {
        updateBlobFormParameters(selectedForm.id, { [paramKey]: value });
      },
      [selectedForm.id, updateBlobFormParameters]
    );

    const handleResetForm = useCallback(() => {
      if (window.confirm("Bist du dir sicher?")) {
        resetBlobFormParameters(selectedForm.id);
      }
    }, [selectedForm.id, resetBlobFormParameters]);

    const renderParameterSliders = useMemo(() => {
      const parameterRanges = FORM_PARAMETER_RANGES[formType];
      if (!parameterRanges) return null;

      return Object.entries(parameterRanges).map(([paramKey, range]) => {
        const currentValue =
          (selectedForm.parameters as any)[paramKey] || range.default;

        return (
          <ParameterRow key={paramKey}>
            <ParameterHeader>
              <ParameterLabel>{range.label}</ParameterLabel>
              <ParameterValue>
                {currentValue.toFixed(range.step < 1 ? 2 : 0)}
              </ParameterValue>
            </ParameterHeader>
            <ParameterSlider
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={currentValue}
              onChange={(e) =>
                handleParameterChange(paramKey, parseFloat(e.target.value))
              }
            />
            <ParameterDescription>{range.description}</ParameterDescription>
          </ParameterRow>
        );
      });
    }, [formType, selectedForm.parameters, handleParameterChange]);

    return (
      <div className={className}>
        <FormSection>
          <PreviewTitle>{selectedForm.name}</PreviewTitle>
          <PreviewDescription>{selectedForm.description}</PreviewDescription>
          <FormGrid>
            {blobForms.map((form) => (
              <FormCard
                key={form.id}
                $selected={form.selected}
                $unlocked={form.unlocked}
                $canAfford={canAfford(form.cost)}
                onClick={() => handleFormSelect(form)}
              >
                {form.name}
                {!form.unlocked && <FormCost>{form.cost} taps</FormCost>}
              </FormCard>
            ))}
          </FormGrid>
        </FormSection>

        {/* Parameter Customization */}
        {selectedForm.unlocked && (
          <ParameterSection>
            <SectionHeader>
              <SectionTitle>Fine-Tuning</SectionTitle>
              <ResetButton onClick={handleResetForm}>Reset</ResetButton>
            </SectionHeader>
            <ParameterGrid>{renderParameterSliders}</ParameterGrid>
          </ParameterSection>
        )}
      </div>
    );
  }
);
