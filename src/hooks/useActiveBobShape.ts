import { useMemo } from "react";
import { useCoreStore } from "@/store/core/store";
import { getSelectedBlobForm, getBlobFormType } from "@/types/blobForms";
import { getGameSizeFactor } from "@/utils/gameSizing";

/** One reactive contract for Bob's selected geometry and matching game scale. */
export function useActiveBobShape() {
  const forms = useCoreStore((state) => state.blobForms);
  return useMemo(() => {
    const selected = getSelectedBlobForm(forms);
    const formType = getBlobFormType(selected.id);
    return {
      formType,
      parameters: selected.parameters,
      sizeFactor: getGameSizeFactor(formType, selected.parameters),
    };
  }, [forms]);
}
