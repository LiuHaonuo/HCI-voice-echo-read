# VoiceControlPanel 使用指南

## 概述

VoiceControlPanel 现在已经被重构为一个模块化的语音控制系统，提供：

1. **`useVoiceControl` Hook** - 核心语音控制逻辑
2. **`VoiceControlPanel` 组件** - 完整的 UI 组件封装

## 使用方式

### 方式一：使用完整的 UI 组件

```tsx
import { VoiceControlPanel } from './voice/components/VoiceControlPanel';
import { eventBus } from './integration/EventBus';
import { useReaderStore } from './store/readerStore';

export const MyComponent = () => {
  const { currentIndex, setCurrentIndex, speechRate } = useReaderStore();

  const callbacks = {
    onCommand: (command) => {
      switch (command) {
        case 'play':
          eventBus.emit('reader:play-request', { currentIndex, speechRate });
          break;
        case 'pause':
          eventBus.emit('reader:pause-request');
          break;
        case 'resume':
          eventBus.emit('reader:resume-request');
          break;
        case 'next':
          setCurrentIndex(currentIndex + 1);
          break;
        case 'prev':
          setCurrentIndex(currentIndex - 1);
          break;
      }
    },
    onAnnotationSave: (text) => {
      console.log('保存批注:', text);
      // 你的保存逻辑
    },
    onQuestionSubmit: (text) => {
      console.log('提交问题:', text);
      // 你的提问逻辑
    },
    onTextRecognized: (text) => {
      console.log('识别结果:', text);
    },
    onModeChange: (mode) => {
      console.log('模式变更:', mode);
    }
  };

  return <VoiceControlPanel callbacks={callbacks} />;
};
```

### 方式二：使用 Hook 自定义 UI

```tsx
import { useVoiceControl } from './voice/hooks';
import { eventBus } from './integration/EventBus';

export const CustomVoiceUI = () => {
  const {
    startListening,
    isListening,
    isAnnotating,
    recognizedText,
    // ... 其他状态和方法
  } = useVoiceControl({
    callbacks: {
      onCommand: (cmd) => console.log('命令:', cmd),
      onAnnotationSave: (text) => console.log('批注:', text),
    }
  });

  return (
    <div>
      <button onClick={startListening}>
        {isListening ? '正在听...' : '开始录音'}
      </button>
      {isAnnotating && <p>批注模式</p>}
      {recognizedText && <p>识别: {recognizedText}</p>}
    </div>
  );
};
```

### 方式三：在 ReaderControls 中集成

参考 `ReaderControls.tsx` 的重构版本，可以将语音控制部分提取为独立的组件。

## 接口定义

### VoiceControlCallbacks

```typescript
interface VoiceControlCallbacks {
  onCommand?: (command: 'play' | 'pause' | 'resume' | 'next' | 'prev') => void;
  onAnnotationSave?: (text: string) => void;
  onQuestionSubmit?: (text: string) => void;
  onTextRecognized?: (text: string) => void;
  onModeChange?: (mode: 'annotating' | 'asking' | 'idle') => void;
}
```

### useVoiceControl 返回值

```typescript
interface UseVoiceControlReturn {
  // 控制函数
  startListening: () => void;
  cancelAnnotation: () => void;
  finishAnnotation: () => void;
  cancelQuestion: () => void;
  finishQuestion: () => void;
  handleMockVoiceInput: (text: string) => void;
  
  // 状态
  isListening: boolean;
  isAnnotating: boolean;
  isAsking: boolean;
  recognizedText: string;
  annotationText: string;
  questionText: string;
  showMockInput: boolean;
  mockInputText: string;
  useMockVoice: boolean;
  status: string;
  
  // 状态设置器
  setMockInputText: (text: string) => void;
  setShowMockInput: (show: boolean) => void;
  setUseMockVoice: (use: boolean) => void;
}
```

## 语音命令

支持的语音命令：

| 命令 | 触发关键词 |
|------|----------|
| 播放 | "播放"、"开始" |
| 暂停 | "暂停" |
| 继续 | "继续"、"继续播放" |
| 下一段 | "下一段"、"下一章" |
| 上一段 | "上一段"、"上一章" |
| 批注 | "批注"、"备注" |
| 提问 | "提问" |
| 结束 | "结束" |

## 注意事项

1. 语音识别依赖 Web Speech API，仅支持 Chrome/Edge 等浏览器
2. 需要用户授权麦克风权限
3. 建议在组件卸载时清理语音识别资源
4. 批注和提问模式会自动持续监听，直到说出"结束"
