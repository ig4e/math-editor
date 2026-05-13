// Handwriting OCR — vision-LLM-driven. Takes a PNG of an Excalidraw
// selection and asks the user's currently-configured provider (the one
// surfaced in the AI panel chip) to transcribe it to LaTeX.
//
// Vision support varies per provider × model. We surface the "vision
// models" list per provider in ai/providers/<name>.ts; pickVisionModel
// picks the first matching model for the user's saved provider.

import { generateText } from 'ai';
import { useStore } from '../state/store';
import { getProvider, getAllProviders } from './providers';
import { loadProviderKey, listProviderRecords } from './byok';
import './providers/index';

export interface OcrResult {
  ok: boolean;
  latex?: string;
  reason?: string;
  /** Provider + model used. Useful for telling the user "via Claude / gpt-4o". */
  via?: string;
}

const SYSTEM = [
  'You are a math handwriting transcriber.',
  'You will receive an image of handwritten or sketched math.',
  'Output ONLY the LaTeX source of what you see. No code fences, no prose.',
  'Use standard LaTeX (\\frac, \\int, \\sum, etc.). Greek letters as \\alpha etc.',
  'If the image contains multiple lines, join them with \\\\.',
  'If you genuinely can\'t read it, output: \\text{unreadable}',
].join('\n');

/** Detect which stored provider has a vision-capable model + return it. */
function pickVisionProvider(): { providerId: string; model: string } | null {
  const saved = listProviderRecords();
  for (const rec of saved) {
    const p = getProvider(rec.providerId);
    if (!p) continue;
    const vision = p.info.visionModels;
    if (!vision || vision.length === 0) continue;
    // Prefer the saved default if it's vision-capable; otherwise first vision model.
    const preferred = rec.model && vision.includes(rec.model) ? rec.model : vision[0];
    if (preferred) return { providerId: rec.providerId, model: preferred };
  }
  // Last resort — return the first provider with any vision model, even
  // if it has no key (build() will fail downstream with a clearer error).
  for (const p of getAllProviders()) {
    if (p.info.visionModels?.[0]) {
      return { providerId: p.info.id, model: p.info.visionModels[0] };
    }
  }
  return null;
}

export async function transcribeImageToLatex(dataURL: string): Promise<OcrResult> {
  const pick = pickVisionProvider();
  if (!pick) {
    return { ok: false, reason: 'No vision-capable provider configured. Add a key with vision in Settings.' };
  }
  const provider = getProvider(pick.providerId);
  if (!provider) return { ok: false, reason: 'Provider not registered' };
  const apiKey = await loadProviderKey(pick.providerId);
  if (!apiKey) {
    return { ok: false, reason: `No key for ${provider.info.label} — add one in Settings.` };
  }
  const rec = listProviderRecords().find((r) => r.providerId === pick.providerId);

  try {
    const model = provider.build({ apiKey, baseURL: rec?.baseURL, model: pick.model });
    const result = await generateText({
      model,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Transcribe this to LaTeX.' },
          { type: 'image', image: dataURL },
        ],
      }],
      maxOutputTokens: 400,
    });
    const text = result.text.trim().replace(/^```(?:latex)?\s*|\s*```$/g, '');
    return { ok: true, latex: text, via: `${provider.info.label} · ${pick.model}` };
  } catch (e) {
    useStore.getState().toast(`OCR failed: ${(e as Error).message}`, 'error');
    return { ok: false, reason: (e as Error).message };
  }
}
