// Pure helpers used by multiple slices.

import { nanoid } from 'nanoid';
import type { Sheet } from './types';

/** Short, unguessable, URL-safe ID. */
export const uid = (): string => nanoid(10);

export function newSheet(name = 'Sheet 1'): Sheet {
  return {
    id: uid(),
    name,
    blocks: [],
    view: { panX: 0, panY: 0, zoom: 1 },
  };
}
