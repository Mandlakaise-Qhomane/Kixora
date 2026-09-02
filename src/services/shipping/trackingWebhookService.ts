import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { webhookIdempotency } from '../payments/webhookIdempotency';
import { CarrierWebhookPayload } from './carrierTypes';
import { emailService } from '../email/emailService';
import { logger } from '../../../logger';
import { verifyCarrierWebhookSignature } from '../payments/crypto';
import { getServerConfig } from '../../config/env';

export interface TrackingWebhookResult {
  success: boolean;
  idempotent: boolean;
  trackingNumber?: string;
  orderCode?: string;
  mappedStatus?: string;
  error?: string;
}

export interface VerifyAndProcessTrackingInput {
  rawBody: string;
  signatureHeader?: string;
  timestampHeader?: string;
  secret?: string;
  toleranceSeconds?: number;
  parsedPayload?: Partial<CarrierWebhookPayload>;
}

export class TrackingWebhookService {
  /**
   * Maps diverse carrier statuses into Kixora standard internal order & shipment statuses
   */
  mapCarrierStatus(rawStatus: string): {
    internalOrderStatus: 'Pending' | 'Authenticated' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    milestoneTitle: string;
    description: string;
  } {
    const s = (rawStatus || '').toUpperCase().trim();

    if (s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCHED') || s.includes('IN_TRANSIT') || s.includes('HUB') || s.includes('COLLECTED')) {
      return {
        internalOrderStatus: 'Shipped',
        milestoneTitle: s.includes('OUT') ? 'Out for Delivery' : 'In Transit via Vault Courier',
        description: s.includes('OUT')
          ? 'Courier is en route to customer destination for hand delivery.'
          : 'Package has departed regional distribution center.',
      };
    }

    if (s.includes('DELIVER') || s.includes('POD') || s.includes('COMPLETED')) {
      return {
        internalOrderStatus: 'Delivered',
        milestoneTitle: 'Delivered to Recipient',
        description: 'Package successfully delivered and signed for at destination.',
      };
    }

    if (s.includes('EXCEPTION') || s.includes('DELAY') || s.includes('FAILED')) {
      return {
        internalOrderStatus: 'Processing',
        milestoneTitle: 'Delivery Exception Notice',
        description: 'Delivery attempt delayed. Courier will re-attempt on next business cycle.',
      };
    }

    return {
      internalOrderStatus: 'Processing',
      milestoneTitle: 'Shipment Status Update',
      description: `Carrier update received: ${rawStatus}`,
    };
  }

  /**
   * Verifies carrier signature, validates timestamp replay window, and reconciles state.
   */
  async verifyAndProcessTrackingWebhook(input: VerifyAndProcessTrackingInput): Promise<TrackingWebhookResult> {
    const { rawBody, signatureHeader, timestampHeader, toleranceSeconds = 300 } = input;
    const serverConfig = getServerConfig();
    const secret = input.secret || serverConfig.shippingWebhookSecret;

    // 1. Signature Verification if secret or signature is configured/provided
    if (secret && signatureHeader) {
      const verification = verifyCarrierWebhookSignature(
        rawBody,
        signatureHeader,
        secret,
        timestampHeader,
        toleranceSeconds
      );

      if (!verification.valid) {
        logger.warn('[TrackingWebhook] Carrier signature verification failed', {
          error: verification.error,
          hasHeader: !!signatureHeader,
        });
        return {
          success: false,
          idempotent: false,
          error: verification.error || 'Invalid carrier webhook signature',
        };
      }
    } else if (secret && !signatureHeader) {
      logger.warn('[TrackingWebhook] Missing mandatory carrier signature header');
      return {
        success: false,
        idempotent: false,
        error: 'Missing carrier signature header',
      };
    }

    // 2. Parse Raw Payload
    let payload: any = input.parsedPayload;
    if (!payload && rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch (err: any) {
        logger.warn('[TrackingWebhook] Failed to parse JSON raw body', { error: err.message });
        return {
          success: false,
          idempotent: false,
          error: 'Malformed JSON webhook payload',
        };
      }
    }

    if (!payload) {
      return {
        success: false,
        idempotent: false,
        error: 'Missing webhook payload',
      };
    }

    // Standardize carrier webhook payload
    const standardizedPayload: CarrierWebhookPayload = {
      eventId: payload.eventId || payload.id || `evt_track_${Date.now()}`,
      carrier: payload.carrier || 'The Courier Guy',
      trackingNumber: payload.trackingNumber || payload.tracking_number || payload.waybill_number || '',
      orderCode: payload.orderCode || payload.order_code || payload.reference,
      status: payload.status || payload.event || 'IN_TRANSIT',
      location: payload.location || payload.depot || 'Regional Distribution Hub',
      timestamp: payload.timestamp || new Date().toISOString(),
      description: payload.description || payload.message,
    };

    return this.processTrackingWebhook(standardizedPayload);
  }

