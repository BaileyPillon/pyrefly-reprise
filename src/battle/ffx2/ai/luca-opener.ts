/**
 * Ormi, Logos and Leblanc on the docks of Luca: the first fights of FFX-2's Chapter 1 (the hidden chapter "The Luca Opener"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own scripts, `m129`, `m130` and `m131`** (`research/re-ffx2-luca-opener.md` section 3: the shipped plain-text AI sources, each equal to its compiled worker in its queued command ids;
 * none carries a "battle too long" block). `random() % n` is stream 2, `searchr` (near-weighted) and `searchr_nop` (uniform) are stream 4. Each poll, in this order `[script]`:
 *
 * | Who | Condition | Action |
 * |---|---|---|
 * | **Ormi** (`m129`) | his counter `t` is 2 or more | `t` := 0; **Pirouette Pitch** (the weak shield throw, power 26) on the girl at the **greatest 2-D distance** from him |
 * | | else | `t` + 1; **Attack** on a near-weighted living girl |
 * | **Logos** (`m130`) | the flag `portion` is 0 and **Ormi's HP is under a fifth of his maximum** (integer division: `hp < floor(97 / 5) = 19`, so 18 or less) | `portion` := 1; **Potion** (the weak one: a fixed 20 HP) on Ormi |
 * | | else | **1H Pistol** (two hits) on a uniformly chosen living girl |
 * | **Leblanc** (`m131`) | her counter `t` is 0 to 2 | `t` + 1; **Attack** on a near-weighted living girl |
 * | | else | `t` := 0; her MP under 8: **Attack**; otherwise **Thunder** on the living girl with the most HP |
 *
 * So Ormi's cycle is Attack, Attack, shield throw for ever; Logos shoots, with at most one Potion in the whole fight; Leblanc's is Attack, Attack, Attack, Thunder (Thunder costs 4 MP and she has 101, so the MP test never fires in
 * play). Their records' death handling (a spoken line while the body falls; no revive for Ormi and Logos, a fade-out for Leblanc) is the engine's KO.
 *
 * **Draw counts (rule 3, measured by `tests/unit/chapters/luca-opener-ai.test.ts`).** A search over fewer than two candidates draws nothing. Leblanc's Thunder is a PAIR: the script runs `searchr` over the living girls and throws its pick
 * away (it still draws when two or more live), then `searchr_nop` over the same set keeps the candidates tied for the most HP and picks among the ties (one more draw with a tie): `extremePick`, the repo's reading of the pair
 * (`./script-rolls.ts`). Ormi's farthest-girl search is a single `searchr` over the distance with `max`: an unambiguous extreme draws nothing, an exact tie draws once (near-weighted).
 *
 * **Targets, from the docks' start positions** (`./script-rolls.ts` `SCENES.lucaOrmi` and `SCENES.lucaLeblanc`, `pos_lchb03_229.psc` and `pos_lchb03_228.psc`; the engine tracks no later movement, as for every other boss that uses
 * `searchr`): from Ormi at (-27, -12) the girls are 49.5 (Yuna), 56.4 (Rikku) and 51.0 (Paine) away, so **the shield throw goes to Rikku while she is up**; with Rikku down it goes to Paine, and with Rikku and Paine down to Yuna.
 *
 * **Not modelled (disclosed, not tuned):** Ormi's lone-45-HP rule (a test formation's: LO5, the real scene has Logos beside him, so he keeps 97); Leblanc's opening ATB wait (the engine's own opening gauges apply); the game's
 * handling of a Potion queued at an Ormi who is already down (Logos' test is `Ormi's HP < max / 5`, and a fallen Ormi has 0: the script queues the Potion anyway, once, and the engine decides what a heal on a fallen target does; the
 * answer is pinned by the AI test, and the game's own answer is `[gap]`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { SCENES, extremeId, girls, maxHpDiv, searchNear, searchUniform, type Scene } from './script-rolls.ts';

/** The script ids (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/luca-opener.ts` names the same strings, a test pins them). */
export const LUCA_ORMI_SCRIPT = 'x2-luca-ormi';
export const LUCA_LOGOS_SCRIPT = 'x2-luca-logos';
export const LUCA_LEBLANC_SCRIPT = 'x2-luca-leblanc';

/** The combatant ids (`src/battle/**` imports no `src/data/**`, so the strings are repeated here and a test pins them against the data). */
export const LUCA_ORMI = 'x2-luca-ormi';

/** The ability ids (the data file `luca-opener-abilities.ts` owns the rows; a test pins these against it). */
export const LUCA_ABILITY = {
  ormiAttack: 'x2-luca-ormi-attack',
  pitch: 'x2-luca-ormi-pirouette-pitch',
  pistol: 'x2-luca-logos-pistol',
  potion: 'x2-luca-logos-potion',
  leblancAttack: 'x2-luca-leblanc-attack',
  thunder: 'x2-luca-leblanc-thunder',
} as const;

/** AI memory: Ormi's counter `mf_t`, Logos' flag `mf_portion`, Leblanc's counter `mf_t`. */
export const LUCA_ORMI_T = 'lucaOrmiT';
export const LUCA_LOGOS_PORTION = 'lucaLogosPortion';
export const LUCA_LEBLANC_T = 'lucaLeblancT';

