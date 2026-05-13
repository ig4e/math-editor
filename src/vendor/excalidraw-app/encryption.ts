// SPDX-License-Identifier: MIT
//
// Adapted from excalidraw/excalidraw — `excalidraw-app/data/encryption.ts`.
// Upstream: https://github.com/excalidraw/excalidraw/blob/master/excalidraw-app/data/encryption.ts
// Snapshot SHA at vendor time: see /NOTICE (we track sync dates there).
//
// MIT License — Copyright (c) 2020 Excalidraw maintainers.
// See https://github.com/excalidraw/excalidraw/blob/master/LICENSE
//
// Diff from upstream:
//   - dropped React + Vite-specific imports (browser-only crypto)
//   - returned base64 instead of typed arrays in generateEncryptionKey
//   - exposed encryptBlob / decryptBlob with our EncryptedKey shape

import type { EncryptedKey } from '../../state/types';

const IV_LENGTH_BYTES = 12;          // AES-GCM standard
const KEY_LENGTH_BITS = 256;

/**
 * Generate a fresh AES-GCM key as a base64 string. Stored in the keys
 * slice; never logged. The key is per-install — losing it means losing
 * the encrypted blobs.
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    true,
    ['encrypt', 'decrypt'],
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToBase64(raw);
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = base64ToBuf(keyB64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt a string → { iv, ciphertext } both base64. */
export async function encryptString(keyB64: string, plain: string): Promise<EncryptedKey> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return {
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ct),
  };
}

/** Decrypt back to the original string. Throws on tamper / wrong key. */
export async function decryptString(keyB64: string, blob: EncryptedKey): Promise<string> {
  const key = await importKey(keyB64);
  const iv = new Uint8Array(base64ToBuf(blob.iv));
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBuf(blob.ciphertext),
  );
  return new TextDecoder().decode(pt);
}

/** Encrypt an arbitrary ArrayBuffer (used by share-link blobs). */
export async function encryptBlob(keyB64: string, data: ArrayBuffer): Promise<{ iv: string; ciphertext: ArrayBuffer }> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { iv: bufToBase64(iv.buffer), ciphertext: ct };
}

export async function decryptBlob(keyB64: string, iv: string, ciphertext: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await importKey(keyB64);
  const ivBuf = new Uint8Array(base64ToBuf(iv));
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, ciphertext);
}

// ----- base64 helpers (browser-only) -----------------------------------

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}
