import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import {
  AuthUser,
  AuthSession,
  UserRole,
  AuthState,
  SignInCredentials,
  SignUpCustomerParams,
} from '../types/auth';
import { hasAdminRole, hasSuperAdminRole } from '../utils/roleUtils';

export function useAuth(): AuthState & {
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  signUpCustomer: (params: SignUpCustomerParams) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [role, setRole] = useState<UserRole>('anon');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state from session
  const applySession = useCallback((newSession: AuthSession | null) => {
    if (newSession && newSession.user) {
      setSession(newSession);
      setUser(newSession.user);
      setRole(authService.getUserRole(newSession.user));
    } else {
      setSession(null);
      setUser(null);
      setRole('anon');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session load
    authService.getSession().then(initialSession => {
      if (isMounted) {
        applySession(initialSession);
      }
    });

    // 2. Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange(changedSession => {
      if (isMounted) {
        applySession(changedSession);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applySession]);

  const signIn = async (credentials: SignInCredentials) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signIn(credentials);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return { success: false, error: result.error };
    }
    applySession(result.session);
    return { success: true };
  };

  const signUpCustomer = async (params: SignUpCustomerParams) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signUpCustomer(params);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return { success: false, error: result.error };
    }
    applySession(result.session);
    return { success: true };
  };

  const signOut = async () => {
    setIsLoading(true);
    await authService.signOut();
    applySession(null);
  };

  const refreshSession = async () => {
    const refreshed = await authService.refreshSession();
    applySession(refreshed);
  };

  const isAuthenticated = Boolean(user && session);
  const isAdmin = hasAdminRole(role);
  const isSuperAdmin = hasSuperAdminRole(role);

  return {
    user,
    session,
    role,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isLoading,
    error,
    signIn,
    signUpCustomer,
    signOut,
    refreshSession,
  };
}
