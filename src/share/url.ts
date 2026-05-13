// Share-link round-trip. Compresses the active sheet (or the whole
// workspace) into a base64url string and stuffs it into the URL hash —
// fully self-contained, no server. The vendored compressToBase64Url
// helper (from excalidraw-app) does the heavy lifting.
//
// Format: `#sheet=<base64url-of-gzipped-json>`
//   or:   `#ws=<base64url-of-gzipped-json>`
//
// On boot, src/share/loader.ts checks the hash and offers to load.

import { compressToBase64Url, decompressFromBase64Url } from '../vendor/excalidraw-app/share-link';
import { useStore } from '../state/store';
import type { Sheet } from '../state/types';

export interface ShareSinglePayload {
  v: 1;
  kind: 'sheet';
  sheet: Sheet;
}

export interface ShareWorkspacePayload {
  v: 1;
  kind: 'workspace';
  sheets: Record<string, Sheet>;
  sheetOrder: string[];
}

export type SharePayload = ShareSinglePayload | ShareWorkspacePayload;

export function encodeActiveSheet(): string {
  const s = useStore.getState();
  const sheet = s.sheets[s.activeSheetId];
  if (!sheet) throw new Error('no active sheet');
  const payload: SharePayload = { v: 1, kind: 'sheet', sheet };
  return `#sheet=${compressToBase64Url(JSON.stringify(payload))}`;
}

export function encodeWorkspace(): string {
  const s = useStore.getState();
  const payload: SharePayload = {
    v: 1,
    kind: 'workspace',
    sheets: s.sheets,
    sheetOrder: s.sheetOrder,
  };
  return `#ws=${compressToBase64Url(JSON.stringify(payload))}`;
}

export interface DecodedShare {
  payload: SharePayload;
  kind: 'sheet' | 'workspace';
}

export function decodeHash(hash: string): DecodedShare | null {
  const trimmed = hash.replace(/^#/, '');
  let kind: 'sheet' | 'workspace' | null = null;
  let body = '';
  if (trimmed.startsWith('sheet=')) { kind = 'sheet'; body = trimmed.slice(6); }
  else if (trimmed.startsWith('ws=')) { kind = 'workspace'; body = trimmed.slice(3); }
  if (!kind) return null;
  try {
    const json = decompressFromBase64Url(body);
    const payload = JSON.parse(json) as SharePayload;
    if (payload.v !== 1) return null;
    return { payload, kind };
  } catch {
    return null;
  }
}

/** Apply a decoded share to the store. Sheet-only shares are appended
 *  as a new sheet so the existing workspace stays intact; workspace
 *  shares replace everything (with a confirm in the loader). */
export function applyShare(decoded: DecodedShare): void {
  const s = useStore.getState();
  if (decoded.payload.kind === 'sheet') {
    const sheet = decoded.payload.sheet;
    s.replaceFromJSON({
      sheets: { ...s.sheets, [sheet.id]: sheet },
      sheetOrder: [...s.sheetOrder, sheet.id],
      activeSheetId: sheet.id,
    });
  } else {
    s.replaceFromJSON({
      sheets: decoded.payload.sheets,
      sheetOrder: decoded.payload.sheetOrder,
      activeSheetId: decoded.payload.sheetOrder[0] ?? '',
    });
  }
}

export function buildShareURL(hash: string): string {
  const base = typeof window === 'undefined'
    ? 'https://math-notebook.app/'
    : `${window.location.origin}${window.location.pathname}`;
  return `${base}${hash}`;
}
