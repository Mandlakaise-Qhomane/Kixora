// Kixora Production Environment Configuration & Validation
export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  useSupabaseCatalog: boolean;
  paymentProviderMode: 'mock' | 'stripe' | 'payfast' | 'paypal';
  paymentPublicKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  payfastMerchantId: string;
  payfastMerchantKey: string;
  payfastPassphrase: string;
  payfastSandbox: boolean;
  customerDomain: string;
  adminDomain: string;
}

export function getEnvConfig(): EnvConfig {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};

  const paymentProviderMode = (metaEnv.VITE_PAYMENT_PROVIDER_MODE || procEnv.VITE_PAYMENT_PROVIDER_MODE || 'mock') as EnvConfig['paymentProviderMode'];

  return {
    supabaseUrl: metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '',
    supabaseAnonKey: metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || '',
    useSupabaseCatalog: (metaEnv.VITE_USE_SUPABASE_CATALOG || procEnv.VITE_USE_SUPABASE_CATALOG) === 'true',
    paymentProviderMode,
    paymentPublicKey: metaEnv.VITE_PAYMENT_PUBLIC_KEY || procEnv.VITE_PAYMENT_PUBLIC_KEY || '',
    stripePublishableKey: metaEnv.VITE_STRIPE_PUBLISHABLE_KEY || procEnv.VITE_STRIPE_PUBLISHABLE_KEY || '',
    stripeWebhookSecret: procEnv.STRIPE_WEBHOOK_SECRET || metaEnv.STRIPE_WEBHOOK_SECRET || '',
    payfastMerchantId: metaEnv.VITE_PAYFAST_MERCHANT_ID || procEnv.VITE_PAYFAST_MERCHANT_ID || '',
    payfastMerchantKey: metaEnv.VITE_PAYFAST_MERCHANT_KEY || procEnv.VITE_PAYFAST_MERCHANT_KEY || '',
    payfastPassphrase: procEnv.PAYFAST_PASSPHRASE || metaEnv.PAYFAST_PASSPHRASE || '',
    payfastSandbox: (metaEnv.VITE_PAYFAST_SANDBOX ?? procEnv.VITE_PAYFAST_SANDBOX ?? 'true') !== 'false',
    customerDomain: metaEnv.VITE_CUSTOMER_DOMAIN || procEnv.VITE_CUSTOMER_DOMAIN || 'https://kixora.com',
    adminDomain: metaEnv.VITE_ADMIN_DOMAIN || procEnv.VITE_ADMIN_DOMAIN || 'https://admin.kixora.com',
  };
}

export function isPaymentConfigured(): boolean {
  const config = getEnvConfig();
  if (config.paymentProviderMode === 'mock') return true;
  if (config.paymentProviderMode === 'stripe') return !!config.stripePublishableKey || !!config.paymentPublicKey;
  if (config.paymentProviderMode === 'payfast') return !!config.payfastMerchantId && !!config.payfastMerchantKey;
  return !!config.paymentPublicKey;
}
