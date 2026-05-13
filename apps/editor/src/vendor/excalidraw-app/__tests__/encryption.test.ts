// Round-trip the vendored encryption + share-link compression so a
// future upstream sync doesn't silently break the share / BYOK paths.

import { describe, it, expect } from 'vitest';
import { generateEncryptionKey, encryptString, decryptString } from '../encryption';
import { compressToBase64Url, decompressFromBase64Url } from '../share-link';

describe('vendored encryption.ts', () => {
  it('round-trips a UTF-8 string', async () => {
    const key = await generateEncryptionKey();
    const blob = await encryptString(key, 'hello 🧮 résumé');
    const out = await decryptString(key, blob);
    expect(out).toBe('hello 🧮 résumé');
  });

  it('decryption with a wrong key throws', async () => {
    const k1 = await generateEncryptionKey();
    const k2 = await generateEncryptionKey();
    const blob = await encryptString(k1, 'secret');
    await expect(decryptString(k2, blob)).rejects.toBeDefined();
  });
});

describe('vendored share-link.ts', () => {
  it('round-trips arbitrary text via gzip + base64url', () => {
    const big = JSON.stringify({
      sheets: { a: { id: 'a', blocks: Array.from({ length: 200 }, (_, i) => ({ id: `b${i}`, type: 'math', x: i, y: i, latex: `x_${i} = ${i}`, fontSize: 22, note: '', showNote: false })) } },
    });
    const enc = compressToBase64Url(big);
    expect(enc).not.toContain('=');
    expect(enc.length).toBeLessThan(big.length); // gzip should compress
    expect(decompressFromBase64Url(enc)).toBe(big);
  });

  it('handles empty strings', () => {
    const enc = compressToBase64Url('');
    expect(decompressFromBase64Url(enc)).toBe('');
  });
});
