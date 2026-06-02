// src/components/DocumentUploader.tsx
import React, { useRef } from 'react';
import { useReaderStore } from '../store/readerStore';

export const DocumentUploader: React.FC = () => {
  const { uploadAndParseFile, parseStatus, currentDoc } = useReaderStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadAndParseFile(files[0]);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="font-bold text-blue-600 text-lg tracking-wide">VoiceEcho Read</span>
        {currentDoc && (
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium">
            📄 当前文件：{currentDoc.fileName} ({currentDoc.paragraphs.length} 段)
          </span>
        )}
      </div>
      
      <div>
        {/* 隐藏的原生输入框 */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx"
          className="hidden"
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={parseStatus === 'parsing'}
          className={`px-4 py-2 text-white rounded-md text-sm shadow transition-all ${
            parseStatus === 'parsing' 
              ? 'bg-amber-500 cursor-wait' 
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
          }`}
        >
          {parseStatus === 'parsing' ? '⚡ 正在提取文本段落...' : '📂 导入课件 (PDF/DOCX/TXT)'}
        </button>
      </div>
    </div>
  );
};