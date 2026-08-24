-- ==============================================================================
-- KIXORA SEED: 02_STAGING_DEMO_ORDERS (DEVELOPMENT / STAGING ONLY)
-- Description: Sample demo customer profiles, sample orders, tracking records,
--              and audit timelines for local/staging QA testing.
-- WARNING: DO NOT EXECUTE ON PRODUCTION DATABASE INSTANCES.
-- ==============================================================================

-- 1. DEMO CUSTOMER & ADMIN PROFILES
INSERT INTO public.profiles (id, email, role, full_name, phone, shipping_address) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'lerato.m@culture.co.za',
    'customer',
    'Lerato Modise',
    '+27 82 555 0192',
    '{"street": "142 Sandton Drive, Suite 402", "city": "Johannesburg", "state": "Gauteng", "zip": "2196", "country": "South Africa"}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'sibusiso.k@sneakerheads.co.za',
    'customer',
    'Sibusiso Khoza',
    '+27 71 888 4421',
    '{"street": "88 Kloof Street", "city": "Cape Town", "state": "Western Cape", "zip": "8001", "country": "South Africa"}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000099',
    'admin@kixora.co.za',
    'admin',
    'Kixora Executive Vault Admin',
    '+27 11 000 9999',
    '{"street": "Kixora Vault HQ, Rosebank", "city": "Johannesburg", "state": "Gauteng", "zip": "2196", "country": "South Africa"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 2. DEMO SAMPLE ORDER 1: AUTHENTICATED / PROCESSING
INSERT INTO public.orders (
  id, order_code, guest_access_token, user_id, customer_snapshot, subtotal, discount, shipping_fee, tax, total,
  payment_method, shipping_method, payment_status, payment_reference, current_status, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'KXO-8492',
  'demo_guest_token_8492',
  'f0000000-0000-0000-0000-000000000001',
  '{"fullName": "Lerato Modise", "email": "lerato.m@culture.co.za", "phone": "+27 82 555 0192", "street": "142 Sandton Drive, Suite 402", "city": "Johannesburg", "state": "Gauteng", "zip": "2196", "country": "South Africa"}'::jsonb,
  2999.00,
  299.90,
  0.00,
  0.00,
  2699.10,
  'Credit / Debit Card (3D Secure)',
  'Express Vault Courier (1-2 Days)',
  'paid',
  'PAY-REF-992837',
  'Processing',
  NOW() - INTERVAL '1 day 6 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (
  order_id, product_id, product_name, product_sku, size_us, unit_price, quantity, image_url
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Air Jordan 1 Retro "Shattered Backboard"',
  '555088-005',
  10.0,
  2999.00,
  1,
  'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shipments (
  order_id, tracking_number, carrier, nfc_security_tag_id, dispatched_at, estimated_delivery
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'KX-92847192-ZA',
  'Vault Priority Express',
  'NFC-TAG-8829-01',
  NOW() - INTERVAL '12 hours',
  NOW() + INTERVAL '1 day'
) ON CONFLICT (order_id) DO NOTHING;

INSERT INTO public.order_status_history (
  order_id, status, title, description, created_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Pending',
    'Order Placed',
    'Order successfully received in the vault system.',
    NOW() - INTERVAL '1 day 6 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Authenticated',
    '12-Point Authentication Passed',
    'Physical pair verified genuine with UV blacklight and RFID scan.',
    NOW() - INTERVAL '1 day 2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Processing',
    'Vault Packaging & Security Tag Attached',
    'Encrypted NFC tamper-proof tag attached. Armored dispatch boxing ready.',
    NOW() - INTERVAL '18 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. DEMO SAMPLE ORDER 2: DELIVERED
INSERT INTO public.orders (
  id, order_code, guest_access_token, user_id, customer_snapshot, subtotal, discount, shipping_fee, tax, total,
  payment_method, shipping_method, payment_status, payment_reference, current_status, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'KXO-3912',
  'demo_guest_token_3912',
  'f0000000-0000-0000-0000-000000000002',
  '{"fullName": "Sibusiso Khoza", "email": "sibusiso.k@sneakerheads.co.za", "phone": "+27 71 888 4421", "street": "88 Kloof Street", "city": "Cape Town", "state": "Western Cape", "zip": "8001", "country": "South Africa"}'::jsonb,
  1899.00,
  0.00,
  150.00,
  0.00,
  2049.00,
  'Instant EFT / Ozow',
  'Express Vault Courier (1-2 Days)',
  'paid',
  'EFT-991823-OZ',
  'Delivered',
  NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (
  order_id, product_id, product_name, product_sku, size_us, unit_price, quantity, image_url
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'Nike Dunk Low Retro "Panda"',
  'DD1391-100',
  9.5,
  1899.00,
  1,
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shipments (
  order_id, tracking_number, carrier, nfc_security_tag_id, dispatched_at, estimated_delivery, delivered_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'KX-38192847-ZA',
  'Vault Priority Express',
  'NFC-TAG-1192-02',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (order_id) DO NOTHING;
