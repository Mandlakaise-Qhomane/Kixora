import React from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export const WishlistModal: React.FC = () => {
  const { 
    sneakers, 
    wishlist, 
    isWishlistOpen, 
    setIsWishlistOpen, 
    toggleWishlist, 
    addToCart,
    openSneakerModal,
    setIsCartOpen 
  } = useStore();

  if (!isWishlistOpen) return null;

  const wishlistedSneakers = sneakers.filter(s => wishlist.includes(s.id));

  return (
    <div id="wishlist-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#282828] rounded-3xl overflow-hidden shadow-2xl text-[#F5F5F5] my-auto"
      >
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-[#FF7A00] fill-[#FF7A00]" />
            <h2 className="font-display font-black text-lg uppercase tracking-wider text-white">
              SAVED GRAILS ({wishlistedSneakers.length})
            </h2>
          </div>

          <button
            id="wishlist-close-btn"
            onClick={() => setIsWishlistOpen(false)}
            className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {wishlistedSneakers.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="w-12 h-12 text-[#444444] mx-auto" />
              <h3 className="font-display font-bold text-white">No Saved Grails Yet</h3>
              <p className="text-xs text-[#888888]">
                Click the heart icon on any sneaker in the vault to save it to your wishlist.
              </p>
            </div>
          ) : (
            wishlistedSneakers.map(sneaker => (
              <div
                key={sneaker.id}
                className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#282828] flex items-center justify-between gap-4"
              >
                <div
                  onClick={() => {
                    setIsWishlistOpen(false);
                    openSneakerModal(sneaker);
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={sneaker.images[0]}
                    alt={sneaker.name}
                    className="w-14 h-14 object-contain bg-[#111111] rounded-lg p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-xs text-white truncate">{sneaker.name}</h4>
                    <div className="text-[10px] font-mono text-[#FF7A00] uppercase font-bold">{sneaker.brand}</div>
                    <div className="text-xs font-mono font-black text-white mt-0.5">{formatPrice(sneaker.price)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart(sneaker, sneaker.sizes[0]?.size || 9, 1);
                      setIsWishlistOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="px-3 py-2 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs uppercase rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(sneaker.id)}
                    className="p-2 text-[#888888] hover:text-[#EF4444] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
