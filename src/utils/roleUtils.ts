import { UserRole, AuthUser } from '../types/auth';

/**
 * Validates and extracts a role strictly from database-controlled app_metadata.
 * NEVER reads from user_metadata (which can be modified client-side).
 */
export function extractRoleFromAppMetadata(appMetadata?: Record<string, unknown> | null): UserRole {
  if (!appMetadata || typeof appMetadata !== 'object') {
    return 'customer';
  }

  const role = (appMetadata as { role?: unknown }).role;
  if (role === 'admin' || role === 'super_admin' || role === 'customer') {
    return role;
  }

  return 'customer';
}

/**
 * Extracts the authoritative role from an AuthUser or Supabase User object.
 * Strictly ignores user_metadata.
 */
export function extractRoleFromUser(user?: AuthUser | { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null): UserRole {
  if (!user) {
    return 'anon';
  }

  // Check AuthUser structure
  if ('appMetadata' in user && user.appMetadata) {
    return extractRoleFromAppMetadata(user.appMetadata as Record<string, unknown>);
  }

  // Check Supabase User structure
  if ('app_metadata' in user && user.app_metadata) {
    return extractRoleFromAppMetadata(user.app_metadata);
  }

  // If role is explicitly set on user object (and not anon)
  if ('role' in user && typeof user.role === 'string') {
    const r = user.role;
    if (r === 'admin' || r === 'super_admin' || r === 'customer') {
      return r;
    }
  }

  return 'customer';
}

/**
 * Determines whether a user has administrative access.
 */
export function hasAdminRole(role?: UserRole | string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Determines whether a user has super administrative access.
 */
export function hasSuperAdminRole(role?: UserRole | string | null): boolean {
  return role === 'super_admin';
}

/**
 * Determines whether a role is a standard customer.
 */
export function isCustomerRole(role?: UserRole | string | null): boolean {
  return role === 'customer';
}

/**
 * Evaluates whether a role is authorized to access the Admin Hub domain.
 */
export function canAccessAdminDomain(role?: UserRole | string | null): boolean {
  return hasAdminRole(role);
}

/**
 * Detects if a client payload is attempting unauthorized role escalation.
 */
export function isUnauthorizedRoleElevation(
  currentRole: UserRole,
  attemptedRole: string | undefined
): boolean {
  if (!attemptedRole) return false;
  if (attemptedRole === currentRole) return false;

  // Customers cannot elevate to admin or super_admin
  if (currentRole === 'customer' && (attemptedRole === 'admin' || attemptedRole === 'super_admin')) {
    return true;
  }

  // Admins cannot elevate to super_admin
  if (currentRole === 'admin' && attemptedRole === 'super_admin') {
    return true;
  }

  return false;
}
