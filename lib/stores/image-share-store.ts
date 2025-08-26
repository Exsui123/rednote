import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SharedImage {
  id: string;
  src: string; // base64 or blob url
  toolName: string;
  timestamp: number;
  selected: boolean;
  fileName?: string;
  size?: number; // in bytes
}

interface ImageShareStore {
  images: SharedImage[];
  addImage: (image: Omit<SharedImage, 'id' | 'timestamp' | 'selected'>) => void;
  addImages: (images: Omit<SharedImage, 'id' | 'timestamp' | 'selected'>[]) => void;
  removeImage: (id: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  unselectAll: () => void;
  getSelectedImages: () => SharedImage[];
  clearImages: () => void;
  clearSelectedImages: () => void;
}

export const useImageShareStore = create<ImageShareStore>()(
  persist(
    (set, get) => ({
      images: [],

      addImage: (image) => {
        const newImage: SharedImage = {
          ...image,
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          selected: false,
        };
        set((state) => ({
          images: [newImage, ...state.images],
        }));
      },

      addImages: (images) => {
        const newImages: SharedImage[] = images.map((image, index) => ({
          ...image,
          id: `img_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now() + index,
          selected: false,
        }));
        set((state) => ({
          images: [...newImages, ...state.images],
        }));
      },

      removeImage: (id) => {
        set((state) => ({
          images: state.images.filter((img) => img.id !== id),
        }));
      },

      toggleSelect: (id) => {
        set((state) => ({
          images: state.images.map((img) =>
            img.id === id ? { ...img, selected: !img.selected } : img
          ),
        }));
      },

      selectAll: () => {
        set((state) => ({
          images: state.images.map((img) => ({ ...img, selected: true })),
        }));
      },

      unselectAll: () => {
        set((state) => ({
          images: state.images.map((img) => ({ ...img, selected: false })),
        }));
      },

      getSelectedImages: () => {
        return get().images.filter((img) => img.selected);
      },

      clearImages: () => {
        set({ images: [] });
      },

      clearSelectedImages: () => {
        set((state) => ({
          images: state.images.filter((img) => !img.selected),
        }));
      },
    }),
    {
      name: 'image-share-storage',
      partialize: (state) => ({ images: state.images }), // Only persist images
    }
  )
);