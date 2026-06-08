// src/store/readerStore.ts
import { create } from 'zustand';
import { ReaderDocument } from '../types/document';
import { eventBus } from '../integration/EventBus';
import * as DocumentParserModule from '../parsers/documentParser';
import { memoryService } from './memoryService';

interface ReaderState {
  currentDoc: ReaderDocument | null;
  currentIndex: number;
  speechRate: number;
  parseStatus: 'idle' | 'parsing' | 'ready' | 'error';
  cachedDocs: ReaderDocument[];
  uploadAndParseFile: (file: File) => Promise<void>;
  setCurrentDoc: (doc: ReaderDocument) => void;
  setCurrentIndex: (index: number) => void;
  setSpeechRate: (rate: number) => void;
  setParseStatus: (status: 'idle' | 'parsing' | 'ready' | 'error') => void;
  loadCachedDocument: (docId: string) => void;
  removeCachedDocument: (docId: string) => void;
  loadCachedDocs: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  currentDoc: null,
  currentIndex: 0,
  speechRate: 1.0,
  parseStatus: 'idle',
  cachedDocs: [],

  uploadAndParseFile: async (file: File) => {
    set({ parseStatus: 'parsing' });
    try {
      let parseFn = (DocumentParserModule as any).parseDocument || (DocumentParserModule as any).default;

      if (!parseFn || typeof parseFn !== 'function') {
        throw new Error('未在 documentParser 中找到有效的解析函数');
      }

      const documentData = await parseFn(file);
      const historyIndex = (memoryService && typeof memoryService.load === 'function') 
        ? (memoryService.load(documentData.id) || 0)
        : 0;

      if (memoryService && typeof memoryService.saveDocument === 'function') {
        memoryService.saveDocument(documentData);
      }

      set((state) => ({
        cachedDocs: [documentData, ...state.cachedDocs.filter(d => d.id !== documentData.id)]
      }));

      set({
        currentDoc: documentData,
        currentIndex: historyIndex,
        parseStatus: 'ready'
      });

      eventBus.emit('reader:doc-changed', documentData);
    } catch (error) {
      console.error('文档解析失败:', error);
      set({ parseStatus: 'error' });
    }
  },

  setCurrentDoc: (doc) => {
    const historyIndex = memoryService.load(doc.id) || 0;
    set({ currentDoc: doc, currentIndex: historyIndex, parseStatus: 'ready' });
    eventBus.emit('reader:doc-changed', doc);
  },

  setCurrentIndex: (index) => set((state) => {
    if (!state.currentDoc || index < 0 || index >= state.currentDoc.paragraphs.length) return state;

    if (memoryService && typeof memoryService.save === 'function') {
      memoryService.save(state.currentDoc.id, index);
    }

    eventBus.emit('reader:paragraph-change', { index, paragraph: state.currentDoc.paragraphs[index] });
    return { currentIndex: index };
  }),

  setSpeechRate: (rate) => set(() => {
    eventBus.emit('reader:speech-rate-change', { speechRate: rate });
    return { speechRate: rate };
  }),

  setParseStatus: (status) => set({ parseStatus: status }),

  loadCachedDocument: (docId: string) => {
    const doc = memoryService.getDocument(docId);
    if (doc) {
      get().setCurrentDoc(doc);
    }
  },

  removeCachedDocument: (docId: string) => {
    memoryService.deleteDocument(docId);
    set((state) => ({
      cachedDocs: state.cachedDocs.filter(d => d.id !== docId),
      currentDoc: state.currentDoc?.id === docId ? null : state.currentDoc,
      currentIndex: state.currentDoc?.id === docId ? 0 : state.currentIndex
    }));
  },

  loadCachedDocs: () => {
    const docs = memoryService.getAllDocuments();
    set({ cachedDocs: docs });
  },
}));