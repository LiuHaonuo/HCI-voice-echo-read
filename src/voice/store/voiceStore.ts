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
  deleteAnnotation: (docId: string, annId: string) => void;
  loadAnnotations: (docId: string) => void;
}

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
    const currentAnns = state.annotations[docId] || [];
    const newAnnotations = {
      ...state.annotations,
      [docId]: [...currentAnns, ann]
    };
    memoryService.saveAnnotations(docId, newAnnotations[docId]);
    return { annotations: newAnnotations };
  }),
  deleteAnnotation: (docId, annId) => set((state) => {
    const currentAnns = state.annotations[docId] || [];
    const newAnnotations = {
      ...state.annotations,
      [docId]: currentAnns.filter(a => a.id !== annId)
    };
    memoryService.saveAnnotations(docId, newAnnotations[docId]);
    return { annotations: newAnnotations };
  }),
  loadAnnotations: (docId) => set((state) => {
    if (state.annotations[docId]) return state;
    const loadedAnnotations = memoryService.loadAnnotations(docId);
    return {
      annotations: {
        ...state.annotations,
        [docId]: loadedAnnotations
      }
    };
  }),
}));