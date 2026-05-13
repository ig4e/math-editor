// SPDX-License-Identifier: MIT
//
// Adapted from excalidraw/excalidraw — share-link compression helpers
// originally in `excalidraw-app/data/index.ts`.
// Upstream: https://github.com/excalidraw/excalidraw/blob/master/excalidraw-app/data/
//
// MIT License — Copyright (c) 2020 Excalidraw maintainers.
// See https://github.com/excalidraw/excalidraw/blob/master/LICENSE
//
// Diff from upstream:
//   - dropped Firebase / Socket.io path; we keep only the
//     compress/decompress + base64-url codec.
//   - takes / returns vanilla strings; the optional encryption layer
//     lives in ./encryption.ts (composed by /share/url.ts in P8).
//
// Used by the Phase 8 "Copy share link" flow: the entire sheet JSON
// is gzipped + base64-url-encoded and stuffed into the URL hash, so a
// shared link is fully self-contained (no server required).

import { deflate, inflate } from 'pako';

/** Compress a UTF-8 string with gzip; return base64url. */
export function compressToBase64Url(plain: string): string {
  const data = new TextEncoder().encode(plain);
  const compressed = deflate(data, { level: 6 });
  return bytesToBase64Url(compressed);
}

/** Reverse of `compressToBase64Url`. Throws on malformed input. */
export function decompressFromBase64Url(encoded: string): string {
  const bytes = base64UrlToBytes(encoded);
  const out = inflate(bytes);
  return new TextDecoder().decode(out);
}

// ----- base64url codec (URL-safe, no padding) --------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  // restore padding the regular `atob` requires.
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const std = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(std);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
