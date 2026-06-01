import { Paragraph, ReaderDocument } from '../../types/document';

export interface PromptContext {
  document: ReaderDocument;
  currentParagraph: Paragraph;
  currentIndex: number;
  previousParagraphs: Paragraph[];
  nextParagraphs: Paragraph[];
}

export type QuestionType = 'explain' | 'summarize' | 'qa' | 'elaborate';

export interface BuildPromptOptions {
  questionType?: QuestionType;
  userQuestion?: string;
  includeDocumentSummary?: boolean;
}

const SYSTEM_PROMPT = `你是VoiceEcho Read的上下文AI助手，一个帮助用户进行听读学习的智能工具。

你的任务是：
1. 基于用户当前阅读的段落内容提供准确的解答
2. 保持回答简洁、易懂，适合语音朗读
3. 上下文连贯，参考前后段落的内容
4. 使用中文回答，语气友好专业

请用简洁的语言回答问题，避免过长的段落，保持在200字以内。`;

class PromptBuilder {
  buildContextPrompt(
    context: PromptContext,
    options: BuildPromptOptions = {}
  ): string {
    const { questionType = 'qa', userQuestion = '请解释这段内容的核心观点' } = options;

    let prompt = this.buildSystemInstruction();
    prompt += '\n\n---\n\n';
    prompt += this.buildDocumentContext(context);
    prompt += '\n\n---\n\n';
    prompt += this.buildQuestionPrompt(questionType, userQuestion);

    return prompt;
  }

  private buildSystemInstruction(): string {
    return SYSTEM_PROMPT;
  }

  buildSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  private buildDocumentContext(context: PromptContext): string {
    let contextText = `📄 文档信息: ${context.document.fileName}\n\n`;

    if (context.previousParagraphs.length > 0) {
      contextText += `📖 前文回顾 (第${context.currentIndex - context.previousParagraphs.length + 1} - ${context.currentIndex}段):\n`;
      context.previousParagraphs.forEach((p, idx) => {
        contextText += `${idx + 1}. ${p.text}\n`;
      });
      contextText += '\n';
    }

    contextText += `🎯 当前段落 (第${context.currentIndex + 1}段):\n`;
    contextText += context.currentParagraph.text;
    contextText += '\n\n';

    if (context.nextParagraphs.length > 0) {
      contextText += `🔮 后续预览 (第${context.currentIndex + 2} - ${context.currentIndex + 1 + context.nextParagraphs.length}段):\n`;
      context.nextParagraphs.slice(0, 2).forEach((p, idx) => {
        contextText += `${idx + 1}. ${p.text}\n`;
      });
    }

    return contextText;
  }

  private buildQuestionPrompt(type: QuestionType, userQuestion: string): string {
    const prompts: Record<QuestionType, string> = {
      explain: `请用通俗易懂的语言解释这段内容的核心含义和关键概念。`,
      summarize: `请简要总结这段内容的主要观点（50字以内）。`,
      elaborate: `请展开阐述这段内容的背景知识和重要性。`,
      qa: userQuestion,
    };

    return `❓ 用户问题:\n${prompts[type]}`;
  }

  buildContext(
    document: ReaderDocument,
    currentIndex: number,
    lookBack: number = 2,
    lookAhead: number = 1
  ): PromptContext {
    const startIdx = Math.max(0, currentIndex - lookBack);
    const endIdx = Math.min(document.paragraphs.length, currentIndex + 1 + lookAhead);

    return {
      document,
      currentParagraph: document.paragraphs[currentIndex],
      currentIndex,
      previousParagraphs: document.paragraphs.slice(startIdx, currentIndex),
      nextParagraphs: document.paragraphs.slice(currentIndex + 1, endIdx),
    };
  }

  buildConversationHistory(
    qaHistory: { q: string; a: string }[],
    maxHistory: number = 3
  ): { role: 'user' | 'assistant'; content: string }[] {
    const history = qaHistory.slice(-maxHistory);
    return history.flatMap((qa) => [
      { role: 'user' as const, content: qa.q },
      { role: 'assistant' as const, content: qa.a },
    ]);
  }

  buildQuickQuestionPrompts(): { label: string; question: string; type: QuestionType }[] {
    return [
      { label: '核心观点', question: '请解释这段内容的核心观点是什么', type: 'explain' },
      { label: '简要总结', question: '请简要总结这段内容', type: 'summarize' },
      { label: '展开阐述', question: '请展开阐述这段内容的背景知识', type: 'elaborate' },
    ];
  }
}

export const promptBuilder = new PromptBuilder();
