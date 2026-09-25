/**
 * **The absence check, reproducible** (AGENTS.md hard rule 14; the Chapter XIV
 * engine review asked for the "byte-identical" claim to be re-runnable).
 *
 * Plays every registered **FFX** chapter headless from its own setup through
 * its whole chain (`setupForNextLink`, the screen's own carry), under three
 * seeded policies, and hashes what the player would see and what happened:
 * every menu the engine offers, the full event log and the result. Run it on
 * two trees and diff the JSON; a change that is meant to be inert elsewhere
 * must leave every line equal.
 *
 * Skipped unless `FFX_HASH_OUT` names the JSON file to write, so `npm test`
 * does not pay for it. Usage (from the tree to measure):
 *
 *   FFX_HASH_OUT=D:/Tools/pyrefly-scratch/<key>/head.json FFX_HASH_SEEDS=8 \
 *     npx vitest run tests/unit/tools/ffx-chapter-hashes.test.ts
 *
 * For the other side, `git archive <base> | tar -x` into scratch on D:, give it
 * a `node_modules` junction, copy this file in and run the same command. It
 * imports nothing chapter-specific, so it runs on any tree since Chapter X.
 * `FFX_HASH_SKIP` (comma-separated chapter ids) leaves out the chapters the
 * change adds.
 *
 * Policies: `uniform` picks any enabled row and target; `attack` prefers
 * Attack; `summoner` prefers Summon and Overdrive rows; `auto-gs` is
 * `summoner` but leaves Grand Summon's aeon to the engine's own roll (the
 * headless default), where the others name one. The `autoGs` count per run
 * says how often that roll was taken. Each chapter is played from its first
 * link through the chain, and every later link is also played once on its
 * own with the chapter's build (no chaining from there: a possessed aeon's
 * link does not hand on from a cold start), so the late links are reached
 * even when a random policy loses early.
 *
 * FFX only; test-only; writes one file and nothing else.
 */

import { it } from 'vitest';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import type { BattleSetup, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { CHAPTERS, UNLISTED_CHAPTERS } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Policy = 'uniform' | 'attack' | 'summoner' | 'auto-gs';
const POLICIES: readonly Policy[] = ['uniform', 'attack', 'summoner', 'auto-gs'];

const OUT = process.env.FFX_HASH_OUT;
const SEEDS = Number(process.env.FFX_HASH_SEEDS ?? 8);
const SKIP = new Set((process.env.FFX_HASH_SKIP ?? '').split(',').filter(Boolean));

function choose(d: Input, rng: SeededRng, policy: Policy, counts: { autoGs: number }): Command {
  const enabled = d.commands.filter((c) => c.enabled);
  if (enabled.length === 0) return { kind: 'defend', targets: [] };
  const attack = enabled.find((c) => c.command.kind === 'attack');
  const big = enabled.filter((c) => c.command.kind === 'summon' || c.command.kind === 'overdrive');
  const row = policy === 'attack' && attack && rng.int(1, 4) > 1
    ? attack
    : (policy === 'summoner' || policy === 'auto-gs') && big.length > 0 && rng.int(1, 10) > 3
      ? rng.pick(big)
      : rng.pick(enabled);
  const command = { ...row.command } as Command;
  if (command.targets.length === 0 && row.validTargets.length > 0) command.targets = [rng.pick(row.validTargets)];
  if (command.kind === 'overdrive' && command.id === 'grand-summon' && command.extra === undefined) {
    const summons = d.commands.filter((c) => c.command.kind === 'summon' && c.enabled);
    if (policy !== 'auto-gs' && summons.length > 0) {
      const aeonId = 'id' in summons[0]!.command ? summons[0]!.command.id : '';
      command.extra = { kind: 'yuna-grand-summon', grandSummon: { aeonId } };
    } else {
      counts.autoGs++;
    }
  }
  return command;
}

function runChain(first: BattleSetup, seed: number, policy: Policy, chain: boolean): string {
  const content = new FFXContentRegistry();
  content.addAbilities([...ALL_ABILITIES]);
  content.addItems(Object.values(ITEMS));
  const rng = new SeededRng(seed * 7919 + 13);
  const hash = createHash('sha256');
  const counts = { autoGs: 0 };
  let setup = first;
  let outcome = 'unfinished';
  let links = 0;
  let error = '';
  try {
    for (links = 1; links <= 8; links++) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init(setup);
      for (let i = 0; i < 20_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        hash.update(JSON.stringify(d.commands));
        engine.submit(choose(d, rng, policy, counts));
      }
      const state = engine.state();
      hash.update(JSON.stringify(state.log));
      hash.update(JSON.stringify(state.result ?? null));
      outcome = state.result?.outcome ?? 'unfinished';
      const nextId = state.result?.nextGroupId;
      if (!chain || outcome !== 'victory' || !nextId) break;
      const next: EnemyGroupDef | undefined = ENEMY_GROUPS_BY_ID[nextId];
      if (!next) break;
      setup = setupForNextLink(setup, next, state, first.seed + links);
    }
  } catch (e) {
    error = ` error=${String(e).slice(0, 100)}`;
  }
  return `${hash.digest('hex').slice(0, 16)} ${outcome} links=${links} autoGs=${counts.autoGs}${error}`;
}

it.skipIf(!OUT)('hashes every FFX chapter chain (writes FFX_HASH_OUT)', () => {
  const out: Record<string, string> = {};
  for (const chapter of [...CHAPTERS, ...UNLISTED_CHAPTERS]) {
    if (chapter.game !== 'ffx' || SKIP.has(chapter.id)) continue;
    const starts: EnemyGroupDef[] = [chapter.enemyGroupRef];
    for (let g = ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.nextGroupId ?? '']; g && starts.length < 8; g = ENEMY_GROUPS_BY_ID[g.nextGroupId ?? '']) starts.push(g);
    for (const [n, group] of starts.entries()) {
      for (const policy of POLICIES) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          out[`${chapter.id}|${group.id}|${n}|${policy}|${seed}`] = runChain({ ...setupForChapter(chapter, seed), enemies: group }, seed, policy, n === 0);
        }
      }
    }
  }
  writeFileSync(OUT!, `${JSON.stringify(out, null, 1)}\n`);
}, 3_600_000);
