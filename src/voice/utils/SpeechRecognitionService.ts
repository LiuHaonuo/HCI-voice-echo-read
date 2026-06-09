// src/voice/utils/SpeechRecognitionService.ts
import { audioManager } from '../../integration/AudioManager';

/**
 * 纯粹的语音转文字服务
 * 不包含任何业务逻辑，只负责语音识别功能
 */

export interface SpeechRecognitionOptions {
  /** 语言设置，默认中文 */
  lang?: string;
  /** 是否连续识别 */
  continuous?: boolean;
  /** 是否返回中间结果 */
  interimResults?: boolean;
  /** 最大备选结果数 */
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  /** 识别的文本 */
  transcript: string;
  /** 置信度 */
  confidence: number;
}

export interface SpeechRecognitionCallback {
  /** 识别到结果时调用 */
  onResult?: (result: SpeechRecognitionResult) => void;
  /** 识别错误时调用 */
  onError?: (error: Error) => void;
  /** 识别结束时调用 */
  onEnd?: () => void;
  /** 开始识别时调用 */
  onStart?: () => void;
}

/**
 * 语音识别服务类
 */
export class SpeechRecognitionService {
  private recognition: any = null;
  private options: SpeechRecognitionOptions;
  private callbacks: SpeechRecognitionCallback;
  private isListening = false;

  constructor(options: SpeechRecognitionOptions = {}, callbacks: SpeechRecognitionCallback = {}) {
    this.options = {
      lang: 'zh-CN',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      ...options
    };
    this.callbacks = callbacks;
  }

  /**
   * 检查浏览器是否支持语音识别
   */
  public isSupported(): boolean {
    const win = window as unknown as {
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    };
    return !!(win.webkitSpeechRecognition || win.SpeechRecognition);
  }

  /**
   * 开始语音识别
   */
  public start(): void {
    if (this.isListening) {
      console.warn('[SpeechRecognitionService] 已在监听中');
      return;
    }

    if (!this.isSupported()) {
      const error = new Error('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      this.callbacks.onError?.(error);
      alert(error.message);
      return;
    }

    const win = window as unknown as {
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
      SpeechRecognition?: typeof window.SpeechRecognition;
    };
    const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.options.lang!;
    this.recognition.continuous = this.options.continuous!;
    this.recognition.interimResults = this.options.interimResults!;
    this.recognition.maxAlternatives = this.options.maxAlternatives!;

    // 处理识别结果
    this.recognition.onresult = (event: any) => {
      const result: SpeechRecognitionResult = {
        transcript: event.results[0][0].transcript,
        confidence: event.results[0][0].confidence
      };
      this.callbacks.onResult?.(result);
    };

    // 处理错误
    this.recognition.onerror = (event: any) => {
      const error = new Error(`语音识别错误: ${event.error}`);
      console.error('[SpeechRecognitionService] 识别错误:', event.error);
      this.callbacks.onError?.(error);
      this.stop();
    };

    // 处理结束
    this.recognition.onend = () => {
      this.isListening = false;
      audioManager.release('stt');
      this.callbacks.onEnd?.();
    };

    // 开始识别
    audioManager.acquire('stt');
    this.isListening = true;
    this.callbacks.onStart?.();
    this.recognition.start();
  }

  /**
   * 停止语音识别
   */
  public stop(): void {
    if (!this.isListening || !this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.warn('[SpeechRecognitionService] 停止时出错:', error);
    }
    this.isListening = false;
  }

  /**
   * 获取当前监听状态
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * 设置回调函数
   */
  public setCallbacks(callbacks: SpeechRecognitionCallback): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 设置选项
   */
  public setOptions(options: Partial<SpeechRecognitionOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * 一次性语音识别函数
 * @param options 识别选项
 * @returns Promise 返回识别结果
 */
export const recognizeOnce = async (
  options: SpeechRecognitionOptions = {}
): Promise<SpeechRecognitionResult> => {
  return new Promise((resolve, reject) => {
    const service = new SpeechRecognitionService(
      { ...options, continuous: false },
      {
        onResult: (result) => {
          service.stop();
          resolve(result);
        },
        onError: (error) => {
          reject(error);
        },
        onEnd: () => {
          // 如果没有结果就结束，也需要处理
        }
      }
    );
    service.start();
  });
};

/**
 * 创建语音识别服务实例
 * @param options 配置选项
 * @param callbacks 回调函数
 * @returns SpeechRecognitionService 实例
 */
export const createSpeechRecognitionService = (
  options: SpeechRecognitionOptions = {},
  callbacks: SpeechRecognitionCallback = {}
): SpeechRecognitionService => {
  return new SpeechRecognitionService(options, callbacks);
};

/**
 * 默认的语音识别服务实例
 */
export const defaultSpeechService = new SpeechRecognitionService();
