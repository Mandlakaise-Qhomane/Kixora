import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isSupabaseAdminAuditEnabled } from '../config/features';

export interface AuditLogPayload {
  adminId?: string;
  adminEmail?: string;
  action?: string;
  actionType?: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export const auditService = {
  async log(payload: AuditLogPayload): Promise<void> {
    if (!isSupabaseConfigured() || !isSupabaseAdminAuditEnabled()) {
      return;
    }

    try {
      await supabase.from('admin_audit_logs').insert({
        admin_id: payload.adminId || null,
        admin_email: payload.adminEmail || payload.adminId || 'admin@kixora.com',
        action_type: payload.actionType || payload.action || 'MUTATION',
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        changes: payload.changes || payload.details || {},
        details: payload.details || payload.changes || {},
      });
    } catch (err) {
      console.warn('[auditService.log] Failed to write audit log:', err);
    }
  },
};
