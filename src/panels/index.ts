// Side-effect barrel. Every panel registers itself here on first import.
// Adding a new panel: drop a folder under src/panels/, add a `register.ts`
// that calls registerPanel(...), and import it from this file.
//
// Order doesn't matter at runtime (the registry is a flat Map), but we
// keep it sorted by phase + alphabetical for readability.

// Canvas is no longer a sidebar panel — it IS the app shell. Other
// modules still import from src/panels/canvas/ for the toolbar, math
// embeddable rendering, and inject helpers, but no `register.ts` for
// canvas is needed.
// Phase 3
import './solver/register';
import './variables/register';
// Phase 4
import './graph/register';
// Phase 5
import './graph3d/register';
// Phase 6
import './ai/register';
// Phase 7
import './inspector/register';
import './notes/register';
import './reference/register';
// Phase 1 — actually implemented
import './settings/register';
// Phase 13
import './matrix/register';
// Phase 14
import './numerics/register';
// Phase 15
import './mllab/register';
