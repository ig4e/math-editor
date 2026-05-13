// Mermaid renderer for Notes. mermaid.render() is async and produces
// an SVG string. We lazy-load mermaid on first use so the Notes panel
// doesn't pay the cost until the user actually pastes a diagram.
//
// Each diagram gets a unique render id; renders are cached per source
// so toggling the preview doesn't re-render unchanged blocks.

type MermaidModule = typeof import('mermaid');

let cachedMermaid: MermaidModule['default'] | null = null;
let nextId = 1;

async function getMermaid() {
  if (cachedMermaid) return cachedMermaid;
  const mod = await import('mermaid');
  const m = mod.default;
  m.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'inherit',
    themeVariables: {
      darkMode: true,
      background: 'transparent',
      primaryColor: '#363541',
      primaryTextColor: '#FCFCFC',
      primaryBorderColor: '#a8a5ff',
      lineColor: '#B8B8B8',
      textColor: '#FCFCFC',
      mainBkg: '#232329',
      secondBkg: '#2b2b33',
    },
  });
  cachedMermaid = m;
  return m;
}

interface MermaidResult { svg?: string; error?: string }

const cache = new Map<string, MermaidResult>();

export async function renderMermaid(source: string): Promise<MermaidResult> {
  const key = source.trim();
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const m = await getMermaid();
    const id = `mermaid-${nextId++}`;
    const { svg } = await m.render(id, source);
    const result = { svg };
    cache.set(key, result);
    return result;
  } catch (e) {
    const result = { error: (e as Error).message };
    cache.set(key, result);
    return result;
  }
}
