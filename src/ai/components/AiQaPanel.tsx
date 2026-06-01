import React, { useState, useEffect } from 'react';
import { useReaderStore } from '../../store/readerStore';
import { useAiStore } from '../store/aiStore';
import { promptBuilder } from '../utils/promptBuilder';

export const AiQaPanel: React.FC = () => {
  const { currentDoc, currentIndex } = useReaderStore();
  const { 
    qaHistory, 
    isLoading, 
    error, 
    askQuestion, 
    clearError,
    currentModel,
    availableModels,
    switchModel,
    initializeService 
  } = useAiStore();
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const quickQuestions = promptBuilder.buildQuickQuestionPrompts();

  const handleQuickQuestion = (question: string) => {
    if (!currentDoc) return;
    clearError();
    askQuestion(question, currentIndex);
  };

  const handleCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoc || !customQuestion.trim()) return;
    clearError();
    askQuestion(customQuestion, currentIndex);
    setCustomQuestion('');
  };

  const filteredHistory = qaHistory.filter(qa => qa.paragraphIndex === currentIndex);

  if (!currentDoc) return null;

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-gray-700">💬 上下文 AI 助手</span>
        <select
          value={currentModel}
          onChange={(e) => switchModel(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-0.5 bg-white"
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          <p className="font-medium">⚠️ 出错了</p>
          <p>{error}</p>
          <button 
            onClick={clearError}
            className="mt-1 text-xs underline hover:no-underline"
          >
            关闭
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {filteredHistory.map((qa) => (
          <div key={qa.id} className="space-y-1">
            <p className="font-semibold text-blue-600 text-xs">
              {qa.paragraphIndex !== currentIndex && `[§${qa.paragraphIndex + 1}] `}
              问: {qa.question}
            </p>
            <p className="bg-white p-2 rounded border border-gray-100 text-gray-700 text-xs leading-relaxed">
              {qa.answer}
            </p>
          </div>
        ))}
        
        {isLoading && (
          <p className="text-gray-400 text-xs animate-pulse">{currentModel} 正在思考中...</p>
        )}
        
        {filteredHistory.length === 0 && !isLoading && (
          <p className="text-gray-400 text-xs text-center py-4">
            选择一个问题，让 AI 为您解答
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1">
          {quickQuestions.map((qq, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(qq.question)}
              disabled={isLoading}
              className="text-xs py-1.5 px-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {qq.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomQuestion} className="flex gap-1">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="输入您的问题..."
            disabled={isLoading}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !customQuestion.trim()}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};
