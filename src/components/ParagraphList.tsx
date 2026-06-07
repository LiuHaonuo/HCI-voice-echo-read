// src/components/ParagraphList.tsx
import React, { useEffect, useRef } from 'react';
import { useReaderStore } from '../store/readerStore';

export const ParagraphList: React.FC = () => {
  const currentDoc = useReaderStore((state) => state.currentDoc);
  const currentIndex = useReaderStore((state) => state.currentIndex);
  const setCurrentIndex = useReaderStore((state) => state.setCurrentIndex);

  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  let paragraphs = currentDoc?.paragraphs || [];

  if (paragraphs.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', height: '100%' }}>
        <span style={{ fontSize: '36px', marginBottom: '8px' }}>📁</span>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', margin: 0 }}>暂无活动文档</p>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>请点击右上角导入课件</p>
      </div>
    );
  }

  return (
    // ⚡ 降维打击核心：用原生行内样式限死高度，在内部强制撑开纵向滚动条
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      backgroundColor: '#f1f5f9',
      display: 'block',
      height: 'calc(100% - 10px)' // 保留微弱间距，防止触底
    }}>
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
