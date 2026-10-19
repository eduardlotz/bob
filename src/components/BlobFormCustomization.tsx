import { memo, useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import { PANEL_LAYOUT_SPRING, PANEL_SPRING } from "@/styles/panelMotion";
import { useCoreStore } from "@/store/core/store";
import {
  getSelectedBlobForm,
  getBlobFormType,
  getBlobFormParameterRange,
  type BlobFormParameters,
} from "@/types/blobForms";
import { getBobParameterKeys } from "@/types/bobControlValues";
import styled from "styled-components";
import { FloatingValueControl } from "./FloatingValueControl";
import { FloatingActionButton } from "./FloatingActionButton";
import { FormParameterIcon, ResetFormIcon } from "@/icons/formParameter";
import { FillColumn } from "@/layout";
import { useI18n } from "@/i18n";

export const BlobFormCustomization = memo(function BlobFormCustomization({
  section = "all",
}: { section?: "all" | "selector" | "parameters" }) {
  const layoutId = useId();
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0 } : PANEL_LAYOUT_SPRING;
  const blobForms = useCoreStore((state) => state.blobForms);
  const selectBlobForm = useCoreStore((state) => state.selectBlobForm);
  const updateParameters = useCoreStore((state) => state.updateBlobFormParameters);
  const resetParameters = useCoreStore((state) => state.resetBlobFormParameters);
  const { messages } = useI18n();
  const copy = messages.options.bobShape;
  const selectedForm = getSelectedBlobForm(blobForms);
  const formType = getBlobFormType(selectedForm.id);
  const [roundForm, setRoundForm] = useState(formType === "egg" ? "egg" : "sphere");
  const [boxForm, setBoxForm] = useState(formType === "cuboid" ? "cuboid" : "cube");
  const select = (id: string) => {
    if (id === "sphere" || id === "egg") setRoundForm(id); else setBoxForm(id);
    selectBlobForm(id);
  };

  return (
    <FillColumn $gap="1rem" style={{ height: "fit-content" }}>
      {section !== "parameters" && (
        <LayoutGroup id={layoutId}>
          <ShapeSelector layout role="group" aria-label={messages.options.sections.bobShape}>
            {[["sphere", "egg"], ["cube", "cuboid"]].map((family, index) => {
              const active = family.includes(selectedForm.id);
              const currentIndex = family.indexOf(selectedForm.id);
              const next = active ? family[1 - currentIndex] : index === 0 ? roundForm : boxForm;
              const names = family.map(id => copy.shapes[getBlobFormType(id)]);
              return <ShapeFamily
                layout
                key={family[0]}
                type="button"
                aria-pressed={active}
                aria-label={active ? `${names.join(" / ")}: ${copy.shapes[formType]}` : names[0]}
                onClick={() => select(next)}
                animate={{ backgroundColor: active ? "#ffffff" : "rgba(255, 255, 255, 0)" }}
                transition={{ ...transition, backgroundColor: { duration: reducedMotion ? 0 : 0.15 } }}
                data-shape-family={family[0]}
                data-selected-shape={active ? selectedForm.id : undefined}
                data-ui-sound-id="ui-tap"
              >
                <AnimatePresence initial={false} mode="popLayout" propagate>
                  {isPresent && family.filter((_, labelIndex) => active || labelIndex === 0).map(id => {
                    const selected = !active || selectedForm.id === id;
                    return <ShapeLabel key={id} layout transition={{ layout: transition }}
                      data-shape-label={id} data-selected={selected}
                      style={{ fontSize: selected ? "1em" : "0.875em", color: selected ? "#212026" : "#929294" }}>
                      <motion.span
                        initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }}
                        transition={reducedMotion ? { duration: 0 } : PANEL_SPRING}
                      >{copy.shapes[getBlobFormType(id)]}</motion.span>
                    </ShapeLabel>;
                  })}
                </AnimatePresence>
              </ShapeFamily>;
            })}
          </ShapeSelector>
        </LayoutGroup>
      )}
      {section !== "selector" && (
        <ParameterControls>
          {getBobParameterKeys(formType).map((key) => {
            const range = getBlobFormParameterRange(formType, key, selectedForm.parameters);
            const parameter = key as keyof BlobFormParameters;
            const label = formType === "cube" && key === "cubeWidth" ? copy.parameters.sphereRadius : copy.parameters[key as keyof typeof copy.parameters];
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

const ShapeSelector = styled(motion.div)`
  display: flex; width: 100%; padding: 4px; border-radius: 999px; background: rgba(33, 33, 33, 0.07); gap: 2px;
`;
const ShapeFamily = styled(motion.button)`
  position: relative; display: flex; align-items: center; justify-content: center; gap: 6px;
  flex: 1; min-width: 0; min-height: 42px; padding: 8px;
  border-radius: 999px; border: 0; background: transparent;
  color: #212026; font-size: 16px; font-weight: 900; line-height: 1; cursor: pointer;
  &:focus-visible { outline: 2px solid #4178f7; outline-offset: 1px; }
  @media (max-width: 350px) { padding: 8px 4px; font-size: 14px; }
`;
const ShapeLabel = styled(motion.span)`
  display: inline-flex; flex-shrink: 0; white-space: nowrap; pointer-events: none;
  > span { display: inline-block; }
`;
