import { describe, expect, it } from 'vitest';
import {
  computeMd5,
  generatePayFastSignature,
  verifyPayFastSignature,
} from '../../src/services/payments/crypto';
import {
  initiatePayFastCheckout,
  type PayFastCheckoutDependencies,
  type PayFastOrderRecord,
} from '../../src/services/payments/payfastCheckout';

const CONFIG = {
  merchantId: 'sandbox-merchant',
  merchantKey: 'sandbox-key',
  passphrase: 'sandbox-passphrase',
  customerOrigin: 'https://shop.example.test',
  sandbox: true,
};

function makeOrder(overrides: Partial<PayFastOrderRecord> = {}): PayFastOrderRecord {
  return {
    order_code: 'KXO-1234',
    user_id: null,
    guest_access_token: 'guest-token-secret',
    payment_status: 'pending',
    total: '1250.50',
    customer_snapshot: {
      email: 'buyer@example.test',
      fullName: 'Example Buyer',
    },
    ...overrides,
  };
}

function makeDependencies(order = makeOrder()): PayFastCheckoutDependencies {
  return {
    findOrder: async orderCode => ({
      order: orderCode === order.order_code ? order : null,
    }),
    getUserId: async accessToken => accessToken === 'buyer-token' ? 'buyer-id' : 'another-user',
    config: CONFIG,
  };
}

describe('PayFast signatures', () => {
  it('includes blank fields in received order when signing an ITN', () => {
    const fields = {
      m_payment_id: 'KXO-1234',
      amount_gross: '',
      payment_status: 'COMPLETE',
    };

    const signature = generatePayFastSignature(fields, 'sandbox passphrase');
    expect(signature).toBe(computeMd5(
      'm_payment_id=KXO-1234&amount_gross=&payment_status=COMPLETE&passphrase=sandbox+passphrase'
    ));
    expect(verifyPayFastSignature(fields, signature, 'sandbox passphrase').valid).toBe(true);
  });
});

describe('PayFast checkout initiation', () => {
  it('rejects an authenticated user who does not own the order', async () => {
    const result = await initiatePayFastCheckout(
      { orderCode: 'KXO-1234', authorization: 'Bearer other-user-token' },
      {
        ...makeDependencies(makeOrder({ user_id: 'buyer-id' })),
        getUserId: async () => 'another-user',
      }
    );

    expect(result.status).toBe(403);
  });

  it('rejects a guest with the wrong access token', async () => {
    const result = await initiatePayFastCheckout(
      { orderCode: 'KXO-1234', guestAccessToken: 'wrong-token' },
      makeDependencies()
    );

    expect(result.status).toBe(403);
  });

  it('rejects an order that is already paid', async () => {
    const result = await initiatePayFastCheckout(
      { orderCode: 'KXO-1234', guestAccessToken: 'guest-token-secret' },
      makeDependencies(makeOrder({ payment_status: 'paid' }))
    );

    expect(result.status).toBe(409);
  });

  it('uses the database amount and real order code, ignoring a client amount', async () => {
    const result = await initiatePayFastCheckout(
      {
        orderCode: 'KXO-1234',
        guestAccessToken: 'guest-token-secret',
        amount: '0.01',
      },
      makeDependencies()
    );

    expect(result.status).toBe(200);
    if (!('processUrl' in result.body)) throw new Error('Expected PayFast initialization to succeed.');
    expect(result.body.processUrl).toBe('https://sandbox.payfast.co.za/eng/process');
    expect(result.body.fields.m_payment_id).toBe('KXO-1234');
    expect(result.body.fields.amount).toBe('1250.50');
    expect(result.body.fields.notify_url).toBe('https://shop.example.test/api/webhooks/payfast');
    expect(verifyPayFastSignature(result.body.fields, result.body.fields.signature, CONFIG.passphrase).valid).toBe(true);
  });
});
