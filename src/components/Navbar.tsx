import React, { useState } from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { ViewMode, Brand } from '../types';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onToggleMobileFilters?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileFilters }) => {
  const { 
    cart, 
    wishlist, 
    setIsCartOpen, 
    setIsWishlistOpen, 
    currentView, 
    setCurrentView,
    filters,
    setFilters
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavClick = (view: ViewMode) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111]/95 backdrop-blur-md border-b border-[#2C2C2C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo matching Reference Image */}
          <div className="flex items-center gap-3">
            <button
              id="header-logo-btn"
              onClick={() => handleNavClick('store')}
              className="flex items-center gap-2 group text-left focus:outline-none"
              aria-label="Kixora"
            >
              <span className="sr-only">Kixora</span>
              <div aria-hidden="true" className="font-display font-extrabold text-2xl sm:text-3xl tracking-wider text-white flex items-center">
                <span>KI</span>
                <span className="text-[#FF7A00] drop-shadow-[0_0_12px_rgba(255,122,0,0.6)]">X</span>
                <span>ORA</span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links matching Reference Image: HOME, SHOP, NEW RELEASES, BRANDS, ABOUT */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-wider uppercase font-sans">
            <button
              id="nav-link-home"
              onClick={() => handleNavClick('store')}
              className={`relative py-2 transition-colors ${
                currentView === 'store' ? 'text-white' : 'text-[#888888] hover:text-white'
              }`}
            >
              <span>HOME</span>
              {currentView === 'store' && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7A00] rounded-full"
                />
              )}
            </button>

            <button
              id="nav-link-shop"
              onClick={() => {
                handleNavClick('store');
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative py-2 transition-colors ${
                currentView === 'shop' ? 'text-white' : 'text-[#888888] hover:text-white'
              }`}
            >
              <span>SHOP</span>
            </button>

            <button
              id="nav-link-new-releases"
              onClick={() => handleNavClick('drops')}
              className={`relative py-2 transition-colors flex items-center gap-1.5 ${
                currentView === 'drops' ? 'text-white' : 'text-[#888888] hover:text-white'
              }`}
            >
              <span>NEW RELEASES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-ping" />
              {currentView === 'drops' && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7A00] rounded-full"
                />
              )}
            </button>

            <button
              id="nav-link-brands"
              onClick={() => {
                handleNavClick('store');
                const el = document.getElementById('brands-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2 text-[#888888] hover:text-white transition-colors"
            >
              <span>BRANDS</span>
            </button>

            <button
              id="nav-link-customizer"
              onClick={() => handleNavClick('customizer')}
              className={`relative py-2 transition-colors flex items-center gap-1 ${
                currentView === 'customizer' ? 'text-white' : 'text-[#888888] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#FF7A00]" />
              <span>3D LAB</span>
              {currentView === 'customizer' && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7A00] rounded-full"
                />
              )}
            </button>

            <button
              id="nav-link-about"
              onClick={() => handleNavClick('tracking')}
              className={`relative py-2 transition-colors ${
                currentView === 'tracking' ? 'text-white' : 'text-[#888888] hover:text-white'
              }`}
            >
              <span>AUTHENTICITY</span>
              {currentView === 'tracking' && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF7A00] rounded-full"
                />
              )}
            </button>
          </nav>

          {/* Right Header Controls matching Reference Image */}
          <div className="flex items-center space-x-4">
            {/* Search Input matching reference image */}
            <div className="hidden md:flex items-center relative w-64 lg:w-72">
              <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="header-search-input"
                type="text"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search sneakers..."
                className="w-full bg-[#1A1A1A] text-xs text-[#F5F5F5] placeholder-[#666666] pl-10 pr-4 py-2.5 rounded-lg border border-[#2C2C2C] focus:outline-none focus:border-[#FF7A00] transition-colors"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Wishlist Icon */}
            <button
              id="header-wishlist-button"
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 text-[#888888] hover:text-white hover:bg-[#232323] rounded-lg transition-colors"
              title="Saved Grails"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF7A00]" />
              )}
            </button>

            {/* Admin Switcher / Profile Icon */}
            <button
              id="header-admin-profile-button"
              onClick={() => handleNavClick(currentView === 'admin' ? 'store' : 'admin')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                currentView === 'admin'
                  ? 'bg-[#FF7A00] text-black'
                  : 'text-[#888888] hover:text-white hover:bg-[#232323]'
              }`}
              title={currentView === 'admin' ? 'Exit Admin' : 'Admin Panel'}
            >
              <User className="w-5 h-5" />
              <span className="hidden xl:inline text-[11px] font-mono">
                {currentView === 'admin' ? 'Store' : 'Admin'}
              </span>
            </button>

            {/* Cart Icon with Orange Badge counter matching reference image */}
            <button
              id="header-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#888888] hover:text-white hover:bg-[#232323] rounded-lg transition-colors group"
            >
              <ShoppingBag className="w-5 h-5 text-[#F5F5F5] group-hover:text-[#FF7A00] transition-colors" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF7A00] text-black font-bold font-mono text-[11px] flex items-center justify-center shadow-lg shadow-[#FF7A00]/40">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#888888] hover:text-white rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#111111] border-b border-[#2C2C2C] px-4 py-6 space-y-4"
          >
            {/* Mobile Search */}
            <div className="relative w-full mb-4">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search sneakers..."
                className="w-full bg-[#1A1A1A] text-xs text-[#F5F5F5] pl-9 pr-4 py-2.5 rounded-lg border border-[#2C2C2C] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase font-sans">
              <button
                onClick={() => handleNavClick('store')}
                className={`p-3 rounded-lg text-left ${currentView === 'store' ? 'bg-[#FF7A00] text-black font-extrabold' : 'bg-[#1A1A1A] text-[#F5F5F5]'}`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  handleNavClick('store');
                  const el = document.getElementById('catalog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-3 rounded-lg text-left bg-[#1A1A1A] text-[#F5F5F5]"
              >
                Shop Vault
              </button>
              <button
                onClick={() => handleNavClick('drops')}
                className={`p-3 rounded-lg text-left ${currentView === 'drops' ? 'bg-[#FF7A00] text-black' : 'bg-[#1A1A1A] text-[#F5F5F5]'}`}
              >
                New Releases 🔥
              </button>
              <button
                onClick={() => handleNavClick('customizer')}
                className={`p-3 rounded-lg text-left ${currentView === 'customizer' ? 'bg-[#FF7A00] text-black' : 'bg-[#1A1A1A] text-[#F5F5F5]'}`}
              >
                3D Custom Lab ✨
              </button>
              <button
                onClick={() => handleNavClick('tracking')}
                className={`p-3 rounded-lg text-left ${currentView === 'tracking' ? 'bg-[#FF7A00] text-black' : 'bg-[#1A1A1A] text-[#F5F5F5]'}`}
              >
                Track Order 📦
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className={`p-3 rounded-lg text-left ${currentView === 'admin' ? 'bg-[#FF7A00] text-black' : 'bg-[#1A1A1A] text-[#FF7A00]'}`}
              >
                Admin Panel ⚡
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
