import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

test.describe('Phase 5A: Realtime Inventory & Order Tracking', () => {
  
  test('RT-01: Storefront reacts to realtime inventory updates', async ({ page }) => {
    await page.goto('/');
    
    // Wait for products to load
    await page.waitForSelector('.product-card');
    
    // Find a specific product (e.g. the first one)
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.scrollIntoViewIfNeeded();
    
    // Get product ID from a data attribute if available, or just use the first one we know
    // In Kixora, product cards usually show "Sold Out" or stock count if low
    // For this test, we'll open the modal to see specific sizes
    await firstProduct.click();
    await page.waitForSelector('#product-modal-backdrop');
    
    // We need to know which size to update
    // Let's find a size button that is not sold out
    const sizeButton = page.locator('button[aria-label^="US"]').first();
    const sizeText = await sizeButton.innerText(); // e.g. "US 10"
    const sizeValue = sizeText.replace('US ', '');
    
    // In a real environment, we'd find the product_size_id. 
    // Since we are in a test, we might need to query the DB to find the ID for this product and size.
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get the product name to find it in the DB
      const productName = await page.locator('h2').first().innerText();
      
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('name', productName)
        .maybeSingle();
        
      if (product) {
        const { data: sizeRow } = await supabase
          .from('product_sizes')
          .select('id')
          .eq('product_id', product.id)
          .eq('size_us', sizeValue)
          .maybeSingle();
          
        if (sizeRow) {
          // Now we have the product_size_id, let's update its stock to 0 (Sold Out)
          // First, verify it's NOT sold out in UI
          await expect(sizeButton).not.toHaveClass(/cursor-not-allowed/);
          
          // Trigger realtime update
          await supabase
            .from('inventory')
            .update({ stock: 0, reserved_stock: 0 })
            .eq('product_size_id', sizeRow.id);
            
          // Verify UI updates to "Sold Out" (line-through or disabled)
          await expect(sizeButton).toHaveClass(/cursor-not-allowed/, { timeout: 10000 });
          
          // Restore stock
          await supabase
            .from('inventory')
            .update({ stock: 10, reserved_stock: 0 })
            .eq('product_size_id', sizeRow.id);
            
          await expect(sizeButton).not.toHaveClass(/cursor-not-allowed/);
        }
      }
    } else {
      console.warn('Supabase credentials missing in test environment, skipping live realtime check');
      test.skip();
    }
  });

  test('RT-02: Order tracking updates in realtime when status changes', async ({ page }) => {
    // This test would require an existing order
    // We can use a mock or a pre-seeded order
    await page.goto('/');
    
    // Navigate to tracking
    await page.click('#nav-link-about');
    await page.waitForSelector('#order-tracking-view');
    
    // Search for a dummy order if it doesn't show one automatically
    // For this test, we'll assume there's at least one order if we are logged in or have one in local storage
    
    const activeOrderHeader = page.locator('h2:has-text("Order #")');
    if (await activeOrderHeader.count() > 0) {
      const orderText = await activeOrderHeader.innerText();
      const orderId = orderText.replace('Order #', '').trim();
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Change status to 'Authenticated'
        await supabase
          .from('orders')
          .update({ current_status: 'Authenticated' })
          .eq('id', orderId);
          
        // Verify status badge updates
        await expect(page.locator('span:has-text("Authenticated")')).toBeVisible({ timeout: 10000 });
        
        // Add a status history entry
        await supabase
          .from('order_status_history')
          .insert({
            order_id: orderId,
            status: 'Authenticated',
            title: 'Vault Verified',
            description: 'Your grail has passed our 12-point authentication.'
          });
          
        // Verify timeline updates
        await expect(page.locator('div:has-text("Vault Verified")')).toBeVisible({ timeout: 10000 });
      }
    } else {
       console.warn('No active order to track, skipping live order tracking check');
       test.skip();
    }
  });
});
