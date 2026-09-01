import { supabase } from '../lib/supabase';
import { Order } from '../types';

export interface FulfillmentProvider {
  name: string;
  type: string;
  syncStock: (productSizeId: string, quantity: number) => Promise<boolean>;
  dispatchOrder: (order: Order) => Promise<{ trackingNumber: string; success: boolean }>;
}

export interface FulfillmentBatch {
  id: string;
  batchCode: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  orderIds: string[];
  metadata?: any;
}

export const fulfillmentService = {
  /**
   * Generates a packing list for an order
   */
  generatePackingList(order: Order): string {
    const itemsList = order.items.map(item => 
      `- ${item.sneaker.name} (Size US ${item.selectedSize}) x${item.quantity}`
    ).join('\n');

    return `
KIXORA PACKING LIST
Order: ${order.orderCode || order.id}
Customer: ${order.customer.fullName}
Address: ${order.customer.street}, ${order.customer.city}, ${order.customer.state} ${order.customer.zip}

Items:
${itemsList}

Thank you for shopping with Kixora.
    `.trim();
  },

  /**
   * Creates a fulfillment batch for bulk processing
   */
  async createBatch(orderIds: string[], metadata: any = {}): Promise<FulfillmentBatch> {
    const batchCode = `BTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { data, error } = await supabase
      .from('fulfillment_batches')
      .insert({
        batch_code: batchCode,
        status: 'draft',
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Link orders to batch
    const { error: linkError } = await supabase
      .from('orders')
      .update({ fulfillment_batch_id: data.id })
      .in('id', orderIds);

    if (linkError) throw linkError;

    return {
      id: data.id,
      batchCode: data.batch_code,
      status: data.status,
      orderIds,
      metadata: data.metadata
    };
  },

  /**
   * Processes a batch of orders: paid -> processing -> fulfilled (Shipped)
   */
  async processBatch(batchId: string): Promise<{ successCount: number; failedCount: number }> {
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('fulfillment_batch_id', batchId);

    if (fetchError) throw fetchError;

    let successCount = 0;
    let failedCount = 0;

    // Transition batch to processing
    await supabase.from('fulfillment_batches').update({ status: 'processing' }).eq('id', batchId);

    for (const order of orders) {
      try {
        // Logic for each order in batch
        // In a real 3PL sync, we'd call an external API here
        
        // Update order status to Shipped/Dispatched
        const { error: updateError } = await supabase
          .from('orders')
          .update({ current_status: 'Shipped' })
          .eq('id', order.id);

        if (updateError) throw updateError;

        successCount++;
      } catch (err) {
        console.error(`Failed to process order ${order.id} in batch ${batchId}:`, err);
        failedCount++;
      }
    }

    // Mark batch as completed
    await supabase.from('fulfillment_batches')
      .update({ 
        status: failedCount === 0 ? 'completed' : 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    return { successCount, failedCount };
  },

  /**
   * Reconciles stock with external records
   */
  async reconcileInventory(productSizeId: string, externalStock: number, channelId: string): Promise<void> {
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('stock')
      .eq('product_size_id', productSizeId)
      .single();

    if (fetchError) throw fetchError;

    const discrepancy = externalStock - inventory.stock;

    if (discrepancy !== 0) {
      // Log the discrepancy
      const { error: logError } = await supabase
        .from('inventory_sync_logs')
        .insert({
          product_size_id: productSizeId,
          channel_id: channelId,
          event_type: 'reconciliation',
          previous_stock: inventory.stock,
          new_stock: externalStock,
          discrepancy,
          metadata: { reconciled_at: new Date().toISOString() }
        });

      if (logError) throw logError;

      // Update local stock to match external truth if discrepancy found
      // (This policy depends on which system is the "Source of Truth")
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ stock: externalStock })
        .eq('product_size_id', productSizeId);

      if (updateError) throw updateError;
    }
  }
};
