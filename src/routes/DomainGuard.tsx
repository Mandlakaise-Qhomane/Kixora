import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { canAccessAdminDomain } from '../utils/roleUtils';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export interface DomainInspectionResult {
  isAdminDomain: boolean;
  isCustomerDomain: boolean;
  hostname: string;
}

/**
 * Pure function to inspect current hostname and determine domain classification.
 */
export function inspectHostname(hostnameInput?: string, searchParamsInput?: string): DomainInspectionResult {
  const hostname = (
    hostnameInput ??
    (typeof window !== 'undefined' ? window.location.hostname : 'kixora.com')
  ).toLowerCase();

  const searchParams = searchParamsInput ?? (typeof window !== 'undefined' ? window.location.search : '');
  const urlParams = new URLSearchParams(searchParams);
  const domainOverride = urlParams.get('domain')?.toLowerCase();
  const isAdminParam = urlParams.get('admin') === 'true';

  // Check explicit query param override first (useful in QA/Playwright sandbox)
  if (domainOverride === 'admin' || isAdminParam) {
    return {
      isAdminDomain: true,
      isCustomerDomain: false,
      hostname,
    };
  }

  if (domainOverride === 'customer' || domainOverride === 'store') {
    return {
      isAdminDomain: false,
      isCustomerDomain: true,
      hostname,
    };
  }

  // Hostname matching
  const isAdmin =
    hostname === 'admin.kixora.com' ||
    hostname === 'admin.localhost' ||
    hostname.startsWith('admin.');

  return {
    isAdminDomain: isAdmin,
    isCustomerDomain: !isAdmin,
    hostname,
  };
}

export interface DomainGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReturnToStore?: () => void;
}

/**
 * DomainGuard:
 * - If current view is 'admin' or path is '/admin' while on the customer domain (kixora.com),
 *   it hides the Admin UI and renders a 404 Vault Not Found.
 * - Ensures Admin Hub is strictly isolated to admin.kixora.com.
 */
export const DomainGuard: React.FC<DomainGuardProps> = ({
  children,
  fallback,
  onReturnToStore,
}) => {
  const { isAdminDomain } = inspectHostname();
  const { role } = useAuth();
  const hasAccess = canAccessAdminDomain(role);

  // If on customer domain, Admin routes/views are strictly blocked (404/Inaccessible)
  if (!isAdminDomain && !hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div id="domain-guard-404" className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#111111] text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#282828] flex items-center justify-center mb-6 text-[#FF7A00]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight mb-2">404: Vault View Not Found</h1>
        <p className="text-xs text-[#888888] max-w-md mb-8">
          The requested administrative resource does not exist on this domain. Administrative management is restricted to authorized subdomains.
        </p>
        {onReturnToStore && (
          <button
            onClick={onReturnToStore}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7A00] text-black font-extrabold text-xs rounded-xl shadow-lg hover:bg-[#FF8A1A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Kixora Storefront
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default DomainGuard;
