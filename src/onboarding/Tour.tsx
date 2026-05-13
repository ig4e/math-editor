// Multi-step tour. Imperative open/close via openTour() so the Help
// command can re-summon it. Lightweight UI — no spotlight/highlight
// pass yet; that lands in a future P17 follow-up.

import { useEffect, useState } from 'react';
import { Dialog, Button, Kbd } from '../components/common';
import { Icon } from '../components/Icons';
import { useStore } from '../state/store';

interface Step {
  title: string;
  body: React.ReactNode;
}

const STEPS: readonly Step[] = [
  {
    title: 'Welcome to Math Notebook',
    body: (
      <p>
        Excalidraw canvas, MathLive equations, step-by-step solver, 2D + 3D plots,
        AI chat, share-link export, realtime collab. Press <Kbd combo="$mod+K" /> any time to find a command.
      </p>
    ),
  },
  {
    title: 'Solve & simplify',
    body: (
      <p>
        Click into a math block and press <Kbd combo="$mod+Enter" /> to solve. Or open
        the Solver panel (already in the right column) for step-by-step. The Variables
        panel surfaces every <code className="text-fg-2">name = number</code> definition
        with a live slider.
      </p>
    ),
  },
  {
    title: 'Plot things',
    body: (
      <p>
        Select <code>y = x^2</code> and the Graph 2D panel will auto-plot. For surfaces,
        <code> z = sin(x) cos(y)</code> in Graph 3D. Right-click a plot row for roots,
        extrema, and intersections.
      </p>
    ),
  },
  {
    title: 'Bring your own AI',
    body: (
      <p>
        Open <strong>Settings → API keys</strong> to add an Anthropic / OpenAI / Google /
        xAI / Mistral / Groq key, or use the OpenAI-compatible adapter for DeepSeek / Qwen
        / Moonshot / Zhipu / Ollama. Keys are encrypted at rest with WebCrypto.
      </p>
    ),
  },
  {
    title: 'Share + collaborate',
    body: (
      <p>
        <Kbd combo="$mod+Shift+C" /> copies a share link with the whole sheet baked in.
        Click "Start collab session" in <Kbd combo="$mod+K" /> for realtime peer-to-peer
        editing via Yjs.
      </p>
    ),
  },
];

let opener: (() => void) | null = null;
export function openTour(): void { opener?.(); }

export function Tour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dismissOnboarding = useStore((s) => s.dismissOnboarding);
  const onboardingDismissed = useStore((s) => s.onboardingDismissed);

  useEffect(() => {
    opener = () => { setStep(0); setOpen(true); };
    return () => { opener = null; };
  }, []);

  // Auto-open on first run.
  useEffect(() => {
    if (!onboardingDismissed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [onboardingDismissed]);

  const cur = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) dismissOnboarding();
      }}
      title={cur.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => { setOpen(false); dismissOnboarding(); }}>
            Skip
          </Button>
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              <Icon name="chevron-left" /> Back
            </Button>
          )}
          {isLast ? (
            <Button variant="primary" onClick={() => { setOpen(false); dismissOnboarding(); }}>
              <Icon name="check" /> Done
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
              Next <Icon name="chevron-right" />
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm text-fg-2 leading-relaxed">
        {cur.body}
        <div className="flex items-center gap-1 text-[10px] text-fg-muted mt-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={i === step ? 'w-4 h-1 rounded bg-accent' : 'w-1.5 h-1 rounded bg-border'}
            />
          ))}
          <span className="ml-auto">{step + 1} / {STEPS.length}</span>
        </div>
      </div>
    </Dialog>
  );
}
