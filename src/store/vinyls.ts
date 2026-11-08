import { create } from "zustand";
import { ABOUT_VINYLS, ABOUT_PICTURES } from "@/3d-objects/about/roomConfig";

export const useVinylStore = create<{
  selected: string | null;
  select: (id: string | null) => void;
  navigate: (direction: -1 | 1) => void;
}>((set, get) => ({
  selected: null,
  select: id => { if (id === null || [...ABOUT_VINYLS, ...ABOUT_PICTURES].some(item => item.id === id)) set({ selected: id }); },
  navigate: direction => {
    const collection = ABOUT_PICTURES.some(photo => photo.id === get().selected) ? ABOUT_PICTURES : ABOUT_VINYLS;
    const index = collection.findIndex(item => item.id === get().selected);
    if (index < 0) return;
    set({ selected: collection[(index + direction + collection.length) % collection.length].id });
  },
}));
