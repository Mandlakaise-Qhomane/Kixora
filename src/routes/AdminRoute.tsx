import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, ShieldAlert, LogIn, Lock, ArrowLeft } from 'lucide-react';

export interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReturnToStore?: () => void;
}

/**
 * AdminRoute: Strictly guards administrative views.
 * Authorization is evaluated from app_metadata.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  fallback,
  onReturnToStore,
}) => {
  const { user, role, isAdmin, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div id="admin-route-loading" className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-[#888888]">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full mb-3" />
        <p className="text-xs font-mono">Verifying Vault Credentials...</p>
      </div>
    );
  }

  // If user is authorized Admin or Super Admin
  if (isAdmin) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Admin email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    const res = await signIn({ email, password });
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.error || 'Invalid administrator credentials.');
    }
  };

  // If authenticated as a customer but trying to access admin
  const isCustomerLoggedIn = user && role === 'customer';

  return (
    <div id="admin-route-forbidden" className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#111111] text-white">
      <div className="w-full max-w-md bg-[#161616] border border-[#282828] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#FF7A00]">
            {isCustomerLoggedIn ? <ShieldAlert className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-display font-black text-2xl text-white tracking-tight mb-2">
            {isCustomerLoggedIn ? '403: Access Forbidden' : 'Vault Admin Authentication'}
          </h2>
          <p className="text-xs text-[#888888] leading-relaxed">
            {isCustomerLoggedIn
              ? 'Your current account has Customer privileges and is not authorized to access the Kixora Vault Admin Console.'
              : 'Administrative credentials required. Please authenticate with your staff account.'}
          </p>
        </div>

        {!isCustomerLoggedIn && (
          <form onSubmit={handleAdminSignIn} className="space-y-4 mb-6">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kixora.com"
                className="w-full bg-[#111111] text-xs text-white placeholder-[#555555] px-4 py-2.5 rounded-xl border border-[#282828] focus:outline-none focus:border-[#FF7A00]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Security Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111111] text-xs text-white placeholder-[#555555] px-4 py-2.5 rounded-xl border border-[#282828] focus:outline-none focus:border-[#FF7A00]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF7A00] text-black font-extrabold text-xs rounded-xl shadow-lg hover:bg-[#FF8A1A] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Authenticate to Admin Console
                </>
              )}
            </button>
          </form>
        )}

        {onReturnToStore && (
          <div className="pt-4 border-t border-[#222222] text-center">
            <button
              onClick={onReturnToStore}
              className="inline-flex items-center gap-2 text-xs text-[#888888] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Storefront
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoute;
