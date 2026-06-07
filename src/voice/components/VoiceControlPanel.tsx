// src/voice/components/VoiceControlPanel.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useReaderStore } from '../../store/readerStore';
import { useAiStore } from '../../ai/store/aiStore';
import { eventBus } from '../../integration/EventBus';
import { audioManager } from '../../integration/AudioManager';

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

export const VoiceControlPanel: React.FC = () => {
  const { status, setStatus, isAnnotating, setIsAnnotating, isAsking, setIsAsking, addAnnotation } = useVoiceStore();
  const { currentIndex, currentDoc, setCurrentIndex, speechRate } = useReaderStore();
  const { askQuestion, clearError } = useAiStore();
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [annotationText, setAnnotationText] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const annotationTextRef = useRef<string>('');
  const questionTextRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    const startTts = (payload: PlayRequestPayload) => {
      audioManager.acquire('tts');
      setStatus('speaking');
      console.log(`[TTS Engine] 正在以 ${payload.speechRate} 速度朗读第 ${payload.currentIndex + 1} 段`);
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = currentDoc?.paragraphs[payload.currentIndex]?.text || '';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = payload.speechRate;
        utterance.onend = () => {
          setStatus('idle');
          audioManager.release('tts');
          if (currentDoc && payload.currentIndex < currentDoc.paragraphs.length - 1) {
            setCurrentIndex(payload.currentIndex + 1);
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    audioManager.acquire('stt');
    setStatus('listening');
    if (!isAnnotating && !isAsking) {
      setRecognizedText('');
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (!isAnnotating && !isAsking) {
        setRecognizedText(transcript);
      }
      
      if (isAnnotating) {
        const cleanedTranscript = transcript.trim();
        
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
      } else if (isAsking) {
        const cleanedTranscript = transcript.trim();
        
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
      } else {
        const commands = [
          { keyword: '备注', action: () => {
              shouldRestartRef.current = true;
              setIsAnnotating(true);
              setAnnotationText('');
              annotationTextRef.current = '';
              setRecognizedText('备注模式已开启，请开始说您的备注内容，最后说"结束"来保存');
            }
          },
          { keyword: '提问', action: () => {
              shouldRestartRef.current = true;
              setIsAsking(true);
              setQuestionText('');
              questionTextRef.current = '';
              setRecognizedText('提问模式已开启，请开始说您的问题，最后说"结束"来提交');
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
          if (wasSpeaking) {
            eventBus.emit('reader:resume-request');
          }
        }
      }
    };

    recognition.onend = () => {
      audioManager.release('stt');
      if (!isAnnotating && !isAsking) {
        setStatus('idle');
      } else if (shouldRestartRef.current) {
        setTimeout(() => {
          startListening();
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
    recognitionRef.current?.stop();
    setIsAnnotating(false);
    setAnnotationText('');
    annotationTextRef.current = '';
    setRecognizedText('已取消备注');
    setStatus('idle');
  };

  const finishAnnotation = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    if (annotationTextRef.current.trim()) {
      saveAnnotation();
    } else {
      setIsAnnotating(false);
      setStatus('idle');
    }
  };

  const cancelQuestion = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setIsAsking(false);
    setQuestionText('');
    questionTextRef.current = '';
    setRecognizedText('已取消提问');
    setStatus('idle');
  };

  const finishQuestion = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
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

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center justify-between">
        <span>🎙️ 语音控制台</span>
        <div className="flex gap-2">
          {isAnnotating && (
            <span className="px-2 py-0.5 rounded text-xs uppercase bg-amber-100 text-amber-800 font-mono animate-pulse">
              📝 备注中...
            </span>
          )}
          {isAsking && (
            <span className="px-2 py-0.5 rounded text-xs uppercase bg-purple-100 text-purple-800 font-mono animate-pulse">
              ❓ 提问中...
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-xs uppercase bg-blue-100 text-blue-800 font-mono">
            状态: {status}
          </span>
        </div>
      </h3>
      
      <div className="mt-3">
        {isAnnotating ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-xs text-amber-700 mb-2">💬 正在收集您的备注内容，系统会持续录音，请开始说，最后说"结束"来保存</p>
              {annotationText && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">已记录:</p>
                  <p className="text-sm text-amber-900 mt-1">{annotationText}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={startListening}
                disabled={status === 'listening'}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  status === 'listening' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {status === 'listening' ? '🔴 正在听...' : '🎤 开始/继续'}
              </button>
              <button 
                onClick={finishAnnotation}
                className="px-4 py-3 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                保存并退出
              </button>
              <button 
                onClick={cancelAnnotation}
                className="px-4 py-3 rounded-lg text-sm font-medium bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : isAsking ? (
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
              <p className="text-xs text-purple-700 mb-2">❓ 正在收集您的问题，系统会持续录音，请开始说，最后说"结束"来提交</p>
              {questionText && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">已记录:</p>
                  <p className="text-sm text-purple-900 mt-1">{questionText}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={startListening}
                disabled={status === 'listening'}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  status === 'listening' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {status === 'listening' ? '🔴 正在听...' : '🎤 开始/继续'}
              </button>
              <button 
                onClick={finishQuestion}
                className="px-4 py-3 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                提交并退出
              </button>
              <button 
                onClick={cancelQuestion}
                className="px-4 py-3 rounded-lg text-sm font-medium bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={startListening}
              disabled={status === 'listening'}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                status === 'listening' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {status === 'listening' ? '🔴 正在听...' : '🎤 点击开始语音输入'}
            </button>
            
            <div className="text-xs text-gray-400 text-center">
              尝试说: "播放"、"暂停"、"继续"、"上一段"、"下一段"、"备注"、"提问"
            </div>
          </div>
        )}
        
        {recognizedText && (
          <div className="mt-3 p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">识别结果:</div>
            <div className="text-sm text-gray-800">{recognizedText}</div>
          </div>
        )}
      </div>
    </div>
  );
};
