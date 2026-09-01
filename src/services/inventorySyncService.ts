import { supabase } from '../lib/supabase';
import { fulfillmentService } from './fulfillmentService';

export const inventorySyncService = {
  /**
   * Runs a full reconciliation across all active fulfillment channels.
   */
  async runFullSync(): Promise<{ processed: number; discrepancies: number }> {
    try {
      // 1. Fetch active channels
      const { data: channels, error: channelError } = await supabase
        .from('fulfillment_channels')
        .select('*')
        .eq('is_active', true);

      if (channelError) throw channelError;

      // 2. Fetch all product sizes that need sync
      const { data: productSizes, error: sizeError } = await supabase
        .from('product_sizes')
        .select('id, sku');

      if (sizeError) throw sizeError;

      let processed = 0;
      let discrepancies = 0;

      for (const channel of channels) {
        for (const size of productSizes) {
          try {
            // In a real scenario, we'd call the channel's API to get their stock for this SKU
            // For this implementation, we simulate an external stock check
            const externalStock = await this.mockExternalStockCheck(channel, size.sku);
            
            // Check discrepancy and log/sync
            const { data: currentInventory } = await supabase
              .from('inventory')
              .select('stock')
              .eq('product_size_id', size.id)
              .single();

            if (currentInventory && currentInventory.stock !== externalStock) {
              await fulfillmentService.reconcileInventory(size.id, externalStock, channel.id);
              discrepancies++;
            }
            
            processed++;
          } catch (err) {
            console.error(`Sync failed for SKU ${size.sku} on channel ${channel.name}:`, err);
          }
        }
      }

      return { processed, discrepancies };
    } catch (err) {
      console.error('[inventorySyncService.runFullSync] Error:', err);
      throw err;
    }
  },

  /**
   * Mocks an external API call to a 3PL or Marketplace
   */
  async mockExternalStockCheck(channel: any, sku: string): Promise<number> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 50));

    // For simulation: deterministic stock based on SKU length + channel type
    // This allows us to test discrepancies consistently
    const base = sku.length + (channel.provider_type === 'shopify-sync' ? 5 : 2);
    return Math.max(0, base % 50);
  }
};
