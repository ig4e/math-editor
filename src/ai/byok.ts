// BYOK (bring-your-own-key) — encrypts a plain API key with the
// per-install AES-GCM key and stashes the blob in keysSlice.providers.
// Decryption happens on-demand when building a provider model.
//
// The per-install salt + the AES-GCM key are stored in keysSlice. If
// the user clears localStorage / IDB, all keys are gone — there's no
// recovery path because that's the point of local-only crypto.

import { useStore } from '../state/store';
import {
  generateEncryptionKey, encryptString, decryptString,
} from '../vendor/excalidraw-app/encryption';
import type { ProviderKey } from '../state/types';

let cachedSalt: string | null = null;

/** Returns the per-install AES-GCM key (base64). Lazily generated on
 *  first call; persisted as `keysSlice.salt` so reloads work. */
async function ensureSalt(): Promise<string> {
  if (cachedSalt) return cachedSalt;
  const existing = useStore.getState().salt;
  if (existing) {
    cachedSalt = existing;
    return existing;
  }
  const fresh = await generateEncryptionKey();
  useStore.getState().setSalt(fresh);
  cachedSalt = fresh;
  return fresh;
}

export interface SaveKeyOpts {
  providerId: string;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export async function saveProviderKey(opts: SaveKeyOpts): Promise<void> {
  const salt = await ensureSalt();
  const encrypted = await encryptString(salt, opts.apiKey);
  const record: ProviderKey = {
    providerId: opts.providerId,
    model: opts.model,
    baseURL: opts.baseURL,
    key: encrypted,
  };
  useStore.getState().setProviderKey(record);
}

export async function loadProviderKey(providerId: string): Promise<string | null> {
  const rec = useStore.getState().providers[providerId];
  if (!rec) return null;
  const salt = await ensureSalt();
  try {
    return await decryptString(salt, rec.key);
  } catch (e) {
    console.warn('[byok] decrypt failed', e);
    return null;
  }
}

export function removeProviderKey(providerId: string): void {
  useStore.getState().removeProviderKey(providerId);
}

export function listProviderRecords(): ReadonlyArray<{ providerId: string; model?: string; baseURL?: string }> {
  const ps = useStore.getState().providers;
  return Object.values(ps).map((p) => ({ providerId: p.providerId, model: p.model, baseURL: p.baseURL }));
}

/** Quick "do we have a key for this provider?" probe — no decryption. */
export function hasProviderKey(providerId: string): boolean {
  return Boolean(useStore.getState().providers[providerId]);
}
