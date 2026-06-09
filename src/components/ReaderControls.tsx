// src/components/ReaderControls.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useReaderStore } from '../store/readerStore';
import { useVoiceStore } from '../voice/store/voiceStore';
import { useAiStore } from '../ai/store/aiStore';
import { eventBus } from '../integration/EventBus';
import { audioManager } from '../integration/AudioManager';

interface PlayRequestPayload {
  currentIndex: number;
  speechRate: number;
}

export const ReaderControls: React.FC = () => {
  const { currentDoc, currentIndex, setCurrentIndex, speechRate, setSpeechRate } = useReaderStore();
  const { 
    status, 
    setStatus, 
    isAnnotating, 
    setIsAnnotating, 
    isAsking, 
    setIsAsking, 
    addAnnotation 
  } = useVoiceStore();
  const { askQuestion, clearError } = useAiStore();
  const [recognizedText, setRecognizedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [useMockVoice, setUseMockVoice] = useState(false);
  const [showMockInput, setShowMockInput] = useState(false);
  const [mockInputText, setMockInputText] = useState('');
  const annotationTextRef = useRef('');
  const questionTextRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const isAnnotatingRef = useRef(isAnnotating);
  const isAskingRef = useRef(isAsking);

  useEffect(() => {
    isAnnotatingRef.current = isAnnotating;
    isAskingRef.current = isAsking;
  }, [isAnnotating, isAsking]);

  useEffect(() => {
    const startTts = (payload: PlayRequestPayload) => {
      audioManager.acquire('tts');
      setStatus('speaking');
      console.log(`[TTS Engine] 正在以 ${payload.speechRate} 速度朗读第 ${payload.currentIndex + 1} 段`);

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
      window.speechSynthesis?.pause();
      audioManager.release('tts');
    };

    const resumeTts = () => {
      audioManager.acquire('tts');
      setStatus('speaking');
      window.speechSynthesis?.resume();
    };

    eventBus.on('reader:play-request', startTts);
    eventBus.on('reader:pause-request', stopTts);
    eventBus.on('reader:resume-request', resumeTts);

    return () => {
      eventBus.off('reader:play-request', startTts);
      eventBus.off('reader:pause-request', stopTts);
      eventBus.off('reader:resume-request', resumeTts);
    };
  }, [currentDoc, setStatus, setCurrentIndex]);

  const saveAnnotation = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    const finalAnnotationText = annotationTextRef.current;
    if (currentDoc && finalAnnotationText.trim()) {
      addAnnotation(currentDoc.id, {
        id: `ann-${Date.now()}`,
        docId: currentDoc.id,
        paragraphIndex: currentIndex,
        text: finalAnnotationText.trim(),
        createdAt: Date.now(),
        source: 'voice'
      });
      setRecognizedText(`已保存批注: ${finalAnnotationText.trim()}`);
      setAnnotationText('');
      annotationTextRef.current = '';
    }
    setIsAnnotating(false);
    setStatus('idle');
  }, [currentDoc, currentIndex, addAnnotation, setIsAnnotating, setStatus]);

  const submitQuestion = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    const finalQuestionText = questionTextRef.current;
    if (currentDoc && finalQuestionText.trim()) {
      clearError();
      askQuestion(finalQuestionText.trim(), currentIndex);
      setRecognizedText(`已发送问题: ${finalQuestionText.trim()}`);
      setQuestionText('');
      questionTextRef.current = '';
    }
    setIsAsking(false);
    setStatus('idle');
  }, [currentDoc, currentIndex, askQuestion, clearError, setIsAsking, setStatus]);

  const handleMockVoiceInput = useCallback((text: string) => {
    if (!text.trim()) return;
    
    setMockInputText('');
    setShowMockInput(false);

    if (isAnnotating) {
      const cleanedTranscript = text.trim();
      if (cleanedTranscript.includes('结束') || cleanedTranscript === '结束') {
        saveAnnotation();
        return;
      }
      if (annotationTextRef.current && annotationTextRef.current.trim()) {
        annotationTextRef.current = annotationTextRef.current + ' ' + cleanedTranscript;
      } else {
        annotationTextRef.current = cleanedTranscript;
      }
      setAnnotationText(annotationTextRef.current);
      if (shouldRestartRef.current) {
        setShowMockInput(true);
      }
    } else if (isAsking) {
      const cleanedTranscript = text.trim();
      if (cleanedTranscript.includes('结束') || cleanedTranscript === '结束') {
        submitQuestion();
        return;
      }
      if (questionTextRef.current && questionTextRef.current.trim()) {
        questionTextRef.current = questionTextRef.current + ' ' + cleanedTranscript;
      } else {
        questionTextRef.current = cleanedTranscript;
      }
      setQuestionText(questionTextRef.current);
      if (shouldRestartRef.current) {
        setShowMockInput(true);
      }
    } else {
      setRecognizedText(text);
      const commands = [
        { keyword: '批注', action: () => {
            shouldRestartRef.current = true;
            isAnnotatingRef.current = true;
            setIsAnnotating(true);
            setAnnotationText('');
            annotationTextRef.current = '';
            setRecognizedText('批注模式已开启，请开始说您的批注内容，最后说"结束"来保存');
            setShowMockInput(true);
          }
        },
        { keyword: '提问', action: () => {
            shouldRestartRef.current = true;
            isAskingRef.current = true;
            setIsAsking(true);
            setQuestionText('');
            questionTextRef.current = '';
            setRecognizedText('提问模式已开启，请开始说您的问题，最后说"结束"来提交');
            setShowMockInput(true);
          }
        },
        { keyword: '播放', action: () => eventBus.emit('reader:play-request', { currentIndex, speechRate }) },
        { keyword: '下一段', action: () => setCurrentIndex(currentIndex + 1) },
        { keyword: '上一段', action: () => setCurrentIndex(currentIndex - 1) },
        { keyword: '暂停', action: () => eventBus.emit('reader:pause-request') },
        { keyword: '继续', action: () => eventBus.emit('reader:resume-request') },
        { keyword: '继续播放', action: () => eventBus.emit('reader:resume-request') },
      ];

      let commandFound = false;
      for (const cmd of commands) {
        if (text.includes(cmd.keyword)) {
          cmd.action();
          commandFound = true;
          break;
        }
      }

      if (!commandFound) {
        console.log(`[Mock STT] 未识别的指令: ${text}`);
      }
    }
  }, [isAnnotating, isAsking, currentIndex, speechRate, setCurrentIndex, setIsAnnotating, setIsAsking, saveAnnotation, submitQuestion]);

  const startListening = useCallback(() => {
    const win = window as unknown as {
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    };
    const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;

    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    const wasSpeaking = window.speechSynthesis?.speaking;

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    audioManager.acquire('stt');
    setStatus('listening');
    if (!isAnnotatingRef.current && !isAskingRef.current) {
      setRecognizedText('');
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setRecognizedText(transcript);

      // 批注模式处理
      if (isAnnotatingRef.current) {
        const cleanedTranscript = transcript.trim();
        if (cleanedTranscript.includes('结束') || cleanedTranscript === '结束') {
          shouldRestartRef.current = false;
          recognition.stop();
          saveAnnotation();
          return;
        }
        // 收集批注内容
        if (annotationTextRef.current && annotationTextRef.current.trim()) {
          annotationTextRef.current = annotationTextRef.current + ' ' + cleanedTranscript;
        } else {
          annotationTextRef.current = cleanedTranscript;
        }
        setAnnotationText(annotationTextRef.current);
        shouldRestartRef.current = true;
        recognition.stop();
        return;
      }

      // 提问模式处理
      if (isAskingRef.current) {
        const cleanedTranscript = transcript.trim();
        if (cleanedTranscript.includes('结束') || cleanedTranscript === '结束') {
          shouldRestartRef.current = false;
          recognition.stop();
          submitQuestion();
          return;
        }
        // 收集提问内容
        if (questionTextRef.current && questionTextRef.current.trim()) {
          questionTextRef.current = questionTextRef.current + ' ' + cleanedTranscript;
        } else {
          questionTextRef.current = cleanedTranscript;
        }
        setQuestionText(questionTextRef.current);
        shouldRestartRef.current = true;
        recognition.stop();
        return;
      }

      // 正常命令模式
      const wasPlayingBefore = window.speechSynthesis?.speaking;
      
      const commands = [
        { keyword: '批注', action: () => {
            shouldRestartRef.current = true;
            isAnnotatingRef.current = true;
            setIsAnnotating(true);
            setAnnotationText('');
            annotationTextRef.current = '';
            setRecognizedText('已进入批注模式，请开始说您的批注内容，最后说"结束"来保存');
            recognition.stop();
          }
        },
        { keyword: '提问', action: () => {
            shouldRestartRef.current = true;
            isAskingRef.current = true;
            setIsAsking(true);
            setQuestionText('');
            questionTextRef.current = '';
            setRecognizedText('已进入提问模式，请开始说您的问题，最后说"结束"来提交');
            recognition.stop();
          }
        },
        { keyword: '播放', action: () => eventBus.emit('reader:play-request', { currentIndex, speechRate }) },
        { keyword: '下一段', action: () => setCurrentIndex(currentIndex + 1) },
        { keyword: '上一段', action: () => setCurrentIndex(currentIndex - 1) },
        { keyword: '暂停', action: () => eventBus.emit('reader:pause-request') },
        { keyword: '继续', action: () => eventBus.emit('reader:resume-request') },
        { keyword: '继续播放', action: () => eventBus.emit('reader:resume-request') },
      ];

      let commandFound = false;
      for (const cmd of commands) {
        if (transcript.includes(cmd.keyword)) {
          cmd.action();
          commandFound = true;
          break;
        }
      }

      if (!commandFound) {
        console.log(`[STT] 未识别的指令: ${transcript}`);
        setRecognizedText(`未识别指令: ${transcript}`);
        if (wasPlayingBefore) {
          setTimeout(() => {
            eventBus.emit('reader:resume-request');
          }, 100);
        }
      }

      recognition.stop();
    };

    recognition.onend = () => {
      audioManager.release('stt');
      if (shouldRestartRef.current && (isAnnotatingRef.current || isAskingRef.current)) {
        // 在批注或提问模式下自动重启监听
        setTimeout(() => {
          if (shouldRestartRef.current) {
            startListening();
          }
        }, 100);
      } else {
        setStatus('idle');
      }
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('[STT] 语音识别错误:', event.error);
      setStatus('idle');
      setIsAnnotating(false);
      setIsAsking(false);
      setAnnotationText('');
      setQuestionText('');
      annotationTextRef.current = '';
      questionTextRef.current = '';
      shouldRestartRef.current = false;
      audioManager.release('stt');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isAnnotating, isAsking, currentIndex, speechRate, setStatus, setIsAnnotating, setIsAsking, saveAnnotation, submitQuestion]);

  const cancelAnnotation = () => {
    shouldRestartRef.current = false;
    const currentRecognition = recognitionRef.current;
    recognitionRef.current = null;
    currentRecognition?.stop();
    setIsAnnotating(false);
    setAnnotationText('');
    annotationTextRef.current = '';
    setRecognizedText('已取消批注');
    setStatus('idle');
  };

  const finishAnnotation = () => {
    shouldRestartRef.current = false;
    const currentRecognition = recognitionRef.current;
    recognitionRef.current = null;
    currentRecognition?.stop();
    if (annotationTextRef.current.trim()) {
      saveAnnotation();
    } else {
      setIsAnnotating(false);
      setStatus('idle');
    }
  };

  const cancelQuestion = () => {
    shouldRestartRef.current = false;
    const currentRecognition = recognitionRef.current;
    recognitionRef.current = null;
    currentRecognition?.stop();
    setIsAsking(false);
    setQuestionText('');
    questionTextRef.current = '';
    setRecognizedText('已取消提问');
    setStatus('idle');
  };

  const finishQuestion = () => {
    shouldRestartRef.current = false;
    const currentRecognition = recognitionRef.current;
    recognitionRef.current = null;
    currentRecognition?.stop();
    if (questionTextRef.current.trim()) {
      submitQuestion();
    } else {
      setIsAsking(false);
      setStatus('idle');
    }
  };

  useEffect(() => {
    if ((isAnnotating || isAsking) && shouldRestartRef.current && status !== 'listening') {
      startListening();
    }
  }, [isAnnotating, isAsking, status, startListening]);

  const handlePlayRequest = () => {
    eventBus.emit('reader:play-request', { currentIndex, speechRate });
  };

  const handlePauseRequest = () => {
    eventBus.emit('reader:pause-request');
  };

  const handleResumeRequest = () => {
    eventBus.emit('reader:resume-request');
  };

  const handlePlayPauseToggle = () => {
    if (status === 'speaking') {
      handlePauseRequest();
    } else {
      handlePlayRequest();
    }
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
      gap: '24px',
      position: 'relative'
    }}>
      {/* 语音控制面板 */}
      {showVoicePanel && (isAnnotating || isAsking) && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          width: '350px',
          zIndex: 100,
          border: '1px solid #e2e8f0'
        }}>
          {isAnnotating ? (
            <div>
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: '0 0 8px 0'
                }}>
                  💬 正在收集您的批注内容，系统会持续录音，请开始说，最后说"结束"来保存
                </p>
                {annotationText && (
                  <div>
                    <p style={{
                      fontSize: '11px',
                      color: '#78716c',
                      margin: '0 0 4px 0'
                    }}>
                      已记录:
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#78350f',
                      margin: 0
                    }}>
                      {annotationText}
                    </p>
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={startListening}
                  disabled={status === 'listening'}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: status === 'listening' ? '#dc2626' : '#f59e0b',
                    color: '#ffffff',
                    cursor: status === 'listening' ? 'wait' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'listening' ? '🔴 正在听...' : '🎤 开始/继续'}
                </button>
                <button
                  onClick={finishAnnotation}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  保存
                </button>
                <button
                  onClick={cancelAnnotation}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                backgroundColor: '#ede9fe',
                border: '1px solid #c4b5fd',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#6d28d9',
                  margin: '0 0 8px 0'
                }}>
                  ❓ 正在收集您的问题，系统会持续录音，请开始说，最后说"结束"来提交
                </p>
                {questionText && (
                  <div>
                    <p style={{
                      fontSize: '11px',
                      color: '#7c3aed',
                      margin: '0 0 4px 0'
                    }}>
                      已记录:
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#5b21b6',
                      margin: 0
                    }}>
                      {questionText}
                    </p>
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={startListening}
                  disabled={status === 'listening'}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: status === 'listening' ? '#dc2626' : '#8b5cf6',
                    color: '#ffffff',
                    cursor: status === 'listening' ? 'wait' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'listening' ? '🔴 正在听...' : '🎤 开始/继续'}
                </button>
                <button
                  onClick={finishQuestion}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  提交
                </button>
                <button
                  onClick={cancelQuestion}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
          ⏮️
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
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={handleResumeRequest}
          disabled={isPlaying}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isPlaying ? '#f1f5f9' : '#f8fafc',
            color: isPlaying ? '#94a3b8' : '#64748b',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          ▶️
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
          ⏭️
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
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '1px',
          height: '40px',
          backgroundColor: '#e2e8f0'
        }} />

        {/* 状态指示器 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginRight: '8px'
        }}>
          {isAnnotating && (
            <span style={{
              padding: '4px 8px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              animation: 'pulse 1.5s infinite'
            }}>
              📝 批注中
            </span>
          )}
          {isAsking && (
            <span style={{
              padding: '4px 8px',
              backgroundColor: '#ede9fe',
              color: '#6d28d9',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              animation: 'pulse 1.5s infinite'
            }}>
              ❓ 提问中
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (isAnnotating) {
              // 如果在批注模式，点击按钮取消批注
              cancelAnnotation();
            } else if (isAsking) {
              // 如果在提问模式，点击按钮取消提问
              cancelQuestion();
            } else if (isListening) {
              recognitionRef.current?.stop();
              setStatus('idle');
              setRecognizedText('已停止语音监听');
            } else {
              if (useMockVoice) {
                setShowMockInput(true);
              } else {
                startListening();
              }
            }
          }}
          disabled={false}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid #2563eb',
            backgroundColor: isListening ? '#dc2626' : '#ffffff',
            color: isListening ? '#ffffff' : '#2563eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.2s',
            boxShadow: isListening ? '0 0 20px rgba(220, 38, 38, 0.6)' : '0 4px 12px rgba(37, 99, 235, 0.15)'
          }}
        >
          {isListening ? '🎙️' : '🎤'}
        </button>

        {/* 模拟语音开关 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          backgroundColor: useMockVoice ? '#fef3c7' : '#f1f5f9',
          borderRadius: '20px',
          border: '1px solid',
          borderColor: useMockVoice ? '#fde68a' : '#e2e8f0'
        }}>
          <span style={{ fontSize: '11px', color: useMockVoice ? '#92400e' : '#64748b' }}>
            {useMockVoice ? '🔧 模拟' : '🎤 真实'}
          </span>
          <button
            onClick={() => setUseMockVoice(!useMockVoice)}
            style={{
              width: '24px',
              height: '14px',
              borderRadius: '7px',
              backgroundColor: useMockVoice ? '#f59e0b' : '#cbd5e1',
              position: 'relative',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '1px',
              left: useMockVoice ? '11px' : '1px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        {/* 模拟输入框 */}
        {showMockInput && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: '24px',
            marginBottom: '8px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '12px',
            width: '320px',
            zIndex: 100,
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {isAnnotating ? '📝 请输入批注内容:' : isAsking ? '❓ 请输入问题:' : '🎤 请输入语音指令:'}
            </p>
            <input
              type="text"
              value={mockInputText}
              onChange={(e) => setMockInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleMockVoiceInput(mockInputText);
                }
              }}
              placeholder="输入文字模拟语音..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '8px'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowMockInput(false);
                  if (isAnnotating) {
                    cancelAnnotation();
                  } else if (isAsking) {
                    cancelQuestion();
                  }
                }}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleMockVoiceInput(mockInputText)}
                disabled={!mockInputText.trim()}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  backgroundColor: mockInputText.trim() ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: mockInputText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                发送
              </button>
            </div>
          </div>
        )}

        {/* 识别结果提示 */}
        {recognizedText && !isAnnotating && !isAsking && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            maxWidth: '250px'
          }}>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              margin: '0 0 2px 0'
            }}>
              识别结果:
            </p>
            <p style={{
              fontSize: '13px',
              color: '#2563eb',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {recognizedText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};