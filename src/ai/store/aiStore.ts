import { create } from 'zustand';
import { promptBuilder } from '../utils/promptBuilder';
import { useReaderStore } from '../../store/readerStore';
import { aiGateway } from '../api/aiGateway';

export interface QaItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  paragraphIndex: number;
  isStreaming?: boolean;
  modelId?: string;
}

interface AiState {
  currentModel: string;
  availableModels: string[];
  isConfigured: boolean;
  qaHistory: QaItem[];
  isLoading: boolean;
  error: string | null;

  initializeService: () => Promise<void>;
  switchModel: (modelId: string) => void;
  askQuestion: (question: string, paragraphIndex: number) => Promise<void>;
  addManualQa: (question: string, answer: string, paragraphIndex: number) => void;
  clearHistory: () => void;
  clearError: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  currentModel: 'gemini',
  availableModels: [],
  isConfigured: false,
  qaHistory: [],
  isLoading: false,
  error: null,

  initializeService: async () => {
    try {
      const models = await aiGateway.getModels();
      set({
        availableModels: models.models,
        currentModel: models.default,
        isConfigured: true,
      });
    } catch {
      console.warn('AI Gateway 不可用，将使用本地模式');
      set({
        availableModels: ['gemini', 'openai', 'deepseek', 'tongyi', 'minimax', 'qianfan'],
        isConfigured: false,
      });
    }
  },

  switchModel: (modelId: string) => {
    const { availableModels } = get();
    if (availableModels.includes(modelId)) {
      set({ currentModel: modelId, error: null });
    } else {
      set({ error: `不支持的模型: ${modelId}` });
    }
  },

  askQuestion: async (question: string, paragraphIndex: number) => {
    const { currentDoc } = useReaderStore.getState();
    const { currentModel } = get();

    if (!currentDoc) {
      set({ error: '请先导入文档' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const context = promptBuilder.buildContext(currentDoc, paragraphIndex);
      const contextText = promptBuilder.buildContextPrompt(context, { userQuestion: question });

      const response = await aiGateway.askWithContext(question, contextText, currentModel);

      const qaId = Date.now().toString();
      set((state) => ({
        qaHistory: [
          ...state.qaHistory,
          {
            id: qaId,
            question,
            answer: response.answer,
            timestamp: Date.now(),
            paragraphIndex,
            modelId: response.model_id,
          },
        ],
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '请求失败，请检查后端服务是否启动' });
    } finally {
      set({ isLoading: false });
    }
  },

  addManualQa: (question: string, answer: string, paragraphIndex: number) => {
    const qaId = Date.now().toString();
    set((state) => ({
      qaHistory: [
        ...state.qaHistory,
        {
          id: qaId,
          question,
          answer,
          timestamp: Date.now(),
          paragraphIndex,
        },
      ],
    }));
  },

  clearHistory: () => set({ qaHistory: [] }),

  clearError: () => set({ error: null }),
}));
