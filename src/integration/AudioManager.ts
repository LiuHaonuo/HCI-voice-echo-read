// src/integration/AudioManager.ts
export type AudioOwner = 'tts' | 'stt' | 'ai-tts' | null;

class AudioManager {
  private currentOwner: AudioOwner = null;

  acquire(owner: AudioOwner): boolean {
    if (this.currentOwner && this.currentOwner !== owner) {
      console.log(`[AudioManager] 抢占资源: ${this.currentOwner} -> ${owner}`);
      this.pauseAll();
    }
    this.currentOwner = owner;
    return true;
  }

  release(owner: AudioOwner) {
    if (this.currentOwner === owner) {
      this.currentOwner = null;
      console.log(`[AudioManager] 释放资源: ${owner}`);
    }
  }

  private pauseAll() {
    // 触发 B 模块的 TTS 暂停动作
    window.speechSynthesis?.pause();
  }
}

export const audioManager = new AudioManager();