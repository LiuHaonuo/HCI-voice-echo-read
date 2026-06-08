import React, { useState, useEffect } from 'react';
import { useReaderStore } from '../../store/readerStore';
import { useAiStore } from '../store/aiStore';
import { promptBuilder } from '../utils/promptBuilder';

interface AiSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ isCollapsed, onToggle }) => {
  const { currentDoc, currentIndex } = useReaderStore();
  const {
    qaHistory,
    isLoading,
    error,
    askQuestion,
    clearError,
    currentModel,
    availableModels,
    switchModel,
    initializeService
  } = useAiStore();
  const [customQuestion, setCustomQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const quickQuestions = promptBuilder.buildQuickQuestionPrompts();

  const handleQuickQuestion = (question: string) => {
    if (!currentDoc) return;
    clearError();
    askQuestion(question, currentIndex);
  };

  const handleCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoc || !customQuestion.trim()) return;
    clearError();
    askQuestion(customQuestion, currentIndex);
    setCustomQuestion('');
  };

  const filteredHistory = qaHistory.filter(qa => qa.paragraphIndex === currentIndex);

  const handleVoiceInput = () => {
    setIsRecording(true);
    setTimeout(() => {
      const mockNote = window.prompt('🎤 语音转写，请输入问题（模拟）:', '这是什么意思？');
      if (mockNote) {
        setRecognizedText(mockNote);
        setCustomQuestion(mockNote);
        if (currentDoc) {
          clearError();
          askQuestion(mockNote, currentIndex);
        }
      }
      setIsRecording(false);
    }, 500);
  };

  if (!currentDoc) return null;

  if (isCollapsed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '16px',
        gap: '12px',
        backgroundColor: '#f8fafc',
        borderLeft: '1px solid #e2e8f0'
      }}>
        <button
          onClick={onToggle}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px 0 0 8px',
            border: 'none',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
          title="展开 AI 助手"
        >
          ◀
        </button>

        <div style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '13px',
          color: '#94a3b8',
          fontWeight: '500',
          letterSpacing: '2px'
        }}>
          AI 助手
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '280px',
      height: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0',
      transition: 'width 0.3s ease'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            🤖 AI 助手
          </span>
          <select
            value={currentModel}
            onChange={(e) => switchModel(e.target.value)}
            style={{
              fontSize: '11px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '2px 6px',
              backgroundColor: '#f8fafc',
              color: '#64748b'
            }}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onToggle}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
          title="收起 AI 助手"
        >
          ▶
        </button>
      </div>

      <div style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: '12px'
      }}>
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#dc2626',
                margin: '0 0 4px 0'
              }}>
                ⚠️ 出错了
              </p>
              <p style={{
                fontSize: '11px',
                color: '#ef4444',
                margin: 0
              }}>
                {error}
              </p>
            </div>
            <button
              onClick={clearError}
              style={{
                fontSize: '11px',
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              关闭
            </button>
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px'
        }}>
          {filteredHistory.map((qa) => (
            <div key={qa.id} style={{
              padding: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#2563eb',
                margin: '0 0 6px 0'
              }}>
                {qa.paragraphIndex !== currentIndex && `[段落 ${qa.paragraphIndex + 1}] `}
                问: {qa.question}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {qa.answer}
              </p>
            </div>
          ))}

          {isLoading && (
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '16px 0'
            }}>
              {currentModel} 正在思考中...
            </p>
          )}

          {filteredHistory.length === 0 && !isLoading && (
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '24px 0'
            }}>
              选择一个问题，让 AI 为你解答
            </p>
          )}
        </div>

        {recognizedText && (
          <div style={{
            padding: '8px 10px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            fontSize: '11px'
          }}>
            <span style={{ color: '#64748b' }}>最近识别: </span>
            <span style={{ color: '#2563eb', fontWeight: '500' }}>{recognizedText}</span>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          flexShrink: 0
        }}>
          {quickQuestions.map((qq, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(qq.question)}
              disabled={isLoading}
              style={{
                fontSize: '11px',
                padding: '8px 4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                color: '#475569',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {qq.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomQuestion} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="输入你的问题..."
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isRecording}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '2px solid #2563eb',
                backgroundColor: isRecording ? '#dc2626' : '#ffffff',
                color: isRecording ? '#ffffff' : '#2563eb',
                cursor: isRecording ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title="语音输入"
            >
              {isRecording ? '🎙️' : '🎤'}
            </button>

            <button
              type="submit"
              disabled={isLoading || !customQuestion.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isLoading || !customQuestion.trim() ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                cursor: isLoading || !customQuestion.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s'
              }}
              title="发送"
            >
              →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
