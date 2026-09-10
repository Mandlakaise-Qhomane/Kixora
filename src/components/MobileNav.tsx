import React from 'react';
import { useStore } from '../context/StoreContext';
import { Home, ShoppingBag, Flame, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setIsCartOpen,
    setIsWishlistOpen,
    openAuthModal,
    cart,
  } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goStore = (anchor?: string) => {
    setCurrentView('store');
    if (anchor) {
      requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[56px] text-[10px] font-bold uppercase tracking-wider ${
      active ? 'text-[#FF7A00]' : 'text-[#888888]'
    }`;

  return (
    <nav
      aria-label="Mobile primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111111]/95 backdrop-blur-md border-t border-[#2C2C2C] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        <button className={itemClass(currentView === 'store')} onClick={() => goStore()}>
          <Home className="w-5 h-5" />
          Home
        </button>
        <button className={itemClass(false)} onClick={() => goStore('catalog-section')}>
          <ShoppingBag className="w-5 h-5" />
          Shop
        </button>
        <button className={itemClass(currentView === 'drops')} onClick={() => setCurrentView('drops')}>
          <Flame className="w-5 h-5" />
          Drops
        </button>
        <button className={`${itemClass(false)} relative`} onClick={() => setIsCartOpen(true)}>
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-4 min-w-[16px] h-4 px-1 rounded-full bg-[#FF7A00] text-black text-[9px] font-mono flex items-center justify-center">
              {cartCount}
            </span>
          )}
          Cart
        </button>
        <button
          className={itemClass(false)}
          onClick={() => {
            setIsWishlistOpen(false);
            openAuthModal('signin');
          }}
        >
          <User className="w-5 h-5" />
          Account
        </button>
      </div>
    </nav>
  );
};
