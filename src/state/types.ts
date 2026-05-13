// Domain types — slim version. The legacy Tool / Stroke / Shape / Link
// types and their fields on Sheet are gone; Excalidraw owns drawings now.

export type ColorName =
  | 'black' | 'red' | 'blue' | 'green' | 'orange' | 'purple';

export interface BaseBlock {
  id: string;
  x: number;          // world coords on the Excalidraw canvas
  y: number;
  fontSize: number;
  note: string;
  showNote: boolean;
}

export interface MathBlock extends BaseBlock {
  type: 'math';
  latex: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  text: string;
}

export type Block = MathBlock | TextBlock;

// ---------- View / Sheet ----------------------------

export interface View {
  panX: number;
  panY: number;
  zoom: number;
}

export interface Sheet {
  id: string;
  name: string;
  blocks: Block[];
  /** Serialized Excalidraw scene (elements + appState + files). Phase 2
   *  populates this. Stored as opaque JSON; restoreElements/restoreAppState
   *  hydrate it on load. */
  excalidrawSnapshot?: unknown;
  view: View;
}

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

export type Theme = 'light' | 'dark';

// ---------- v2 additions: workspace, prefs, keys -----------------------

/** Curriculum the user picked in Settings. Drives AI prompt + Reference filter. */
export type Curriculum =
  | 'none'
  | 'ap-calc-ab' | 'ap-calc-bc'
  | 'ib-math-sl' | 'ib-math-hl'
  | 'a-level-further' | 'us-common-core-hs'
  | 'gre' | 'custom';

/** Workspace layout JSON, opaque to the rest of the store — flexlayout owns it. */
export type LayoutJSON = unknown;

/** Encrypted blob plus its WebCrypto IV. The key derives from a salt in IDB. */
export interface EncryptedKey {
  iv: string;       // base64
  ciphertext: string;
}

/** One provider's BYOK record. */
export interface ProviderKey {
  providerId: string;        // 'anthropic', 'openai', 'openai-compat:<label>', …
  model?: string;            // default model the user picked
  baseURL?: string;          // only for openai-compat
  key: EncryptedKey;
}
