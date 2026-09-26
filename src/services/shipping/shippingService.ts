import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ShippingCarrierDriver,
  CarrierProviderId,
  ShippingRateRequest,
  ShippingRateQuote,
  ShippingLabelRequest,
  ShippingLabelResult,
  CarrierTrackingResult,
} from './carrierTypes';
import { TheCourierGuyDriver, VaultExpressDriver } from './carrierDrivers';
import { logger } from '../../../logger';

export class ShippingService {
  private drivers: Map<CarrierProviderId, ShippingCarrierDriver> = new Map();
  private defaultProvider: CarrierProviderId = 'the_courier_guy';

  constructor() {
    this.registerDriver(new TheCourierGuyDriver());
    this.registerDriver(new VaultExpressDriver());
  }

  registerDriver(driver: ShippingCarrierDriver) {
    this.drivers.set(driver.providerId, driver);
  }

  getDriver(providerId?: CarrierProviderId): ShippingCarrierDriver {
    const id = providerId || this.defaultProvider;
    const driver = this.drivers.get(id);
    if (!driver) {
      return this.drivers.get('vault_express') || new VaultExpressDriver();
    }
    return driver;
  }

  private isProductionCarrierConfigured(): boolean {
    const hasCourierKey = Boolean(process.env.THE_COURIER_GUY_API_KEY || process.env.SHIPLOGIC_API_KEY);
    const hasWebhookSecret = Boolean(process.env.SHIPPING_WEBHOOK_SECRET);
    return hasCourierKey || hasWebhookSecret;
  }

  /**
   * Calculates live and fallback shipping quotes across available couriers.
   * If production credentials are absent, we degrade gracefully instead of crashing.
   */
  async calculateRates(request: ShippingRateRequest): Promise<ShippingRateQuote[]> {
    const quotes: ShippingRateQuote[] = [];

    if (process.env.NODE_ENV === 'production' && !this.isProductionCarrierConfigured()) {
      logger.warn('[ShippingService] Production carrier auth unavailable; using fallback estimates.', {
        totalValueZar: request.totalValueZar,
        itemsCount: request.itemsCount,
      });
    }

    for (const driver of this.drivers.values()) {
      try {
        const driverQuotes = await driver.calculateRates(request);
        quotes.push(...driverQuotes);
      } catch (err: any) {
        logger.warn(`[ShippingService] Failed to get quotes from ${driver.providerName}`, {
          error: err?.message || 'unknown_error',
        });
      }
    }

    if (quotes.length === 0) {
      const fallbackDriver = this.getDriver();
      const fallbackQuotes = await fallbackDriver.calculateRates(request);
      return fallbackQuotes;
    }

    return quotes;
  }

  /**
   * Generates waybill label and registers the tracking record in Supabase.
   * In production, this still succeeds in demo/degraded mode if carrier credentials are absent.
   */
  async createShipmentLabel(request: ShippingLabelRequest): Promise<ShippingLabelResult> {
    const driver = this.getDriver(request.carrierId);
    const labelResult = await driver.generateLabel(request);

    if (process.env.NODE_ENV === 'production' && !this.isProductionCarrierConfigured()) {
      logger.warn('[ShippingService] Production carrier auth unavailable; generated degraded shipment label.', {
        orderCode: request.orderCode,
        carrier: labelResult.carrier,
      });
    }

    if (labelResult.success && isSupabaseConfigured() && request.orderId) {
      try {
        await supabase
          .from('shipments')
          .upsert({
            order_id: request.orderId,
            tracking_number: labelResult.trackingNumber,
            carrier: labelResult.carrier,
            waybill_id: labelResult.waybillId,
            label_url: labelResult.labelUrl,
            tracking_url: labelResult.trackingUrl,
            carrier_status: 'pending_pickup',
            dispatched_at: new Date().toISOString(),
            estimated_delivery: labelResult.estimatedDeliveryDate,
          }, { onConflict: 'order_id' });

        await supabase
          .from('orders')
          .update({
            carrier: labelResult.carrier,
            tracking_number: labelResult.trackingNumber,
            tracking_url: labelResult.trackingUrl,
            current_status: 'Processing',
          })
          .eq('id', request.orderId);

        await supabase
          .from('order_status_history')
          .insert({
            order_id: request.orderId,
            status: 'Processing',
            title: 'Waybill & Label Generated',
            description: `Shipment label generated with ${labelResult.carrier}. Tracking: ${labelResult.trackingNumber}`,
          });
      } catch (dbErr: any) {
        logger.warn('[ShippingService] Failed to persist shipment in Supabase', {
          error: dbErr?.message || 'unknown_db_error',
        });
      }
    }

    return labelResult;
  }

  /**
   * Retrieves tracking history and status for a given tracking number.
   * Production falls back to a seeded tracking record instead of failing the checkout.
   */
  async getTracking(trackingNumber: string, carrierId?: CarrierProviderId): Promise<CarrierTrackingResult> {
    const driver = this.getDriver(carrierId);
    try {
      return await driver.getTracking(trackingNumber);
    } catch (err: any) {
      logger.warn('[ShippingService] Tracking lookup failed; generating fallback tracking payload', {
        trackingNumber,
        error: err?.message || 'unknown_error',
      });

      const fallbackCarrier = this.getDriver('the_courier_guy');
      return fallbackCarrier.getTracking(trackingNumber);
    }
  }
}

export const shippingService = new ShippingService();
