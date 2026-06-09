// src/health/HealthReminderModal.tsx
import React, { useEffect, useState } from 'react';

export const HealthReminderModal: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 演示阶段设为 45 秒触发一次
    const timer = setInterval(() => {
      if (!document.hidden) setShow(true);
    }, 4500*1000);

    return () => clearInterval(timer);
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .reminder-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 100 !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .reminder-content {
          background: white;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div className="reminder-overlay">
        <div className="reminder-content">
          <div style={{
           background: 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>保护眼睛，休息一下</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 20px 0',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              您已连续用眼/听读一节课时间。建议闭眼 20 秒，向远方眺望，保护您的视力健康。
            </p>
            <button 
              onClick={() => setShow(false)}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(34, 197, 94, 0.49)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(34, 197, 94, 0.39)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
            >
              知道了，继续听读
            </button>
          </div>
        </div>
      </div>
    </>
  );
};