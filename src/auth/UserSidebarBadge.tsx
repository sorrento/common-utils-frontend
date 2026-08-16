import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { UserManagementModal } from './UserManagementModal';
import { Icons } from '../icons';


export interface UserSidebarBadgeProps {
  className?: string;
  style?: React.CSSProperties;
  showStatusDot?: boolean;
}

export const UserSidebarBadge: React.FC<UserSidebarBadgeProps> = ({
  className = '',
  style = {},
  showStatusDot = true,
}) => {
  const { user, userProfile, logout, config } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Invitado';
  const roleLabel = userProfile?.role || userProfile?.department || 'Operador de Sistema';
  const initials = getInitials(userProfile?.displayName || user?.displayName, user?.email || undefined);

  return (
    <>
      <div
        className={`user-sidebar-badge ${className}`}
        onClick={() => {
          if (user) {
            setShowUserModal(true);
          } else {
            setShowAuthModal(true);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          ...style,
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: config.primaryColor || '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <strong
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {user ? displayName : 'Iniciar Sesión'}
          </strong>
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px',
            }}
          >
            {user ? roleLabel : 'Haz clic para acceder'}
          </span>
        </div>

        {user ? (
          <button
            title="Cerrar Sesión"
            onClick={async (e) => {
              e.stopPropagation();
              await logout();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {Icons.exit}
          </button>
        ) : (

          showStatusDot && (
            <div
              title="Sin Sesión"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                flexShrink: 0,
              }}
            />
          )
        )}

      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UserManagementModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
    </>
  );
};
