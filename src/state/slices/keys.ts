// Keys slice — encrypted BYOK storage. The slice itself is just a typed
// dictionary of {providerId → encrypted blob}; encryption/decryption
// helpers live in src/ai/byok.ts (added in Phase 6, lazy-loaded).
//
// Plain keys NEVER touch the persisted state. The encryption salt does —
// without it we can't decrypt next session — but the salt alone doesn't
// reveal the keys.

import type { AppSlice } from '../store';
import type { ProviderKey, EncryptedKey } from '../types';

export interface KeysState {
  /** Per-install random salt used to derive the WebCrypto KDF key. */
  salt: string | null;

  /** providerId → encrypted blob + metadata. */
  providers: Record<string, ProviderKey>;

  /** Keybinding overrides keyed by command ID. (Phase 1 ships the runtime;
   *  Settings → Keybinds writes here.) */
  keybindOverrides: Record<string, string>;
}

export interface KeysActions {
  setSalt(salt: string): void;

  /** Store an encrypted key for a provider. Plain key was encrypted by the
   *  caller (typically `byok.encryptKey`). */
  setProviderKey(record: ProviderKey): void;
  removeProviderKey(providerId: string): void;

  /** Replace the user's encrypted key blob for a provider, keeping metadata. */
  rotateProviderKey(providerId: string, blob: EncryptedKey): void;

  setKeybindOverride(commandId: string, combo: string | null): void;
  resetKeybinds(): void;
}

export type KeysSlice = KeysState & KeysActions;

export const createKeysSlice: AppSlice<KeysSlice> = (set) => ({
  salt: null,
  providers: {},
  keybindOverrides: {},

  setSalt: (salt) =>
    set((s) => {
      s.salt = salt;
    }),

  setProviderKey: (record) =>
    set((s) => {
      s.providers[record.providerId] = record;
    }),

  removeProviderKey: (providerId) =>
    set((s) => {
      delete s.providers[providerId];
    }),

  rotateProviderKey: (providerId, blob) =>
    set((s) => {
      const existing = s.providers[providerId];
      if (existing) existing.key = blob;
    }),

  setKeybindOverride: (commandId, combo) =>
    set((s) => {
      if (combo === null || combo === '') delete s.keybindOverrides[commandId];
      else s.keybindOverrides[commandId] = combo;
    }),

  resetKeybinds: () =>
    set((s) => {
      s.keybindOverrides = {};
    }),
});
