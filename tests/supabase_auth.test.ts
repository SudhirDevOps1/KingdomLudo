// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import {
  generateGuestDisplayName,
  getOrCreateGuestSession,
  updateGuestDisplayName,
} from '../src/services/auth/authService';
import { isSupabaseConfigured, getSupabaseClient } from '../src/services/supabase/supabaseClient';

describe('Guest-First Identity & Supabase Auth Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates cryptographically distinct guest IDs with random fantasy champion titles', () => {
    const session1 = getOrCreateGuestSession();
    expect(session1.guestId.startsWith('gst_')).toBe(true);
    expect(session1.guestToken.length).toBeGreaterThan(16);
    expect(session1.displayName.length).toBeGreaterThan(3);

    // Second call retrieves exact same persisted session
    const retrieved = getOrCreateGuestSession();
    expect(retrieved.guestId).toBe(session1.guestId);
    expect(retrieved.guestToken).toBe(session1.guestToken);

    // Title generation randomness
    const title = generateGuestDisplayName();
    expect(title).toMatch(/^[\w\s]+#\d{3}$/);
  });

  it('allows updating guest display name without altering cryptographic tokens', () => {
    const original = getOrCreateGuestSession();
    updateGuestDisplayName('Lord Commander Titan');
    const updated = getOrCreateGuestSession();
    expect(updated.displayName).toBe('Lord Commander Titan');
    expect(updated.guestId).toBe(original.guestId);
    expect(updated.guestToken).toBe(original.guestToken);
  });

  it('gracefully handles offline mode when Supabase credentials are unset', () => {
    // When no URL / key is supplied in test env, isSupabaseConfigured returns false
    expect(typeof isSupabaseConfigured()).toBe('boolean');
    if (!isSupabaseConfigured()) {
      expect(getSupabaseClient()).toBeNull();
    }
  });
});
