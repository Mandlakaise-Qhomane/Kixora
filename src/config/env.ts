// Kixora Production Environment Configuration & Validation

/**
 * Client-safe configuration. These variables are safe to expose to the browser.
 * They MUST be prefixed with VITE_ in the environment.
 */
export interface ClientEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  useSupabaseCatalog: boolean;
  paymentProviderMode: 'mock' | 'stripe' | 'payfast' | 'paypal';
  paymentPublicKey: string;
  stripePublishableKey: string;
  payfastMerchantId: string;
  payfastMerchantKey: string;
  payfastSandbox: boolean;
  customerDomain: string;
  adminDomain: string;
  googleClientId: string;
}

/**
 * Server-only configuration. These variables contain sensitive secrets
 * and MUST NOT be prefixed with VITE_. They are only accessible in the Node.js environment.
 */
export interface ServerEnvConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  payfastPassphrase: string;
  payfastMerchantKeySecret: string; 
  supabaseServiceRoleKey: string;
}

export function getEnvConfig(): ClientEnvConfig {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};

  const paymentProviderMode = (metaEnv.VITE_PAYMENT_PROVIDER_MODE || procEnv.VITE_PAYMENT_PROVIDER_MODE || 'mock') as ClientEnvConfig['paymentProviderMode'];

  return {
    supabaseUrl: metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '',
    supabaseAnonKey: metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || '',
    useSupabaseCatalog: (metaEnv.VITE_USE_SUPABASE_CATALOG || procEnv.VITE_USE_SUPABASE_CATALOG) === 'true',
    paymentProviderMode,
    paymentPublicKey: metaEnv.VITE_PAYMENT_PUBLIC_KEY || procEnv.VITE_PAYMENT_PUBLIC_KEY || '',
    stripePublishableKey: metaEnv.VITE_STRIPE_PUBLISHABLE_KEY || procEnv.VITE_STRIPE_PUBLISHABLE_KEY || '',
    payfastMerchantId: metaEnv.VITE_PAYFAST_MERCHANT_ID || procEnv.VITE_PAYFAST_MERCHANT_ID || '',
    payfastMerchantKey: metaEnv.VITE_PAYFAST_MERCHANT_KEY || procEnv.VITE_PAYFAST_MERCHANT_KEY || '',
    payfastSandbox: (metaEnv.VITE_PAYFAST_SANDBOX ?? procEnv.VITE_PAYFAST_SANDBOX ?? 'true') !== 'false',
    customerDomain: metaEnv.VITE_CUSTOMER_DOMAIN || procEnv.VITE_CUSTOMER_DOMAIN || 'https://kixora.com',
    adminDomain: metaEnv.VITE_ADMIN_DOMAIN || procEnv.VITE_ADMIN_DOMAIN || 'https://admin.kixora.com',
    googleClientId: metaEnv.VITE_GOOGLE_CLIENT_ID || procEnv.VITE_GOOGLE_CLIENT_ID || '',
  };
}

/**
 * Retrieves server-side secrets. This will return empty strings in the browser.
 */
export function getServerConfig(): ServerEnvConfig {
  const isServer = typeof process !== 'undefined' && process.env;
  if (!isServer) {
    return {
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      payfastPassphrase: '',
      payfastMerchantKeySecret: '',
      supabaseServiceRoleKey: ''
    };
  }

  const env = process.env;
  return {
    stripeSecretKey: env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    payfastPassphrase: env.PAYFAST_PASSPHRASE || '',
    payfastMerchantKeySecret: env.PAYFAST_MERCHANT_KEY || '',
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

export function isPaymentConfigured(): boolean {
  const config = getEnvConfig();
  if (config.paymentProviderMode === 'mock') return true;
  if (config.paymentProviderMode === 'stripe') return !!config.stripePublishableKey || !!config.paymentPublicKey;
  if (config.paymentProviderMode === 'payfast') return !!config.payfastMerchantId && !!config.payfastMerchantKey;
  return !!config.paymentPublicKey;
}
