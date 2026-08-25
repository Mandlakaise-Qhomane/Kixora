import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, LogIn } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onOpenAuthModal?: () => void;
}

/**
 * ProtectedRoute: Requires user to be authenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  onOpenAuthModal,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-[#888888]">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full mb-3 mx-auto" />
        <p className="text-xs">Authenticating Vault Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div id="protected-route-unauthenticated" className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-[#141414] rounded-2xl border border-[#282828] max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-[#1F1F1F] border border-[#333333] flex items-center justify-center mb-5 text-[#FF7A00]">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">Authentication Required</h2>
        <p className="text-xs text-[#888888] max-w-sm mb-6">
          Please sign in to access your collector account, saved bespoke designs, and order history.
        </p>
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7A00] text-black font-extrabold text-xs rounded-xl shadow-lg hover:bg-[#FF8A1A] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Kixora
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
