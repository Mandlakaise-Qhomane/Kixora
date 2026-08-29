// ==============================================================================
// KIXORA CRYPTOGRAPHIC UTILITIES & SIGNATURE VERIFICATION (Phase 3C)
// Provides HMAC-SHA256, MD5 hashing, and timing-safe signature comparison for
// Stripe and PayFast webhook security and replay-attack mitigation.
// ==============================================================================

import crypto from 'node:crypto';

/**
 * Perform a timing-safe string comparison to prevent side-channel timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Compute HMAC-SHA256 hex digest for a given payload and secret.
 */
export function computeHmacSha256(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf-8').digest('hex');
}

/**
 * Compute MD5 hex digest for a given payload.
 */
export function computeMd5(payload: string): string {
  return crypto.createHash('md5').update(payload, 'utf-8').digest('hex');
}

export interface StripeSignatureResult {
  valid: boolean;
  timestamp?: number;
  error?: string;
}

/**
 * Verify Stripe webhook signature header ('Stripe-Signature: t=1614555555,v1=...').
 * 
 * @param rawBody - Exact unparsed raw string of the HTTP request body
 * @param signatureHeader - The 'stripe-signature' header value
 * @param webhookSecret - The endpoint secret (whsec_...)
 * @param toleranceSeconds - Maximum allowed drift between webhook timestamp and current time (default 300s)
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300
): StripeSignatureResult {
  if (!rawBody || typeof rawBody !== 'string') {
    return { valid: false, error: 'Raw body is required for Stripe signature verification.' };
  }
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return { valid: false, error: 'Missing Stripe signature header.' };
  }
  if (!webhookSecret || typeof webhookSecret !== 'string') {
    return { valid: false, error: 'Stripe webhook secret is not configured.' };
  }

  // Parse header items (e.g. t=1614555555,v1=5257a869...)
  const parts = signatureHeader.split(',').map(p => p.trim());
  let timestampStr: string | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value) {
      timestampStr = value;
    } else if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (!timestampStr) {
    return { valid: false, error: 'Timestamp (t) missing in Stripe signature header.' };
  }

  if (signatures.length === 0) {
    return { valid: false, error: 'Signature (v1) missing in Stripe signature header.' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: 'Invalid timestamp format in Stripe signature header.' };
  }

  // Replay protection: check timestamp drift
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return {
      valid: false,
      timestamp,
      error: `Webhook timestamp is outside the tolerance window (${Math.abs(now - timestamp)}s drift > ${toleranceSeconds}s limit).`
    };
  }

  // Signed payload format: ${timestamp}.${rawBody}
  const signedPayload = `${timestampStr}.${rawBody}`;
  const expectedSignature = computeHmacSha256(signedPayload, webhookSecret);

  // Compare against all v1 signatures in header using timing-safe comparison
  const matched = signatures.some(sig => timingSafeEqual(sig, expectedSignature));

  if (!matched) {
    return {
      valid: false,
      timestamp,
      error: 'Computed Stripe signature does not match any v1 signature in header.'
    };
  }

  return { valid: true, timestamp };
}

export interface PayFastSignatureResult {
  valid: boolean;
  expectedSignature?: string;
  error?: string;
}

/**
 * Generate PayFast parameter string and calculate MD5 signature.
 * Excludes 'signature' parameter and builds URL-encoded key=value string.
 */
export function generatePayFastSignature(
  data: Record<string, any>,
  passphrase?: string
): string {
  // Collect keys except 'signature' and empty values
  const keys = Object.keys(data).filter(k => k !== 'signature' && data[k] !== undefined && data[k] !== null && data[k] !== '');
  
  // PayFast preserves post order or alphabetical order
  const paramPairs: string[] = [];
  for (const key of keys) {
    const val = String(data[key]).trim();
    paramPairs.push(`${key}=${encodeURIComponent(val).replace(/%20/g, '+')}`);
  }

  let paramString = paramPairs.join('&');
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  return computeMd5(paramString);
}

/**
 * Verify PayFast ITN notification signature.
 */
export function verifyPayFastSignature(
  data: Record<string, any>,
  receivedSignature: string,
  passphrase?: string
): PayFastSignatureResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid PayFast data payload.' };
  }
  if (!receivedSignature || typeof receivedSignature !== 'string') {
    return { valid: false, error: 'Missing PayFast signature.' };
  }

  const expected = generatePayFastSignature(data, passphrase);
  const isValid = timingSafeEqual(receivedSignature.trim().toLowerCase(), expected.toLowerCase());

  if (!isValid) {
    return {
      valid: false,
      expectedSignature: expected,
      error: 'Calculated PayFast signature does not match received signature.'
    };
  }

  return { valid: true, expectedSignature: expected };
}
