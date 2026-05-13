// Side-effect barrel — importing this file registers every solver
// backend. Bootstrap calls this once during app init via the commands
// barrel (Solver panel + AI tools also call solve() through ./index).

import './computeEngine';
// mathsteps is lazy via a dedicated module that registers itself on
// first import (it imports its own heavy mathjs dep). Importing the
// REGISTRATION here keeps the registry aware of its existence without
// loading the heavy mathjs code yet — the solver's `invoke` does the
// dynamic import.
import './mathsteps';
