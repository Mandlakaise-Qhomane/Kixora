import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { webhookService } from './src/services/webhookService';
import { getServerConfig } from './src/config/env';
import { logger } from './logger';

/**
 * Kixora Production Server (Express + Vite)
 * Handles secure webhook ingress for Stripe and PayFast, 
 * provides SPA routing, and integrates Vite for development.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // ===========================================================================
  // REQUEST CONTEXT & LOGGING (Task 2)
  // ===========================================================================
  app.use((req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string || Math.random().toString(36).substring(2, 15);
    
    // Attach to res for access in handlers if needed
    (res as any).requestId = requestId;

    // Log request completion
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`HTTP ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent']
      });
    });

    next();
  });

  // ===========================================================================
  // SECURITY MIDDLEWARE & HEADERS (Task 4)
  // ===========================================================================
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://www.google-analytics.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://*.stripe.com", "https://images.unsplash.com", "https://res.cloudinary.com", "https://v5.airtableusercontent.com"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://*.stripe.com", "wss://*.supabase.co", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://www.google-analytics.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Standard Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // ===========================================================================
  // RATE LIMITING (Task 2)
  // ===========================================================================
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 auth attempts per hour
    message: { error: 'Too many login attempts, please try again in an hour.' }
  });

  const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 checkout initiations per hour
    message: { error: 'Too many checkout attempts, please contact support if you are having issues.' }
  });

  // Apply limiters
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/payments/stripe/create-intent', checkoutLimiter);

  // Payload Size Validation (Strict limits)
  app.use('/api/webhooks/', express.raw({ type: 'application/json', limit: '100kb' }));
  app.use('/api/payments/', express.json({ limit: '10kb' }));

  // ===========================================================================
  // SOCIAL MEDIA CRAWLER INTERCEPTOR (Task 7)
  // ===========================================================================
  app.get('/product/:id', async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const isCrawler = /Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|WhatsApp|Googlebot|bingbot|Baiduspider|yacybot|yandexbot/i.test(userAgent);
    
    if (isCrawler && process.env.NODE_ENV === 'production') {
      const productId = req.params.id;
      // In a real production app, we would fetch product data from DB here.
      // For this implementation, we serve a minimal template with standard Kixora branding
      // and instructions for the crawler.
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kixora Sneaker Vault</title>
            <meta property="og:title" content="Kixora | Sneaker Vault" />
            <meta property="og:description" content="Exclusive authenticated sneaker drops." />
            <meta property="og:image" content="https://kixora.com/og-image-default.png" />
            <meta name="twitter:card" content="summary_large_image" />
          </head>
          <body>
            <h1>Kixora</h1>
            <p>Loading sneaker details...</p>
            <script>window.location.href = "/?product=${productId}";</script>
          </body>
        </html>
      `;
      return res.send(html);
    }
    next();
  });

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', domain: 'kixora-production' });
  });

  // ===========================================================================
  // STRIPE PAYMENT INTENT (Production Blocker Fix)
  // ===========================================================================
  
  const { stripeSecretKey } = getServerConfig();
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

  app.post('/api/payments/stripe/create-intent', async (req, res) => {
    if (!stripe) {
      logger.error('[Stripe] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const { amount, currency, orderCode, customerEmail, metadata } = req.body;

    try {
      logger.info(`[Stripe] Creating intent for order ${orderCode}`, {
        orderCode,
        amount,
        currency
      });
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
      // Use structured logger
      logger.error('[Stripe Intent Error]', {
        message: err.message,
        orderCode
      });
      res.status(500).json({ error: 'Payment initialization failed.' });
    }
  });

  // ===========================================================================
  // SECURE WEBHOOK INGRESS (Production Blocker Fix)
  // ===========================================================================

  /**
   * POST /api/webhooks/stripe
   * Stripe Signature Verification & Reconciliation
   */
  app.post('/api/webhooks/stripe', async (req, res) => {
    const signatureHeader = req.headers['stripe-signature'];
    const { stripeWebhookSecret } = getServerConfig();

    if (!signatureHeader) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const rawBody = req.body.toString('utf-8');

    try {
      logger.info('[Stripe Webhook] Received event');
      const result = await webhookService.verifyAndProcessStripeWebhook(
        rawBody,
        signatureHeader as string,
        stripeWebhookSecret
      );
      
      if (result.success) {
        logger.info(`[Stripe Webhook] Successfully processed: ${result.event}`, {
          orderCode: result.orderCode,
          event: result.event
        });
        res.status(200).json({ received: true });
      } else {
        logger.warn(`[Stripe Webhook] Verification failed`, { error: result.error });
        res.status(400).json({ error: 'Webhook verification failed' });
      }
    } catch (err: any) {
      logger.error('[Stripe Webhook] Exception', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/webhooks/payfast
   * PayFast ITN Verification & Reconciliation
   */
  app.post('/api/webhooks/payfast', express.urlencoded({ extended: true, limit: '10kb' }), async (req, res) => {
    const { payfastPassphrase } = getServerConfig();
    const payload = req.body;

    try {
      logger.info('[PayFast Webhook] Received ITN');
      const result = await webhookService.verifyAndProcessPayFastWebhook(
        payload,
        payload.signature,
        payfastPassphrase
      );

      if (result.success) {
        logger.info(`[PayFast Webhook] Successfully processed: ${result.event}`, {
          orderCode: result.orderCode,
          event: result.event
        });
        res.status(200).send('OK');
      } else {
        logger.warn(`[PayFast Webhook] Verification failed`, { error: result.error });
        res.status(400).send('Verification failed');
      }
    } catch (err: any) {
      logger.error('[PayFast Webhook] Exception', { error: err.message });
      res.status(500).send('Internal server error');
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
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
