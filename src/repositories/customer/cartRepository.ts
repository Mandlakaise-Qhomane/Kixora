import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CartItem, Sneaker, CustomSneakerConfig } from '../../types';
import { mapCartRowsToCartItems, CartItemHydratedRow } from './cartMapper';

export const cartRepository = {
  async getOrCreateCart(userIdOrGuestToken: string, isGuest: boolean = false): Promise<string> {
    if (!isSupabaseConfigured()) {
      return 'local-cart-id';
    }

    let query = supabase.from('carts').select('id');
    if (isGuest) {
      query = query.eq('guest_session_token', userIdOrGuestToken);
    } else {
      query = query.eq('user_id', userIdOrGuestToken);
    }

    const { data: existing, error: findError } = await query.limit(1).maybeSingle();
    if (findError) {
      console.error('[cartRepository.getOrCreateCart] Error finding cart:', findError);
      throw findError;
    }

    if (existing?.id) {
      return existing.id;
    }

    const insertPayload: any = isGuest
      ? { guest_session_token: userIdOrGuestToken }
      : { user_id: userIdOrGuestToken };

    const { data: created, error: createError } = await supabase
      .from('carts')
      .insert(insertPayload)
      .select('id')
      .single();

    if (createError) {
      console.error('[cartRepository.getOrCreateCart] Error creating cart:', createError);
      throw createError;
    }

    return created.id;
  },

  async getCart(userId: string): Promise<CartItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const cartId = await this.getOrCreateCart(userId, false);
    return this.getCartWithItems(cartId);
  },

  async getCartWithItems(cartId: string): Promise<CartItem[] & { items: CartItem[]; cart?: any }> {
    if (!isSupabaseConfigured()) {
      const emptyArr: any = [];
      emptyArr.items = [];
      return emptyArr;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          *,
          brands (*),
          categories (*),
          product_images (*),
          product_sizes (
            *,
            inventory (*)
          )
        ),
        product_sizes (*),
        bespoke_designs (*)
      `)
      .eq('cart_id', cartId);

    if (error) {
      console.error('[cartRepository.getCartWithItems] Error fetching cart items:', error);
      throw error;
    }

    const items = mapCartRowsToCartItems((data || []) as unknown as CartItemHydratedRow[]);
    const result: any = [...items];
    result.items = items;
    return result;
  },

  async addItem(
    cartIdOrUserId: string,
    sneakerOrSizeId: any,
    sizeOrQuantity?: any,
    quantityOrProductIdOrCustomization?: any,
    bespokeIdOrCustomization?: any
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    // Check if called with (userId, sneaker, size, quantity, customization)
    if (typeof sneakerOrSizeId === 'object' && sneakerOrSizeId?.id) {
      const sneaker: Sneaker = sneakerOrSizeId;
      const size: number = typeof sizeOrQuantity === 'number' ? sizeOrQuantity : 9;
      const quantity: number = typeof quantityOrProductIdOrCustomization === 'number' ? quantityOrProductIdOrCustomization : 1;
      const customization: CustomSneakerConfig | undefined = bespokeIdOrCustomization || undefined;

      let cartId = cartIdOrUserId;
      if (!cartId.includes('-') && cartId.length < 30) {
        cartId = await this.getOrCreateCart(cartIdOrUserId, false);
      }

      const { error } = await supabase.from('cart_items').insert({
        cart_id: cartId,
        product_id: sneaker.id,
        size,
        quantity,
        customization,
      });

      if (error) {
        console.error('[cartRepository.addItem] Error adding cart item:', error);
        throw error;
      }
      return;
    }

    // Called with (cartId, sizeId, quantity, productId, bespokeId)
    const cartId = cartIdOrUserId;
    const sizeId = sneakerOrSizeId;
    const quantity = typeof sizeOrQuantity === 'number' ? sizeOrQuantity : 1;
    const productId = typeof quantityOrProductIdOrCustomization === 'string' ? quantityOrProductIdOrCustomization : null;
    const bespokeId = typeof bespokeIdOrCustomization === 'string' ? bespokeIdOrCustomization : null;

    const { error } = await supabase.from('cart_items').insert({
      cart_id: cartId,
      product_size_id: sizeId,
      product_id: productId,
      quantity: quantity || 1,
      bespoke_design_id: bespokeId || null,
    });

    if (error) {
      console.error('[cartRepository.addItem] Error adding cart item:', error);
      throw error;
    }
  },

  async updateQuantity(cartItemIdOrUserId: string, cartItemIdOrQuantity: any, quantity?: number): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const itemId = quantity !== undefined ? cartItemIdOrQuantity : cartItemIdOrUserId;
    const qty = quantity !== undefined ? quantity : cartItemIdOrQuantity;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: qty })
      .eq('id', itemId);

    if (error) {
      console.error('[cartRepository.updateQuantity] Error updating quantity:', error);
      throw error;
    }
  },

  async removeItem(cartItemIdOrUserId: string, cartItemId?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const itemId = cartItemId || cartItemIdOrUserId;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('[cartRepository.removeItem] Error removing item:', error);
      throw error;
    }
  },

  async clearCart(cartIdOrUserId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    let cartId = cartIdOrUserId;
    if (!cartId.includes('-') && cartId.length < 30) {
      cartId = await this.getOrCreateCart(cartIdOrUserId, false);
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) {
      console.error('[cartRepository.clearCart] Error clearing cart:', error);
      throw error;
    }
  }
};
