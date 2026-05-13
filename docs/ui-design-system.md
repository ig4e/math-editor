# UI design system

Every panel, dialog, popover, and inline control in the app must feel like part of one app. That's enforced by **one set of tokens** and **one set of primitives** that every feature consumes. No panel rolls its own button, input, or dialog.

## Tokens

Defined in `src/index.css` via Tailwind v4 `@theme`:

### Colors

Bare-noun custom properties; Tailwind v4 emits matching `bg-*` / `text-*` / `border-*` utilities automatically.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--color-app` | `#f4f4ef` | `#0d0e11` | page background |
| `--color-canvas` | `#f4f4ef` | `#14161a` | canvas background |
| `--color-surface` | `#ffffff` | `#1c1e23` | panels, cards |
| `--color-surface-2` | `#fafafa` | `#23262c` | nested cards, table stripes |
| `--color-surface-glass` | `#ffffffd9` | `#1c1e23d9` | floating toolbar / overlay |
| `--color-border` | `#e2e2dd` | `#2f323a` | dividers, control borders |
| `--color-border-soft` | `#ececea` | `#2a2d34` | secondary dividers |
| `--color-fg` | `#111111` | `#e7e9ee` | primary text |
| `--color-fg-2` | `#4b5563` | `#c4c7cf` | secondary text |
| `--color-fg-muted` | `#6b7280` | `#9ba0aa` | hints, captions |
| `--color-fg-faint` | `#9ca3af` | `#6b7280` | placeholders, decoration |
| `--color-accent` | `#6366f1` | `#8b8efb` | primary action |
| `--color-accent-bg` | `#eef2ff` | `#2b2f55` | accent fills |
| `--color-accent-border` | `#c7d2fe` | `#4f54a0` | accent borders |
| `--color-selected` | `#6366f1` | `#8b8efb` | selection outline |
| `--color-selected-glow` | `#6366f133` | `#8b8efb44` | selection halo |
| `--color-danger` | `#dc2626` | `#f87171` | destructive |
| `--color-success` | `#16a34a` | `#4ade80` | success |
| `--color-warning` | `#d97706` | `#fbbf24` | warning |

### Shadows

`--shadow-card`, `--shadow-pill`, `--shadow-toast`. Used as `shadow-card`, `shadow-pill`, `shadow-toast`.

### Animations

One keyframe (`toast-in`). Everything else uses Tailwind's `transition` utilities. Animations never exceed 200 ms. One easing curve (`ease-out`).

### Spacing

Stick to Tailwind's default 4 px grid. No custom pixel values inline.

### Radii

- `rounded-md` (6 px) for small things (buttons, inputs, chips).
- `rounded-xl` (12 px) for cards / panels.

## Primitive components

Live under `src/components/common/`. Every panel composes these; **no panel rolls its own button / input / menu**.

| Primitive | Behavior | Backed by |
|---|---|---|
| `<Button variant size>` | native button with our heights (28 / 32 / 40), padding, focus ring, disabled state | — |
| `<IconButton title>` | square button + Tooltip | Radix Tooltip |
| `<Input>` | native input, themed | — |
| `<Select>` | dropdown | Radix Select |
| `<Switch>` | on/off toggle | Radix Switch |
| `<Slider>` | numeric slider | Radix Slider |
| `<Tabs>` | tabs container | Radix Tabs |
| `<DropdownMenu>` | contextual menus | Radix DropdownMenu |
| `<Tooltip>` | hover hints | Radix Tooltip |
| `<Dialog>` | overlay modals | Radix Dialog |
| `<Sheet>` | side-sheet (settings drawer, AI side panel) | Radix Dialog (left/right anchor) |
| `<Card>` | surface + border + radius + padding | — |
| `<Field label hint error>` | form-row wrapper | — |
| `<EmptyState icon title cta>` | first-paint of an empty panel | — |
| `<Banner kind>` | in-panel error / info / warn / success | — |
| `<SkeletonRow>` `<SkeletonCard>` | async loading | — |
| `<Spinner size>` | inline progress indicator | — |
| `<PanelHeader>` `<PanelRibbon>` `<PanelStatus>` | panel chrome | — |
| `<Kbd>` | render a keyboard combo | — |

`Button` variants: `primary | secondary | ghost | danger`. Sizes: `sm | md`.

## Panel chrome

Every panel renders the same three-slot shell:

```
┌──────────────────────────────────────────────┐
│ ◀ ▶  Panel title           ⋯  ⤢  ✕           │  ← PanelHeader
├──────────────────────────────────────────────┤
│ optional ribbon (zoom / settings / search)   │  ← PanelRibbon  (omit when not needed)
├──────────────────────────────────────────────┤
│            panel content                     │
├──────────────────────────────────────────────┤
│ optional status (selected: 3 · 4 plots)      │  ← PanelStatus  (omit when not needed)
└──────────────────────────────────────────────┘
```

`PanelHeader` is one component. Title text, optional left breadcrumb, right action slot for IconButtons (Settings ⋯, Popout ⤢, Close ✕). flexlayout's tab strip is themed via CSS variables — no custom tab UI per panel.

## Iconography

- One set: feather-style strokes in `Icons.tsx`. Stroke width and color from the `.ic` class.
- Sizes: `w-3.5 h-3.5` (12 px) inside compact rows, `w-4 h-4` (16 px) default, `w-5 h-5` (20 px) in headers.
- No emoji.

## Typography

- One scale: 12 / 13 / 14 / 16 / 18 / 24 — `text-xs / sm / base / lg / xl / 2xl`.
- Bodies in 14; secondary in 12-13 with `text-fg-muted`.
- Math content sets its own size via `fontSize` on `<math-field>`; surrounding chrome stays on the scale.

## Density & spacing

- Cards padded with `p-3` (12 px). Large panels use `p-4` (16 px). Never inline-padded.
- Stacks use `space-y-2 / 3 / 4` only.
- Tables use `py-2 px-3` per cell.

## States — handled uniformly

- **Empty** → `<EmptyState icon title cta>` with a single CTA.
- **Loading** → skeleton lines or `<Spinner size="sm">` next to a label.
- **Error** → in-panel `<Banner kind="error">`. Never a toast for a panel-local failure.
- **Disabled** → `opacity-60 pointer-events-none` + Tooltip explaining why.
- **Focus** → every interactive element shows the same focus ring: `focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-app`.

## Motion

- Animations no longer than 200 ms (`duration-150` / `duration-200`).
- One easing curve (`ease-out`).
- `prefers-reduced-motion` disables all non-essential transitions.

## Accessibility

- Every interactive element has an accessible name (visible label or `aria-label`).
- All overlays use Radix's focus-trap + Esc / outside-click behavior.
- Keyboard nav: arrow keys move focus within a panel ribbon; Tab moves between regions.
- Color contrast checked at build time (a small CI script asserts `--color-fg` over `--color-surface` ≥ AA in both themes).

## Enforcement

- `components/common/` is the **only** place buttons / inputs / dialogs are styled. Direct `<button>` outside this folder is flagged by an eslint rule (`no-restricted-syntax: ['button']`) with an "import from common" message.
- See [`contributing.md`](./contributing.md) for the full rules.
