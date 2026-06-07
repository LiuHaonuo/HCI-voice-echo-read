// src/components/ParagraphList.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import { useVoiceStore } from '../voice/store/voiceStore';
import { ParagraphAnnotation } from '../voice/components/ParagraphAnnotation';

export const ParagraphList: React.FC = () => {
  const currentDoc = useReaderStore((state) => state.currentDoc);
  const currentIndex = useReaderStore((state) => state.currentIndex);
  const setCurrentIndex = useReaderStore((state) => state.setCurrentIndex);
  const { annotations, loadAnnotations } = useVoiceStore();

  const activeRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // 加载文档批注
  useEffect(() => {
    if (currentDoc) {
      loadAnnotations(currentDoc.id);
    }
  }, [currentDoc?.id, loadAnnotations]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  if (!currentDoc || currentDoc.paragraphs.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        height: '100%',
        backgroundColor: '#f8fafc'
      }}>
        <span style={{ fontSize: '48px', marginBottom: '16px' }}>📁</span>
        <p style={{ textAlign: 'center', fontSize: '16px', color: '#64748b', margin: 0, fontWeight: '500' }}>
          暂无活动文档
        </p>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginTop: '8px', margin: '8px 0 0 0' }}>
          请在左侧栏导入文档开始阅读
        </p>
      </div>
    );
  }

  const getParagraphAnnotations = (index: number) => {
    if (!currentDoc) return [];
    return annotations[currentDoc.id]?.filter(a => a.paragraphIndex === index) || [];
  };

  const toggleAnnotation = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      backgroundColor: '#f8fafc',
      display: 'block'
    }}>
      {currentDoc.paragraphs.map((p, idx) => {
        const isCurrent = idx === currentIndex;
        const paragraphAnnotations = getParagraphAnnotations(idx);
        const hasAnnotations = paragraphAnnotations.length > 0;
        const isExpanded = expandedIndex === idx;

        return (
          <div
            key={p.id || `p-${idx}`}
            ref={isCurrent ? activeRef : null}
            style={{
              backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
              border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 16px 12px 16px',
              marginBottom: '12px',
              cursor: 'pointer',
              boxShadow: isCurrent ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'block',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div 
              onClick={() => setCurrentIndex && setCurrentIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <span
                style={{
                  backgroundColor: isCurrent ? '#2563eb' : '#f1f5f9',
                  color: isCurrent ? '#ffffff' : '#94a3b8',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  minWidth: '32px',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: isCurrent ? '#1e40af' : '#374151',
                  fontSize: '15px',
                  margin: 0,
                  lineHeight: '1.7'
                }}>
                  {p.text}
                </p>
              </div>

              {/* 右侧操作区 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '8px',
                flexShrink: 0,
                minWidth: '80px'
              }}>
                {/* 批注提示 */}
                {hasAnnotations && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#92400e',
                    fontWeight: '500'
                  }}>
                    <span>📝</span>
                    <span>{paragraphAnnotations.length}</span>
                  </div>
                )}

                {/* 展开/收起批注按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAnnotation(idx);
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: 'none',
                    backgroundColor: isExpanded ? '#e2e8f0' : 'transparent',
                    color: '#64748b',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* 批注区域 */}
            {isExpanded && currentDoc && (
              <ParagraphAnnotation
                docId={currentDoc.id}
                paragraphIndex={idx}
                annotations={paragraphAnnotations}
                onClose={() => setExpandedIndex(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};