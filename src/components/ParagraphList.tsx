// src/components/ParagraphList.tsx
import React, { useEffect, useRef } from 'react';
import { useReaderStore } from '../store/readerStore';
import { useVoiceStore } from '../voice/store/voiceStore';

export const ParagraphList: React.FC = () => {
  const { currentDoc, currentIndex, setCurrentIndex } = useReaderStore();
  const { annotations } = useVoiceStore();
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  if (!currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
        <p className="text-center">暂无活动文档，请点击右上角导入测试课件</p>
      </div>
    );
  }

  const currentAnns = annotations[currentDoc.id] || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
      {currentDoc.paragraphs.map((p, idx) => {
        const isCurrent = idx === currentIndex;
        const hasAnn = currentAnns.some(a => a.paragraphIndex === idx);

        return (
          <div
            key={p.id}
            ref={isCurrent ? activeRef : null}
            onClick={() => setCurrentIndex(idx)}
            className={`p-4 rounded-lg border cursor-pointer transition-all relative ${
              isCurrent 
                ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-300' 
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start">
              <span className="text-xs font-mono text-gray-400 mr-3 mt-1">§{p.index + 1}</span>
              <p className={`text-base leading-relaxed ${isCurrent ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {p.text}
              </p>
            </div>
            {hasAnn && (
              <span className="absolute bottom-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};