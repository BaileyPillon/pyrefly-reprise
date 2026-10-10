/**
 * Shuyin — the final boss of link 5 [research/re-ffx2-ai-bahamut-vegnagun.md section 7; re-parity AI lane FFX-2 a].
 * **FFX-2 only.** The decision table of the game's own script (`m260`), in our words.
 *
 * **The turn cycle** is eight actions long, with Terror of Zanarkand at slot 2:
 *
 * ```
 * 1 Attack · 2 TERROR OF ZANARKAND · 3 Attack · 4 Hit & Run · 5 Attack · 6 Spin Cut · 7 Attack · 8 Force Rain -> goto 1
 * ```
 *
 * Targets (rows S1): the Attack of turn 1 and Terror of Zanarkand pick a girl by the near-weighted search; the Attacks of turns 3,
 * 5 and 7 and the Spin Cut pick uniformly; Hit & Run (6 hits at random targets) and Force Rain take the whole party. **Terror
 * of Zanarkand is aimed at the girl wearing her Special 1 dressphere** (Yuna's Floral Fallal, then Paine's Full Throttle, then
 * Rikku's Machina Maw, a later check winning over an earlier one) and at the search's pick when nobody wears one. There is no
 * Yuna-first rule anywhere in the script: the old "he hunts Yuna" reading (a PS2 reading from one source) is gone.
 *
 * **Voice lines** (rows S2). Each poll whose gate is open flips a coin (`random() % 2`); on a heads the gate shuts, and with
 * HP below half a pool of seven lines (`random() % 7`: Jecht x3, Auron x2, Braska x2), otherwise a pool of five (Jecht, Auron
 * x2, Braska x2), picks one line: if it has not been spoken it is, and the poll ends (a turn spent on a line, cycle unmoved);
 * if it has, the poll goes on and attacks. The poll after a heads never flips: the gate opens again. So the chance that a given
 * unspoken line is the next to speak is 1/10 above half HP and 1/14 below, per open poll, not per turn in total.
 * The story binds one line per pool (`shuyin-taunt`, `shuyin-desperate`), whatever the pool's pick.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { scriptMod, searchNear, searchUniform, SCENES } from './script-rolls.ts';

/** The pools, by the order of the pick: Jecht, Auron, Braska. */
const LINES_HIGH = ['jeck01', 'alone01', 'alone02', 'blaska01', 'blaska02'] as const;
const LINES_LOW = ['jeck02', 'jeck03', 'jeck04', 'alone03', 'alone04', 'blaska03', 'blaska04'] as const;

/** The three Special 1 dresspheres, in the order the script checks them (a later one wins). */
const SPECIAL_ONE: readonly string[] = ['floral-fallal', 'full-throttle', 'machina-maw'];

/** The voice-line gate; true when this poll was spent on a line. */
function tryVoiceLine(ctx: AiContext): boolean {
  const self = ctx.self;
  if (mem(self, 'gate') !== 0) {
    setMem(self, 'gate', 0);
    return false;
  }
  if (scriptMod(ctx.rng, 2) !== 0) return false;
  setMem(self, 'gate', 1);
  const low = self.hp < Math.floor(self.stats.maxHp / 2);
  const pool: readonly string[] = low ? LINES_LOW : LINES_HIGH;
  const key = pool[scriptMod(ctx.rng, pool.length)] ?? pool[0] ?? '';
  if (mem(self, key) !== 0) return false;
  setMem(self, key, 1);
  const spoken = pool.filter((k) => mem(self, k) !== 0).length - 1;
  ctx.emit({
    type: 'script-trigger',
    name: low ? 'shuyin-desperate' : 'shuyin-taunt',
    payload: { index: spoken, half: low ? 'low' : 'high', line: key },
  });
  return true;
}

/** Terror of Zanarkand's target: the near-weighted pick, then the Special 1 override. */
function terrorTarget(ctx: AiContext): Ffx2Unit | undefined {
  const girls = ctx.party();
  let target = searchNear(ctx.rng, girls, SCENES.shuyin);
  for (const sphere of SPECIAL_ONE) {
    const wearer = girls.find((g) => g.dresspheres?.current === sphere);
    if (wearer) target = wearer;
  }
  return target;
}

function aimed(id: string, target: Ffx2Unit | undefined): Command | null {
  return target ? { kind: 'ability', id, targets: [target.id] } : null;
}

export const shuyinScript: AiScript = {
  id: 'shuyin',

  decide(ctx: AiContext): Command | null {
    if (tryVoiceLine(ctx)) return null;

    const self = ctx.self;
    const turn = mem(self, 'turn') + 1;
    setMem(self, 'turn', turn);
    const girls = ctx.party();
    switch (turn) {
      case 1:
        return aimed('shuyin-attack', searchNear(ctx.rng, girls, SCENES.shuyin));
      case 2: {
        // The countdown telegraph. Nine Defense-ignoring hits are coming.
        ctx.emit({ type: 'charge', enemyId: self.id, name: 'Terror of Zanarkand', turnsLeft: 0, stage: 2 });
        return aimed('terror-of-zanarkand', terrorTarget(ctx));
      }
      case 3:
      case 5:
      case 7:
        return aimed('shuyin-attack', searchUniform(ctx.rng, girls));
      case 4:
        return { kind: 'ability', id: 'run-and-slash', targets: [] };
      case 6:
        return aimed('spin-cut', searchUniform(ctx.rng, girls));
      default:
        setMem(self, 'turn', 0);
        return { kind: 'ability', id: 'force-rain', targets: [] };
    }
  },
};

export default shuyinScript;
