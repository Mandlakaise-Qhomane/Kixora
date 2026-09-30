import { describe, expect, it } from 'vitest';
import { extractRoleFromUser, hasAdminRole, isUnauthorizedRoleElevation } from '../../src/utils/roleUtils';

describe('roleUtils', () => {
  it('ignores client-side spoofed user_metadata roles', () => {
    const user = {
      id: 'user-1',
      email: 'customer@kixora.com',
      role: 'customer',
      app_metadata: { role: 'customer' },
      user_metadata: { role: 'super_admin' },
    } as any;

    expect(extractRoleFromUser(user)).toBe('customer');
    expect(hasAdminRole(extractRoleFromUser(user))).toBe(false);
  });

  it('blocks unauthorized role elevation for customers and admins', () => {
    expect(isUnauthorizedRoleElevation('customer', 'admin')).toBe(true);
    expect(isUnauthorizedRoleElevation('customer', 'super_admin')).toBe(true);
    expect(isUnauthorizedRoleElevation('admin', 'super_admin')).toBe(true);
    expect(isUnauthorizedRoleElevation('admin', 'admin')).toBe(false);
  });
});
