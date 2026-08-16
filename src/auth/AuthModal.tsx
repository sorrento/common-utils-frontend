import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, sendResetPasswordEmail, config } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const primaryColor = config.primaryColor || '#0f172a';

  const resetFormState = () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(false);
  };

  const handleModeChange = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    resetFormState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'register') {
        await register(email, password, displayName, extraData);
        setSuccessMessage('¡Cuenta creada correctamente! Se ha enviado un correo de verificación.');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (mode === 'forgot') {
        const sent = await sendResetPasswordEmail(email);
        if (sent) {
          setSuccessMessage('Correo de restablecimiento enviado. Por favor revisa tu bandeja de entrada.');
        } else {
          setError('No se pudo enviar el correo. Verifica que la dirección sea correcta.');
        }
      }
    } catch (err: any) {
      console.error('[AuthModal] Error:', err);
      let msg = err.message || 'Ha ocurrido un error inesperado.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Correo electrónico o contraseña incorrectos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'El correo electrónico ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      }
      setError(msg);
    } finally {
      setLoading(false);
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
        maxWidth: '440px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
      }}>
        {/* Header / Logo */}
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {config.logoUrl && (
            <img src={config.logoUrl} alt={config.appName} style={{ maxHeight: '48px', marginBottom: '12px' }} />
          )}
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {config.appName}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {config.companyName}
          </p>
        </div>

        {/* Dynamic Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', textAlign: 'center' }}>
          {mode === 'login' && 'Iniciar Sesión'}
          {mode === 'register' && 'Crear Nueva Cuenta'}
          {mode === 'forgot' && 'Recuperar Contraseña'}
        </h3>

        {/* Alert Error / Success */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Juan Pérez"
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
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
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

          {mode !== 'forgot' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          )}

          {/* Custom Fields (Register Mode) */}
          {mode === 'register' && config.customFields && config.customFields.map((field) => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={extraData[field.name] || ''}
                  onChange={(e) => setExtraData({ ...extraData, [field.name]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  value={extraData[field.name] || ''}
                  onChange={(e) => setExtraData({ ...extraData, [field.name]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: primaryColor,
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Procesando...' : (
              mode === 'login' ? 'Entrar' :
              mode === 'register' ? 'Registrarse' : 'Enviar Correo'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ marginTop: '20px', textTransform: 'none', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          {mode === 'login' && config.allowSelfRegistration !== false && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div style={{ marginTop: '8px' }}>
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Regístrate
                </button>
              </div>
            </>
          )}

          {mode === 'login' && config.allowSelfRegistration === false && (
            <div>
              <button
                type="button"
                onClick={() => handleModeChange('forgot')}
                style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: '12px', padding: 0 }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                Las altas de usuario son administradas por la organización.
              </div>
            </div>
          )}


          {mode === 'register' && (
            <div>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Inicia Sesión
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
