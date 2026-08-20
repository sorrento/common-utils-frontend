import React from 'react';
import { SparklesIcon } from '../icons/Icons';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'ai' | 'purple';
  showDot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, { bg: string; color: string; dot: string }> = {
  info: { bg: 'rgba(43, 115, 224, 0.12)', color: '#2B73E0', dot: '#2B73E0' },
  success: { bg: 'rgba(49, 196, 141, 0.12)', color: '#057A55', dot: '#31C48D' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', color: '#B45309', dot: '#F59E0B' },
  danger: { bg: 'rgba(224, 36, 36, 0.12)', color: '#E02424', dot: '#E02424' },
  neutral: { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569', dot: '#64748B' },
  ai: { bg: 'rgba(147, 51, 234, 0.10)', color: '#7e22ce', dot: '#9333ea' },
  purple: { bg: 'rgba(147, 51, 234, 0.10)', color: '#7e22ce', dot: '#9333ea' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  showDot = true,
  icon,
  style,
  className = '',
}) => {
  const current = variantStyles[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.color,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {icon ? (
        icon
      ) : showDot ? (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: current.dot,
          }}
        />
      ) : null}
      {children}
    </span>
  );
};

export const AIFieldIndicator: React.FC<{
  label?: string;
  style?: React.CSSProperties;
}> = ({ label = 'AI', style }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '0',
        fontSize: '11px',
        fontWeight: 600,
        color: '#7e22ce',
        background: 'transparent',
        border: 'none',
        ...style,
      }}
      title="Field automatically populated by AI extractor"
    >
      <SparklesIcon size={12} color="#7e22ce" />
      {label}
    </span>
  );
};
