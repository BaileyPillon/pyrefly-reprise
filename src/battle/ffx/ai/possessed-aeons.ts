/**
 * The possessed aeons, their turn and their `onHit` (`research/re-ffx-ai-yunalesca-bfa.md` section 5.5, m163 to m169;
 * **FFX only**). Each is the player's own aeon turned against the party: the engine copies its stats from the party's aeon
 * (`possession-setup.ts`) and the script below is its whole mind.
 *
 * A turn, once the first (a no-effect Summon and "Possessed by Yu Yevon") is past: re-read the gauge; at 100 or more the aeon
 * spends it on its Overdrive, aimed at the whole front line; otherwise it picks a random living actor first (a draw only with
 * two or more), then
 *
 * | Aeon | Special | The rest of the turn |
 * |---|---|---|
 * | Valefor, Ifrit, Ixion, Shiva | on the actor it picked, if the roll is under 50 | else the same special if that actor has Counterattack or Evade and Counter, else a plain Attack |
 * | Bahamut | Impulse on the whole front line, on the same roll | else Impulse again if the actor has a counter, else Attack on the actor |
 * | Anima | Pain on the actor, always | never Attack |
 * | Yojimbo | Kozuka or Wakizashi on a coin, never Attack | |
 *
 * and then, if the gauge is below 100, `+ GetRandomValue mod 10`, clamped at 100 (row A5). Its `onHit` adds the same
 * `mod 10` for every hit event that reached it (ignored at 0 HP, with a full gauge or for a command that does not touch HP),
 * and a Yu Pagoda's Power Wave adds 15 and a second `mod 10` on top: 15 to 33 in all, mean 24; Yojimbo's is 5 instead of
 * 15 (row A6, P5). Valefor's Overdrive is Energy Blast when the party's Valefor knows it, else Energy Ray.
 *
 * Ours has one data gap: the possessed Yojimbo's Kozuka and Wakizashi are not in the data, so both sides of his coin use
 * the Daigoro row he has. He, Anima and the Magus Sisters are outside the default chain (the five story aeons are in it).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { hasAuto } from '../equipment.ts';
import { type Ctx, rtOf } from '../state.ts';
import { frontLine, gameMod, randomLiving } from './game-rolls.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

/** The aeon's Overdrive gauge, in its actor memory: an enemy has no Overdrive block. */
const GAUGE = 'aeon.gauge';

type Pattern = 'split' | 'split-front' | 'always' | 'coin';

interface AeonScript {
  special: string;
  pattern: Pattern;
  overdrive: (ctx: Ctx) => string;
}

/** Valefor's Overdrive: Energy Blast if the party's Valefor knows it (checked once at init), else Energy Ray. */
function valeforOverdrive(ctx: Ctx): string {
  const known = ctx.rt.aeonRoster.get('valefor')?.overdrive?.unlockedOverdriveIds ?? [];
  return known.includes('energy-blast') ? 'possessed-valefor-energy-blast' : 'possessed-valefor-energy-ray';
}

const SCRIPTS: Readonly<Record<string, AeonScript>> = {
  'possessed-valefor': { special: 'possessed-valefor-sonic-wings', pattern: 'split', overdrive: valeforOverdrive },
  'possessed-ifrit': { special: 'possessed-ifrit-meteor-strike', pattern: 'split', overdrive: () => 'possessed-ifrit-hellfire' },
  'possessed-ixion': { special: 'possessed-ixion-aerospark', pattern: 'split', overdrive: () => 'possessed-ixion-thors-hammer' },
  'possessed-shiva': { special: 'possessed-shiva-heavenly-strike', pattern: 'split', overdrive: () => 'possessed-shiva-diamond-dust' },
  'possessed-bahamut': { special: 'possessed-bahamut-impulse', pattern: 'split-front', overdrive: () => 'possessed-bahamut-mega-flare' },
  'possessed-anima': { special: 'possessed-anima-pain', pattern: 'always', overdrive: () => 'possessed-anima-oblivion' },
  'possessed-yojimbo': { special: 'possessed-yojimbo-daigoro', pattern: 'coin', overdrive: () => 'possessed-yojimbo-zanmato' },
};

