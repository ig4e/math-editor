// Side-effect barrel for the command registry. Bootstrap commands
// register first; later phases drop their own register files here.

import { registerBootstrapCommands } from './bootstrap';

// Bootstrap depends on the panel registry being populated so its
// dynamic "Open <Panel>" commands can mirror it. Panels register via
// `src/panels/index.ts`; whichever module imports both should import
// panels first. main.tsx does so by importing './panels' before this.
registerBootstrapCommands();
