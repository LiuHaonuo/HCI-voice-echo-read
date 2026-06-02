// src/voice/components/VoiceControlPanel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useReaderStore } from '../../store/readerStore';
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
  const { status, setStatus } = useVoiceStore();
  const { currentIndex, currentDoc, setCurrentIndex, speechRate } = useReaderStore();
  const [recognizedText, setRecognizedText] = useState<string>('');

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

    eventBus.on('reader:play-request', startTts);
    eventBus.on('reader:pause-request', stopTts);

    return () => {
      eventBus.off('reader:play-request', startTts);
      eventBus.off('reader:pause-request', stopTts);
    };
  }, [currentDoc]);

  const handleVoiceCommand = useCallback((transcript: string, idx: number, rate: number) => {
    console.log(`[STT] 识别结果: ${transcript}`);
    
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

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center justify-between">
        <span>🎙️ 语音控制台</span>
        <span className="px-2 py-0.5 rounded text-xs uppercase bg-blue-100 text-blue-800 font-mono">
          状态: {status}
        </span>
      </h3>
      
      <div className="mt-3">
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
        
        {recognizedText && (
          <div className="mt-3 p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">识别结果:</div>
            <div className="text-sm text-gray-800">{recognizedText}</div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-400 text-center">
          尝试说: "播放"、"暂停"、"上一段"、"下一段"
        </div>
      </div>
    </div>
  );
};