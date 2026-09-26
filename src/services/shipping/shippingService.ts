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
      // Fallback to vault express
      return this.drivers.get('vault_express') || new VaultExpressDriver();
    }
    return driver;
  }

  /**
   * Calculates live and fallback shipping quotes across available couriers
   */
  async calculateRates(request: ShippingRateRequest): Promise<ShippingRateQuote[]> {
    // Check if shipping is configured for production use
    const isConfigured = process.env.NODE_ENV !== 'production' || 
      Boolean(process.env.THE_COURIER_GUY_API_KEY || process.env.SHIPLOGIC_API_KEY);
    
    if (!isConfigured) {
      console.warn('[ShippingService] Shipping rates unavailable - carrier integration not configured');
      return [];
    }
    const quotes: ShippingRateQuote[] = [];

    for (const driver of this.drivers.values()) {
      try {
        const driverQuotes = await driver.calculateRates(request);
        quotes.push(...driverQuotes);
      } catch (err) {
        console.warn(`[ShippingService] Failed to get quotes from ${driver.providerName}:`, err);
      }
    }

    return quotes;
  }

  /**
   * Generates waybill label and registers the tracking record in Supabase
   */
  async createShipmentLabel(request: ShippingLabelRequest): Promise<ShippingLabelResult> {
    // Check if shipping is configured for production use
    const isConfigured = process.env.NODE_ENV !== 'production' || 
      Boolean(process.env.THE_COURIER_GUY_API_KEY || process.env.SHIPLOGIC_API_KEY);
    
    if (!isConfigured) {
      console.warn('[ShippingService] Shipping labels unavailable - carrier integration not configured');
      return {
        success: false,
        waybillId: '',
        trackingNumber: '',
        carrier: '',
        carrierId: request.carrierId || 'the_courier_guy',
        labelUrl: '',
        trackingUrl: '',
        estimatedDeliveryDate: '',
        error: 'Shipping carrier integration not configured',
      };
    }
    const driver = this.getDriver(request.carrierId);
    const labelResult = await driver.generateLabel(request);

    if (labelResult.success && isSupabaseConfigured() && request.orderId) {
      try {
        // Upsert shipment record
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

        // Update orders table with quick-access courier tracking cache
        await supabase
          .from('orders')
          .update({
            carrier: labelResult.carrier,
            tracking_number: labelResult.trackingNumber,
            tracking_url: labelResult.trackingUrl,
            current_status: 'Processing',
          })
          .eq('id', request.orderId);

        // Add milestone to order_status_history
        await supabase
          .from('order_status_history')
          .insert({
            order_id: request.orderId,
            status: 'Processing',
            title: 'Waybill & Label Generated',
            description: `Shipment label generated with ${labelResult.carrier}. Tracking: ${labelResult.trackingNumber}`,
          });

      } catch (dbErr) {
        console.warn('[ShippingService] Failed to persist shipment in Supabase:', dbErr);
      }
    }

    return labelResult;
  }

  /**
   * Retrieves tracking history and status for a given tracking number
   */
  async getTracking(trackingNumber: string, carrierId?: CarrierProviderId): Promise<CarrierTrackingResult> {
    // Check if shipping is configured for production use
    const isConfigured = process.env.NODE_ENV !== 'production' || 
      Boolean(process.env.THE_COURIER_GUY_API_KEY || process.env.SHIPLOGIC_API_KEY);
    
    if (!isConfigured) {
      console.warn('[ShippingService] Shipping tracking unavailable - carrier integration not configured');
      return {
        trackingNumber,
        carrier: 'unknown',
        status: 'PENDING_PICKUP',
        internalStatus: 'Pending',
        origin: 'unknown',
        destination: 'unknown',
        events: [],
        error: 'Shipping carrier integration not configured',
      };
    }
    const driver = this.getDriver(carrierId);
    return driver.getTracking(trackingNumber);
  }
}

export const shippingService = new ShippingService();
