// src/types/voice.ts
export type VoiceStatus = 'idle' | 'listening' | 'recognizing' | 'speaking' | 'error';
export type VoiceCommand = 'play' | 'pause' | 'resume' | 'next' | 'prev' | 'annotate';

export interface ParagraphAnnotation {
  id: string;
  docId: string;
  paragraphIndex: number;
  text: string;
  createdAt: number;
  source: 'voice' | 'manual';
}