/** Ormi throws the shield when his counter has reached this many Attacks `[script]`: `mf_t >= 2`. */
export const LUCA_ORMI_ATTACKS_BEFORE_PITCH = 2;
/** Logos throws his Potion when Ormi's HP is under his maximum divided by this (integer division) `[script]`. */
export const LUCA_POTION_DIVISOR = 5;
/** Leblanc attacks while her counter is at most this (`mf_t <= 2`), so three times before each Thunder `[script]`. */
export const LUCA_LEBLANC_LAST_ATTACK_T = 2;
/** She attacks instead of casting under this much MP `[script]`. */
export const LUCA_LEBLANC_ATTACK_BELOW_MP = 8;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The ground distance from the scene's boss spot to the girl at party slot `slot`, in the game's units, from the scene's start positions. */
export function groundDistance(scene: Scene, slot: number): number {
  const girl = scene.girls[slot] ?? scene.girls[0];
  return Math.hypot(girl.x - scene.boss.x, girl.z - scene.boss.z);
}

/**
 * "The character furthest away": the living girl(s) at the greatest ground distance from the scene's boss spot; an unambiguous extreme draws nothing, exact ties are near-weighted (`searchNear`), one draw among two or more.
 * `[script]`, from the scene's own start positions.
 */
export function furthestGirl(ctx: AiContext, scene: Scene): string[] {
  const alive = girls(ctx);
  if (alive.length === 0) return [];
  const farthest = Math.max(...alive.map((u) => groundDistance(scene, u.slot)));
  const tied = alive.filter((u) => Math.abs(groundDistance(scene, u.slot) - farthest) < 1e-9);
  const pick = searchNear(ctx.rng, tied, scene);
  return pick === undefined ? [] : [pick.id];
}

/** An Attack's target: the near-weighted pick of a living girl (one draw with two or more) `[script]`. */
export function nearGirl(ctx: AiContext, scene: Scene): string[] {
  const pick = searchNear(ctx.rng, girls(ctx), scene);
  return pick === undefined ? [] : [pick.id];
}

/** Ormi (`m129`): Attack, Attack, shield throw at the farthest girl, for ever. */
export const x2LucaOrmiScript: AiScript = {
  id: LUCA_ORMI_SCRIPT,
  decide(ctx) {
    if (girls(ctx).length === 0) return null;
    const self = ctx.self;
    const t = mem(self, LUCA_ORMI_T);
    if (t >= LUCA_ORMI_ATTACKS_BEFORE_PITCH) {
      setMem(self, LUCA_ORMI_T, 0);
      return use(LUCA_ABILITY.pitch, furthestGirl(ctx, SCENES.lucaOrmi));
    }
    setMem(self, LUCA_ORMI_T, t + 1);
    return use(LUCA_ABILITY.ormiAttack, nearGirl(ctx, SCENES.lucaOrmi));
  },
};

/** Ormi as Logos' script reads him: the enemy with Ormi's id, standing or fallen (`getstat` on a fallen body reads 0). */
function ormiOf(ctx: AiContext): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === LUCA_ORMI && u.side === 'enemy');
}

/** Logos (`m130`): the pistol on a uniform girl, and one Potion for Ormi when he is under a fifth of his life. */
export const x2LucaLogosScript: AiScript = {
  id: LUCA_LOGOS_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    if (mem(self, LUCA_LOGOS_PORTION) === 0) {
      const ormi = ormiOf(ctx);
      if (ormi !== undefined && ormi.hp < maxHpDiv(ormi, LUCA_POTION_DIVISOR)) {
        setMem(self, LUCA_LOGOS_PORTION, 1);
        return use(LUCA_ABILITY.potion, [ormi.id]);
      }
    }
    const target = searchUniform(ctx.rng, party);
    return use(LUCA_ABILITY.pistol, target === undefined ? [] : [target.id]);
  },
};

/** Leblanc (`m131`): three Attacks, then Thunder at the girl with the most HP. */
export const x2LucaLeblancScript: AiScript = {
  id: LUCA_LEBLANC_SCRIPT,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    const t = mem(self, LUCA_LEBLANC_T);
    if (t <= LUCA_LEBLANC_LAST_ATTACK_T) {
      setMem(self, LUCA_LEBLANC_T, t + 1);
      return use(LUCA_ABILITY.leblancAttack, nearGirl(ctx, SCENES.lucaLeblanc));
    }
    setMem(self, LUCA_LEBLANC_T, 0);
    if (self.mp < LUCA_LEBLANC_ATTACK_BELOW_MP) return use(LUCA_ABILITY.leblancAttack, nearGirl(ctx, SCENES.lucaLeblanc));
    return use(LUCA_ABILITY.thunder, extremeId(ctx.rng, party, (u) => u.hp, 'max'));
  },
};

export const lucaOpenerScripts: readonly AiScript[] = [x2LucaOrmiScript, x2LucaLogosScript, x2LucaLeblancScript];

export default lucaOpenerScripts;
