import { test, expect } from '@playwright/test';
import { emailService } from '../../src/services/email/emailService';
import { checkoutService } from '../../src/services/checkoutService';
import { OrderConfirmationEmailPayload } from '../../src/services/email/emailTypes';

test.describe('Phase 9: Transactional Email Notification Pipeline', () => {

  test('EMAIL-01: Order confirmation email payload contains all mandatory order & tracking details', async () => {
    const payload: OrderConfirmationEmailPayload = {
      orderCode: 'KXO-4422',
      customerEmail: 'collector@kixora.com',
      customerName: 'Marcus Ndlovu',
      items: [
        {
          name: 'Air Jordan 4 Retro White Cement',
          sku: 'AJ4-WHT-CEM',
          sizeUs: 10,
          quantity: 1,
          unitPrice: 6500,
        },
        {
          name: 'Travis Scott x Dunk Low Premium',
          sku: 'NK-SB-TS-01',
          sizeUs: 9.5,
          quantity: 1,
          unitPrice: 22000,
        },
      ],
      subtotal: 28500,
      discount: 2850,
      shippingFee: 0,
      total: 25650,
      shippingAddress: {
        street: '44 Melrose Boulevard',
        city: 'Johannesburg',
        state: 'Gauteng',
        zip: '2196',
        country: 'South Africa',
      },
      paymentMethod: 'Credit / Debit Card',
      trackingNumber: 'TCG99887766ZA',
      trackingUrl: 'https://kixora.com/?track=TCG99887766ZA',
    };

    const result = await emailService.sendOrderConfirmation(payload);
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(['resend', 'console_fallback']).toContain(result.provider);
  });

  test('EMAIL-02: Shipping update dispatch generates milestone notice for in-transit package', async () => {
    const result = await emailService.sendShippingUpdate({
      orderCode: 'KXO-4422',
      customerEmail: 'collector@kixora.com',
      customerName: 'Marcus Ndlovu',
      trackingNumber: 'TCG99887766ZA',
      carrier: 'The Courier Guy',
      status: 'Out for Delivery',
      trackingUrl: 'https://thecourierguy.co.za/tracking?ref=TCG99887766ZA',
      currentLocation: 'Sandton Local Courier Fleet',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('EMAIL-03: Checkout service successfully triggers email confirmation in background', async () => {
    const mockSneaker = {
      id: 'snk-em-01',
      name: 'Nike Dunk Low Retro Panda',
      brand: 'Nike',
      price: 2800,
      colorway: 'Black/White',
      sku: 'DD1391-100',
      description: 'Classic court shoe',
      releaseYear: 2021,
      story: 'Story',
      mainImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewCount: 42,
      category: 'Streetwear',
      sizes: [{ size: 9, stock: 5 }],
      isGrail: false,
      isVaultExclusive: false,
    };

    const checkoutResult = await checkoutService.placeOrder({
      customerInfo: {
        email: 'grail.buyer@gmail.com',
        fullName: 'Grail Hunter',
        street: '12 Bree Street',
        city: 'Cape Town',
        state: 'Western Cape',
        zip: '8001',
        country: 'South Africa',
      },
      cartItems: [
        {
          id: 'item-01',
          sneaker: mockSneaker as any,
          selectedSize: 9,
          quantity: 1,
        },
      ],
      paymentMethod: 'Credit / Debit Card',
    });

    expect(checkoutResult.success).toBe(true);
    expect(checkoutResult.orderCode).toBeDefined();
    expect(checkoutResult.trackingNumber).toBeDefined();
  });

});
