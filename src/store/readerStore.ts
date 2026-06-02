// src/store/readerStore.ts
import { create } from 'zustand';
import { ReaderDocument } from '../types/document';
import { eventBus } from '../integration/EventBus';
// 💡 安全修改：如果命名导出失败，我们直接引入整个解析模块，防止运行时 undefined
import * as DocumentParserModule from '../parsers/documentParser';
import { memoryService } from './memoryService';

interface ReaderState {
  currentDoc: ReaderDocument | null;
  currentIndex: number;
  speechRate: number;
  parseStatus: 'idle' | 'parsing' | 'ready' | 'error';
  uploadAndParseFile: (file: File) => Promise<void>;
  setCurrentDoc: (doc: ReaderDocument) => void;
  setCurrentIndex: (index: number) => void;
  setSpeechRate: (rate: number) => void;
  setParseStatus: (status: 'idle' | 'parsing' | 'ready' | 'error') => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  currentDoc: null,
  currentIndex: 0,
  speechRate: 1.0,
  parseStatus: 'idle',

  uploadAndParseFile: async (file: File) => {
    set({ parseStatus: 'parsing' });
    try {
      // ⚡ 安全兼容防御：自动适配是 默认导出(default) 还是 命名导出(parseDocument)
      let parseFn = (DocumentParserModule as any).parseDocument || (DocumentParserModule as any).default;
      
      if (!parseFn || typeof parseFn !== 'function') {
        throw new Error('未在 documentParser 中找到有效的解析函数，请检查该文件的 export 方式');
      }

      // 1. 调用安全提取出来的文件解析引擎
      const documentData = await parseFn(file);
      
      // 2. 安全读取历史进度
      const historyIndex = (memoryService && typeof memoryService.load === 'function') 
        ? (memoryService.load(documentData.id) || 0) 
        : 0;

      // 3. 灌入全局状态
      set({ 
        currentDoc: documentData, 
        currentIndex: historyIndex, 
        parseStatus: 'ready' 
      });

      // 4. 通知下游（包含成员B的 AI 模块）
      eventBus.emit('reader:doc-changed', documentData);
    } catch (error) {
      console.error('文档解析失败:', error);
      set({ parseStatus: 'error' });
    }
  },

  // 🤝 完美保留成员B的所有接口逻辑，确保 AI 面板运行畅通
  setCurrentDoc: (doc) => set({ currentDoc: doc, currentIndex: 0, parseStatus: 'ready' }),
  
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
}));