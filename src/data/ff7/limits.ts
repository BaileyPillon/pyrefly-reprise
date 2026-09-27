/**
 * The Limit gauge's LNum per character and Limit Level [core §7.1, verified: 2 sources:
 * Fergusson PM §3.2; wiki "Limit (Final Fantasy VII)"].
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** At Level 1, Cloud fills at 46.5% of
 * Max HP lost and Barret at 42.8% [core §7.1].
 */

import type { Ff7LimitTable } from '../../battle/ff7/defs.ts';
import type { Ff7CharacterId } from './ids.ts';

export const FF7_LIMIT_TABLES: Readonly<Record<Ff7CharacterId, Ff7LimitTable>> = {
  cloud: { lnum: [140, 324, 435, 506], cite: 'core §7.1 [verified: 2 sources]' },
  barret: { lnum: [129, 240, 374, 450], cite: 'core §7.1 [verified: 2 sources]' },
};
