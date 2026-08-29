// ==============================================================================
// KIXORA MOCK PAYMENT GATEWAY DRIVER (Phase 3B)
// Deterministic sandbox payment driver for testing and development.
// ==============================================================================

import {
  PaymentGatewayDriver,
  PaymentProviderType,
  PaymentIntentRequest,
  PaymentIntentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  PaymentWebhookPayload,
  PaymentWebhookResponse,
  RefundRequest,
  RefundResponse
} from './types';

export class MockPaymentDriver implements PaymentGatewayDriver {
  readonly provider: PaymentProviderType = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    if (!request.amount || request.amount <= 0) {
      return {
        success: false,
        provider: this.provider,
        status: 'failed',
        error: 'Invalid payment amount specified for intent initialization.',
        errorCode: 'INVALID_AMOUNT'
      };
    }

    const intentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secret = `seti_mock_secret_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      provider: this.provider,
      paymentIntentId: intentId,
      clientSecret: secret,
      status: 'pending',
      gatewayData: {
        orderCode: request.orderCode,
        currency: request.currency || 'ZAR',
        amount: request.amount
      }
    };
  }

  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    if (!request.paymentIntentId) {
      return {
        success: false,
        provider: this.provider,
        status: 'failed',
        error: 'Payment intent ID is required for verification.'
      };
    }

    return {
      success: true,
      provider: this.provider,
      status: 'pending',
      transactionId: request.paymentIntentId
    };
  }

  async handleWebhook(payload: PaymentWebhookPayload): Promise<PaymentWebhookResponse> {
    const raw = payload.payload;
    if (!raw || !raw.type) {
      return {
        success: false,
        event: 'unknown',
        error: 'Invalid mock webhook payload structure.'
      };
    }

    const eventType = raw.type;
    const orderCode = raw.data?.object?.metadata?.orderCode || raw.orderCode;
    const paymentIntentId = raw.data?.object?.id || raw.paymentIntentId;

    if (eventType === 'payment_intent.succeeded' || eventType === 'charge.completed') {
      return {
        success: true,
        event: eventType,
        orderCode,
        paymentIntentId,
        newStatus: 'paid'
      };
    }

    if (eventType === 'payment_intent.payment_failed') {
      return {
        success: true,
        event: eventType,
        orderCode,
        paymentIntentId,
        newStatus: 'failed'
      };
    }

    return {
      success: true,
      event: eventType,
      orderCode,
      paymentIntentId,
      newStatus: 'pending'
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    if (!request.orderId) {
      return {
        success: false,
        provider: this.provider,
        status: 'paid',
        error: 'Order ID is required to process refund.'
      };
    }

    return {
      success: true,
      provider: this.provider,
      refundId: `ref_mock_${Date.now()}`,
      amountRefunded: request.amount || 0,
      status: 'refunded'
    };
  }
}
