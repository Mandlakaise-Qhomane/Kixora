// ==============================================================================
// KIXORA WEBHOOK IDEMPOTENCY & REPLAY PROTECTION (Phase 3C)
// Tracks processed webhook event IDs to prevent double-processing,
// duplicate inventory deductions, and replay attacks.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface ProcessedWebhookRecord {
  eventId: string;
  provider: string;
  eventType: string;
  orderCode?: string;
  payload?: any;
  status: 'processed' | 'failed' | 'ignored';
  processedAt: string;
}

class WebhookIdempotencyRegistry {
  private inMemoryCache: Map<string, ProcessedWebhookRecord> = new Map();
  private maxCacheSize = 2000;

  private makeKey(provider: string, eventId: string): string {
    return `${provider.toLowerCase()}:${eventId}`;
  }

  /**
   * Check if a webhook event has already been processed.
   */
  async isEventProcessed(eventId: string, provider: string): Promise<boolean> {
    if (!eventId || !provider) return false;

    const key = this.makeKey(provider, eventId);
    if (this.inMemoryCache.has(key)) {
      return true;
    }

    // Check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('webhook_events')
          .select('event_id')
          .eq('event_id', eventId)
          .eq('provider', provider)
          .maybeSingle();

        if (!error && data) {
          this.inMemoryCache.set(key, {
            eventId,
            provider,
            eventType: 'existing',
            status: 'processed',
            processedAt: new Date().toISOString()
          });
          return true;
        }
      } catch (err) {
        console.warn('[WebhookIdempotency] Supabase lookup error (falling back to memory):', err);
      }
    }

    return false;
  }

  /**
   * Atomically checks and acquires lock if not already processed or currently in-flight.
   * Returns true if lock was successfully acquired (first processing attempt), false if duplicate.
   */
  async acquireProcessingLock(eventId: string, provider: string): Promise<boolean> {
    if (!eventId || !provider) return false;

    const key = this.makeKey(provider, eventId);
    
    // 1. Synchronous check-and-set for memory cache to block concurrent in-flight requests
    if (this.inMemoryCache.has(key)) {
      return false;
    }

    // Set optimistic lock in memory cache IMMEDIATELY before any awaits
    this.inMemoryCache.set(key, {
      eventId,
      provider,
      eventType: 'in_flight',
      status: 'processed',
      processedAt: new Date().toISOString(),
    });

    // 2. Check persistent database if available (secondary guard)
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('webhook_events')
          .select('event_id')
          .eq('event_id', eventId)
          .eq('provider', provider)
          .maybeSingle();

        if (!error && data) {
          // Already in DB, so it was definitely processed before this run
          return false;
        }
      } catch (err) {
        console.warn('[WebhookIdempotency] DB lock check error:', err);
        // Fallback to the memory lock we already set
      }
    }

    return true;
  }

  /**
   * Record a webhook event as successfully processed.
   */
  async recordEventProcessed(record: {
    eventId: string;
    provider: string;
    eventType: string;
    orderCode?: string;
    payload?: any;
    status?: 'processed' | 'failed' | 'ignored';
  }): Promise<void> {
    const { eventId, provider, eventType, orderCode, payload, status = 'processed' } = record;
    if (!eventId || !provider) return;

    const key = this.makeKey(provider, eventId);
    const entry: ProcessedWebhookRecord = {
      eventId,
      provider,
      eventType,
      orderCode,
      payload,
      status,
      processedAt: new Date().toISOString()
    };

    // Maintain in-memory cache size
    if (this.inMemoryCache.size >= this.maxCacheSize) {
      const firstKey = this.inMemoryCache.keys().next().value;
      if (firstKey) this.inMemoryCache.delete(firstKey);
    }
    this.inMemoryCache.set(key, entry);

    // Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('webhook_events').insert({
          event_id: eventId,
          provider,
          event_type: eventType,
          order_code: orderCode || null,
          payload: payload || {},
          status,
          processed_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[WebhookIdempotency] Supabase insert warning:', err);
      }
    }
  }

  /**
   * Reset the in-memory cache (for test isolation).
   */
  clearRegistry(): void {
    this.inMemoryCache.clear();
  }
}

export const webhookIdempotency = new WebhookIdempotencyRegistry();
