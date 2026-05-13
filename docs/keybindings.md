# Keybindings

Every keybind in the app is bound to a **command** in the command registry — never to a panel or component directly. That means rebinding a key is the same operation regardless of what it controls.

Open the editor: **Settings → Keybinds**, or run "Customize keybindings" from the command palette.

## Platform-aware defaults

Defaults are platform-aware: `Mod` resolves to **Cmd** on macOS and **Ctrl** elsewhere. Defaults below show the macOS form.

### Math

| Command | Default | Notes |
|---|---|---|
| Add equation block | `E` | place at viewport center |
| Add text block | `T` | place at viewport center |
| Solve selected | `⌘ Enter` | works inside a math field too |
| Simplify selected | `⌘ ⇧ S` | |
| Solve as system | `⌘ ⇧ Enter` | requires ≥ 2 math blocks selected |
| Convert selection to math (OCR) | `⌘ ⇧ M` | requires AI BYOK with a vision-capable model |
| Insert template… | `⌘ ⇧ I` | opens the template picker |
| Duplicate selection | `⌘ D` | |

### View

| Command | Default |
|---|---|
| Open command palette | `⌘ K` |
| Open Graph 2D | `⌘ G` |
| Open Graph 3D | `⌘ ⇧ G` |
| Open AI chat | `⌘ L` |
| Open Variables | `⌘ ⇧ V` |
| Open Solver | `⌘ ⇧ R` |
| Open Settings | `⌘ ,` |
| Reset layout | `⌘ 0` |
| Toggle theme | `⌘ ⇧ T` |
| Zoom in / out / reset | `⌘ + / ⌘ − / ⌘ 0` |

### File

| Command | Default |
|---|---|
| New sheet | `⌘ N` |
| Next / previous sheet | `⌘ ] / ⌘ [` |
| Save | `⌘ S` |
| Copy share link | `⌘ ⇧ C` |
| Export PDF | `⌘ ⇧ E` |

### Edit (Excalidraw-native)

These come from Excalidraw and are not rebindable through our editor — they're the canvas engine's own bindings:

| Command | Default |
|---|---|
| Undo / Redo | `⌘ Z / ⌘ ⇧ Z` |
| Cut / Copy / Paste | `⌘ X / ⌘ C / ⌘ V` |
| Select all | `⌘ A` |
| Bring forward / backward | `⌘ ] / ⌘ [` (canvas-focused only) |
| Group / Ungroup | `⌘ G / ⌘ ⇧ G` (canvas-focused only) |

When the canvas has focus, Excalidraw owns the shortcut. When a panel has focus, our registry owns it. The command palette is always accessible.

## Rebinding

In the Keybinds editor (**Settings → Keybinds**):

1. Find the command (search by name or category).
2. Click the shortcut cell → cell enters **record mode**.
3. Press the new combo.
4. Esc cancels record; Enter commits.
5. If the combo conflicts with another command, the conflicting row highlights red and a tooltip names the colliding command. You can pick a different combo or override the conflict (the older binding is cleared).
6. Per-row **Reset** restores the default. A global **Reset all to defaults** at the top.

## Sharing keybind sets

The editor exposes **Export** (downloads a JSON file) and **Import** (uploads one). Useful for sharing a set of keybindings across machines or teaching environments.

## Notation

In the UI, modifiers render as platform-appropriate symbols: `⌘ / ⌃ / ⌥ / ⇧ / Enter / Esc / Tab`. Letter keys are uppercase. Number-row keys are bare digits.

The underlying combo string format (used in `keybinds/defaults.ts` and on import / export) follows `tinykeys` syntax:

```
$mod+Enter        // Cmd on Mac, Ctrl elsewhere
$mod+Shift+S
Control+Alt+Backspace
```

## Implementation notes

- `keybinds/defaults.ts` is a single table mapping command IDs to combos.
- `keysSlice` stores user overrides; resolution = defaults overlaid with overrides.
- `keybinds/useKeybinds.ts` mounts the bindings via `tinykeys` and dispatches to the command registry. Re-mounted when the resolved map changes (so edits take effect instantly).
- Bindings honor `Command.when(ctx)` — a command's binding is inactive when its predicate is false. Example: "Solve as system" requires `ctx.selectedMathBlockCount >= 2`.
