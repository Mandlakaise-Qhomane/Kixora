import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { Cart, CartWithItems, CartItem } from '../types/domain';

type GetCartParams = {
  userId?: string;
  guestSessionToken?: string;
};

export const cartRepository = {
  async getOrCreateCart({ userId, guestSessionToken }: GetCartParams): Promise<Cart> {
    if (!userId && !guestSessionToken) {
      throw new Error('Must provide either userId or guestSessionToken');
    }

    let query = supabase.from('carts').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (guestSessionToken) {
      query = query.eq('guest_session_token', guestSessionToken);
    }

    const { data: existingCarts, error: findError } = await query.limit(1);
    
    if (findError) throw handleSupabaseError(findError);
    
    if (existingCarts && existingCarts.length > 0) {
      return existingCarts[0] as any;
    }

    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({
        user_id: userId || null,
        guest_session_token: guestSessionToken || null
      } as any)
      .select()
      .single();

    if (createError) throw handleSupabaseError(createError);
    return newCart as any;
  },

  async getCartWithItems(cartId: string): Promise<CartWithItems | null> {
    const res = await supabase
      .from('carts')
      .select('*, items:cart_items(*, product:products(*), product_size:product_sizes(*), bespoke_design:bespoke_designs(*))')
      .eq('id', cartId)
      .single();

    if (res.error) {
      if (res.error.code === 'PGRST116') return null;
      throw handleSupabaseError(res.error);
    }

    return res.data as any;
  },

  async addItemToCart(
    cartId: string, 
    productSizeId: string, 
    productId: string, 
    quantity: number,
    bespokeDesignId?: string
  ): Promise<CartItem> {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({
        cart_id: cartId,
        product_size_id: productSizeId,
        product_id: productId,
        quantity,
        bespoke_design_id: bespokeDesignId || null,
      } as any, {
        onConflict: 'cart_id, product_size_id, bespoke_design_id'
      })
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as any;
  },

  async updateItemQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity } as any)
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as any;
  },

  async removeItem(cartItemId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw handleSupabaseError(error);
  },

  async clearCart(cartId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw handleSupabaseError(error);
  }
};
