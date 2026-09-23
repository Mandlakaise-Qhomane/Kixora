const port = process.env.PLAYWRIGHT_PORT || '3100';
process.env.PORT = port;
process.env.VITE_SUPABASE_URL = `http://127.0.0.1:${port}`;
process.env.VITE_SUPABASE_ANON_KEY = 'playwright-anon-key';
process.env.VITE_USE_SUPABASE_CATALOG = 'true';
process.env.VITE_USE_SUPABASE_AUTH = 'false';
process.env.VITE_USE_SUPABASE_CART = 'false';
process.env.VITE_USE_SUPABASE_WISHLIST = 'false';
process.env.VITE_USE_SUPABASE_ORDERS = 'false';
process.env.VITE_USE_SUPABASE_CHECKOUT = 'false';
process.env.CORS_ALLOWED_ORIGINS = [
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
  `http://admin.localhost:${port}`,
].join(',');
process.env.NODE_ENV = 'test';

await import('../server.ts');
