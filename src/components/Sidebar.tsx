import React, { useRef, useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';

export const Sidebar: React.FC = () => {
  const {
    uploadAndParseFile,
    parseStatus,
    currentDoc,
    cachedDocs,
    loadCachedDocument,
    removeCachedDocument,
    loadCachedDocs
  } = useReaderStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCachedDocs();
  }, [loadCachedDocs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadAndParseFile(files[0]);
    }
  };

  const handleDocClick = (docId: string) => {
    loadCachedDocument(docId);
  };

  const handleDeleteDoc = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个文档吗？')) {
      removeCachedDocument(docId);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'docx') return '📝';
    if (ext === 'txt') return '📃';
    return '📁';
  };

  return (
    <div style={{
      width: '220px',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2563eb',
          letterSpacing: '0.5px',
          margin: 0
        }}>
          VoiceEcho Read
        </h1>
        <p style={{
          fontSize: '11px',
          color: '#94a3b8',
          margin: '4px 0 0 0'
        }}>
          智能语音阅读助手
        </p>
      </div>

      <div style={{
        marginBottom: '20px'
      }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx"
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={parseStatus === 'parsing'}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: parseStatus === 'parsing' ? '#f59e0b' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: parseStatus === 'parsing' ? 'wait' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{parseStatus === 'parsing' ? '⏳' : '📂'}</span>
          <span>{parseStatus === 'parsing' ? '解析中...' : '导入文档'}</span>
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500',
            margin: 0
          }}>
            文档列表
          </p>
          <span style={{
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            {cachedDocs.length} 个
          </span>
        </div>

        {cachedDocs.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#94a3b8',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginTop: '4px'
          }}>
            <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>📁</span>
            <p style={{ fontSize: '12px', margin: 0 }}>暂无文档</p>
            <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>点击上方按钮导入</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '4px'
          }}>
            {cachedDocs.map((doc) => {
              const isCurrent = currentDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleDocClick(doc.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                    border: isCurrent ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '0';
                  }}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>
                    {getFileIcon(doc.fileName)}
                  </span>
                  <div style={{
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: isCurrent ? '600' : '500',
                      color: isCurrent ? '#1e40af' : '#374151',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {doc.fileName}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      margin: '2px 0 0 0'
                    }}>
                      {doc.paragraphs.length} 段 · {doc.format.toUpperCase()}
                    </p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteDoc(e, doc.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'all 0.2s'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p style={{
          fontSize: '11px',
          color: '#94a3b8',
          textAlign: 'center',
          margin: 0
        }}>
          文档自动保存在本地
        </p>
      </div>
    </div>
  );
};
