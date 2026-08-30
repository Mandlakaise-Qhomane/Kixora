import { useState, useCallback, useEffect } from 'react';
import { isSupabaseAdminAuditEnabled } from '../../config/features';
import {
  auditAdminRepository,
  AuditLogFilters,
} from '../../repositories/admin/auditAdminRepository';
import { AdminAuditLog } from '../../repositories/admin/auditAdminMapper';

export function useAdminAudit(initialFilters?: AuditLogFilters) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (filters?: AuditLogFilters) => {
    if (!isSupabaseAdminAuditEnabled()) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await auditAdminRepository.getAuditLogs(filters || initialFilters);
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchLogs();
      }
    };
    init();
    return () => { ignore = true; };
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    refresh: fetchLogs,
  };
}
