// ==============================================================================
// KIXORA PAYMENT GATEWAY FACTORY & REGISTRY (Phase 3B)
// Centralized driver resolution for all supported payment gateways.
// ==============================================================================

import { getEnvConfig } from '../../config/env';
import { PaymentGatewayDriver, PaymentProviderType } from './types';
import { MockPaymentDriver } from './mockDriver';
import { StripePaymentDriver } from './stripeDriver';
import { PayFastPaymentDriver } from './payfastDriver';

export * from './types';
export * from './mockDriver';
export * from './stripeDriver';
export * from './payfastDriver';

// Singleton registry of drivers
const drivers: Record<PaymentProviderType, PaymentGatewayDriver> = {
  mock: new MockPaymentDriver(),
  stripe: new StripePaymentDriver(),
  payfast: new PayFastPaymentDriver(),
  paypal: new MockPaymentDriver(), // Fallback to mock driver for PayPal until provider configured
};

/**
 * Retrieve a payment driver by explicit provider name.
 */
export function getPaymentDriver(provider?: PaymentProviderType): PaymentGatewayDriver {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && provider === 'mock') {
    throw new Error('Mock payment mode is strictly prohibited in production.');
  }
  if (provider && drivers[provider]) {
    return drivers[provider];
  }
  return getActivePaymentDriver();
}

/**
 * Retrieve the active payment driver configured in current environment.
 */
export function getActivePaymentDriver(): PaymentGatewayDriver {
  const config = getEnvConfig();
  const provider = config.paymentProviderMode;
  const driver = drivers[provider];
  if (!driver) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && provider === 'mock') {
    throw new Error('Mock payment mode is strictly prohibited in production.');
  }
  return driver;
}

/**
 * Check if the active provider or specified provider is configured.
 */
export function isPaymentGatewayConfigured(provider?: PaymentProviderType): boolean {
  const driver = getPaymentDriver(provider);
  return driver.isConfigured();
}
