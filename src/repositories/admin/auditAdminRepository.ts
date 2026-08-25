import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  AdminAuditLog,
  mapAuditLogRowsToModels,
  AuditLogRow,
} from './auditAdminMapper';

export interface AuditLogFilters {
  entityType?: string;
  actionType?: string;
  adminId?: string;
  limit?: number;
  offset?: number;
}

export const auditAdminRepository = {
  /**
   * Retrieves paginated admin audit logs with filtering by entity or action type.
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AdminAuditLog[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    if (filters?.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      const limit = filters.limit || 20;
      query = query.range(filters.offset, filters.offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[auditAdminRepository.getAuditLogs] Error:', error);
      throw error;
    }

    return mapAuditLogRowsToModels((data || []) as AuditLogRow[]);
  },
};
