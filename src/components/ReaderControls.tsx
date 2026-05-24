// src/components/ReaderControls.tsx
import React from 'react';
import { useReaderStore } from '../store/readerStore';
import { eventBus } from '../integration/EventBus';

export const ReaderControls: React.FC = () => {
  const { currentDoc, currentIndex, setCurrentIndex, speechRate, setSpeechRate } = useReaderStore();

  const handlePlayRequest = () => {
    eventBus.emit('reader:play-request', { currentIndex, speechRate });
  };

  const handlePauseRequest = () => {
    eventBus.emit('reader:pause-request');
  };

  if (!currentDoc) return null;

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30"
        >
          ⏮️
        </button>
        <button onClick={handlePlayRequest} className="p-2 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow">
          ▶️
        </button>
        <button onClick={handlePauseRequest} className="p-2 bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow">
          ⏸️
        </button>
        <button 
          disabled={currentIndex === currentDoc.paragraphs.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30"
        >
          ⏭️
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">语速: {speechRate}x</span>
        <input 
          type="range" min="0.75" max="1.5" step="0.25" 
          value={speechRate} 
          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};