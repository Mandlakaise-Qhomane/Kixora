export interface FeatureFlags {
  USE_SUPABASE_CATALOG: boolean;
  USE_SUPABASE_DROPS: boolean;
  USE_SUPABASE_CART: boolean;
  USE_SUPABASE_WISHLIST: boolean;
  USE_SUPABASE_ORDERS: boolean;
  USE_SUPABASE_CHECKOUT: boolean;
  USE_SUPABASE_ADMIN: boolean;
  USE_SUPABASE_ADMIN_CATALOG: boolean;
  USE_SUPABASE_ADMIN_ORDERS: boolean;
  USE_SUPABASE_ADMIN_INVENTORY: boolean;
  USE_SUPABASE_ADMIN_PROMOS: boolean;
  USE_SUPABASE_ADMIN_DROPS: boolean;
  USE_SUPABASE_ADMIN_AUDIT: boolean;
  USE_SUPABASE_AUTH: boolean;
}

const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key] !== undefined) {
    return (import.meta as any).env[key];
  }
  const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  if (proc?.env && proc.env[key] !== undefined) {
    return proc.env[key] as string;
  }
  return undefined;
};

const parseBooleanEnv = (key: string, defaultValue: boolean): boolean => {
  const val = getEnvVar(key);
  if (val === undefined || val === '') return defaultValue;
  return val.toLowerCase() === 'true' || val === '1';
};

export const FEATURES: FeatureFlags = {
  USE_SUPABASE_CATALOG: parseBooleanEnv('VITE_USE_SUPABASE_CATALOG', false),
  USE_SUPABASE_DROPS: parseBooleanEnv('VITE_USE_SUPABASE_DROPS', false),
  USE_SUPABASE_CART: parseBooleanEnv('VITE_USE_SUPABASE_CART', false),
  USE_SUPABASE_WISHLIST: parseBooleanEnv('VITE_USE_SUPABASE_WISHLIST', false),
  USE_SUPABASE_ORDERS: parseBooleanEnv('VITE_USE_SUPABASE_ORDERS', false),
  USE_SUPABASE_CHECKOUT: parseBooleanEnv('VITE_USE_SUPABASE_CHECKOUT', false),
  USE_SUPABASE_ADMIN: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN', false),
  USE_SUPABASE_ADMIN_CATALOG: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_CATALOG', false),
  USE_SUPABASE_ADMIN_ORDERS: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_ORDERS', false),
  USE_SUPABASE_ADMIN_INVENTORY: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_INVENTORY', false),
  USE_SUPABASE_ADMIN_PROMOS: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_PROMOS', false),
  USE_SUPABASE_ADMIN_DROPS: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_DROPS', false),
  USE_SUPABASE_ADMIN_AUDIT: parseBooleanEnv('VITE_USE_SUPABASE_ADMIN_AUDIT', false),
  USE_SUPABASE_AUTH: parseBooleanEnv('VITE_USE_SUPABASE_AUTH', false),
};

export const isSupabaseCatalogEnabled = (): boolean => FEATURES.USE_SUPABASE_CATALOG;
export const isSupabaseDropsEnabled = (): boolean => FEATURES.USE_SUPABASE_DROPS;
export const isSupabaseCartEnabled = (): boolean => FEATURES.USE_SUPABASE_CART;
export const isSupabaseWishlistEnabled = (): boolean => FEATURES.USE_SUPABASE_WISHLIST;
export const isSupabaseOrdersEnabled = (): boolean => FEATURES.USE_SUPABASE_ORDERS;
export const isSupabaseCheckoutEnabled = (): boolean => FEATURES.USE_SUPABASE_CHECKOUT;

export const isSupabaseAdminEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminCatalogEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_CATALOG || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminOrdersEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_ORDERS || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminInventoryEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_INVENTORY || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminPromosEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_PROMOS || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminDropsEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_DROPS || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAdminAuditEnabled = (): boolean => FEATURES.USE_SUPABASE_ADMIN_AUDIT || FEATURES.USE_SUPABASE_ADMIN;
export const isSupabaseAuthEnabled = (): boolean => FEATURES.USE_SUPABASE_AUTH;
