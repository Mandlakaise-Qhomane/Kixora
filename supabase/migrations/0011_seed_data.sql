-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0011 - SEED DATA (PRODUCTION CATALOG & STAGING QA)
-- Description: Authentic sneaker brands, categories, products, multi-angle images,
--              size matrices, inventory, active promo codes, drops, and staging QA data.
-- ==============================================================================

-- 1. BRANDS
INSERT INTO public.brands (id, name, slug, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Jordan', 'jordan', true),
  ('b0000000-0000-0000-0000-000000000002', 'Nike', 'nike', true),
  ('b0000000-0000-0000-0000-000000000003', 'Adidas', 'adidas', true),
  ('b0000000-0000-0000-0000-000000000004', 'Puma', 'puma', true),
  ('b0000000-0000-0000-0000-000000000005', 'New Balance', 'new-balance', true),
  ('b0000000-0000-0000-0000-000000000006', 'Vans', 'vans', true),
  ('b0000000-0000-0000-0000-000000000007', 'Converse', 'converse', true),
  ('b0000000-0000-0000-0000-000000000008', 'Travis Scott', 'travis-scott', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 2. CATEGORIES
INSERT INTO public.categories (id, name, slug, description) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'High-Top', 'high-top', 'Classic ankle-high silhouettes with maximum support and court heritage.'),
  ('c0000000-0000-0000-0000-000000000002', 'Low-Top', 'low-top', 'Versatile, low-profile skate and street sneakers for everyday rotation.'),
  ('c0000000-0000-0000-0000-000000000003', 'Lifestyle', 'lifestyle', 'Contemporary streetwear grails crafted with premium materials.'),
  ('c0000000-0000-0000-0000-000000000004', 'Basketball', 'basketball', 'Performance engineered court sneakers built for agility and impact.'),
  ('c0000000-0000-0000-0000-000000000005', 'Limited Edition', 'limited-edition', 'Rare deadstock collaborative releases and numbered vault grails.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. PRODUCTS
INSERT INTO public.products (
  id, name, slug, brand_id, category_id, gender, sku, colorway,
  price, original_price, description, details, tags, rating, reviews_count, sales_count,
  is_new_release, is_featured, is_active
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Air Jordan 1 Retro "Shattered Backboard"',
    'air-jordan-1-retro-shattered-backboard',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Unisex',
    '555088-005',
    'Black/Starfish-Sail',
    2999.00,
    3499.00,
    'Inspired by the broken glass of Michael Jordan''s historic backboard shatter during an exhibition game in Italy in 1985. Features ultra-premium tumbled leather, Sail midpanels, and vibrant Starfish orange overlays.',
    ARRAY['Tumbled Starfish Leather', 'Encapsulated Air-Sole Unit', 'Solid Rubber Outsole with Deep Flex Grooves', 'Custom Starfish Insole Graphic'],
    ARRAY['Vault Grail', 'New Drop', '3D Showcase'],
    4.95,
    142,
    88,
    true,
    true,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Travis Scott x Air Jordan 1 Low "Reverse Mocha"',
    'travis-scott-air-jordan-1-low-reverse-mocha',
    'b0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'Unisex',
    'DM7866-162',
    'Sail/University Red-Ridgerock',
    4499.00,
    5200.00,
    'The iconic collaboration combines earth-tone suede bases with crisp white leather overlays and Travis Scott''s signature oversized backward Swoosh in Sail.',
    ARRAY['Reverse Swoosh Architecture', 'Cactus Jack Heel Embroidery', 'Aged Vintage Sail Midsole', 'Brown Nubuck Underlays'],
    ARRAY['Vault Grail', 'Limited Edition', 'Hype'],
    5.00,
    215,
    124,
    true,
    true,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Nike Dunk Low Retro "Panda"',
    'nike-dunk-low-retro-panda',
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Unisex',
    'DD1391-100',
    'White/Black',
    1899.00,
    null,
    'The most iconic daily silhouette in modern sneaker culture. Timeless monochrome two-tone color blocking engineered for clean styling across all seasons.',
    ARRAY['Smooth Full-Grain Leather Upper', 'Padded Low-Cut Collar', 'Foam Insole Cushioning', 'Durable Rubber Traction Sole'],
    ARRAY['Best Seller', 'Everyday Essential'],
    4.85,
    530,
    420,
    false,
    true,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Adidas Yeezy Boost 350 V2 "Zebra"',
    'adidas-yeezy-boost-350-v2-zebra',
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'Unisex',
    'CP9654',
    'White/Core Black/Red',
    3799.00,
    4299.00,
    'Featuring a dynamic black and white Primeknit upper with reversed red ''SPLY-350'' typography, sitting atop a full-length encapsulated Boost midsole.',
    ARRAY['Re-Engineered Primeknit Pattern', 'Full-Length Energy-Returning Boost', 'Translucent Rubber Outsole', 'Distinctive Heel Pull Tab'],
    ARRAY['Vault Grail', 'Boost Comfort'],
    4.90,
    184,
    95,
    false,
    false,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'New Balance 550 "White Grey"',
    'new-balance-550-white-grey',
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000003',
    'Unisex',
    'BB550PB1',
    'White/Grey',
    1999.00,
    null,
    'Tribute to 1989 basketball heritage. Clean, low-top streamlined silhouette combining perforated white leather with subtle grey accents and vintage aesthetic.',
    ARRAY['Premium Leather and Suede Detailing', 'Breathable Mesh Collar', 'Vintage Off-White Midsole', 'Non-Marking Rubber Outsole'],
    ARRAY['Vintage Retro', 'Street Favorite'],
    4.80,
    98,
    76,
    false,
    false,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'Air Jordan 4 Retro "Black Cat"',
    'air-jordan-4-retro-black-cat',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Men',
    'CU1110-010',
    'Black/Black-Light Graphite',
    4899.00,
    5500.00,
    'Triple black perfection. Dressed in velvety matte black nubuck with matching black mesh netting, molded eyelets, and glossy Jumpman branding on the heel.',
    ARRAY['Matte Suede Nubuck Construction', 'Visible Air Cushioning in Heel', 'TPU Wing Eyelet Supports', 'Herringbone Grip Traction'],
    ARRAY['Vault Grail', 'All Black', 'High Demand'],
    4.98,
    312,
    180,
    false,
    true,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'Converse Chuck 70 High "Vintage Canvas"',
    'converse-chuck-70-high-vintage-canvas',
    'b0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000001',
    'Unisex',
    '162050C',
    'Black/Egret',
    1299.00,
    null,
    'Built off the original 1970s design with premium materials and extraordinary attention to detail. Enhanced cushioning for all-day street comfort.',
    ARRAY['Heavy-Grade 12oz Organic Canvas', 'Archival Star Ankle Patch', 'Glossy Egret Rubber Foxing', 'OrthoLite Insole Cushioning'],
    ARRAY['Classic', 'Heritage'],
    4.75,
    86,
    64,
    false,
    false,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'Puma MB.01 "Rick and Morty"',
    'puma-mb-01-rick-and-morty',
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000004',
    'Men',
    '376682-01',
    'Safety Yellow/Red',
    2899.00,
    null,
    'LaMelo Ball''s signature basketball silhouette infused with Adult Swim''s Rick and Morty portal energy. Mismatched left/right neon colorway.',
    ARRAY['NITRO Foam Infused Midsole', 'Breathable Monomesh Upper', 'High-Abrasion Non-Slip Rubber', 'Custom Rick & Morty Graphics'],
    ARRAY['Collaboration', 'Performance Court'],
    4.90,
    64,
    48,
    true,
    false,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

-- 4. MULTI-ANGLE 3D IMAGES
INSERT INTO public.product_images (product_id, image_url, angle_label, display_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85', '3/4 Dynamic View', 1),
  ('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85', 'Heel & Collar', 2),
  ('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85', 'Underside Sole', 3),

  ('a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85', 'Angle 3/4', 1),

  ('a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85', 'Top Down', 1),

  ('a0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0),
  ('a0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85', 'Side Profile', 0);

-- 5. PRODUCT SIZES & INVENTORY (US 7.5 - 13.0)
DO $$
DECLARE
  v_prod RECORD;
  v_size NUMERIC(3,1);
  v_sizes NUMERIC(3,1)[] := ARRAY[7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 13.0];
  v_size_id UUID;
  v_stock INT;
BEGIN
  FOR v_prod IN SELECT id FROM public.products LOOP
    FOREACH v_size IN ARRAY v_sizes LOOP
      INSERT INTO public.product_sizes (product_id, size_us)
      VALUES (v_prod.id, v_size)
      ON CONFLICT (product_id, size_us) DO UPDATE SET size_us = EXCLUDED.size_us
      RETURNING id INTO v_size_id;

      IF v_size IN (9.0, 9.5, 10.0, 10.5) THEN
        v_stock := 5;
      ELSIF v_size = 13.0 THEN
        v_stock := 1;
      ELSE
        v_stock := 3;
      END IF;

      INSERT INTO public.inventory (product_size_id, stock, reserved_stock)
      VALUES (v_size_id, v_stock, 0)
      ON CONFLICT (product_size_id) DO UPDATE SET stock = EXCLUDED.stock;
    END LOOP;
  END LOOP;
END $$;

-- 6. ACTIVE PROMOTIONAL CODES
INSERT INTO public.promo_codes (id, code, discount_percent, min_spend, max_uses, current_uses, is_active) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'KIX10', 10, 1500.00, 1000, 42, true),
  ('e0000000-0000-0000-0000-000000000002', 'VAULT20', 20, 3000.00, 500, 89, true),
  ('e0000000-0000-0000-0000-000000000003', 'GRAIL15', 15, 2500.00, 200, 15, true)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  min_spend = EXCLUDED.min_spend,
  is_active = EXCLUDED.is_active;

-- 7. VAULT DROPS & RAFFLE EVENTS
INSERT INTO public.drops (
  id, sneaker_name, brand_id, price, release_time, image_url, hype_level, drop_type, description, subscribers_count, is_active
) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'Travis Scott x Air Jordan 1 Low "Olive"',
    'b0000000-0000-0000-0000-000000000008',
    4999.00,
    NOW() + INTERVAL '2 days 4 hours',
    'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=1000&q=85',
    'GRAIL',
    'Raffle Draw',
    'The highly anticipated neutral olive earth-tone edition with reverse white leather Swoosh and red Cactus Jack detailing.',
    1480,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'Tiffany & Co. x Nike Air Force 1 "1837"',
    'b0000000-0000-0000-0000-000000000002',
    6499.00,
    NOW() + INTERVAL '4 days 18 hours',
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85',
    'EXTREME',
    'Shock Drop',
    'Crafted with luxury black suede, iconic Tiffany Blue pebbled leather Swoosh, and authentic .925 sterling silver heel plate.',
    2890,
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'Off-White x Nike Air Jordan 1 "Chicago"',
    'b0000000-0000-0000-0000-000000000001',
    8999.00,
    NOW() + INTERVAL '7 days 12 hours',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85',
    'GRAIL',
    'Vault Exclusive',
    'The legendary Virgil Abloh deconstructed classic. Exposed foam, stitched Swooshes, signature Helvetica text and zip tie.',
    4120,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  sneaker_name = EXCLUDED.sneaker_name,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

-- 8. DEMO CUSTOMER & ADMIN PROFILES (QA / STAGING DATA)
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

-- 9. DEMO ORDERS (QA / STAGING DATA)
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
