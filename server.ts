import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { webhookService } from './src/services/webhookService';
import { getServerConfig } from './src/config/env';

/**
 * Kixora Production Server (Express + Vite)
 * Handles secure webhook ingress for Stripe and PayFast, 
 * provides SPA routing, and integrates Vite for development.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', domain: 'kixora-production' });
  });

  // ===========================================================================
  // STRIPE PAYMENT INTENT (Production Blocker Fix)
  // ===========================================================================
  
  const { stripeSecretKey } = getServerConfig();
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

  app.post('/api/payments/stripe/create-intent', express.json(), async (req, res) => {
    if (!stripe) {
      console.error('[Stripe] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const { amount, currency, orderCode, customerEmail, metadata } = req.body;

    try {
      console.log(`[Stripe] Creating intent for order ${orderCode}: ${amount} ${currency}`);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency: (currency || 'zar').toLowerCase(),
        metadata: {
          orderCode,
          ...metadata
        },
        receipt_email: customerEmail,
        description: `Kixora Order ${orderCode}`
      });

      res.json({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id
      });
    } catch (err: any) {
      console.error('[Stripe Intent Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ===========================================================================
  // SECURE WEBHOOK INGRESS (Production Blocker Fix)
  // ===========================================================================

  /**
   * POST /api/webhooks/stripe
   * Stripe Signature Verification & Reconciliation
   */
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const signatureHeader = req.headers['stripe-signature'];
    const { stripeWebhookSecret } = getServerConfig();

    if (!signatureHeader) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const rawBody = req.body.toString('utf-8');

    try {
      console.log('[Stripe Webhook] Received event');
      const result = await webhookService.verifyAndProcessStripeWebhook(
        rawBody,
        signatureHeader as string,
        stripeWebhookSecret
      );
      
      if (result.success) {
        console.log(`[Stripe Webhook] Successfully processed: ${result.event} for Order ${result.orderCode}`);
        res.status(200).json({ received: true });
      } else {
        console.warn(`[Stripe Webhook] Verification failed: ${result.error}`);
        res.status(400).json({ error: result.error });
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] Exception:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/webhooks/payfast
   * PayFast ITN Verification & Reconciliation
   */
  app.post('/api/webhooks/payfast', express.urlencoded({ extended: true }), async (req, res) => {
    const { payfastPassphrase } = getServerConfig();
    const payload = req.body;

    try {
      console.log('[PayFast Webhook] Received ITN');
      const result = await webhookService.verifyAndProcessPayFastWebhook(
        payload,
        payload.signature,
        payfastPassphrase
      );

      if (result.success) {
        console.log(`[PayFast Webhook] Successfully processed: ${result.event} for Order ${result.orderCode}`);
        res.status(200).send('OK');
      } else {
        console.warn(`[PayFast Webhook] Verification failed: ${result.error}`);
        res.status(400).send(result.error || 'Verification failed');
      }
    } catch (err: any) {
      console.error('[PayFast Webhook] Exception:', err);
      res.status(500).send(err.message);
    }
  });

  // ===========================================================================
  // VITE & STATIC SERVING
  // ===========================================================================

  if (process.env.NODE_ENV !== 'production') {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware mounted.');
  } else {
    // Static file serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get('*', (req, res) => {
      // Avoid intercepting API routes that might have failed above
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static assets and SPA fallback enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kixora Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
