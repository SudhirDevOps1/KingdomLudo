import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/supabaseClient';

export interface GuestSession {
  guestId: string;
  guestToken: string;
  displayName: string;
  createdAt: number;
}

const GUEST_STORAGE_KEY = 'kingdomludo_guest_session';

const TITLES = [
  'Ember Vanguard',
  'Glacier Champion',
  'Verdant Warden',
  'Solar Sovereign',
  'Iron Sentinel',
  'Storm Wanderer',
  'Mystic Tactician',
  'Crown Voyager',
];

function generateCryptoToken(byteLength = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateGuestDisplayName(): string {
  const title = TITLES[Math.floor(Math.random() * TITLES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${title} #${num}`;
}

export function getOrCreateGuestSession(): GuestSession {
  if (typeof window === 'undefined') {
    return {
      guestId: 'gst_server_fallback',
      guestToken: 'tok_server_fallback',
      displayName: 'Royal Voyager',
      createdAt: Date.now(),
    };
  }

  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GuestSession;
      if (parsed.guestId && parsed.guestToken) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error and recreate
  }

  const fresh: GuestSession = {
    guestId: `gst_${generateCryptoToken(12)}`,
    guestToken: generateCryptoToken(24),
    displayName: generateGuestDisplayName(),
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // localStorage full or disabled
  }

  return fresh;
}

export function updateGuestDisplayName(newName: string): void {
  const current = getOrCreateGuestSession();
  current.displayName = newName.trim().slice(0, 32) || current.displayName;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Supabase Auth Integration (Optional Registered Accounts)
// ---------------------------------------------------------------------------

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error('Supabase is not configured yet. Offline guest mode is active.'),
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  return {
    user: data.user,
    session: data.session,
    error: error ? new Error(error.message) : null,
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error('Supabase is not configured yet. Offline guest mode is active.'),
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error: error ? new Error(error.message) : null,
  };
}

export async function signInWithGoogle(): Promise<{ url: string | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      url: null,
      error: new Error('Supabase is not configured yet. Offline guest mode is active.'),
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    },
  });

  return {
    url: data.url,
    error: error ? new Error(error.message) : null,
  };
}

export async function signOutSupabase(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

export async function resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      error: new Error('Supabase is not configured. Password reset is unavailable.'),
    };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onSupabaseAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => {
    subscription.unsubscribe();
  };
}
