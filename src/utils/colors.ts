// Single source of truth for the color palette used by the math-field
// (xcolor names go into \textcolor / \colorbox commands) and the pen tool
// (hex colors are baked into each stroke when drawn).

import type { ColorName } from '../state/types';

export interface PaletteEntry {
  /** xcolor name — what MathLive understands inside \textcolor{} / \colorbox{} */
  name: ColorName;
  /** screen color — used for swatches and pen strokes */
  hex: string;
  /** human label for accessibility */
  label: string;
}

export const PALETTE: readonly PaletteEntry[] = [
  { name: 'black',  hex: '#111111', label: 'Black'  },
  { name: 'red',    hex: '#e11d48', label: 'Red'    },
  { name: 'blue',   hex: '#2563eb', label: 'Blue'   },
  { name: 'green',  hex: '#16a34a', label: 'Green'  },
  { name: 'orange', hex: '#ca8a04', label: 'Orange' },
  { name: 'purple', hex: '#9333ea', label: 'Purple' },
] as const;

export const COLOR_HEX: Record<ColorName, string> =
  Object.fromEntries(PALETTE.map((c) => [c.name, c.hex])) as Record<ColorName, string>;
