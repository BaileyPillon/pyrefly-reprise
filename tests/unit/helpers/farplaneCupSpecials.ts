/**
 * The Farplane Cup with the girls able to reach their Special dresspheres (FFX-2 only; the `specialDressUp` switch is passed ON here, it is OFF in every build).
 *
 * {@link specialFight} plays one duel on the real engine with one girl WALKING her real Garment Grid to her Special (the Change rows the menu offers, by breadth-first search over the grid's links),
 * putting it on the moment the menu offers it, and playing her three parts with {@link partsPolicy}; everybody else plays the existing `curtains` line (`helpers/farplaneCupDrive.ts`), and once the form is over
 * (left, or the main body fell) every girl who can act plays it again. A line is an input to a measurement, never game data; nothing here tunes a boss (rule 6).
 *
 * `mastered` gives the three Specials everything learned (`forms.ts#masteredLearned`: the whole ladder and Double and Triple HP): the Lv 99 party of the Cup is an endgame party, but no source says which
 * abilities of a Special it has learned, so both readings are measured (the build as given has none: the commands the game lists from the start).
 */

import type { Command, Decision, FFX2Combatant } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FORMS, masteredLearned } from '../../../src/battle/ffx2/special/forms.ts';
import { farplaneCupBuild } from '../../../src/data/ffx2/builds/farplane-cup.ts';
import { farplaneCupGroups } from '../../../src/data/ffx2/enemies/farplane-cup.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { LINES, bossOf, girlsOf, type Duel } from './farplaneCupDrive.ts';
import { changeRows, nextStep, nodesOf, partsPolicy, specialRow, toNodeOf, unit, logOf } from './specialDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

export type Walker = 'yuna' | 'rikku' | 'paine' | null;

export interface SpecialFight {
  outcome: string | undefined;
  /** Game seconds at which the walker was offered and took her Special; undefined when she never did. */
  enteredAt: number | undefined;
  changes: number;
  kos: number;
  ejects: number;
  /** Whether the form ended by the main body's fall, and how many actions the parts took. */
  formEndedByFall: boolean;
  partActions: number;
  /** Eject statuses put on the walker or her pods while the form stood (the sourced rule says none can land). */
  ejectsOnParts: number;
  /** Eject statuses put on any girl outside the form. */
  ejectsOutside: number;
  seconds: number;
}

const STEP_SECONDS = 1 / 29.97;

export function specialFight(duel: Duel, seed: number, walker: Walker, mastered: boolean, maxDecisions = 60_000): SpecialFight {
  const boss = bossOf(duel);
  const build = structuredClone(farplaneCupBuild);
  if (mastered) for (const m of build.members) Object.assign(m.abilitiesLearned, masteredLearned(Object.values(FORMS).find((f) => f.girl === m.id)!));
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', specialDressUp: true }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: build, enemies: farplaneCupGroups[duel]!, triggers: [], seed, condition: 'normal', canEscape: false });

  const rest = LINES.curtains(boss);
  const parts = partsPolicy(boss);
  const nodes = walker ? nodesOf(engine, walker) : [];
  let changes = 0;
  let entered: number | undefined;
  let outcome: string | undefined;
  let partActions = 0;
  let sawForm = false;

  for (let i = 0; i < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String(d.result.outcome);
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(25, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const inForm = walker !== null && (unit(engine, walker).dresspheres?.special !== undefined);
    if (inForm) {
      sawForm = true;
      partActions += 1;
      engine.submit(parts(d as Input, engine));
      continue;
    }
    if (walker !== null && d.actorId === walker && !sawForm) {
      const row = specialRow(d as Input);
      if (row) {
        entered = engine.state().ticks * STEP_SECONDS;
        engine.submit(row.command);
        continue;
      }
      const step = nextStep(engine, walker, nodes);
      const change = step ? changeRows(d as Input).find((r) => toNodeOf(r) === step.node && r.enabled) : undefined;
      if (change) {
        changes += 1;
        engine.submit(change.command);
        continue;
      }
    }
    engine.submit((rest(d as Input, engine) as Command | null) ?? { kind: 'defend', targets: [] });
  }

  const log = logOf(engine);
  let kos = 0;
  for (const e of log) {
    if (e.type === 'ko' && (e.targetId === 'yuna' || e.targetId === 'rikku' || e.targetId === 'paine' || (e.targetId ?? '').startsWith('floral-') || (e.targetId ?? '').startsWith('machina-') || (e.targetId ?? '').startsWith('full-'))) kos += 1;
  }
  const partIds = new Set<string>(walker === null ? [] : [walker, ...Object.values(FORMS).find((f) => f.girl === walker)!.pods.map((p) => p.id)]);
  // The form stands from the `spherechange` with `special` until the `spherechange` that takes the Special off (the girl's way out, or the settle after her main body fell).
  let standing = false;
  let ejectsOnParts = 0;
  let ejectsOutside = 0;
  for (const e of log) {
    const ev = e as unknown as { type: string; status?: string; targetId?: string; special?: string; from?: string; who?: string };
    if (ev.type === 'spherechange') {
      if (ev.special !== undefined) standing = true;
      else if (standing && ev.who === walker) standing = false;
    }
    if (ev.type !== 'status-add' || ev.status !== 'eject') continue;
    if (standing && partIds.has(ev.targetId ?? '')) ejectsOnParts += 1;
    else ejectsOutside += 1;
  }
  const girls = girlsOf(engine) as FFX2Combatant[];
  const fall = walker !== null && sawForm && unit(engine, walker).dresspheres?.special === undefined && !unit(engine, walker).alive;
  return {
    outcome,
    enteredAt: entered,
    changes,
    kos,
    ejects: girls.filter((g) => g.statuses['eject'] !== undefined).length,
    formEndedByFall: fall,
    partActions,
    ejectsOnParts,
    ejectsOutside,
    seconds: engine.state().ticks * STEP_SECONDS,
  };
}
