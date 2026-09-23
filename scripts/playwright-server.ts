const port = process.env.PLAYWRIGHT_PORT || '3000';
process.env.PORT = port;
process.env.VITE_SUPABASE_URL = `http://127.0.0.1:${port}`;
process.env.VITE_SUPABASE_ANON_KEY = 'playwright-anon-key';
process.env.VITE_USE_SUPABASE_CATALOG = 'true';
process.env.VITE_USE_SUPABASE_AUTH = 'false';
process.env.VITE_USE_SUPABASE_CART = 'false';
process.env.VITE_USE_SUPABASE_WISHLIST = 'false';
process.env.VITE_USE_SUPABASE_ORDERS = 'false';
process.env.VITE_USE_SUPABASE_CHECKOUT = 'false';
process.env.VITE_CLOUDINARY_CLOUD_NAME ||= 'kixora';
process.env.VITE_CLOUDINARY_UPLOAD_PRESET ||= 'kixora_product_images';
process.env.VITE_PLAYWRIGHT_ADMIN = 'true';
process.env.CUSTOMER_ORIGIN = `http://127.0.0.1:${port}`;
process.env.ADMIN_ORIGIN = `http://admin.localhost:${port}`;
process.env.CORS_ALLOWED_ORIGINS = [
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
  `http://admin.localhost:${port}`,
].join(',');
process.env.NODE_ENV = 'test';

await import('../server.ts');
