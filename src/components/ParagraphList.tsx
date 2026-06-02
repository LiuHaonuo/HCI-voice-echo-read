// src/components/ParagraphList.tsx
import React, { useEffect, useRef } from 'react';
import { useReaderStore } from '../store/readerStore';

export const ParagraphList: React.FC = () => {
  // ⚡ 核心改动：使用极度灵敏的精准原子订阅，只要 currentDoc 变了，全家立刻强制刷新
  const currentDoc = useReaderStore((state) => state.currentDoc);
  const currentIndex = useReaderStore((state) => state.currentIndex);
  const setCurrentIndex = useReaderStore((state) => state.setCurrentIndex);

  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  // 1. 保底机制：从浏览器原生的全局存储里去看看有没有被 Store 漏掉的文件（绝招）
  let paragraphs = currentDoc?.paragraphs || [];
  let fileName = currentDoc?.fileName || '';

  // 2. 状态检查
  if (paragraphs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[300px]">
        <span className="text-4xl mb-2">📁</span>
        <p className="text-center text-sm text-gray-500">暂无活动文档</p>
        <p className="text-center text-xs text-gray-400 mt-1">请点击右上角导入课件</p>
        <div className="text-[10px] text-gray-300 mt-4 max-w-xs truncate">
          调试诊断: 未检测到任何文件数据
        </div>
      </div>
    );
  }

  // 3. 只要数组里有东西，直接吐出精致圆角卡片
  return (
    <div className="flex-1 overflow-y-auto p-6 h-full min-h-[500px]" style={{ backgroundColor: '#f1f5f9', display: 'block' }}>
      {paragraphs.map((p: any, idx: number) => {
        const isCurrent = idx === currentIndex;

        return (
          <div
            key={p.id || `p-${idx}`}
            ref={isCurrent ? activeRef : null}
            onClick={() => setCurrentIndex && setCurrentIndex(idx)}
            style={{ 
              backgroundColor: '#ffffff', 
              border: isCurrent ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              display: 'block'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span 
                style={{ 
                  backgroundColor: isCurrent ? '#3b82f6' : '#f1f5f9', 
                  color: isCurrent ? '#ffffff' : '#94a3b8',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  marginRight: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {idx + 1}
              </span>
              <p style={{ color: isCurrent ? '#0f172a' : '#334155', fontSize: '16px', margin: 0, flex: 1, lineHeight: '1.6' }}>
                {p.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};