// Appearance settings — font scale, tablet mode. The app is dark-only,
// so the theme + theme-auto controls are gone.

import { useStore } from '../../state/store';
import { Field, Switch, Slider } from '../../components/common';

export function AppearanceSection() {
  const fontScale   = useStore((s) => s.fontScale);
  const tabletMode  = useStore((s) => s.tabletMode);
  const setFontScale = useStore((s) => s.setFontScale);
  const setTabletMode = useStore((s) => s.setTabletMode);

  return (
    <div className="flex flex-col gap-4 max-w-md">
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

      <Field label="Tablet / stylus mode" inline rightSlot={
        <Switch checked={tabletMode} onCheckedChange={setTabletMode} ariaLabel="Tablet mode" />
      }>
        {() => (
          <div className="text-xs text-fg-muted">
            Grows buttons / inputs to 44 px tap targets. Auto-enabled on
            <code className="text-fg-2"> pointer: coarse </code> devices.
          </div>
        )}
      </Field>
    </div>
  );
}
