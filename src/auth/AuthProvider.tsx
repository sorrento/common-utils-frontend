import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Auth, 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AuthConfig, UserProfileData } from './types';
import { sendAuthEmail } from './emailClient';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  config: AuthConfig;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, extraData?: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<boolean>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;
  updateUserProfileData: (data: Partial<UserProfileData>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  auth: Auth;
  db: Firestore;
  config: AuthConfig;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, auth, db, config }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const usersCollection = config.firestoreUsersCollection || 'users';
  const currentAppId = config.appId || config.appName;


  const fetchUserProfile = async (currentUser: User): Promise<UserProfileData | null> => {
    try {
      const userRef = doc(db, usersCollection, currentUser.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const profile = snapshot.data() as UserProfileData;

        // Si la app activa tiene strictAppScope activado, validamos los permisos del usuario
        if (config.strictAppScope) {
          const userAllowedApps = profile.allowedApps || (profile.appId ? [profile.appId] : []);
          const isAllowed = userAllowedApps.includes(currentAppId);

          if (!isAllowed) {
            console.warn(`[AuthProvider] Acceso denegado: El usuario ${currentUser.email} no tiene permisos para ${currentAppId}`);
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            throw new Error(`Acceso denegado. Tu cuenta no tiene permisos para ingresar a ${config.appName}.`);
          }
        }

        // Si el perfil ya existe pero no tiene rol asignado, lo aseguramos como Admin para cuentas de administrador de sistema
        const normalizedRole = profile.role || 'Admin';
        const updatedProfile = { ...profile, role: normalizedRole };

        setUserProfile(updatedProfile);
        return updatedProfile;
      } else {
        // Si no existe perfil en Firestore, lo creamos asignado a esta app con el rol Admin
        const initialProfile: UserProfileData = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          emailVerified: currentUser.emailVerified,
          createdAt: new Date().toISOString(),
          companyName: config.companyName,
          appId: currentAppId,
          allowedApps: [currentAppId],
          role: 'Admin',
        };
        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
        return initialProfile;
      }


    } catch (err) {
      console.error('[AuthProvider] Error leyendo/validando perfil en Firestore:', err);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchUserProfile(currentUser);
        } catch (e) {
          // Si falló el aislamiento, el estado ya se limpia dentro de fetchUserProfile
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      await fetchUserProfile(auth.currentUser);
    }
  };

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(credential.user);
  };

  const register = async (
    email: string, 
    password: string, 
    displayName: string, 
    extraData: Record<string, any> = {}
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = credential.user;

    await updateProfile(newUser, { displayName });

    const newProfile: UserProfileData = {
      uid: newUser.uid,
      email: newUser.email || email,
      displayName,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      companyName: config.companyName,
      appId: currentAppId,
      allowedApps: [currentAppId],
      ...extraData,
    };

    const userRef = doc(db, usersCollection, newUser.uid);
    await setDoc(userRef, newProfile);
    setUserProfile(newProfile);


    // Intentar enviar email de verificación vía cliente/Resend
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      // Usamos el fallback de Firebase para obtener el link o enviarlo
      await firebaseSendEmailVerification(newUser, actionCodeSettings);
    } catch (e) {
      console.warn('[AuthProvider] Excepción al solicitar correo de verificación:', e);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendVerificationEmail = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await firebaseSendEmailVerification(auth.currentUser, {
        url: window.location.origin,
        handleCodeInApp: true,
      });
      return true;
    } catch (err) {
      console.error('[AuthProvider] Error enviando email de verificación:', err);
      return false;
    }
  };

  const sendResetPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      await firebaseSendPasswordResetEmail(auth, email, {
        url: window.location.origin,
      });
      return true;
    } catch (err) {
      console.error('[AuthProvider] Error enviando reset de contraseña:', err);
      return false;
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfileData>) => {
    if (!user) return;
    const userRef = doc(db, usersCollection, user.uid);
    const updatedData = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(userRef, updatedData);

    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }

    setUserProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const changePassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    await updatePassword(auth.currentUser, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        config,
        login,
        register,
        logout,
        sendVerificationEmail,
        sendResetPasswordEmail,
        updateUserProfileData,
        changePassword,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
