// src/integration/AppShell.tsx
import React from 'react';
import { DocumentUploader } from '../components/DocumentUploader';
import { ParagraphList } from '../components/ParagraphList';
import { ReaderControls } from '../components/ReaderControls';
import { VoiceControlPanel } from '../voice/components/VoiceControlPanel';
import { AnnotationRecorder } from '../voice/components/AnnotationRecorder';
import { AiQaPanel } from '../ai/components/AiQaPanel';
import { HealthReminderModal } from '../health/HealthReminderModal';

export const AppShell: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans antialiased">
      {/* 顶部上传栏 */}
      <DocumentUploader />

      {/* 主体交互区分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：阅读主干道 (70%) */}
        <div className="w-[70%] flex flex-col bg-white border-r border-gray-200">
          <ParagraphList />
          <ReaderControls />
        </div>

        {/* 右侧：语音与智能辅助控制台 (30%) */}
        <aside className="w-[30%] bg-gray-100 p-4 flex flex-col overflow-y-auto space-y-4">
          <VoiceControlPanel />
          <AnnotationRecorder />
          <AiQaPanel />
        </aside>
      </div>

      {/* 全局健康提示模态层 */}
      <HealthReminderModal />
    </div>
  );
};