// src/integration/AppShell.tsx
import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ParagraphList } from '../components/ParagraphList';
import { ReaderControls } from '../components/ReaderControls';
import { AiSidebar } from '../ai/components/AiSidebar';
import { HealthReminderModal } from '../health/HealthReminderModal';

export const AppShell: React.FC = () => {
  const [isAiSidebarCollapsed, setIsAiSidebarCollapsed] = useState(false);

  return (
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
      backgroundColor: '#f1f5f9',
      fontFamily: 'sans-serif'
    }}>
      {/* 左侧侧边栏：文件上传和文档列表 */}
      <Sidebar />

      {/* 中间阅读区 */}
      <div style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 段落列表区域 */}
        <ParagraphList />

        {/* 播放控制栏 */}
        <div style={{ flexShrink: 0 }}>
          <ReaderControls />
        </div>
      </div>

      {/* 右侧 AI 侧边栏（可折叠） */}
      <AiSidebar
        isCollapsed={isAiSidebarCollapsed}
        onToggle={() => setIsAiSidebarCollapsed(!isAiSidebarCollapsed)}
      />

      <HealthReminderModal />
    </div>
  );
};
