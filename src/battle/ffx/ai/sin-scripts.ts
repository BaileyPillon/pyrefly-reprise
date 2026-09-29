/**
 * **Sin's AI scripts, registered** (FFX only). `ai/index.ts` imports this file
 * in the line that imported `./overdrive-sin.ts` (`docs/plans/sin-two-chapters-plan.md`
 * §2.1); each file below registers its own scripts on import:
 *
 * - `overdrive-sin.ts`: link 4, the head (`overdrive-sin`);
 * - `sin-fins.ts`: links 1 and 2, the Fins and Cid without missiles
 *   (`sin-left-fin`, `sin-right-fin`, `cid-fahrenheit-sin`);
 * - `sin-genais-core.ts`: link 3 (`sinspawn-genais`, `sin-core`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import './overdrive-sin.ts';
import './sin-fins.ts';
import './sin-genais-core.ts';
