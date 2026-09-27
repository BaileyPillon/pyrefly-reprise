/**
 * Guard Scorpion's script, the No. 1 Reactor core [gs §5, verified: 2 sources:
 * Fergusson EM §5.1.1 "AI: Setup / Main / Counter - General / Counter - Death";
 * wiki "AI script"]. Behaviour-exact restatement of gs §5.1:
 *
 * ```
 * SETUP   MDf = 256 (the data already carries it, gs §2.2); Stage = Count = Warning = 0
 * MAIN    Count 0 or 2: Target = random opponent; Search Scope on it ("Locked On Target")
 *         Count 1 or 3: 1/3 Scorpion Tail, else (HP < MaxHP/2 ? Scorpion Tail : Rifle), on Target
 *         Count 4:      Raise Tail (Def 255, MDf 384, Stage 1; the warning once)
 *         Count 5, 6:   the turn passes
 *         Count 7:      Drop Tail (Def 40, MDf 256, Stage 0); Count = 0
 * COUNTER General: if Stage == 1, Tail Laser on all opponents
 * COUNTER Death:   if Stage == 1, Drop Tail (animation only)
 * ```
 *
 * **The tail is on the turn counter, never on HP** [gs §5.3]. Draw order in Main:
 * Count 0 / 2 one `Rnd(0..n-1)` for the target; Count 1 / 3 one `Rnd(0..2)` for the
 * 1/3 (drawn first, as Fergusson rolls it, even when HP decides), then a second
 * `Rnd(0..n-1)` only when the Target was KO'd since Search Scope. That retarget is
 * **our estimate** (gs §5.6, G7: unsourced).
 *
 * The form (Def/MDf) changes with the Raise Tail and Drop Tail actions themselves
 * (`toForm` in the data); a single enemy commits and resolves in the same tick,
 * so this is the same instant the script sets them.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { CombatantId, Ff7HintCase } from '../../common/types.ts';
import { randomOpponent, type Ff7AiApi, type Ff7AiPlan, type Ff7AiScript } from './script.ts';

const COUNT = 'count';
const STAGE = 'stage';
const WARNING = 'warning';
const TARGET = 'target';

/** The two party members the warning is written for [gs §7.1]. */
const CLOUD: CombatantId = 'cloud';
const BARRET: CombatantId = 'barret';

/**
 * The warning, verbatim (PlayStation English as transcribed; "it's" is the game's
 * spelling) [gs §7.1, verified: 2 sources: Fergusson EM script, wiki script; the
 * third line per the transcriptions, gs §7.2 / G8]. `{barret}` is Barret's name.
 */
export const GUARD_SCORPION_HINTS: Readonly<Record<Ff7HintCase, { speaker: CombatantId; lines: readonly string[] }>> = {
  'both-alive': {
    speaker: CLOUD,
    lines: ['{barret}, be careful!', "Attack while it's tail's up!", "It's gonna counterattack with its laser."],
  },
  'cloud-only': {
    speaker: CLOUD,
    lines: ["It's gonna fire that laser...", "Attack while it's tail's up!", "It's gonna counterattack with its laser."],
  },
  'barret-only': {
    speaker: BARRET,
    lines: ["I dunno what's goin' on, but...", 'it looks pretty bad.', "Let's see what it does when it's tail's up..."],
  },
};

/** Which warning plays, by who is alive [gs §7.1]; null when neither is (the battle is over then). */
export function hintCase(cloudAlive: boolean, barretAlive: boolean): Ff7HintCase | null {
  if (cloudAlive && barretAlive) return 'both-alive';
  if (cloudAlive) return 'cloud-only';
  if (barretAlive) return 'barret-only';
  return null;
}

function alive(api: Ff7AiApi, id: CombatantId): boolean {
  const c = api.state.combatants[id];
  return !!c && c.alive && !c.removed;
}

/** Show the warning lines as `message` events (kind `'story'`, tagged `ff7.hint`). */
function warn(api: Ff7AiApi): void {
  const which = hintCase(alive(api, CLOUD), alive(api, BARRET));
  if (!which) return;
  const hint = GUARD_SCORPION_HINTS[which];
  const barretName = api.state.combatants[BARRET]?.name ?? 'Barret';
  hint.lines.forEach((line, i) => {
    api.emit({
      type: 'message',
      text: line.replace('{barret}', barretName),
      kind: 'story',
      ff7: { kind: 'hint', hintCase: which, line: i, speakerId: hint.speaker },
    });
  });
}

export const guardScorpionScript: Ff7AiScript = {
  setup(api) {
    api.set(STAGE, 0);
    api.set(COUNT, 0);
    api.set(WARNING, 0);
  },

  main(api): Ff7AiPlan {
    const count = api.get(COUNT);
    switch (count) {
      case 0:
      case 2: {
        const target = randomOpponent(api);
        api.setId(TARGET, target.id);
        api.set(COUNT, count + 1);
        return { kind: 'ability', abilityId: 'search-scope', targets: [target.id] };
      }
      case 1:
      case 3: {
        const third = api.rng.int(0, 2) === 0; // "with chance 1/3" [gs §5.1]
        const low = api.self.hp * 2 < api.self.stats.maxHp; // HP < MaxHP / 2
        const saved = api.getId(TARGET);
        const target = saved && alive(api, saved) ? saved : randomOpponent(api).id; // G7 [estimate]
        api.set(COUNT, count + 1);
        return { kind: 'ability', abilityId: third || low ? 'scorpion-tail' : 'rifle', targets: [target] };
      }
      case 4:
        api.set(COUNT, 5);
        return { kind: 'ability', abilityId: 'raise-tail', targets: [api.self.id] };
      case 5:
      case 6:
        api.set(COUNT, count + 1);
        return { kind: 'pass' };
      default:
        // Count 7.
        api.set(COUNT, 0);
        return { kind: 'ability', abilityId: 'drop-tail', targets: [api.self.id] };
    }
  },

  afterAction(api, plan) {
    if (plan.kind !== 'ability') return;
    if (plan.abilityId === 'raise-tail') {
      api.set(STAGE, 1);
      if (api.get(WARNING) === 0) {
        warn(api);
        api.set(WARNING, 1);
      }
    } else if (plan.abilityId === 'drop-tail') {
      api.set(STAGE, 0);
    }
  },

  // Tail Laser answers every hostile action while the tail is up, 100% [gs §5.5, verified: 3 sources].
  counterGeneral(api) {
    if (api.get(STAGE) !== 1) return null;
    const targets = api.opponents().map((c) => c.id);
    return targets.length > 0 ? { kind: 'ability', abilityId: 'tail-laser', targets } : null;
  },

  // A killing blow runs the death counter instead: Drop Tail, animation only [gs §5.1, §5.5].
  counterDeath(api) {
    if (api.get(STAGE) !== 1) return null;
    api.set(STAGE, 0);
    return { kind: 'ability', abilityId: 'drop-tail', targets: [api.self.id] };
  },
};
