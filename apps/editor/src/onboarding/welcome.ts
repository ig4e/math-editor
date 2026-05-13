// First-run welcome sheet content. Seeded into the user's empty default
// sheet so the very first thing they see is a working example.

import { useStore } from '../state/store';

export interface WelcomeBlock {
  type: 'math' | 'text';
  x: number;
  y: number;
  content: string;
  note?: string;
}

export const WELCOME_BLOCKS: readonly WelcomeBlock[] = [
  { type: 'text',  x: 100,  y: 60,  content: 'Welcome to Math Notebook — try these!' },
  { type: 'math',  x: 100,  y: 130, content: 'x^2 - 5x + 6 = 0', note: 'Cmd+Enter to solve.' },
  { type: 'math',  x: 100,  y: 220, content: 'g = 9.8', note: 'Definitions appear in the Variables panel.' },
  { type: 'math',  x: 100,  y: 280, content: 'F = m g', note: 'Substitution is automatic.' },
  { type: 'math',  x: 100,  y: 360, content: 'y = x^2', note: 'Open Graph 2D (Cmd+G) to plot.' },
  { type: 'math',  x: 100,  y: 430, content: 'z = \\sin(x) \\cos(y)', note: 'Open Graph 3D for the surface.' },
  { type: 'text',  x: 100,  y: 510, content: 'Press Cmd+K to discover every command.' },
];

/** Seed the welcome blocks onto the active sheet. Idempotent: skipped
 *  if the sheet already has blocks or the user has dismissed onboarding. */
export function seedWelcomeIfFresh(): void {
  const s = useStore.getState();
  if (s.onboardingDismissed) return;
  const sheet = s.sheets[s.activeSheetId];
  if (!sheet || sheet.blocks.length > 0) return;

  for (const b of WELCOME_BLOCKS) {
    if (b.type === 'math') {
      s.addMathBlock({ x: b.x, y: b.y, latex: b.content, note: b.note, showNote: !!b.note });
    } else {
      s.addTextBlock({ x: b.x, y: b.y, text: b.content, note: b.note, showNote: !!b.note });
    }
  }
}
