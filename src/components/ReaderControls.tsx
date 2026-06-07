// src/components/ReaderControls.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';
import { useVoiceStore } from '../voice/store/voiceStore';
import { eventBus } from '../integration/EventBus';
import { audioManager } from '../integration/AudioManager';

interface PlayRequestPayload {
  currentIndex: number;
  speechRate: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionError {
  error: string;
}

export const ReaderControls: React.FC = () => {
  const { currentDoc, currentIndex, setCurrentIndex, speechRate, setSpeechRate } = useReaderStore();
  const { status, setStatus } = useVoiceStore();
  const [showVoiceTips, setShowVoiceTips] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    const startTts = (payload: PlayRequestPayload) => {
      audioManager.acquire('tts');
      setStatus('speaking');
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const latestDoc = useReaderStore.getState().currentDoc;
        const text = latestDoc?.paragraphs[payload.currentIndex]?.text || '';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = payload.speechRate;
        utterance.onend = () => {
          setStatus('idle');
          audioManager.release('tts');
          if (latestDoc && payload.currentIndex < latestDoc.paragraphs.length - 1) {
            const nextIndex = payload.currentIndex + 1;
            useReaderStore.getState().setCurrentIndex(nextIndex);
            setTimeout(() => {
              eventBus.emit('reader:play-request', { 
                currentIndex: nextIndex, 
                speechRate: payload.speechRate 
              });
            }, 300);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    };

    const stopTts = () => {
      setStatus('idle');
      window.speechSynthesis?.cancel();
      audioManager.release('tts');
    };

    eventBus.on('reader:play-request', startTts);
    eventBus.on('reader:pause-request', stopTts);

    return () => {
      eventBus.off('reader:play-request', startTts);
      eventBus.off('reader:pause-request', stopTts);
    };
  }, [setStatus]);

  const handlePlayRequest = () => {
    eventBus.emit('reader:play-request', { currentIndex, speechRate });
  };

  const handlePauseRequest = () => {
    eventBus.emit('reader:pause-request');
  };

  const handlePlayPauseToggle = () => {
    if (status === 'speaking') {
      handlePauseRequest();
    } else {
      handlePlayRequest();
    }
  };

  const handleVoiceCommand = useCallback((transcript: string, idx: number, rate: number) => {
    setRecognizedText(transcript);
    
    if (transcript.includes('播放')) {
      eventBus.emit('reader:play-request', { currentIndex: idx, speechRate: rate });
    }
    if (transcript.includes('下一段')) {
      setCurrentIndex(idx + 1);
    }
    if (transcript.includes('上一段')) {
      setCurrentIndex(idx - 1);
    }
    if (transcript.includes('暂停')) {
      eventBus.emit('reader:pause-request');
    }
  }, [setCurrentIndex]);

  const startListening = () => {
    const win = window as unknown as { 
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    };
    const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;

    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    audioManager.acquire('stt');
    setStatus('listening');
    setRecognizedText('');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setRecognizedText(transcript);
      handleVoiceCommand(transcript, currentIndex, speechRate);
    };

    recognition.onend = () => {
      setStatus('idle');
      audioManager.release('stt');
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('[STT] 语音识别错误:', event.error);
      setStatus('idle');
      audioManager.release('stt');
    };

    recognition.start();
  };

  if (!currentDoc) return null;

  const isPlaying = status === 'speaking';
  const isListening = status === 'listening';

  return (
    <div style={{
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px'
    }}>
      {/* 左侧：播放控制 + 语速调节 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <button 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: currentIndex === 0 ? '#f1f5f9' : '#f8fafc',
            color: currentIndex === 0 ? '#94a3b8' : '#64748b',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s'
          }}
        >
          ⏮
        </button>

        <button 
          onClick={handlePlayPauseToggle}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isPlaying ? '#dc2626' : '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button 
          disabled={currentIndex === currentDoc.paragraphs.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: currentIndex === currentDoc.paragraphs.length - 1 ? '#f1f5f9' : '#f8fafc',
            color: currentIndex === currentDoc.paragraphs.length - 1 ? '#94a3b8' : '#64748b',
            cursor: currentIndex === currentDoc.paragraphs.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s'
          }}
        >
          ⏭
        </button>

        {/* 语速调节 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingLeft: '24px',
          borderLeft: '1px solid #e2e8f0'
        }}>
          <span style={{
            fontSize: '12px',
            color: '#64748b'
          }}>
            语速
          </span>
          <input 
            type="range" 
            min="0.75" 
            max="1.5" 
            step="0.25" 
            value={speechRate} 
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            style={{
              width: '100px',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          />
          <span style={{
            fontSize: '12px',
            color: '#2563eb',
            fontWeight: '500',
            minWidth: '36px'
          }}>
            {speechRate}x
          </span>
        </div>
      </div>

      {/* 右侧：语音控制 */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '1px',
          height: '40px',
          backgroundColor: '#e2e8f0'
        }} />

        <button
          onClick={startListening}
          disabled={isListening}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid #2563eb',
            backgroundColor: '#ffffff',
            color: '#2563eb',
            cursor: isListening ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.2s',
            boxShadow: isListening ? '0 0 20px rgba(220, 38, 38, 0.6)' : '0 4px 12px rgba(37, 99, 235, 0.15)'
          }}
        >
          {isListening ? '🔴' : '🎤'}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowVoiceTips(!showVoiceTips)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: showVoiceTips ? '#2563eb' : '#f1f5f9',
              color: showVoiceTips ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            i
          </button>

          {showVoiceTips && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '8px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              width: '220px',
              zIndex: 100,
              border: '1px solid #e2e8f0'
            }}>
              {recognizedText && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    fontSize: '11px',
                    color: '#64748b',
                    margin: '0 0 4px 0'
                  }}>
                    最近识别:
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#2563eb',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {recognizedText}
                  </p>
                </div>
              )}

              <div>
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  可用语音命令:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px'
                }}>
                  {['播放', '暂停', '上一段', '下一段'].map((cmd) => (
                    <span
                      key={cmd}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#374151',
                        textAlign: 'center'
                      }}
                    >
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '-6px',
                right: '8px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #e2e8f0'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                right: '8px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #ffffff'
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};