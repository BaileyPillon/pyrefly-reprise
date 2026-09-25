/**
 * **Oversoul Paragon**, Chapter XIII link 1, **option 1 (TR7 b), shipped 2026-09-25**. **FFX-2 only** [AGENTS.md
 * rule 14]. Research `research/ffx2-trema.md` §12.2, SinirothX's dump (single source), its
 * behaviour verified by 3 sources (waits until hit; copies spells back; physicals often miss):
 *
 * ```
 * (1) Before it acts: hit, or its HP or MP changed?   yes -> (2b)   no -> wait
 * (2a) not hit within 20 s: anyone Reflected? Dispel on all : 1/3 Judgement, Genesis, Big Bang
 * (2b) hit by an "Attack a" -> the same attack back at whoever hit it (Normal Attack if it would
 *      be reflected);  else hit by an "Attack b" -> Demi, until hit by another attack;
 *      else -> Normal Attack
 * HP < 1/10 and nobody Reflected -> Final Impact (once)
 * HP < 4/10 -> Reflected? Dispel on all : below 1/10 1/5 each Ultima, Holy, Judgement, Genesis,
 *      Big Bang; else 1/2 Normal Attack, 1/8 each Firaga, Blizzaga, Thundaga, Waterga (all)
 * ```
 *
 * There is **no Big Bang counter** in this form (§12.2). Every gap in the dump is a named
 * parameter in {@link OVERSOUL_ESTIMATES}, set to the reading that does not make the fight easier
 * (the thresholds follow the research's ruling; `lowHpActsEveryTurn` follows Split's clear). The data rows are
 * `src/data/ffx2/enemies/paragon-oversoul.ts`.
 *
 * - **The Oversoul action** is "always the first action" a fiend of the type takes (wiki
 *   *Oversoul*, §12.2): its first turn is that transformation, a turn that plays nothing here.
 * - **"Hit"** is read off `AiScript.onPartyAction` (`engineHooks.ts`): a party action named it as a
 *   target or hit, missed or touched it. "Its HP or MP changed" otherwise comes only from the party
 *   (it is immune to Poison and Regen), so the hook covers both.
 * - **Answers** fire at once as a counter (`answerTiming: 'immediate'`) or on its next turn
 *   (`'next-turn'`, the dump's literal "before it performs an attack").
 */

