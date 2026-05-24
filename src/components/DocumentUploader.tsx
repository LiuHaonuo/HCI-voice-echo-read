// src/components/DocumentUploader.tsx
import React from 'react';
import { useReaderStore } from '../store/readerStore';

export const DocumentUploader: React.FC = () => {
  const { setCurrentDoc, setParseStatus } = useReaderStore();

  const handleUploadMock = () => {
    setParseStatus('parsing');
    // Mock 异步解析过程
    setTimeout(() => {
      setCurrentDoc({
        id: 'mock-doc-123',
        fileName: 'HCI课程导论.pdf',
        format: 'pdf',
        uploadedAt: Date.now(),
        paragraphs: [
          { id: 'p-1', index: 0, text: '欢迎来到人机交互（HCI）技术前沿课程。今天我们将探讨多模态听觉交互。', charCount: 35 },
          { id: 'p-2', index: 1, text: '“低头党”是现代数字学习中普遍存在的痛点，长时间看屏会导致严重的视觉疲劳。', charCount: 37 },
          { id: 'p-3', index: 2, text: '本研究旨在通过智能断点记忆与上下文AI解惑，提供平滑的听读体验。', charCount: 32 },
        ],
      });
    }, 1000);
  };

  return (
    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
      <span className="font-bold text-blue-600 text-lg">VoiceEcho Read</span>
      <button 
        onClick={handleUploadMock}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm shadow transition-colors"
      >
        导入测试课件 (PDF)
      </button>
    </div>
  );
};