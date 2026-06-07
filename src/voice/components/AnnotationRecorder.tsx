// src/voice/components/AnnotationRecorder.tsx
import React, { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useReaderStore } from '../../store/readerStore';

export const AnnotationRecorder: React.FC = () => {
  const { currentDoc, currentIndex } = useReaderStore();
  const { addAnnotation, annotations, loadAnnotations, deleteAnnotation } = useVoiceStore();

  useEffect(() => {
    if (currentDoc) {
      loadAnnotations(currentDoc.id);
    }
  }, [currentDoc, loadAnnotations]);

  const handleRecordNoteMock = () => {
    if (!currentDoc) return;
    const mockNote = window.prompt("请输入批注内容:", "这部分需要跟第三章的内容交叉对比。");
    if (mockNote) {
      addAnnotation(currentDoc.id, {
        id: `ann-${Date.now()}`,
        docId: currentDoc.id,
        paragraphIndex: currentIndex,
        text: mockNote,
        createdAt: Date.now(),
        source: 'manual'
      });
    }
  };

  if (!currentDoc) return null;
  const currentAnns = annotations[currentDoc.id]?.filter(a => a.paragraphIndex === currentIndex) || [];

  const handleDeleteAnnotation = (id: string) => {
    if (!currentDoc) return;
    if (confirm('确定要删除这条批注吗？')) {
      deleteAnnotation(currentDoc.id, id);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-sm text-gray-700">📝 当前段落批注</span>
        <button onClick={handleRecordNoteMock} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600 transition-colors">
          ✏️ 添加批注
        </button>
      </div>
      
      {currentAnns.length === 0 ? (
        <p className="text-xs text-gray-400 italic">当前段落尚无批注</p>
      ) : (
        <div className="space-y-2">
          {currentAnns.map(ann => (
            <div key={ann.id} className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-amber-900">{ann.text}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {ann.source === 'voice' ? '🎤 语音记录' : '✏️ 手动添加'} · {new Date(ann.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteAnnotation(ann.id)} 
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-100 px-2 py-1 rounded ml-2"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
