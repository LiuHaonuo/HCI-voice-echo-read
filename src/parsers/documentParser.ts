// src/parsers/documentParser.ts
import mammoth from 'mammoth';
import { Paragraph, DocFormat, ReaderDocument } from '../types/document';

// 💡 自动读取成员B设定的 5000 端口基准地址
const BACKEND_URL = 'http://localhost:5000';

/**
 * 辅助函数：根据文件名获取格式
 */
const getFormat = (fileName: string): DocFormat => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'txt';
};

/**
 * 辅助函数：快速为文档生成一个唯一 ID
 */
const generateId = (file: File): string => {
  return `${file.name}_${file.size}_${file.lastModified}`;
};

/**
 * 智能行合并缓冲区（供本地 TXT 和 Word 使用）
 */
const mergeShortLines = (rawLines: string[], prefix: string): Paragraph[] => {
  const mergedParagraphs: string[] = [];
  let currentBuffer = '';

  for (let line of rawLines) {
    line = line.trim();
    if (!line) continue;

    if (!currentBuffer) {
      currentBuffer = line;
    } else {
      const isEndWithPunctuation = /[。？！.?!:：]$/.test(currentBuffer);
      const isBufferShort = currentBuffer.length < 30;

      if (!isEndWithPunctuation && !isBufferShort) {
        currentBuffer += line;
      } else {
        mergedParagraphs.push(currentBuffer);
        currentBuffer = line;
      }
    }
  }

  if (currentBuffer) {
    mergedParagraphs.push(currentBuffer);
  }

  return mergedParagraphs.map((text, index) => ({
    id: `${prefix}-p-${index}-${Date.now()}`,
    index,
    text,
    charCount: text.length,
  }));
};

/**
 * 核心逻辑 1：解析纯文本 (.txt)
 */
const parseTxt = async (file: File): Promise<Paragraph[]> => {
  const text = await file.text();
  const rawLines = text.split(/\r?\n/);
  return mergeShortLines(rawLines, 'txt');
};

/**
 * 核心逻辑 2：解析 Word 文档 (.docx)
 */
const parseDocx = async (file: File): Promise<Paragraph[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawLines = result.value.split(/\r?\n/);
  return mergeShortLines(rawLines, 'docx');
};

/**
 * 核心逻辑 3：解析 PDF 文档 (.pdf)
 * ⚡ 终极修复：放弃在前端配置任何复杂的 Worker 路径，直接交由稳定的 Python 后端解析！
 */
const parsePdfViaBackend = async (file: File): Promise<Paragraph[]> => {
  const formData = new FormData();
  formData.append('file', file);

  // 发送文件到 Flask 后端
  const response = await fetch(`${BACKEND_URL}/api/v1/parse/pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '后端 Python 路由通信故障，解析 PDF 失败');
  }

  const data = await response.json();
  return data.paragraphs; // 完美拿到后端洗好、合好之后的段落结构
};

/**
 * 统一暴露给外界的主解析入口
 */
export const parseDocument = async (file: File): Promise<ReaderDocument> => {
  const format = getFormat(file.name);
  let paragraphs: Paragraph[] = [];

  if (format === 'pdf') {
    // 走高稳定的 Python 后端流解析
    paragraphs = await parsePdfViaBackend(file);
  } else if (format === 'docx') {
    paragraphs = await parseDocx(file);
  } else {
    paragraphs = await parseTxt(file);
  }

  return {
    id: generateId(file),
    fileName: file.name,
    format,
    paragraphs,
    uploadedAt: Date.now(),
  };
};

export default parseDocument;