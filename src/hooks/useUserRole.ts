import { useAuth } from './useAuth';
import { UserRole } from '../types/auth';
import { hasAdminRole, hasSuperAdminRole, isCustomerRole, canAccessAdminDomain } from '../utils/roleUtils';

export interface UserRoleState {
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCustomer: boolean;
  canAccessAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRoleState {
  const { role, isLoading } = useAuth();

  return {
    role,
    isAdmin: hasAdminRole(role),
    isSuperAdmin: hasSuperAdminRole(role),
    isCustomer: isCustomerRole(role),
    canAccessAdmin: canAccessAdminDomain(role),
    isLoading,
  };
}
