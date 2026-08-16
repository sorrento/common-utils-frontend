import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  notify: {
    info: (message: string, title?: string, duration?: number) => string;
    success: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global event listener for imperative helper notify(...) calls when out of context
type ToastListener = (toast: ToastItem) => void;
const listeners: ToastListener[] = [];

export const notify = {
  info: (message: string, title?: string, duration = 4000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), message, title, type: 'info', duration };
    listeners.forEach(l => l(item));
    return item.id;
  },
  success: (message: string, title?: string, duration = 4000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), message, title, type: 'success', duration };
    listeners.forEach(l => l(item));
    return item.id;
  },
  warning: (message: string, title?: string, duration = 5000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), message, title, type: 'warning', duration };
    listeners.forEach(l => l(item));
    return item.id;
  },
  error: (message: string, title?: string, duration = 6000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), message, title, type: 'error', duration };
    listeners.forEach(l => l(item));
    return item.id;
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type: 'info', duration: 4500, ...toastData };
    setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 visible at once
    return id;
  }, []);

  useEffect(() => {
    const handleImperativeToast = (item: ToastItem) => {
      setToasts((prev) => [...prev.slice(-4), item]);
    };
    listeners.push(handleImperativeToast);
    return () => {
      const idx = listeners.indexOf(handleImperativeToast);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const notifyHelpers = {
    info: (msg: string, title?: string, dur?: number) => addToast({ message: msg, title, type: 'info', duration: dur }),
    success: (msg: string, title?: string, dur?: number) => addToast({ message: msg, title, type: 'success', duration: dur }),
    warning: (msg: string, title?: string, dur?: number) => addToast({ message: msg, title, type: 'warning', duration: dur }),
    error: (msg: string, title?: string, dur?: number) => addToast({ message: msg, title, type: 'error', duration: dur }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, notify: notifyHelpers }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return fallback to imperative notify if used outside Provider
    return {
      toasts: [],
      addToast: (t: Omit<ToastItem, 'id'>) => notify[t.type || 'info'](t.message, t.title, t.duration),
      removeToast: () => {},
      notify,
    };
  }
  return ctx;
};

// Component that renders the toast list on top right
export const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
        }}
      >
        {toasts.map((toast) => (
          <SingleToast key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
        ))}
      </div>
    </>
  );
};

const SingleToast: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const { type = 'info', message, title, duration = 4500 } = toast;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    info: {
      bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      barBg: '#38BDF8',
      iconColor: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      defaultTitle: 'Information',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
    success: {
      bg: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      barBg: '#10B981',
      iconColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      defaultTitle: 'Success',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    warning: {
      bg: 'linear-gradient(135deg, #0F172A 0%, #451A03 100%)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      barBg: '#F59E0B',
      iconColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      defaultTitle: 'Attention',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    error: {
      bg: 'linear-gradient(135deg, #0F172A 0%, #4C0519 100%)',
      borderColor: 'rgba(244, 63, 94, 0.4)',
      barBg: '#F43F5E',
      iconColor: '#F43F5E',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
      defaultTitle: 'Action Failed',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  }[type];

  return (
    <div
      style={{
        pointerEvents: 'auto',
        position: 'relative',
        background: config.bg,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        color: '#F8FAFC',
        overflow: 'hidden',
        animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <div
        style={{
          color: config.iconColor,
          backgroundColor: config.badgeBg,
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
        <h4
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 700,
            color: '#F8FAFC',
            letterSpacing: '0.01em',
            lineHeight: '1.3',
          }}
        >
          {title || config.defaultTitle}
        </h4>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '12.5px',
            color: '#94A3B8',
            lineHeight: '1.45',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748B',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          margin: '-4px -4px 0 0',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#F8FAFC';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748B';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            backgroundColor: config.barBg,
            animation: `toastProgress ${duration}ms linear forwards`,
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
};
