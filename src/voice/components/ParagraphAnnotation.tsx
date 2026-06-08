import React, { useState, useRef, useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { ParagraphAnnotation as AnnotationType } from '../../types/voice';

interface ParagraphAnnotationProps {
  docId: string;
  paragraphIndex: number;
  annotations: AnnotationType[];
  onClose: () => void;
}

export const ParagraphAnnotation: React.FC<ParagraphAnnotationProps> = ({
  docId,
  paragraphIndex,
  annotations,
  onClose
}) => {
  const { addAnnotation, updateAnnotation, deleteAnnotation } = useVoiceStore();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAddManualNote = () => {
    if (!inputText.trim()) return;

    addAnnotation(docId, {
      id: `ann-${Date.now()}`,
      docId,
      paragraphIndex,
      text: inputText.trim(),
      createdAt: Date.now(),
      source: 'manual'
    });

    setInputText('');
  };

  const handleRecordNoteMock = () => {
    setIsRecording(true);
    setTimeout(() => {
      const mockNote = window.prompt('🎤 语音转写，请输入批注内容（模拟）:', '这部分需要重点复习。');
      if (mockNote) {
        addAnnotation(docId, {
          id: `ann-${Date.now()}`,
          docId,
          paragraphIndex,
          text: mockNote,
          createdAt: Date.now(),
          source: 'voice'
        });
      }
      setIsRecording(false);
    }, 500);
  };

  const handleStartEdit = (ann: AnnotationType) => {
    setEditingId(ann.id);
    setEditText(ann.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      updateAnnotation(docId, editingId, editText.trim());
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddManualNote();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div style={{
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #e2e8f0'
    }}>
      {annotations.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {annotations.map((ann) => (
            <div
              key={ann.id}
              style={{
                padding: '10px 12px',
                backgroundColor: ann.source === 'voice' ? '#fff7ed' : '#eff6ff',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: ann.source === 'voice' ? '#fed7aa' : '#bfdbfe'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '12px' }}>
                    {ann.source === 'voice' ? '🎤' : '✍️'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>
                    {ann.updatedAt ? `${formatTime(ann.createdAt)} (已编辑)` : formatTime(ann.createdAt)}
                  </span>
                </div>

                {editingId !== ann.id && (
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => handleStartEdit(ann)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteAnnotation(docId, ann.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {editingId === ann.id ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <textarea
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #93c5fd',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'none',
                      minHeight: '50px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '6px'
                  }}>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '4px 10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        color: '#64748b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        backgroundColor: editText.trim() ? '#2563eb' : '#94a3b8',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: editText.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  onClick={() => handleStartEdit(ann)}
                  style={{
                    fontSize: '13px',
                    color: '#374151',
                    margin: 0,
                    lineHeight: '1.5',
                    cursor: 'pointer',
                    padding: '4px 0'
                  }}
                  title="点击编辑"
                >
                  {ann.text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写下你的批注..."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            resize: 'none',
            minHeight: '60px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            收起
          </button>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleRecordNoteMock}
              disabled={isRecording}
              style={{
                padding: '8px 14px',
                border: 'none',
                backgroundColor: isRecording ? '#f59e0b' : '#f97316',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: isRecording ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{isRecording ? '⏳' : '🎤'}</span>
              <span>{isRecording ? '识别中...' : '语音输入'}</span>
            </button>
            <button
              onClick={handleAddManualNote}
              disabled={!inputText.trim()}
              style={{
                padding: '8px 14px',
                border: 'none',
                backgroundColor: !inputText.trim() ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>✍️</span>
              <span>添加批注</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
