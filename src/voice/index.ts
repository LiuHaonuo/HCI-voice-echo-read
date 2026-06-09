// src/voice/index.ts
export { VoiceControlPanel } from './components/VoiceControlPanel';
export type { VoiceControlPanelProps } from './components/VoiceControlPanel';

export { useVoiceControl } from './hooks/useVoiceControl';
export type { VoiceControlCallbacks, UseVoiceControlOptions, UseVoiceControlReturn } from './hooks/useVoiceControl';

export { SpeechRecognitionService, recognizeOnce, createSpeechRecognitionService, defaultSpeechService } from './utils';
export type { SpeechRecognitionOptions, SpeechRecognitionResult, SpeechRecognitionCallback } from './utils';

export { useVoiceStore } from './store/voiceStore';
