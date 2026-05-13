// Appearance settings — theme, theme-auto, font scale. Reads / writes
// prefsSlice. The pre-paint inline script in index.html still owns the
// no-flash boot; this section only handles the runtime toggle.

import { useEffect } from 'react';
import { useStore } from '../../state/store';
import { Field, Select, Switch, Slider } from '../../components/common';
import type { SelectItem } from '../../components/common';
import type { Theme } from '../../state/types';

const THEME_ITEMS: readonly SelectItem[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function AppearanceSection() {
  const theme       = useStore((s) => s.theme);
  const themeAuto   = useStore((s) => s.themeAuto);
  const fontScale   = useStore((s) => s.fontScale);
  const setTheme     = useStore((s) => s.setTheme);
  const setThemeAuto = useStore((s) => s.setThemeAuto);
  const setFontScale = useStore((s) => s.setFontScale);

  // While themeAuto is on, mirror the OS preference into prefsSlice.theme
  // so the rest of the app (and our Excalidraw theme prop) sees a single
  // source of truth.
  useEffect(() => {
    if (!themeAuto) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => useStore.getState().setTheme(mq.matches ? 'dark' : 'light');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themeAuto]);

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Field label="Match system theme" inline rightSlot={
        <Switch checked={themeAuto} onCheckedChange={setThemeAuto} ariaLabel="Match system theme" />
      }>
        {() => (
          <div className="text-xs text-fg-muted">
            Tracks <code className="text-fg-2">prefers-color-scheme</code> automatically.
          </div>
        )}
      </Field>

      <Field label="Theme" inline>
        {() => (
          <Select
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
            items={THEME_ITEMS}
            disabled={themeAuto}
            ariaLabel="Theme"
            className="w-44"
          />
        )}
      </Field>

      <Field
        label="Font size"
        inline
        hint={`${Math.round(fontScale * 14)} px base`}
      >
        {() => (
          <Slider
            value={fontScale}
            min={0.85}
            max={1.4}
            step={0.05}
            onValueChange={setFontScale}
            ariaLabel="Font scale"
            className="w-60"
          />
        )}
      </Field>
    </div>
  );
}
