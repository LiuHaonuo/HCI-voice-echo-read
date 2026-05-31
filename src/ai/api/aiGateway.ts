const API_BASE = import.meta.env.VITE_AI_GATEWAY_URL || 'http://localhost:5000/api/v1';

export interface AiResponse {
  model_id: string;
  question: string;
  answer: string;
  context_provided: boolean;
}

export interface ModelInfo {
  models: string[];
  default: string;
  supported_features: string[];
}

export interface ChatRequest {
  model_id: string;
  question: string;
  context?: string;
  stream?: boolean;
}

export const aiGateway = {
  async chat(request: ChatRequest): Promise<AiResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }

    return response.json();
  },

  async getModels(): Promise<ModelInfo> {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) {
      throw new Error('获取模型列表失败');
    }
    return response.json();
  },

  async getHistory(modelId: string): Promise<{ model_id: string; history: { role: string; content: string }[] }> {
    const response = await fetch(`${API_BASE}/history/${modelId}`);
    if (!response.ok) {
      throw new Error('获取历史记录失败');
    }
    return response.json();
  },

  async clearHistory(modelId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/history/${modelId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('清除历史记录失败');
    }
    return response.json();
  },

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error('服务不可用');
    }
    return response.json();
  },

  async askWithContext(
    question: string,
    context: string,
    modelId: string = 'gemini'
  ): Promise<AiResponse> {
    return this.chat({
      model_id: modelId,
      question,
      context,
      stream: false,
    });
  },
};
