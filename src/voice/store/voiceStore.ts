// src/voice/store/voiceStore.ts
import { create } from 'zustand';
import { VoiceStatus, ParagraphAnnotation } from '../../types/voice';

interface VoiceState {
  status: VoiceStatus;
  isPlaying: boolean;
  annotations: { [docId: string]: ParagraphAnnotation[] };
  setStatus: (status: VoiceStatus) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  addAnnotation: (docId: string, ann: ParagraphAnnotation) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'idle',
  isPlaying: false,
  annotations: {},
  setStatus: (status) => set({ status }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  addAnnotation: (docId, ann) => set((state) => {
    const currentAnns = state.annotations[docId] || [];
    return {
      annotations: {
        ...state.annotations,
        [docId]: [...currentAnns, ann]
      }
    };
  }),
}));