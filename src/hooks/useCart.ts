import { useCartRepository, UseCartRepositoryResult } from './useCartRepository';
import { useStore } from '../context/StoreContext';

/**
 * High-level useCart hook.
 * If passed a userId, delegates to useCartRepository for database access.
 * Otherwise, accesses the global StoreContext cart state.
 */
export function useCart(userId?: string): UseCartRepositoryResult & {
  cart: any[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
} {
  const store = useStore();
  const repo = useCartRepository(userId);

  const subtotal = store.cart.reduce((sum, item) => sum + (item.sneaker?.price || 0) * (item.quantity || 1), 0);

  return {
    ...repo,
    cart: store.cart,
    isCartOpen: store.isCartOpen,
    setIsCartOpen: store.setIsCartOpen,
    subtotal,
  };
}
