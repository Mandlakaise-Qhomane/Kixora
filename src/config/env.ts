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
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  cloudinaryApiKey: string;
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
  resendApiKey: string;
  emailFrom: string;
  theCourierGuyApiKey: string;
  shiplogicApiKey: string;
  shippingWebhookSecret: string;
  adminOrigin: string;
  customerOrigin: string;
}

export interface ProductionEnvValidation {
  valid: boolean;
  errors: string[];
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
    cloudinaryCloudName: metaEnv.VITE_CLOUDINARY_CLOUD_NAME || procEnv.VITE_CLOUDINARY_CLOUD_NAME || 'kixora',
    cloudinaryUploadPreset: metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || procEnv.VITE_CLOUDINARY_UPLOAD_PRESET || 'kixora_product_images',
    cloudinaryApiKey: metaEnv.VITE_CLOUDINARY_API_KEY || procEnv.VITE_CLOUDINARY_API_KEY || '',
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
      supabaseServiceRoleKey: '',
      resendApiKey: '',
      emailFrom: '',
      theCourierGuyApiKey: '',
      shiplogicApiKey: '',
      shippingWebhookSecret: '',
      adminOrigin: '',
      customerOrigin: '',
    };
  }

  const env = process.env;
  return {
    stripeSecretKey: env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    payfastPassphrase: env.PAYFAST_PASSPHRASE || '',
    payfastMerchantKeySecret: env.PAYFAST_MERCHANT_KEY || '',
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    resendApiKey: env.RESEND_API_KEY || '',
    emailFrom: env.EMAIL_FROM || 'Kixora Vault <orders@kixora.com>',
    theCourierGuyApiKey: env.THE_COURIER_GUY_API_KEY || '',
    shiplogicApiKey: env.SHIPLOGIC_API_KEY || '',
    shippingWebhookSecret: env.SHIPPING_WEBHOOK_SECRET || '',
    adminOrigin: env.ADMIN_ORIGIN || env.VITE_ADMIN_ORIGIN || env.VITE_ADMIN_DOMAIN || 'https://admin.kixora.com',
    customerOrigin: env.CUSTOMER_ORIGIN || env.VITE_CUSTOMER_ORIGIN || env.VITE_CUSTOMER_DOMAIN || 'https://kixora.com',
  };
}

export function validateProductionEnv(): ProductionEnvValidation {
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true, errors: [] };
  }

  const client = getEnvConfig();
  const server = getServerConfig();
  const errors: string[] = [];
  const provider = client.paymentProviderMode;

  if (provider !== 'stripe' && provider !== 'payfast') {
    errors.push('VITE_PAYMENT_PROVIDER_MODE must be stripe or payfast in production.');
  }

  if (provider === 'stripe') {
    if (!client.stripePublishableKey && !client.paymentPublicKey) errors.push('Stripe publishable key is required.');
    if (!server.stripeSecretKey) errors.push('STRIPE_SECRET_KEY is required.');
    if (!server.stripeWebhookSecret) errors.push('STRIPE_WEBHOOK_SECRET is required.');
  }

  if (provider === 'payfast') {
    if (!client.payfastMerchantId || !client.payfastMerchantKey) errors.push('PayFast merchant credentials are required.');
    if (!server.payfastPassphrase) errors.push('PAYFAST_PASSPHRASE is required.');
  }

  if (!server.shippingWebhookSecret) errors.push('SHIPPING_WEBHOOK_SECRET is required.');

  const origins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) {
    errors.push('CORS_ALLOWED_ORIGINS must contain explicit origins in production.');
  } else {
    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (!['http:', 'https:'].includes(parsed.protocol)) errors.push(`Invalid CORS origin: ${origin}`);
      } catch {
        errors.push(`Invalid CORS origin: ${origin}`);
      }
    }

    const adminOrigin = server.adminOrigin;
    const customerOrigin = server.customerOrigin;
    for (const [name, origin] of [['ADMIN_ORIGIN', adminOrigin], ['CUSTOMER_ORIGIN', customerOrigin]] as const) {
      try {
        const parsed = new URL(origin);
        if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
          errors.push(`${name} must be an HTTPS origin without a path, query, or hash.`);
        }
      } catch {
        errors.push(`${name} must be a valid HTTPS origin.`);
      }
    }
    if (adminOrigin === customerOrigin) {
      errors.push('ADMIN_ORIGIN and CUSTOMER_ORIGIN must be different origins.');
    }
    if (!origins.includes(adminOrigin) || !origins.includes(customerOrigin)) {
      errors.push('CORS_ALLOWED_ORIGINS must include both ADMIN_ORIGIN and CUSTOMER_ORIGIN.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isPaymentConfigured(): boolean {
  const config = getEnvConfig();
  if (config.paymentProviderMode === 'mock') {
    const isProdBrowser = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;
    const isProdServer = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
    if (isProdBrowser || isProdServer) {
      throw new Error('Payment configuration Error: Mock payment mode is strictly prohibited in production builds.');
    }
    return true;
  }
  if (config.paymentProviderMode === 'stripe') return !!config.stripePublishableKey || !!config.paymentPublicKey;
  if (config.paymentProviderMode === 'payfast') return !!config.payfastMerchantId && !!config.payfastMerchantKey;
  if (config.paymentProviderMode === 'paypal') {
    throw new Error('Payment configuration Error: PayPal is not configured.');
  }
  throw new Error(`Payment configuration Error: Unsupported payment provider "${config.paymentProviderMode}".`);
}
