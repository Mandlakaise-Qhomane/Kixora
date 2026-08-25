import type { Database } from '../../types/database';

export type AuditLogRow = Database['public']['Tables']['admin_audit_logs']['Row'];

export interface AdminAuditLog {
  id: string;
  adminId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Maps database audit log row to domain AdminAuditLog model.
 */
export function mapAuditLogRowToModel(row: AuditLogRow): AdminAuditLog {
  let parsedChanges: Record<string, any> = {};
  if (row.changes) {
    try {
      parsedChanges = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes;
    } catch {
      parsedChanges = {};
    }
  }

  return {
    id: row.id,
    adminId: row.admin_id,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    changes: parsedChanges,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
}

/**
 * Maps an array of audit log rows.
 */
export function mapAuditLogRowsToModels(rows: AuditLogRow[]): AdminAuditLog[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAuditLogRowToModel);
}
