// src/store/memoryService.ts
import { ReadingMemory, ReaderDocument } from '../types/document';

const STORAGE_PREFIX = 'voiceecho:memory:';
const DOCS_STORAGE_KEY = 'voiceecho:documents';
const MAX_CACHED_DOCS = 10; // 最多缓存10个文档

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

  // 保存文档到本地缓存
  saveDocument: (document: ReaderDocument) => {
    const docs = memoryService.getAllDocuments();
    // 移除已存在的相同文档
    const filtered = docs.filter(d => d.id !== document.id);
    // 添加新文档到开头
    filtered.unshift(document);
    // 限制缓存数量
    const limited = filtered.slice(0, MAX_CACHED_DOCS);
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(limited));
  },

  // 获取所有已缓存的文档
  getAllDocuments: (): ReaderDocument[] => {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // 获取单个文档
  getDocument: (docId: string): ReaderDocument | null => {
    const docs = memoryService.getAllDocuments();
    return docs.find(d => d.id === docId) || null;
  },

  // 删除单个文档
  deleteDocument: (docId: string) => {
    const docs = memoryService.getAllDocuments();
    const filtered = docs.filter(d => d.id !== docId);
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(filtered));
    // 同时删除对应的阅读进度
    localStorage.removeItem(`${STORAGE_PREFIX}${docId}`);
  },

  // 清空所有缓存
  clearAll: () => {
    localStorage.removeItem(DOCS_STORAGE_KEY);
    // 清除所有阅读进度
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};