  /**
   * Processes tracking webhook from external carrier with strict idempotency and audit logs
   */
  async processTrackingWebhook(payload: CarrierWebhookPayload): Promise<TrackingWebhookResult> {
    const provider = payload.carrier.toLowerCase().replace(/\s+/g, '_');

    // 1. Idempotency Check & Atomic Lock Acquisition
    const lockAcquired = await webhookIdempotency.acquireProcessingLock(payload.eventId, provider);
    if (!lockAcquired) {
      logger.info(`[TrackingWebhook] Duplicate carrier event ignored: ${payload.eventId}`, {
        eventId: payload.eventId,
        trackingNumber: payload.trackingNumber,
      });
      return {
        success: true,
        idempotent: true,
        trackingNumber: payload.trackingNumber,
        orderCode: payload.orderCode,
      };
    }

    const mapping = this.mapCarrierStatus(payload.status);

    logger.info(`[TrackingWebhook] Processing carrier update: ${payload.carrier} - ${payload.trackingNumber}`, {
      rawStatus: payload.status,
      mappedStatus: mapping.internalOrderStatus,
      location: payload.location,
    });

    if (isSupabaseConfigured() && (payload.trackingNumber || payload.orderCode)) {
      try {
        // Find order / shipment
        let orderId: string | null = null;
        let customerEmail: string | null = null;
        let orderCode = payload.orderCode;

        if (payload.trackingNumber) {
          const { data: shipmentData } = await supabase
            .from('shipments')
            .select('order_id, orders(id, order_code, customer_snapshot)')
            .eq('tracking_number', payload.trackingNumber)
            .maybeSingle();

          if (shipmentData) {
            orderId = shipmentData.order_id;
            const ord = (shipmentData as any).orders;
            if (ord) {
              orderCode = ord.order_code;
              customerEmail = ord.customer_snapshot?.email || null;
            }
          }
        }

        if (!orderId && payload.orderCode) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('id, order_code, customer_snapshot')
            .eq('order_code', payload.orderCode)
            .maybeSingle();

          if (orderData) {
            orderId = orderData.id;
            orderCode = orderData.order_code;
            customerEmail = orderData.customer_snapshot?.email || null;
          }
        }

        if (orderId) {
          // Update shipment record
          const updateShipmentFields: any = {
            carrier_status: payload.status,
            last_status_update: payload.timestamp || new Date().toISOString(),
            raw_webhook_payload: payload,
          };
          if (mapping.internalOrderStatus === 'Delivered') {
            updateShipmentFields.delivered_at = payload.timestamp || new Date().toISOString();
          }

          await supabase
            .from('shipments')
            .update(updateShipmentFields)
            .eq('order_id', orderId);

          // Update order current status
          await supabase
            .from('orders')
            .update({ current_status: mapping.internalOrderStatus })
            .eq('id', orderId);

          // Insert order milestone history
          await supabase
            .from('order_status_history')
            .insert({
              order_id: orderId,
              status: mapping.internalOrderStatus,
              title: mapping.milestoneTitle,
              description: payload.description || mapping.description,
            });

          // Trigger email notification if customer email is available
          if (customerEmail && (mapping.internalOrderStatus === 'Shipped' || mapping.internalOrderStatus === 'Delivered')) {
            await emailService.sendShippingUpdate({
              orderCode: orderCode || 'KX-VAULT',
              customerEmail,
              trackingNumber: payload.trackingNumber || 'KX-TRACK',
              carrier: payload.carrier,
              status: mapping.milestoneTitle,
              trackingUrl: `https://kixora.com/?track=${payload.trackingNumber}`,
              currentLocation: payload.location,
            });
          }
        }
      } catch (dbErr: any) {
        logger.error(`[TrackingWebhook] Database update exception:`, { error: dbErr.message });
      }
    }

    // Mark as processed in idempotency registry
    await webhookIdempotency.recordEventProcessed({
      eventId: payload.eventId,
      provider,
      eventType: mapping.internalOrderStatus,
      orderCode: payload.orderCode,
      payload: {
        trackingNumber: payload.trackingNumber,
        status: mapping.internalOrderStatus,
        location: payload.location,
      },
      status: 'processed',
    });

    return {
      success: true,
      idempotent: false,
      trackingNumber: payload.trackingNumber,
      orderCode: payload.orderCode,
      mappedStatus: mapping.internalOrderStatus,
    };
  }
}

export const trackingWebhookService = new TrackingWebhookService();
