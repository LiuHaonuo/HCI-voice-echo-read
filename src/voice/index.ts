// src/voice/index.ts
export { SpeechRecognitionService, recognizeOnce, createSpeechRecognitionService, defaultSpeechService } from './utils';
export type { SpeechRecognitionOptions, SpeechRecognitionResult, SpeechRecognitionCallback } from './utils';

export { useVoiceStore } from './store/voiceStore';
