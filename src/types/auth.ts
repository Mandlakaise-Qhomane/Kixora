export type UserRole = 'customer' | 'admin' | 'super_admin' | 'anon';

export interface UserAppMetadata {
  role?: UserRole;
  provider?: string;
  providers?: string[];
  [key: string]: unknown;
}

export interface UserUserMetadata {
  full_name?: string;
  fullName?: string;
  phone?: string;
  role?: string; // Note: client-supplied role in user_metadata must NEVER be trusted for RBAC
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  appMetadata?: UserAppMetadata;
  userMetadata?: UserUserMetadata;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
}

export interface SignUpCustomerParams {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}
