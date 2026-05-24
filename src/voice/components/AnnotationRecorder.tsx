// src/voice/components/AnnotationRecorder.tsx
import React from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useReaderStore } from '../../store/readerStore';

export const AnnotationRecorder: React.FC = () => {
  const { currentDoc, currentIndex } = useReaderStore();
  const { addAnnotation, annotations } = useVoiceStore();

  const handleRecordNoteMock = () => {
    if (!currentDoc) return;
    const mockNote = window.prompt("模拟语音转写，请输入批注内容:", "这部分需要跟第三章的内容交叉对比。");
    if (mockNote) {
      addAnnotation(currentDoc.id, {
        id: `ann-${Date.now()}`,
        docId: currentDoc.id,
        paragraphIndex: currentIndex,
        text: mockNote,
        createdAt: Date.now(),
        source: 'voice'
      });
    }
  };

  if (!currentDoc) return null;
  const currentAnns = annotations[currentDoc.id]?.filter(a => a.paragraphIndex === currentIndex) || [];

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm text-gray-700">📝 当前段落批注</span>
        <button onClick={handleRecordNoteMock} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors">
          🎤 记语音笔记
        </button>
      </div>
      
      {currentAnns.length === 0 ? (
        <p className="text-xs text-gray-400 italic">当前段落尚无批注</p>
      ) : (
        <div className="space-y-1.5">
          {currentAnns.map(ann => (
            <div key={ann.id} className="bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-900">
              {ann.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};