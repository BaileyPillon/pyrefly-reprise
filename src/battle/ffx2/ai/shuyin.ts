/**
 * Shuyin — the final boss [ffx2-vegnagun-shuyin §5.5, §3.5].
 *
 * A clean eight-turn cycle, with Terror of Zanarkand — the Blitz Ace analogue —
 * parked at slot 2 so it lands early and again every eighth turn:
 *
 * ```
 * 1 Attack · 2 TERROR OF ZANARKAND · 3 Attack · 4 Run & Slash ·
 * 5 Attack · 6 Spin Cut · 7 Attack · 8 Force Rain -> goto 1
 * ```
 *
 * **Interrupts consume the turn and land no attack**: above half HP a 1-in-10
 * chance per turn of a yell or a one-shot Braska / Auron / Jecht line (five
 * available, each used at most once); below half, 1-in-14 from a pool of seven.
 * They are the pacing valve that keeps a nine-hit Defense-ignoring combo from
 * arriving every eight turns without pause.
 *
 * **Targeting quirk (§3.5).** The original PS2 release has Shuyin
 * preferentially target Yuna whenever she is alive — he is hunting the woman
 * wearing Lenne's dressphere. International / HD targets anybody. We ship the
 * original, exposed as `flags.shuyinTargetsAnyone` so an authenticity toggle
 * can flip it. The gameplay consequence is real: do not make Yuna the healer.
 *
 * Terror of Zanarkand is telegraphed with `charge` events rather than landing
 * unannounced — 1,710–1,935 across nine unblockable hits will KO almost any
 * party member at this level, so the player is owed the tell.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

const CYCLE: readonly string[] = [
  'shuyin-attack',
  'terror-of-zanarkand',
  'shuyin-attack',
  'run-and-slash',
  'shuyin-attack',
  'spin-cut',
  'shuyin-attack',
  'force-rain',
];

/** One-shot flavour lines: five above half HP, seven below. §5.5 */
const LINES_HIGH = 5;
const LINES_LOW = 7;
const INTERRUPT_CHANCE_HIGH = 10;
const INTERRUPT_CHANCE_LOW = 14;

/** Party-wide moves take no explicit target list. */
const PARTY_WIDE = new Set(['force-rain', 'run-and-slash']);

/** §3.5 — Yuna bias, unless the authenticity toggle says otherwise. */
function pickTarget(ctx: AiContext): Ffx2Unit | undefined {
  const party = ctx.party();
  if (party.length === 0) return undefined;
  if (ctx.flags['shuyinTargetsAnyone'] === true) return ctx.rng.pick(party);
  const yuna = party.find((p) => p.id === 'yuna');
  return yuna ?? ctx.rng.pick(party);
}

/** Roll the flavour interrupt. Returns true when the turn was spent on a line. */
function tryInterrupt(ctx: AiContext): boolean {
  const self = ctx.self;
  const low = self.hp < self.stats.maxHp / 2;
  const pool = low ? LINES_LOW : LINES_HIGH;
  const used = mem(self, low ? 'linesLow' : 'linesHigh');
  if (used >= pool) return false;
  const chance = low ? INTERRUPT_CHANCE_LOW : INTERRUPT_CHANCE_HIGH;
  if (ctx.rng.int(1, chance) !== 1) return false;

  setMem(self, low ? 'linesLow' : 'linesHigh', used + 1);
  ctx.emit({
    type: 'script-trigger',
    name: low ? 'shuyin-desperate' : 'shuyin-taunt',
    payload: { index: used, half: low ? 'low' : 'high' },
  });
  return true;
}

export const shuyinScript: AiScript = {
  id: 'shuyin',

  decide(ctx: AiContext): Command | null {
    if (tryInterrupt(ctx)) return null;

    const s = mem(ctx.self, 'step');
    setMem(ctx.self, 'step', s + 1);
    const abilityId = CYCLE[s % CYCLE.length] ?? 'shuyin-attack';

    if (abilityId === 'terror-of-zanarkand') {
      // The countdown telegraph. Nine Defense-ignoring hits are coming.
      ctx.emit({
        type: 'charge',
        enemyId: ctx.self.id,
        name: 'Terror of Zanarkand',
        turnsLeft: 0,
        stage: 2,
      });
    }

    if (PARTY_WIDE.has(abilityId)) return { kind: 'ability', id: abilityId, targets: [] };
    const target = pickTarget(ctx);
    return { kind: 'ability', id: abilityId, targets: target ? [target.id] : [] };
  },
};

export default shuyinScript;
