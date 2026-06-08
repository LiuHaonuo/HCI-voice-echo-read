// src/voice/store/voiceStore.ts
import { create } from 'zustand';
import { VoiceStatus, ParagraphAnnotation } from '../../types/voice';
import { memoryService } from '../../store/memoryService';

interface VoiceState {
  status: VoiceStatus;
  isPlaying: boolean;
  isAnnotating: boolean;
  isAsking: boolean;
  annotations: { [docId: string]: ParagraphAnnotation[] };
  setStatus: (status: VoiceStatus) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsAnnotating: (isAnnotating: boolean) => void;
  setIsAsking: (isAsking: boolean) => void;
  addAnnotation: (docId: string, ann: ParagraphAnnotation) => void;
  updateAnnotation: (docId: string, annId: string, text: string) => void;
  deleteAnnotation: (docId: string, annId: string) => void;
  saveAnnotations: (docId: string) => void;
  loadAnnotations: (docId: string) => ParagraphAnnotation[];
}

const ANNOTATION_STORAGE_PREFIX = 'voiceecho:annotations:';

const saveToStorage = (docId: string, annotations: ParagraphAnnotation[]) => {
  localStorage.setItem(`${ANNOTATION_STORAGE_PREFIX}${docId}`, JSON.stringify(annotations));
};

const loadFromStorage = (docId: string): ParagraphAnnotation[] => {
  const raw = localStorage.getItem(`${ANNOTATION_STORAGE_PREFIX}${docId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  status: 'idle',
  isPlaying: false,
  isAnnotating: false,
  isAsking: false,
  annotations: {},

  setStatus: (status) => set({ status }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsAnnotating: (isAnnotating) => set({ isAnnotating }),
  setIsAsking: (isAsking) => set({ isAsking }),

  addAnnotation: (docId, ann) => set((state) => {
    const currentAnns = state.annotations[docId] || loadFromStorage(docId);
    const newAnns = [...currentAnns, ann];
    saveToStorage(docId, newAnns);
    return {
      annotations: {
        ...state.annotations,
        [docId]: newAnns
      }
    };
  }),

  updateAnnotation: (docId, annId, text) => set((state) => {
    const currentAnns = state.annotations[docId] || loadFromStorage(docId);
    const newAnns = currentAnns.map(a =>
      a.id === annId ? { ...a, text, updatedAt: Date.now() } : a
    );
    saveToStorage(docId, newAnns);
    return {
      annotations: {
        ...state.annotations,
        [docId]: newAnns
      }
    };
  }),

  deleteAnnotation: (docId, annId) => set((state) => {
    const currentAnns = state.annotations[docId] || loadFromStorage(docId);
    const newAnns = currentAnns.filter(a => a.id !== annId);
    saveToStorage(docId, newAnns);
    return {
      annotations: {
        ...state.annotations,
        [docId]: newAnns
      }
    };
  }),

  saveAnnotations: (docId: string) => {
    const annotations = get().annotations[docId] || [];
    saveToStorage(docId, annotations);
  },

  loadAnnotations: (docId: string) => {
    const annotations = loadFromStorage(docId);
    set((state) => ({
      annotations: {
        ...state.annotations,
        [docId]: annotations
      }
    }));
    return annotations;
  },
}));