import React, { useEffect } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use 'danger' for destructive actions (delete, remove). Default is 'primary'. */
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'confirmFadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirmSlideUp {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          animation: 'confirmSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '28px 28px 0 28px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isDanger ? 'rgba(225,29,72,0.08)' : 'rgba(14,165,233,0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              marginBottom: '14px',
            }}
          >
            {isDanger ? String.fromCodePoint(0x1F5D1, 0xFE0F) : '?'}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          {message && (
            <p
              style={{
                margin: '10px 0 0',
                fontSize: '13.5px',
                color: '#64748B',
                lineHeight: 1.55,
              }}
            >
              {message}
            </p>
          )}
        </div>

        <div
          style={{
            padding: '24px 28px 28px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#475569',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: isDanger ? '#E11D48' : '#0EA5E9',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: isDanger
                ? '0 2px 8px rgba(225,29,72,0.35)'
                : '0 2px 8px rgba(14,165,233,0.35)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
