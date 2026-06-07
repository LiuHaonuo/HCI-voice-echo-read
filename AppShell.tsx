// src/integration/AppShell.tsx
import React from 'react';
import { DocumentUploader } from '../components/DocumentUploader';
import { ParagraphList } from '../components/ParagraphList';
import { ReaderControls } from '../components/ReaderControls';
import { VoiceControlPanel } from '../voice/components/VoiceControlPanel';
import { AnnotationRecorder } from '../voice/components/AnnotationRecorder';
// 1. ❌ 暂时注释掉报错导致编译死锁的 AI 组件
import { AiQaPanel } from '../ai/components/AiQaPanel';
import { HealthReminderModal } from '../health/HealthReminderModal';

export const AppShell: React.FC = () => {
  return (
    // 🔒 用纯原生样式强行框死整个视口，让全网页的大滚动条绝对无法出现
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f1f5f9',
      fontFamily: 'sans-serif'
    }}>
      {/* 顶部上传栏：固定高度，不参与压缩 */}
      <div style={{ height: '60px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <DocumentUploader />
      </div>

      {/* 主体交互区分栏：铺满除去顶部栏之外的所有视口高度 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* 💡 左侧阅读主干道 (占 70% 宽度) */}
        <div style={{
          width: '70%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* 1. 文本框：自适应吃满中间的所有高度 */}
          <ParagraphList />
          
          {/* 2. 控制按键栏：flex-shrink: 0 确保它被焊死在最底部，绝对不被挤出屏幕 */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <ReaderControls />
          </div>
        </div>

        {/* 💡 右侧控制台 (占 30% 宽度) */}
        <aside style={{
          width: '30%',
          height: '100%',
          backgroundColor: '#f8fafc',
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <VoiceControlPanel />
          <AnnotationRecorder />
          {/* 2. ❌ 暂时注释掉 AI 面板 */}
          {/* <AiQaPanel /> */}
        </aside>
      </div>

      <HealthReminderModal />
    </div>
  );
};