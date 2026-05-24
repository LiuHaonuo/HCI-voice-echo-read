// src/types/document.ts
export type DocFormat = 'pdf' | 'docx' | 'txt';

export interface Paragraph {
  id: string;
  index: number;
  text: string;
  charCount: number;
}

export interface ReaderDocument {
  id: string;
  fileName: string;
  format: DocFormat;
  paragraphs: Paragraph[];
  uploadedAt: number;
}