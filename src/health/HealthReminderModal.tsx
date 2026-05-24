// src/health/HealthReminderModal.tsx
import React, { useEffect, useState } from 'react';

export const HealthReminderModal: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 演示阶段设为 45 秒触发一次
    const timer = setInterval(() => {
      if (!document.hidden) setShow(true);
    }, 45000);

    return () => clearInterval(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl border text-center animate-in fade-in zoom-in-95 duration-200">
        <span className="text-3xl">👁️</span>
        <h3 className="font-bold text-lg text-gray-900 mt-2">保护眼睛，休息一下</h3>
        <p className="text-sm text-gray-500 mt-2">
          您已连续用眼/听读一节课时间。建议闭眼 20 秒，向远方眺望。
        </p>
        <button 
          onClick={() => setShow(false)}
          className="mt-5 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          知道了，继续听读
        </button>
      </div>
    </div>
  );
};