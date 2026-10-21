import { create } from "zustand";
import type { BlobFormParameters } from "@/types/blobForms";
import { getBlobFormType, getSelectedBlobForm } from "@/types/blobForms";
import { normalizeBobEditorParameters, type BobParameter } from "@/types/bobControlValues";
import { useCoreStore } from "@/store/core/store";

export type { BobParameter } from "@/types/bobControlValues";
export interface BobScreenBounds { left: number; top: number; right: number; bottom: number }
export interface BobDraft { id: string; parameters: BlobFormParameters }

/** Editing is transient: only a completed gesture writes to the saved game. */
export const useBobEditor = create<{
  open: boolean;
  dragging: BobParameter | null;
  draft: BobDraft | null;
  screenOffset: { x: number; y: number };
}>(() => ({ open: false, dragging: null, draft: null, screenOffset: { x: 0, y: 0 } }));

export function commitBobParameters(parameters: BlobFormParameters) {
  const selected = getSelectedBlobForm(useCoreStore.getState().blobForms);
  if (Object.entries(parameters).some(([key, value]) => selected.parameters[key as keyof BlobFormParameters] !== value)) {
    const normalized = normalizeBobEditorParameters(getBlobFormType(selected.id), { ...selected.parameters, ...parameters });
    useCoreStore.getState().updateBlobFormParameters(selected.id, normalized);
  }
  useBobEditor.setState({ draft: null, dragging: null });
}

export function resetBobParameters() {
  const selected = getSelectedBlobForm(useCoreStore.getState().blobForms);
  useBobEditor.setState({ draft: null });
  useCoreStore.getState().resetBlobFormParameters(selected.id);
}