import type { AbilityDef, Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { TICK_RATE_BASE } from '../constants.ts';

/**
 * The missing values of research §12.2, one named parameter each; the data rows read the ones
 * about abilities (`paragon-oversoul.ts`). Change one line to measure another reading.
 */
export const OVERSOUL_ESTIMATES = {
  /**
   * Gap 1, **`[estimate]`**: its physicals "often miss" `[verified: 3 sources]`, "most of its
   * physicals won't connect" with so-so Luck (Split), "will miss a lot" (NightMare185); no source
   * gives a rate or the mechanism (SinirothX's Acc 0 / Luck 16 do not explain it). 50 % is the
   * highest rate that wording allows. Luck is not modelled: the rate is flat for every girl.
   */
  physicalHitPercent: 50,
  /**
   * Gap 2, **`[conflict]`**: SinirothX "within 20 seconds" against the wiki's and NightMare185's
   * "about 2.5 minutes". 20 s is the harder reading (it attacks sooner when left alone). Seconds of
   * game time at Normal ATB speed.
   */
  idleSeconds: 20,
  /**
   * Gap 3, **`[conflict]`, research ruling**: SinirothX's 4/10 and 1/10 of HP left. The observations
   * (wiki "~45 %" lost, then "~80 %"; NightMare185 45 %, then 70 to 80 %) put both earlier, which
   * would be harder; the research says use SinirothX (§0.1 ranks the dump first).
   */
  magicBelow: 4 / 10,
  finalBelow: 1 / 10,
  /** Gap 4, **`[conflict]`**: Final Impact 14 hits (SinirothX, wiki) against 10 (Kolar, NightMare185). 14 is harder. */
  finalImpactHits: 14,
  /** Gap 4, **`[conflict]`**: Protect mitigates it (wiki) or nothing does (NightMare185). Unreduced is harder. */
  finalImpactReducible: false,
  /** Gap 5: the -aga spells hit all characters (the AI line, Split, zero_six "VS all chrs"), not one. */
  agaOnAll: true,
  /** Gap 6, **`[conflict]`**: its Normal Attack causes Itchy (wiki) or nothing (SinirothX). Itchy is harder. */
  attackItchy: true,
  /**
   * Gap 8, **unresolved**: an immediate counter (the wiki: it "will counter all attacks") or its next
   * turn (SinirothX "Before it performs an attack"). `'immediate'` answers every party action at
   * once, off its ATB, which is never easier than one answer a turn.
   */
  answerTiming: 'immediate' as 'immediate' | 'next-turn',
  /**
   * **`[estimate]`, the script's reading**: an "Attack b" (Cure, Shell, Protect ...) wakes it when a
   * girl casts it on anyone, or only when aimed at Paragon (the literal "hit by"). The research's
   * summary is "answers healing and buffs with Demi". Any cast is harder.
   */
  attackBWakesOn: 'any-party-cast' as 'any-party-cast' | 'aimed-at-paragon',
  /**
   * **`[estimate]`, the script's reading, not one of §12.2's gaps**: the HP lines are *what it does*
   * once (1) lets it act, so below 4/10 it still waits to be hit (`false`), the dump's literal order.
   * Split's clear agrees, `[derived]`: from the Dispel to Genesis or Final Impact it "casts -aga
   * spells or Dispel for about four or five of its turns"; at Agility 244 (a turn every 0.95 s) four
   * or five turns cannot carry it from 4/10 (or Split's own 1/4) to 1/10 of 210,000 HP unless each
   * turn waits for a party volley. `true` (every turn, hit or not) would be harder.
   */
  lowHpActsEveryTurn: false,
  /** Gap 7: "Thinking Period 0" is in the dump, undefined by any source; 0 is the engine's "none". */
  thinkingPeriod: 0,
};

/** "Attack a" [SinirothX]: MP Absorb, every Black Magic, every Arcana but Black Sky, four White Magic, Supernova. */
const ARCANA = ['drain', 'demi', 'confuse', 'break', 'bio', 'doom', 'death'].map((a) => `x2-dark-knight-${a}`);
const ATTACK_A_IDS = new Set([
  ...ARCANA, 'x2-black-mage-mp-absorb', 'x2-white-mage-dispel', 'x2-shared-haste', 'x2-shared-hastega',
  'x2-shared-holy', 'x2-gun-mage-supernova',
]);
/** "Attack b" [SinirothX]: Cure, Cura, Curaga, Regen, Esuna, Shell, Protect, Reflect, Full-Cure. */
const ATTACK_B_IDS = new Set(
  ['cure', 'cura', 'curaga', 'regen', 'esuna', 'shell', 'protect', 'reflect', 'full-cure'].map((a) => `x2-white-mage-${a}`),
);

/** Which of the dump's lists a party ability is on. */
export function oversoulAttackClass(ability: AbilityDef | undefined): 'a' | 'b' | 'other' {
  if (!ability) return 'other';
  if (ATTACK_B_IDS.has(ability.id)) return 'b';
  if (ATTACK_A_IDS.has(ability.id) || ability.category === 'blackmagic') return 'a';
  return 'other';
}

const K = {
  oversouled: 'osOversouled', quietSince: 'osQuietSince', pending: 'osPending', pendingId: 'osPendingId',
  attacker: 'osAttacker', demi: 'osDemi', finalUsed: 'osFinalUsed',
} as const;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

/** The girl who hit it, if she can still be hit; otherwise a random one. */
function atAttacker(ctx: AiContext, attackerId: string): string[] {
  return ctx.party().some((u) => u.id === attackerId) ? [attackerId] : randomGirl(ctx);
}

function anyReflected(ctx: AiContext): boolean {
  return ctx.party().some((u) => Boolean(u.statuses.reflect));
}

/** (2b): the same attack back at whoever hit it, or a Normal Attack if the copy would be reflected. */
function answer(ctx: AiContext, kind: string, abilityId: string, attackerId: string): Command {
  const targets = atAttacker(ctx, attackerId);
  const ability = ctx.ability(abilityId);
  if (kind !== 'copy' || !ability) return use('paragon-os-attack', targets);
  const girl = ctx.party().find((u) => u.id === targets[0]);
  if (girl?.statuses.reflect && ability.flags.includes('reflectable')) return use('paragon-os-attack', targets);
  return use(ability.id, ability.targeting.startsWith('single') ? targets : []);
}

/** Mark it busy: the 20 s idle clock starts again. */
function stir(ctx: AiContext): void {
  setMem(ctx.self, K.quietSince, ctx.ticks);
}

/** The HP lines, below 4/10 of max HP. */
function lowHpTurn(ctx: AiContext, hpLeft: number): Command {
  if (anyReflected(ctx)) return use('paragon-os-dispel', []);
  if (hpLeft < OVERSOUL_ESTIMATES.finalBelow) {
    const pool = [
      use('paragon-os-ultima', []), use('paragon-os-holy', randomGirl(ctx)), use('paragon-os-judgement', randomGirl(ctx)),
      use('paragon-genesis', []), use('paragon-big-bang', []),
    ];
    return pool[ctx.rng.int(0, 4)] ?? use('paragon-big-bang', []);
  }
  const roll = ctx.rng.int(0, 7); // 1/2 Normal Attack, 1/8 each -aga
  const aga = ['paragon-os-firaga', 'paragon-os-blizzaga', 'paragon-os-thundaga', 'paragon-os-waterga'][roll - 4];
  return aga ? use(aga, OVERSOUL_ESTIMATES.agaOnAll ? [] : randomGirl(ctx)) : use('paragon-os-attack', randomGirl(ctx));
}

/** (2a): left alone for the idle time. */
function idleTurn(ctx: AiContext): Command {
  if (anyReflected(ctx)) return use('paragon-os-dispel', []);
  const roll = ctx.rng.int(0, 2);
  if (roll === 0) return use('paragon-os-judgement', randomGirl(ctx));
  return use(roll === 1 ? 'paragon-genesis' : 'paragon-big-bang', []);
}

function clearPending(self: Ffx2Unit): void {
  setMem(self, K.pending, '');
}

/**
 * What it does once (1) lets it act: the HP lines when its HP is low, else (2b)'s answer (`'copy'`,
 * `'attack'`, or `'demi'` while an Attack b's Demi holds).
 */
function respond(ctx: AiContext, kind: string, abilityId: string, attackerId: string): Command {
  const self = ctx.self;
  stir(ctx);
  const hpLeft = self.hp / Math.max(1, self.stats.maxHp);
  if (hpLeft < OVERSOUL_ESTIMATES.finalBelow && self.aiMemory?.[K.finalUsed] !== true && !anyReflected(ctx)) {
    setMem(self, K.finalUsed, true);
    return use('paragon-os-final-impact', []);
  }
  if (hpLeft < OVERSOUL_ESTIMATES.magicBelow) return lowHpTurn(ctx, hpLeft);
  if (kind === 'demi') return use('paragon-os-demi', []);
  return answer(ctx, kind, abilityId, attackerId);
}

export const paragonOversoulScript: AiScript = {
  id: 'paragon-oversoul',
  decide(ctx) {
    const self = ctx.self;
    const memo = self.aiMemory ?? {};
    if (memo[K.oversouled] !== true) {
      setMem(self, K.oversouled, true);
      stir(ctx);
      ctx.emit({ type: 'message', text: 'Paragon oversouls!', kind: 'system' });
      return null; // the Oversoul action (wiki *Oversoul*): nothing else plays here
    }
    const pending = typeof memo[K.pending] === 'string' ? (memo[K.pending] as string) : '';
    if (pending !== '') {
      clearPending(self);
      return respond(ctx, pending, String(memo[K.pendingId] ?? ''), String(memo[K.attacker] ?? ''));
    }
    if (memo[K.demi] === true) return respond(ctx, 'demi', '', '');
    const low = self.hp < self.stats.maxHp * OVERSOUL_ESTIMATES.magicBelow;
    if (low && OVERSOUL_ESTIMATES.lowHpActsEveryTurn) return respond(ctx, 'attack', '', '');
    if (ctx.ticks - mem(self, K.quietSince) >= OVERSOUL_ESTIMATES.idleSeconds * TICK_RATE_BASE) {
      stir(ctx);
      return idleTurn(ctx);
    }
    return null; // (1): not hit, so it waits
  },
  onPartyAction(ctx, actor, action) {
    const self = ctx.self;
    const kind = oversoulAttackClass(action.abilityId ? ctx.ability(action.abilityId) : undefined);
    const immediate = OVERSOUL_ESTIMATES.answerTiming === 'immediate';
    if (kind === 'b' && (action.aimedAtSelf || OVERSOUL_ESTIMATES.attackBWakesOn === 'any-party-cast')) {
      setMem(self, K.demi, true);
      clearPending(self);
      stir(ctx);
      return immediate ? respond(ctx, 'demi', '', '') : null;
    }
    if (!action.aimedAtSelf) return null;
    setMem(self, K.demi, false);
    stir(ctx);
    const pending = kind === 'a' ? 'copy' : 'attack';
    if (immediate) return respond(ctx, pending, action.abilityId ?? '', actor.id);
    setMem(self, K.pending, pending);
    setMem(self, K.pendingId, action.abilityId ?? '');
    setMem(self, K.attacker, actor.id);
    return null;
  },
};
