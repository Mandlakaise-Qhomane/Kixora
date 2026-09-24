import React from 'react';
import { useStore } from '../context/StoreContext';
import { Home, ShoppingBag, Flame, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const MobileNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setIsCartOpen,
    openAuthModal,
    cart,
  } = useStore();
  const { isAuthenticated } = useAuth();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goStore = (anchor?: string) => {
    setCurrentView('store');
    requestAnimationFrame(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const tabs = [
    {
      id: 'mobile-nav-home',
      label: 'Home',
      icon: Home,
      active: currentView === 'store',
      onClick: () => goStore(),
    },
    {
      id: 'mobile-nav-shop',
      label: 'Shop',
      icon: ShoppingBag,
      active: false,
      onClick: () => goStore('catalog-section'),
    },
    {
      id: 'mobile-nav-drops',
      label: 'Drops',
      icon: Flame,
      active: currentView === 'drops',
      onClick: () => setCurrentView('drops'),
    },
    {
      id: 'mobile-nav-cart',
      label: 'Cart',
      icon: ShoppingCart,
      active: false,
      badge: cartCount > 0 ? cartCount : undefined,
      onClick: () => setIsCartOpen(true),
    },
    {
      id: 'mobile-nav-account',
      label: 'Account',
      icon: User,
      active: false,
      dot: isAuthenticated,
      onClick: () => openAuthModal(isAuthenticated ? 'profile' : 'signin'),
    },
  ];

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111111]/95 backdrop-blur-md border-t border-[#2C2C2C] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {tabs.map(({ id, label, icon: Icon, active, badge, dot, onClick }) => (
          <button
            key={id}
            id={id}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
              active ? 'text-[#FF7A00]' : 'text-[#888888] hover:text-[#AAAAAA]'
            }`}
          >
            {/* Active indicator bar at top */}
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#FF7A00] shadow-[0_0_6px_rgba(255,122,0,0.7)]" />
            )}

            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />

              {/* Cart badge */}
              {badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#FF7A00] text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-md">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}

              {/* Auth dot */}
              {dot && !badge && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF7A00] border border-[#111111]" />
              )}
            </div>

            <span className={`text-[9px] font-bold uppercase tracking-wider font-sans ${active ? 'text-[#FF7A00]' : ''}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
