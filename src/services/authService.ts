import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isSupabaseAuthEnabled } from '../config/features';
import {
  AuthUser,
  AuthSession,
  UserRole,
  SignUpCustomerParams,
  SignInCredentials,
} from '../types/auth';
import { extractRoleFromUser, extractRoleFromAppMetadata } from '../utils/roleUtils';

const MOCK_STORAGE_KEY = 'kixora_auth_session';
let inMemorySession: AuthSession | null = null;

// Helper to map Supabase User to AuthUser
function mapSupabaseUserToAuthUser(sbUser: any): AuthUser {
  const role: UserRole = extractRoleFromAppMetadata(sbUser.app_metadata);
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    role,
    fullName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.fullName || '',
    phone: sbUser.user_metadata?.phone || '',
    appMetadata: sbUser.app_metadata || {},
    userMetadata: sbUser.user_metadata || {},
    createdAt: sbUser.created_at,
  };
}

// Helper to map Supabase Session to AuthSession
function mapSupabaseSessionToAuthSession(sbSession: any): AuthSession | null {
  if (!sbSession) return null;
  return {
    user: sbSession.user ? mapSupabaseUserToAuthUser(sbSession.user) : null,
    accessToken: sbSession.access_token || null,
    refreshToken: sbSession.refresh_token || null,
    expiresAt: sbSession.expires_at || null,
  };
}

export const authService = {
  /**
   * Signs up a standard customer.
   * Client-provided metadata CANNOT grant admin privileges.
   */
  async signUpCustomer(params: SignUpCustomerParams): Promise<{ user: AuthUser | null; session: AuthSession | null; error?: string }> {
    const { email, password, fullName, phone } = params;

    if (!email || !password) {
      return { user: null, session: null, error: 'Email and password are required.' };
    }

    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone || '',
              // Explicitly note: any role passed here is in user_metadata and NOT trusted by RLS or app_metadata
            },
          },
        });

        if (error) {
          console.error('[authService.signUpCustomer] Supabase signup error:', error.message);
          return { user: null, session: null, error: error.message };
        }

        const authUser = data.user ? mapSupabaseUserToAuthUser(data.user) : null;
        const authSession = data.session ? mapSupabaseSessionToAuthSession(data.session) : null;
        return { user: authUser, session: authSession };
      } catch (err: any) {
        console.error('[authService.signUpCustomer] Unexpected signup error:', err);
        return { user: null, session: null, error: err.message || 'Failed to sign up.' };
      }
    }

    // Mock fallback mode
    const mockUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      role: 'customer', // Always customer
      fullName,
      phone,
      appMetadata: { role: 'customer' },
      userMetadata: { full_name: fullName, phone },
      createdAt: new Date().toISOString(),
    };

    const mockSession: AuthSession = {
      user: mockUser,
      accessToken: `mock_jwt_${Date.now()}`,
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };

    inMemorySession = mockSession;
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSession));
    } catch {
      // Storage unavailable
    }

    return { user: mockUser, session: mockSession };
  },

  /**
   * Signs in a user with email and password.
   */
  async signIn(credentials: SignInCredentials): Promise<{ user: AuthUser | null; session: AuthSession | null; error?: string }> {
    const { email, password } = credentials;

    if (!email || !password) {
      return { user: null, session: null, error: 'Email and password are required.' };
    }

    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[authService.signIn] Supabase sign in error:', error.message);
          return { user: null, session: null, error: error.message };
        }

        const authUser = data.user ? mapSupabaseUserToAuthUser(data.user) : null;
        const authSession = data.session ? mapSupabaseSessionToAuthSession(data.session) : null;
        return { user: authUser, session: authSession };
      } catch (err: any) {
        console.error('[authService.signIn] Unexpected sign in error:', err);
        return { user: null, session: null, error: err.message || 'Failed to sign in.' };
      }
    }

    // Mock fallback authentication
    const isAdminEmail = email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@kixora.com';
    const role: UserRole = isAdminEmail ? 'admin' : 'customer';

    const mockUser: AuthUser = {
      id: isAdminEmail ? 'admin-001' : `user-${Date.now()}`,
      email,
      role,
      fullName: isAdminEmail ? 'Vault Administrator' : 'Kixora Collector',
      appMetadata: { role },
      userMetadata: { full_name: isAdminEmail ? 'Vault Administrator' : 'Kixora Collector' },
      createdAt: new Date().toISOString(),
    };

    const mockSession: AuthSession = {
      user: mockUser,
      accessToken: `mock_jwt_${role}_${Date.now()}`,
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };

    inMemorySession = mockSession;
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSession));
    } catch {
      // Storage unavailable
    }

    return { user: mockUser, session: mockSession };
  },

  /**
   * Signs out the current user and clears session state.
   */
  async signOut(): Promise<{ error?: string }> {
    inMemorySession = null;
    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[authService.signOut] Supabase signOut error:', error.message);
          return { error: error.message };
        }
      } catch (err: any) {
        console.error('[authService.signOut] Unexpected error:', err);
        return { error: err.message || 'Failed to sign out.' };
      }
    }

    try {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }

    return {};
  },

  /**
   * Retrieves current active session.
   */
  async getSession(): Promise<AuthSession | null> {
    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          return null;
        }
        return mapSupabaseSessionToAuthSession(data.session);
      } catch (err) {
        console.error('[authService.getSession] Error:', err);
        return null;
      }
    }

    // Mock fallback
    try {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemorySession = parsed as AuthSession;
        return inMemorySession;
      }
    } catch {
      // Storage unavailable
    }

    return inMemorySession;
  },

  /**
   * Extracts user role using strict app_metadata validation.
   */
  getUserRole(userOrSession?: AuthUser | AuthSession | null): UserRole {
    if (!userOrSession) return 'anon';
    if ('user' in userOrSession) {
      return extractRoleFromUser(userOrSession.user);
    }
    return extractRoleFromUser(userOrSession);
  },

  /**
   * Subscribes to auth state changes.
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(mapSupabaseSessionToAuthSession(session));
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // Polling / storage listener fallback for mock mode
    const handler = (e: StorageEvent) => {
      if (e.key === MOCK_STORAGE_KEY) {
        if (e.newValue) {
          try {
            callback(JSON.parse(e.newValue));
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    };

    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  },

  /**
   * Refreshes the active session.
   */
  async refreshSession(): Promise<AuthSession | null> {
    if (isSupabaseAuthEnabled() && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return null;
        return mapSupabaseSessionToAuthSession(data.session);
      } catch {
        return null;
      }
    }

    return this.getSession();
  },
};
