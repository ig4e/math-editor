// Multi-step tour. Imperative open/close via openTour() so the Help
// command can re-summon it. Each step optionally highlights a target
// panel via <Spotlight>; the tour first calls openPanel(target) on
// entry so the target exists in the DOM before measurement.

import { useEffect, useState } from 'react';
import { Dialog, Button, Kbd } from '../components/common';
import { Icon } from '../components/Icons';
import { useStore } from '../state/store';
import { Spotlight } from './Spotlight';

interface Step {
  title: string;
  body: React.ReactNode;
  /** data-tour-target attribute (= panel ID) to spotlight. Optional. */
  target?: string;
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
    target: 'solver',
    body: (
      <p>
        Click into a math block and press <Kbd combo="$mod+Enter" /> to solve. The
        <strong> Solver panel </strong> on the right shows steps. The <strong>Variables panel</strong>
        surfaces every <code className="text-fg-2">name = number</code> definition with a live slider.
      </p>
    ),
  },
  {
    title: 'Plot things',
    target: 'graph2d',
    body: (
      <p>
        Select <code>y = x^2</code> and the <strong>Graph 2D panel</strong> auto-plots. For surfaces,
        <code> z = sin(x) cos(y)</code> in Graph 3D. Right-click a plot row for roots,
        extrema, and intersections.
      </p>
    ),
  },
  {
    title: 'Bring your own AI',
    target: 'settings',
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
  const openPanel = useStore((s) => s.openPanel);

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

  // When entering a step that targets a panel, open that panel first so
  // it exists in the DOM and Spotlight can measure it.
  useEffect(() => {
    if (!open) return;
    if (cur.target) openPanel(cur.target);
  }, [open, cur.target, openPanel]);

  return (
    <>
      {open && <Spotlight target={cur.target} />}
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
    </>
  );
}