/** The target has Counterattack or Evade and Counter (`readBtlChrProperty(v2, 61)` or `(v2, 62)`). */
function hasCounter(target: FFXCombatant | undefined): boolean {
  return target !== undefined && (hasAuto(target, 'counterattack') || hasAuto(target, 'evade-and-counter'));
}

/** The turn's move after the Overdrive test: the pick, then the roll, in the script's order. */
function ordinaryMove(ai: AiContext, script: AeonScript): Command | null {
  const ctx = ai.ctx;
  const target = randomLiving(ctx);
  const aim = target ? [target.id] : [];
  const front = frontLine(ctx).map((c) => c.id);
  if (script.pattern === 'always') return use(ai, script.special, aim);
  if (script.pattern === 'coin') {
    gameMod(ctx, 2); // Kozuka or Wakizashi: one row stands for both (see the header)
    return use(ai, script.special, aim);
  }
  const special = script.pattern === 'split-front' ? front : aim;
  if (gameMod(ctx, 100) < 50) return use(ai, script.special, special);
  if (hasCounter(target)) return use(ai, script.special, special);
  return { kind: 'attack', targets: aim };
}

export const possessedAeonAi = (ai: AiContext): Command | null => {
  const { ctx, self, memory } = ai;
  const script = SCRIPTS[self.id];
  if (num(memory, 'opened', 0) === 0) {
    memory['opened'] = 1;
    ctx.emit({ type: 'message', text: 'Possessed by Yu Yevon!', kind: 'telegraph' });
    return null;
  }
  const gauge = num(memory, GAUGE, 0);
  if (script === undefined) return sisterTurn(ai, gauge);

  if (gauge >= 100) {
    memory[GAUGE] = 0;
    return use(ai, script.overdrive(ctx), frontLine(ctx).map((c) => c.id));
  }
  const command = ordinaryMove(ai, script);
  memory[GAUGE] = Math.min(100, gauge + gameMod(ctx, 10));
  return command;
};

/**
 * The Magus Sisters' three separate battles (an optional roster; the game fights them as one battle, row A2, which is for
 * Bailey): the pick, then half the turns the sister's special, else Attack, and the Overdrive on a full gauge, as before.
 */
function sisterTurn(ai: AiContext, gauge: number): Command | null {
  const { ctx, self, memory } = ai;
  const abilities = rtOf(ctx, self.id).abilityIds;
  const overdrives = abilities.filter((id) => ctx.content.ability(id)?.category === 'overdrive');
  const ordinary = abilities.filter((id) => ctx.content.ability(id)?.category !== 'overdrive');
  if (gauge >= 100 && overdrives[0] !== undefined) {
    memory[GAUGE] = 0;
    return use(ai, overdrives[0], frontLine(ctx).map((c) => c.id));
  }
  const target = randomLiving(ctx);
  const aim = target ? [target.id] : [];
  const command: Command =
    ordinary.length > 0 && gameMod(ctx, 100) < 50 ? use(ai, ctx.rng.pick(ordinary), aim) : { kind: 'attack', targets: aim };
  memory[GAUGE] = Math.min(100, gauge + gameMod(ctx, 10));
  return command;
}

/**
 * The aeon's `onHit` (m163 f4 @0x03F0): ignored at 0 HP, at a full gauge or for a command that does not touch HP; otherwise
 * `+ mod 10`, and for a Pagoda's Power Wave a further `mod 10` and 15 (Yojimbo: 5), clamped at 100.
 */
function possessedHit(event: HitEvent): void {
  const { ctx, target: aeon, def } = event;
  const memory = rtOf(ctx, aeon.id).ai;
  const gauge = num(memory, GAUGE, 0);
  if (aeon.hp === 0 || gauge >= 100 || !event.affectsHp) return;
  let next = gauge + gameMod(ctx, 10);
  if (def.id === 'power-wave-aeon') next += aeon.id === 'possessed-yojimbo' ? 5 : gameMod(ctx, 10) + 15;
  memory[GAUGE] = Math.min(100, next);
}

registerAiScript('possessed-aeon', possessedAeonAi);
registerHitScript('possessed-aeon', possessedHit);
