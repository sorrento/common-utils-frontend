import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, logout, sendVerificationEmail, updateUserProfileData, changePassword, reloadUser, config } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const primaryColor = config.primaryColor || '#0f172a';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      await updateUserProfileData({ displayName });
      if (newPassword.trim()) {
        await changePassword(newPassword);
        setNewPassword('');
      }
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err: any) {
      console.error('[UserManagementModal] Error al actualizar:', err);
      setMessage({ type: 'error', text: err.message || 'Error al actualizar el perfil.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendVerification = async () => {
    setMessage(null);
    const ok = await sendVerificationEmail();
    if (ok) {
      setMessage({ type: 'success', text: 'Correo de verificación enviado. Revisa tu bandeja de entrada.' });
    } else {
      setMessage({ type: 'error', text: 'No se pudo enviar el correo de verificación.' });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
          Gestión de Perfil de Usuario
        </h3>

        {/* Verification Status Banner */}
        {!user.emailVerified ? (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <strong>Email no verificado</strong>
              <div style={{ fontSize: '12px', color: '#b45309' }}>Verifica tu dirección para todas las funciones.</div>
            </div>
            <button
              onClick={handleSendVerification}
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reenviar
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#166534',
          }}>
            ✓ Correo electrónico verificado ({user.email})
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Correo Electrónico
            </label>
            <input
              type="text"
              disabled
              value={user.email || ''}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Aplicaciones Autorizadas
            </label>
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginTop: '4px'
            }}>
              {(userProfile?.allowedApps || [userProfile?.appId || config.appName]).map((app) => (
                <span 
                  key={app}
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ✓ {app}
                </span>
              ))}
            </div>
          </div>


          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Rol Asignado
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.role || 'Admin'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>



          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Nueva Contraseña (Opcional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Dejar en blanco para mantener la actual"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={updating}
              style={{
                flex: 1,
                backgroundColor: primaryColor,
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: updating ? 'not-allowed' : 'pointer',
              }}
            >
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
