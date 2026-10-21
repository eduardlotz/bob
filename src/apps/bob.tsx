import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useIsPresent } from "motion/react";
import styled from "styled-components";
import { BlobFormCustomization } from "@/components/BlobFormCustomization";
import { BobSculptEditor } from "@/components/bob/BobSculptEditor";
import { resetBobParameters } from "@/store/bobEditor";
import { ResetFormIcon } from "@/icons/formParameter";
import { useCoreStore, useViewStore } from "@/store";
import { useI18n } from "@/i18n";

export const BobIcon = () => (
  <img src="/images/app-logos/shop.png" alt="" height={80} width={80} />
);

export function BobResetButton() {
  const { messages } = useI18n();
  return <Reset type="button" onClick={resetBobParameters} aria-label={messages.options.bobShape.reset} data-ui-sound-id="ui-tap"><ResetFormIcon />{messages.options.bobShape.resetShort}</Reset>;
}

export function BobApp() {
  const isPresent = useIsPresent();
  const currentView = useViewStore((state) => state.currentView);
  const transitionToView = useViewStore((state) => state.transitionToView);
  const resetPreview = useCoreStore((state) => state.resetPreview);

  useEffect(() => {
    resetPreview();
  }, [resetPreview]);

  useEffect(() => {
    // Enter on presence changes, never reclaim the camera while another view exits.
    if (isPresent) transitionToView("phone:bob");
  }, [isPresent, transitionToView]);

  return (
    <>
      <FormPanel data-bob-form-panel>
        <BlobFormCustomization section="selector" />
      </FormPanel>
      {createPortal(
        <AnimatePresence propagate>
          {isPresent && currentView === "phone:bob" && <BobSculptEditor key="bob-controls" />}
        </AnimatePresence>,
        document.getElementById("motion-root")!,
      )}
    </>
  );
}

const FormPanel = styled.div`width: 320px; max-width: calc(100vw - 56px);`;
const Reset = styled.button`display: flex; align-items: center; justify-content: center; align-self: flex-end; gap: 5px; background: #ededf0; color: #212026; border-radius: 14px; padding: 7px 10px; font-size: 14px; font-weight: 900; min-height: 36px;`;
