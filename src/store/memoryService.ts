// src/store/memoryService.ts
import { ReadingMemory } from '../types/document';
import { ParagraphAnnotation } from '../types/voice';

const STORAGE_PREFIX = 'voiceecho:memory:';
const ANNOTATION_PREFIX = 'voiceecho:annotations:';

export const memoryService = {
  // 保存断点到浏览器的 LocalStorage
  save: (docId: string, index: number) => {
    const memory: ReadingMemory = {
      docId,
      currentIndex: index,
      updatedAt: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${docId}`, JSON.stringify(memory));
  },

  // 读取历史断点
  load: (docId: string): number => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${docId}`);
    if (!raw) return 0;
    try {
      const memory: ReadingMemory = JSON.parse(raw);
      return memory.currentIndex;
    } catch {
      return 0;
    }
  },

  // 保存批注到 LocalStorage
  saveAnnotations: (docId: string, annotations: ParagraphAnnotation[]) => {
    localStorage.setItem(`${ANNOTATION_PREFIX}${docId}`, JSON.stringify(annotations));
  },

  // 从 LocalStorage 加载批注
  loadAnnotations: (docId: string): ParagraphAnnotation[] => {
    const raw = localStorage.getItem(`${ANNOTATION_PREFIX}${docId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};