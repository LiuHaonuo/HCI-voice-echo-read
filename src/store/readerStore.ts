// src/store/readerStore.ts
import { create } from 'zustand';
import { ReaderDocument } from '../types/document';
import { eventBus } from '../integration/EventBus';

interface ReaderState {
  currentDoc: ReaderDocument | null;
  currentIndex: number;
  speechRate: number;
  parseStatus: 'idle' | 'parsing' | 'ready' | 'error';
  setCurrentDoc: (doc: ReaderDocument) => void;
  setCurrentIndex: (index: number) => void;
  setSpeechRate: (rate: number) => void;
  setParseStatus: (status: 'idle' | 'parsing' | 'ready' | 'error') => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentDoc: null,
  currentIndex: 0,
  speechRate: 1.0,
  parseStatus: 'idle',
  setCurrentDoc: (doc) => set({ currentDoc: doc, currentIndex: 0, parseStatus: 'ready' }),
  setCurrentIndex: (index) => set((state) => {
    if (!state.currentDoc || index < 0 || index >= state.currentDoc.paragraphs.length) return state;
    // 当阅读段落变更，向下游发送事件
    eventBus.emit('reader:paragraph-change', { index, paragraph: state.currentDoc.paragraphs[index] });
    return { currentIndex: index };
  }),
  setSpeechRate: (rate) => set(() => {
    eventBus.emit('reader:speech-rate-change', { speechRate: rate });
    return { speechRate: rate };
  }),
  setParseStatus: (status) => set({ parseStatus: status }),
}));