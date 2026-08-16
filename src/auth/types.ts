export interface CustomFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required?: boolean;
  defaultValue?: string | number;
}

export interface AuthConfig {
  appName: string;
  appId?: string; // Identificador único de la app (ej: 'new-maritime', 'optiport')
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;
  emailServiceUrl?: string; // Centralized Cloud Function Resend URL
  firestoreUsersCollection?: string; // Default: 'users'
  strictAppScope?: boolean; // Si es true, valida que el usuario pertenezca a esta app
  allowSelfRegistration?: boolean; // Si es false, solo los admins pueden dar de alta usuarios
  customFields?: CustomFieldConfig[];
  roles?: Array<{ id: string; label: string; description?: string }>;
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  role?: string;
  department?: string;
  avatarUrl?: string;
  appId?: string;
  allowedApps?: string[];
  status?: 'active' | 'invited' | 'suspended';
  [key: string]: any;
}

