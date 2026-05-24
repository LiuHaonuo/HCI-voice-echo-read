// src/voice/components/VoiceControlPanel.tsx
import React, { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useReaderStore } from '../../store/readerStore';
import { eventBus } from '../../integration/EventBus';
import { audioManager } from '../../integration/AudioManager';

export const VoiceControlPanel: React.FC = () => {
  const { status, setStatus, isPlaying, setIsPlaying } = useVoiceStore();
  const { currentIndex, currentDoc, setCurrentIndex, speechRate } = useReaderStore();

  // 监听来自 A 的控制指令
  useEffect(() => {
    const startTts = (payload: any) => {
      audioManager.acquire('tts');
      setIsPlaying(true);
      setStatus('speaking');
      console.log(`[TTS Engine] 正在以 ${payload.speechRate} 速度朗读第 ${payload.currentIndex + 1} 段`);
      
      // 原生 Web Speech API Mock
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = currentDoc?.paragraphs[payload.currentIndex]?.text || '';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = payload.speechRate;
        utterance.onend = () => {
          setIsPlaying(false);
          setStatus('idle');
          audioManager.release('tts');
          // 段末自动跳下一段
          if (currentDoc && currentIndex < currentDoc.paragraphs.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    };

    const stopTts = () => {
      setIsPlaying(false);
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
  }, [currentDoc, currentIndex, speechRate]);

  const handleSimulateVoiceCommand = (command: string) => {
    audioManager.acquire('stt');
    setStatus('listening');
    
    setTimeout(() => {
      setStatus('recognizing');
      setTimeout(() => {
        console.log(`[STT] 匹配到语音指令: ${command}`);
        setStatus('idle');
        audioManager.release('stt');

        if (command === '下一段') setCurrentIndex(currentIndex + 1);
        if (command === '上一段') setCurrentIndex(currentIndex - 1);
        if (command === '暂停') eventBus.emit('reader:pause-request');
      }, 800);
    }, 1000);
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center justify-between">
        <span>🎙️ 语音控制台</span>
        <span className="px-2 py-0.5 rounded text-xs uppercase bg-blue-100 text-blue-800 font-mono">
          状态: {status}
        </span>
      </h3>
      
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button onClick={() => handleSimulateVoiceCommand('上一段')} className="bg-white hover:bg-gray-100 border p-2 rounded text-xs">🗣️ "上一段"</button>
        <button onClick={() => handleSimulateVoiceCommand('暂停')} className="bg-white hover:bg-gray-100 border p-2 rounded text-xs">🗣️ "暂停"</button>
        <button onClick={() => handleSimulateVoiceCommand('下一段')} className="bg-white hover:bg-gray-100 border p-2 rounded text-xs">🗣️ "下一段"</button>
      </div>
    </div>
  );
};