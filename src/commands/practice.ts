// Practice generator — uses the user's selected curriculum + a topic
// prompt to ask the configured AI provider for N problems, parses the
// JSON response, and drops the resulting math blocks onto the active
// sheet. Reuses startChat machinery so it inherits the AI proxy gating
// added in D1 and the curriculum-aware system prompt from chat.ts.

import { registerCommands, type Command } from './commands';

const PRACTICE_COMMAND: Command = {
  id: 'curriculum.generatePractice',
  label: 'Generate practice problems',
  description: 'Asks your configured AI for N problems at your curriculum level on a topic you pick.',
  category: 'AI',
  icon: 'sparkles',
  defaultShortcut: '$mod+Shift+P',
  run: async (ctx) => {
    const state = ctx.getState();

    const provider = state.defaultProvider;
    const model = state.defaultModel;
    if (!provider || !model) {
      state.toast('Pick a default AI provider in Settings → API keys first.', 'warn');
      ctx.workspace.openPanel('settings');
      return;
    }

    const level =
      state.curriculum === 'custom'
        ? state.curriculumCustom || 'general'
        : state.curriculum && state.curriculum !== 'none'
          ? state.curriculum
          : 'general';

    const topic = (typeof window !== 'undefined' ? window.prompt('Topic for practice problems', 'algebra') : null) ?? 'algebra';
    if (!topic.trim()) return;

    const count = 5;
    const sys =
      `Generate ${count} practice problems for level "${level}" in topic "${topic}". ` +
      `Reply with ONLY a JSON code-fence:\n` +
      '```json\n{ "problems": [{ "latex": "..." }] }\n```\n' +
      'Each problem.latex must be valid LaTeX, no $ delimiters, no \\(\\) wrapping.';

    state.toast(`Asking ${provider} for ${count} ${topic} problems…`, 'info');

    let fullText = '';
    try {
      const { startChat } = await import('../ai/chat');
      const ctrl = new AbortController();
      const handle = await startChat(
        {
          providerId: provider,
          model,
          history: [
            { role: 'system', content: sys },
            { role: 'user',   content: `Generate ${count} problems now.` },
          ],
        },
        ctrl.signal,
      );
      for await (const chunk of handle.textStream) fullText += chunk;
    } catch (e) {
      state.toast(`Practice generation failed: ${(e as Error).message}`, 'error');
      return;
    }

    const problems = extractProblems(fullText);
    if (problems.length === 0) {
      // Fallback: dump the raw response as one text block so the work
      // isn't lost.
      state.addTextBlock({ x: 80, y: 80, text: `Practice (raw):\n${fullText.slice(0, 800)}` });
      state.toast('Could not parse JSON — raw response added as a text block.', 'warn');
      return;
    }

    let y = 80;
    for (const p of problems) {
      state.addMathBlock({ x: 80, y, latex: p.latex });
      y += 100;
    }
    state.toast(`Inserted ${problems.length} practice problem${problems.length === 1 ? '' : 's'}`, 'success');
  },
};

/** Pull `problems[].latex` out of the AI response. Tries fenced JSON
 *  first, then raw JSON; bails to [] if neither parses. */
function extractProblems(text: string): readonly { latex: string }[] {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/);
  const raw = (fence?.[1] ?? text).trim();
  try {
    const parsed = JSON.parse(raw) as { problems?: { latex?: unknown }[] };
    if (!Array.isArray(parsed?.problems)) return [];
    return parsed.problems
      .map((p) => (typeof p.latex === 'string' ? { latex: p.latex } : null))
      .filter((p): p is { latex: string } => p !== null);
  } catch {
    return [];
  }
}

export function registerPracticeCommands(): void {
  registerCommands([PRACTICE_COMMAND]);
}
