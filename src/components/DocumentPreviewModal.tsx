import React, { useState } from 'react';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: File | null;
  fileUrl?: string;
  textContent?: string;
  title?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  fileUrl,
  textContent,
  title
}) => {
  if (!isOpen) return null;

  const resolvedUrl = file ? URL.createObjectURL(file) : fileUrl;
  const isPdf = file?.type === 'application/pdf' || (file?.name || '').toLowerCase().endsWith('.pdf') || (fileUrl || '').toLowerCase().includes('.pdf');
  const isImage = file?.type.startsWith('image/') || (fileUrl || '').match(/\.(jpg|jpeg|png|webp|avif)$/i);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
              {title || file?.name || 'Document Preview'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0284c7',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd',
                  backgroundColor: '#f0f9ff',
                }}
              >
                Open in New Tab ↗
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content / Preview Area */}
        <div style={{ flex: 1, backgroundColor: '#0f172a', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isPdf && resolvedUrl ? (
            <iframe
              src={resolvedUrl}
              title="PDF Preview"
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
            />
          ) : isImage && resolvedUrl ? (
            <img
              src={resolvedUrl}
              alt="Document Preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '16px' }}
            />
          ) : textContent ? (
            <div style={{ padding: '24px', width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff', overflowY: 'auto' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', color: '#1e293b' }}>
                {textContent}
              </pre>
            </div>
          ) : resolvedUrl ? (
            <iframe
              src={resolvedUrl}
              title="Preview"
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
            />
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>No preview available for this document.</div>
          )}
        </div>
      </div>
    </div>
  );
};
