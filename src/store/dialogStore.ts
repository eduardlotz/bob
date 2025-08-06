import { create } from "zustand";

export interface DialogContent {
  title: string;
  content: React.ReactNode;
}

export interface DialogStore {
  isOpen: boolean;
  content: DialogContent | null;
  openDialog: (content: DialogContent) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  isOpen: false,
  content: null,
  openDialog: (content) => set({ isOpen: true, content }),
  closeDialog: () => set({ isOpen: false, content: null }),
}));
