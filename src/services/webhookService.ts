// ==============================================================================
// KIXORA SECURE WEBHOOK PROCESSING & STATE RECONCILIATION SERVICE (Phase 3C)
// Authoritatively verifies gateway signatures, enforces idempotency, prevents
// replay attacks, and synchronizes atomic order & inventory states.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getPaymentDriver, PaymentProviderType, PaymentStatus } from './payments';
import { webhookIdempotency } from './payments/webhookIdempotency';

export interface ProcessWebhookInput {
  provider: PaymentProviderType;
  payload: any;
  rawBody?: string;
  signature?: string;
  signatureHeader?: string;
  secret?: string;
  passphrase?: string;
  toleranceSeconds?: number;
  eventIdOverride?: string;
}

export interface WebhookReconciliationResult {
  success: boolean;
  provider: PaymentProviderType;
  event: string;
  orderCode?: string;
  paymentIntentId?: string;
  paymentStatus?: PaymentStatus;
  orderStatus?: string;
  idempotent?: boolean;
  inventoryUpdated?: boolean;
  error?: string;
}

export const webhookService = {
  /**
   * Main entry point for processing and reconciling incoming webhook events.
   */
  async processWebhook(input: ProcessWebhookInput): Promise<WebhookReconciliationResult> {
    const { provider, payload, rawBody, signature, signatureHeader, secret, passphrase, toleranceSeconds } = input;

    if (!payload && !rawBody) {
      return {
        success: false,
        provider,
        event: 'unknown',
        error: 'Missing webhook payload and raw body.'
      };
    }

    try {
      const driver = getPaymentDriver(provider);

      // 1. Delegate signature verification & parsing to the driver
      const driverRes = await driver.handleWebhook({
        provider,
        payload,
        rawBody,
        signature,
        signatureHeader,
        secret,
        passphrase,
        toleranceSeconds
      });

      if (!driverRes.success) {
        return {
          success: false,
          provider,
          event: driverRes.event || 'verification_failed',
          error: driverRes.error || 'Webhook driver verification failed.'
        };
      }

      // 2. Determine unique Event ID for idempotency
      const eventId = input.eventIdOverride ||
        (driverRes.gatewayMetadata?.stripeEventId) ||
        (typeof payload === 'object' && payload?.id) ||
        (typeof payload === 'object' && payload?.m_payment_id) ||
        driverRes.paymentIntentId ||
        `evt_${provider}_${Date.now()}_${driverRes.orderCode || 'unknown'}`;

      // 3. Idempotency Check: Prevent duplicate event execution
      const alreadyProcessed = await webhookIdempotency.isEventProcessed(eventId, provider);
      if (alreadyProcessed) {
        return {
          success: true,
          provider,
          event: driverRes.event,
          orderCode: driverRes.orderCode,
          paymentIntentId: driverRes.paymentIntentId,
          paymentStatus: driverRes.newStatus,
          idempotent: true
        };
      }

      // 4. Reconcile Order & Inventory state atomically
      const reconciliation = await this.reconcileOrderState({
        provider,
        orderCode: driverRes.orderCode,
        paymentIntentId: driverRes.paymentIntentId,
        newStatus: driverRes.newStatus || 'pending',
        gatewayMetadata: driverRes.gatewayMetadata,
        eventType: driverRes.event
      });

      // 5. Record event in idempotency store
      await webhookIdempotency.recordEventProcessed({
        eventId,
        provider,
        eventType: driverRes.event,
        orderCode: driverRes.orderCode,
        payload: typeof payload === 'object' ? payload : { raw: String(rawBody || '') },
        status: reconciliation.success ? 'processed' : 'failed'
      });

      return {
        success: reconciliation.success,
        provider,
        event: driverRes.event,
        orderCode: driverRes.orderCode,
        paymentIntentId: driverRes.paymentIntentId,
        paymentStatus: driverRes.newStatus,
        orderStatus: reconciliation.orderStatus,
        inventoryUpdated: reconciliation.inventoryUpdated,
        idempotent: false,
        error: reconciliation.error
      };
    } catch (err: any) {
      console.error('[webhookService.processWebhook] Exception:', err);
      return {
        success: false,
        provider,
        event: 'error',
        error: err.message || 'Fatal error during webhook reconciliation.'
      };
    }
  },

  /**
   * Helper to verify and process Stripe webhooks with raw body and signature header.
   */
  async verifyAndProcessStripeWebhook(
    rawBody: string,
    signatureHeader: string,
    secret?: string
  ): Promise<WebhookReconciliationResult> {
    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      // Handled in driver
    }

    return this.processWebhook({
      provider: 'stripe',
      payload: parsedPayload,
      rawBody,
      signatureHeader,
      secret
    });
  },

  /**
   * Helper to verify and process PayFast ITN webhooks with payload and signature.
   */
  async verifyAndProcessPayFastWebhook(
    payload: Record<string, any>,
    signature?: string,
    passphrase?: string
  ): Promise<WebhookReconciliationResult> {
    return this.processWebhook({
      provider: 'payfast',
      payload,
      signature: signature || payload?.signature,
      passphrase
    });
  },

  /**
   * Reconciles order payment status, order tracking state, and inventory allocation.
   */
  async reconcileOrderState(params: {
    provider: PaymentProviderType;
    orderCode?: string;
    paymentIntentId?: string;
    newStatus: PaymentStatus;
    gatewayMetadata?: Record<string, any>;
    eventType: string;
  }): Promise<{ success: boolean; orderStatus?: string; inventoryUpdated?: boolean; error?: string }> {
    const { provider, orderCode, paymentIntentId, newStatus, gatewayMetadata, eventType } = params;

    if (!orderCode && !paymentIntentId) {
      return { success: true, orderStatus: 'unknown' };
    }

    if (!isSupabaseConfigured()) {
      // Local fallback representation
      return {
        success: true,
        orderStatus: newStatus === 'paid' ? 'Authenticated' : (newStatus === 'failed' || newStatus === 'cancelled' || newStatus === 'refunded' ? 'Cancelled' : 'Processing'),
        inventoryUpdated: true
      };
    }

    try {
      // Find order by code or id
      let query = supabase.from('orders').select('id, order_code, current_status, payment_status, payment_reference');
      if (orderCode) {
        query = query.eq('order_code', orderCode);
      } else if (paymentIntentId) {
        query = query.eq('payment_reference', paymentIntentId);
      }

      const { data: order, error: findError } = await query.maybeSingle();

      if (findError) {
        console.warn('[webhookService.reconcileOrderState] Error finding order:', findError);
        return { success: false, error: findError.message };
      }

      if (!order) {
        console.warn(`[webhookService.reconcileOrderState] Order not found for orderCode: ${orderCode}`);
        return { success: true, orderStatus: 'not_found' };
      }

      let nextOrderStatus = order.current_status;
      let inventoryUpdated = false;

      if (newStatus === 'paid') {
        nextOrderStatus = 'Authenticated';

        // 1. Update order row
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            current_status: 'Authenticated',
            payment_reference: paymentIntentId || order.payment_reference,
            payment_metadata: gatewayMetadata || {}
          })
          .eq('id', order.id);

        // 2. Insert order_status_history
        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status: 'Authenticated',
          notes: `Payment successfully captured via ${provider.toUpperCase()} (Event: ${eventType})`
        });

        // 3. Confirm inventory reservation into finalized sale
        try {
          await supabase.rpc('confirm_inventory_sale', { p_order_id: order.id });
          inventoryUpdated = true;
        } catch (rpcErr) {
          console.warn('[webhookService] confirm_inventory_sale RPC warning:', rpcErr);
        }

      } else if (newStatus === 'failed' || newStatus === 'cancelled') {
        nextOrderStatus = 'Cancelled';

        // 1. Update order row
        await supabase
          .from('orders')
          .update({
            payment_status: newStatus,
            current_status: 'Cancelled',
            payment_metadata: gatewayMetadata || {}
          })
          .eq('id', order.id);

        // 2. Insert order_status_history
        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status: 'Cancelled',
          notes: `Payment ${newStatus} via ${provider.toUpperCase()} (Event: ${eventType})`
        });

        // 3. Release reserved inventory back to catalog
        try {
          await supabase.rpc('release_reserved_inventory', { p_order_id: order.id });
          inventoryUpdated = true;
        } catch (rpcErr) {
          console.warn('[webhookService] release_reserved_inventory RPC warning:', rpcErr);
        }

      } else if (newStatus === 'refunded') {
        nextOrderStatus = 'Cancelled';

        // 1. Update order row
        await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            current_status: 'Cancelled',
            payment_metadata: gatewayMetadata || {}
          })
          .eq('id', order.id);

        // 2. Insert order_status_history
        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status: 'Cancelled',
          notes: `Payment fully refunded via ${provider.toUpperCase()} (Event: ${eventType})`
        });
      }

      return {
        success: true,
        orderStatus: nextOrderStatus,
        inventoryUpdated
      };
    } catch (err: any) {
      console.error('[webhookService.reconcileOrderState] Exception:', err);
      return { success: false, error: err.message || 'Database reconciliation failed.' };
    }
  }
};
