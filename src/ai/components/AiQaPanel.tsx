// src/ai/components/AiQaPanel.tsx
import React, { useState } from 'react';
import { useReaderStore } from '../../store/readerStore';

export const AiQaPanel: React.FC = () => {
  const { currentDoc, currentIndex } = useReaderStore();
  const [qaList, setQaList] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAskAI = () => {
    if (!currentDoc) return;
    setLoading(true);

    // 提取上下文 Prompt 逻辑骨架
    const currentParagraph = currentDoc.paragraphs[currentIndex]?.text;
    console.log(`[PromptBuilder] 正在为 Gemini 聚合上下文...\n当前段: ${currentParagraph}`);

    setTimeout(() => {
      setQaList([
        ...qaList, 
        { q: "这段的核心观点是什么？", a: `（AI基于 §${currentIndex + 1} 简要回答）该处重点在于强调解决特定用户群体认知过载的可行方法。` }
      ]);
      setLoading(false);
    }, 1200);
  };

  if (!currentDoc) return null;

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4 flex-1 flex flex-col overflow-hidden">
      <span className="font-bold text-sm text-gray-700 mb-2 block">💬 上下文 AI 助手 (基于 §{currentIndex + 1})</span>
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs">
        {qaList.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <p className="font-semibold text-blue-600">问: {item.q}</p>
            <p className="bg-white p-2 rounded border border-gray-100 text-gray-700">{item.a}</p>
          </div>
        ))}
        {loading && <p className="text-gray-400 animate-pulse">Gemini Flash 正在思考中...</p>}
      </div>

      <button 
        onClick={handleAskAI}
        disabled={loading}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        🪄 一键解惑当前段
      </button>
    </div>
  );
};