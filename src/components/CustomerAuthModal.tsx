import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../hooks/useAuth';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  ArrowRight, 
  Heart, 
  Package, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const CustomerAuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode,
    setIsWishlistOpen,
    setCurrentView,
    showToast
  } = useStore();

  const { 
    user, 
    isAuthenticated, 
    role, 
    signIn, 
    signUpCustomer, 
    signOut, 
    isLoading: isAuthLoading 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form errors and fields when modal opens or mode changes
  useEffect(() => {
    setTimeout(() => {
      setFormError(null);
      if (!isAuthModalOpen) {
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
      }
    }, 0);
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn({ email: email.trim(), password });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Welcome Back to Kixora', 'You are now authenticated into your Vault account.', 'success');
      closeAuthModal();
    } else {
      setFormError(result.error || 'Invalid email or password.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !password) {
      setFormError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUpCustomer({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined
    });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Account Created Successfully', `Welcome to the Kixora Vault, ${fullName.trim()}!`, 'success');
      closeAuthModal();
    } else {
      setFormError(result.error || 'Failed to create account. Please try again.');
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut();
    setIsSubmitting(false);
    showToast('Signed Out', 'You have been securely signed out of your account.', 'info');
    closeAuthModal();
  };

  return (
    <div 
      id="customer-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <motion.div
        id="customer-auth-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#161616] border border-[#282828] rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white"
      >
        {/* Close Button */}
        <button
          id="customer-auth-close-btn"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#FF7A00] shadow-lg shadow-[#FF7A00]/10">
            {isAuthenticated ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF7A00] font-bold">
              Kixora Vault Pass
            </div>
            <h2 className="font-display font-black text-xl tracking-tight text-white">
              {isAuthenticated
                ? 'Collector Profile'
                : authModalMode === 'signup'
                ? 'Create Collector Account'
                : 'Sign In to Vault'}
            </h2>
          </div>
        </div>

        {/* Form Error Notice */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            id="customer-auth-error"
            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formError}</span>
          </motion.div>
        )}

        {/* AUTHENTICATED PROFILE VIEW */}
        {isAuthenticated && user ? (
          <div id="customer-profile-view" className="space-y-6">
            {/* Account Card */}
            <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {user.fullName || 'Kixora Member'}
                  </h3>
                  <p className="text-xs text-[#888888] font-mono">{user.email}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#FF7A00]/15 border border-[#FF7A00]/40 text-[#FF7A00] text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  {role === 'customer' ? 'Verified Collector' : role}
                </span>
              </div>

              {user.phone && (
                <div className="text-xs text-[#777777] flex items-center gap-1.5 pt-2 border-t border-[#262626]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 text-xs font-semibold">
              <button
                id="customer-profile-wishlist-btn"
                onClick={() => {
                  closeAuthModal();
                  setIsWishlistOpen(true);
                }}
                className="w-full p-3 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] border border-[#2E2E2E] text-white flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-[#FF7A00]" />
                  <span>Saved Grails & Wishlist</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#666666]" />
              </button>

              <button
                id="customer-profile-orders-btn"
                onClick={() => {
                  closeAuthModal();
                  setCurrentView('tracking');
                }}
                className="w-full p-3 rounded-xl bg-[#1F1F1F] hover:bg-[#262626] border border-[#2E2E2E] text-white flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#FF7A00]" />
                  <span>Track Live Order & History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#666666]" />
              </button>
            </div>

            {/* Sign Out Button */}
            <div className="pt-3 border-t border-[#242424]">
              <button
                id="customer-auth-signout-btn"
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#202020] hover:bg-red-500/20 text-[#888888] hover:text-red-400 border border-[#2E2E2E] hover:border-red-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSubmitting ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        ) : authModalMode === 'signup' ? (
          /* SIGN UP FORM */
          <form id="customer-signup-form" onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jordan Collector"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="collector@kixora.com"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
              <span className="text-[10px] text-[#666666] mt-1 block">Minimum 6 characters</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-[#555555]">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27 82 000 0000"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <button
              id="customer-auth-submit-btn"
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="w-full py-3 px-4 bg-[#FF7A00] hover:bg-[#FF8A1A] text-black font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
            >
              {isSubmitting || isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Vault Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Sign In */}
            <div className="text-center pt-3 border-t border-[#242424]">
              <p className="text-xs text-[#888888]">
                Already have an account?{' '}
                <button
                  id="customer-auth-switch-signin"
                  type="button"
                  onClick={() => setAuthModalMode('signin')}
                  className="text-[#FF7A00] hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form id="customer-signin-form" onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="collector@kixora.com"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="customer-auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1F1F1F] text-xs text-white placeholder-[#555555] pl-10 pr-4 py-2.5 rounded-xl border border-[#2E2E2E] focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <button
              id="customer-auth-submit-btn"
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="w-full py-3 px-4 bg-[#FF7A00] hover:bg-[#FF8A1A] text-black font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
            >
              {isSubmitting || isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Sign Up */}
            <div className="text-center pt-3 border-t border-[#242424]">
              <p className="text-xs text-[#888888]">
                New collector?{' '}
                <button
                  id="customer-auth-switch-signup"
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className="text-[#FF7A00] hover:underline font-bold"
                >
                  Create an Account
                </button>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
