import { test, expect } from '@playwright/test';
import { shippingService } from '../../src/services/shipping/shippingService';
import { TheCourierGuyDriver, VaultExpressDriver } from '../../src/services/shipping/carrierDrivers';
import { ShippingRateRequest, ShippingLabelRequest } from '../../src/services/shipping/carrierTypes';

test.describe('Phase 9: Shipping Carrier Integration', () => {

  const sampleAddress = {
    fullName: 'Sipho Zulu',
    street: '155 West Street',
    city: 'Sandton',
    stateOrProvince: 'Gauteng',
    postalCode: '2196',
    country: 'South Africa',
    phone: '+27 82 123 4567',
    email: 'sipho@example.com',
  };

  test('SHIP-01: Rate calculation returns competitive quotes for local delivery', async () => {
    const request: ShippingRateRequest = {
      destination: sampleAddress,
      itemsCount: 1,
      totalValueZar: 1800, // Below free shipping threshold
    };

    const quotes = await shippingService.calculateRates(request);
    expect(quotes.length).toBeGreaterThanOrEqual(2);

    const tcgQuote = quotes.find(q => q.carrierId === 'the_courier_guy');
    expect(tcgQuote).toBeDefined();
    expect(tcgQuote?.rateZar).toBeGreaterThan(0);
    expect(tcgQuote?.currency).toBe('ZAR');

    const vaultQuote = quotes.find(q => q.carrierId === 'vault_express');
    expect(vaultQuote).toBeDefined();
    expect(vaultQuote?.isInsured).toBe(true);
  });

  test('SHIP-02: Orders >= R2,000 qualify for free insured priority shipping', async () => {
    const request: ShippingRateRequest = {
      destination: sampleAddress,
      itemsCount: 2,
      totalValueZar: 4500, // Over R2,000 threshold
    };

    const quotes = await shippingService.calculateRates(request);
    const expressQuote = quotes.find(q => q.carrierId === 'the_courier_guy');
    expect(expressQuote?.rateZar).toBe(0);
  });

  test('SHIP-03: The Courier Guy driver generates valid waybill & tracking label', async () => {
    const driver = new TheCourierGuyDriver();
    const labelReq: ShippingLabelRequest = {
      orderId: 'ord-test-001',
      orderCode: 'KXO-7788',
      recipient: sampleAddress,
      itemsSummary: [
        {
          sku: 'AJ1-TRAVIS-MOCHA',
          name: 'Air Jordan 1 Retro Low Travis Scott Mocha',
          sizeUs: 10.5,
          quantity: 1,
          valueZar: 14500,
        },
      ],
      insuranceRequired: true,
    };

    const result = await driver.generateLabel(labelReq);
    expect(result.success).toBe(true);
    expect(result.waybillId).toContain('TCG-');
    expect(result.trackingNumber).toMatch(/^TCG\d+ZA$/);
    expect(result.trackingUrl).toContain('thecourierguy.co.za');
    expect(result.estimatedDeliveryDate).toBeDefined();
  });

  test('SHIP-04: Vault Express driver generates white-glove security tracking', async () => {
    const driver = new VaultExpressDriver();
    const labelReq: ShippingLabelRequest = {
      orderId: 'ord-vault-002',
      orderCode: 'KXO-9911',
      recipient: sampleAddress,
      itemsSummary: [
        {
          sku: 'NK-OFFWHT-CHIC',
          name: 'Nike Air Jordan 1 Off-White Chicago',
          sizeUs: 11,
          quantity: 1,
          valueZar: 85000,
        },
      ],
    };

    const result = await driver.generateLabel(labelReq);
    expect(result.success).toBe(true);
    expect(result.waybillId).toContain('KX-VLT-');
    expect(result.trackingNumber).toMatch(/^KX-\d+-ZA$/);
  });

  test('SHIP-05: Tracking query returns chronologically ordered milestone scans', async () => {
    const tracking = await shippingService.getTracking('TCG12345678ZA', 'the_courier_guy');
    expect(tracking.trackingNumber).toBe('TCG12345678ZA');
    expect(tracking.carrier).toBe('The Courier Guy');
    expect(tracking.events.length).toBeGreaterThan(0);
    expect(tracking.events[0].status).toBe('COLLECTED');
  });

});
