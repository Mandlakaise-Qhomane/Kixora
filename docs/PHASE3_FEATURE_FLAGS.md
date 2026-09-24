# Phase 3 — Feature Flag Matrix & Env Documentation

## Defaults (all false for safety)
- USE_SUPABASE_CATALOG = false
- USE_SUPABASE_DROPS = false
- USE_SUPABASE_CART = false
- USE_SUPABASE_WISHLIST = false
- USE_SUPABASE_ORDERS = false
- USE_SUPABASE_CHECKOUT = false
- USE_SUPABASE_ADMIN = false
- USE_SUPABASE_AUTH = false

## Staging rollout order
1. Catalog first: VITE_USE_SUPABASE_CATALOG=true
2. Drops: VITE_USE_SUPABASE_DROPS=true
3. Cart + Wishlist: VITE_USE_SUPABASE_CART=true, VITE_USE_SUPABASE_WISHLIST=true
4. Orders: VITE_USE_SUPABASE_ORDERS=true
5. Checkout / Admin / Auth deferred to later phases

## Offline vs Supabase behavior
- Flags OFF: localStorage seed data (INITIAL_SNEAKERS, INITIAL_DROPS, etc.)
- Catalog ON: adapter.loadCatalog() → repository.getProducts() with fallback
- Drops ON: adapter.loadDrops() → repository.getDrops() with fallback
- Cart/Wishlist/Orders: repository sync only when user is authenticated; guest mode stays localStorage

## Files changed in this pass
- src/config/features.ts (already correct, defaults false)
- src/context/StoreContext.tsx (wired adapter + feature flags for catalog/drops)
- src/context/adapters/catalogAdapter.ts (already correct)
- docs/PHASE3_FEATURE_FLAGS.md (this file)

## Ready for next Phase 3 slice?
Yes — catalog and drops read paths are gated. Cart/wishlist repository wiring exists but is deferred to next slice per scope limits. Build passes.