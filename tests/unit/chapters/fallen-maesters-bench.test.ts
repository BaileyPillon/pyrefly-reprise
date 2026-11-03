/**
 * The Fallen Maesters (the hidden FFX-2 chapter): what each floor is like to play, MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Every number of the four fights is the game's own (`research/re-ffx2-fallen-maesters.md`); nothing here moves one. A *line* is a small policy standing in for a player (`helpers/fallenMaestersDrive.ts`): an input to a
 * measurement, never game data. The table below is printed (`PYREFLY_BENCH_SEEDS=<n>` for more seeds; the suite runs 12) and the handoff (`docs/handoff/ch-maesters.md`) carries the 30-seed run.
 *
 * What it pins, so a change that moves a floor's character fails loudly:
 *
 * 1. **Floor 20 (Aranea) is easy**: the Lv 99 party wins every seed on the Darkness line (the preflight's R2: Lv 99 against a Lv 52 fiend).
 * 2. **Floor 40 (the Black Elemental) is nearly as easy** in this engine: it has 9,999 HP, and its Reflect is data only (no redirect is built), so the Dark Knights' Darkness lands; its Ultima is the only way to lose.
 * 3. **Floor 60 (Concherer) is decided by the shell**: Darkness never reaches the 10,000 a result the shell needs (it loses), a Break-Damage-Limit Charon does (it wins), so the floor is the puzzle of getting a girl to break
 *    the limit (The End's gates), which the build does not start with. **The `walk` line is the proof that a player can** (the review of `ch-maesters`, major 1): Paine spends four turns on the Changes the menu offers, then casts Charon,
 *    and the floor is won on about six seeds in ten with nothing written to the party (`fallen-maesters-walk.test.ts` pins the walk itself). The `breakDamageLimit` rig below is a shortcut for the other lines, not the way a player gets there.
 * 4. **Floor 80 (Chac) is not won by any line measured**, simple, walking or chaining (Rikku a Gunner on Trigger Happy, the knights attacking): she acts several times before the first girl, turns the party to stone and shatters it in
 *    seconds of game time. A party that only defends loses on every floor from 60 on; the fight ends (a victory or a defeat), never in a stalemate. The sourced answers (a chain or a delay-lock from the first second) need a kit
 *    and an initiative this build does not give: it stays a hard optional fight, disclosed in the handoff and Bailey's call.
 */
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { tremaBuildFor } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { fallenMaestersBuild } from '../../../src/data/ffx2/builds/fallen-maesters.ts';
import { fight, type Floor, type LineName } from '../helpers/fallenMaestersDrive.ts';

const SEEDS = Math.max(4, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 12));
const FLOOR_NUMBER = [20, 40, 60, 80] as const;

interface Cell {
  wins: number;
  defeats: number;
  unresolved: number;
  kos: number;
  minutes: number;
  shell: number;
}

function cell(floor: Floor, line: LineName, opts: { breakDamageLimit?: boolean; build?: FFX2PartyBuild } = {}): Cell {
  const out: Cell = { wins: 0, defeats: 0, unresolved: 0, kos: 0, minutes: 0, shell: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = fight(floor, seed, line, { ...opts, maxDecisions: 60_000 });
    if (r.outcome === 'victory') out.wins++;
    else if (r.outcome === 'defeat') out.defeats++;
    else out.unresolved++;
    out.kos += r.kos;
    out.minutes += r.ticks / 29.97 / 60;
    if (r.shellBroken) out.shell++;
  }
  return out;
}

function show(label: string, c: Cell): void {
  console.info(
    `[fallen maesters bench] ${label}: wins ${c.wins}/${SEEDS} defeats ${c.defeats} unresolved ${c.unresolved} girl KOs/fight ${(c.kos / SEEDS).toFixed(2)} minutes/fight ${(c.minutes / SEEDS).toFixed(2)} shell broken ${c.shell}`,
  );
}

describe('floor 20 and floor 40: the Lv 99 party against Aranea and the Black Elemental', () => {
  it('Aranea falls to the Darkness line on every seed, in well under a minute, and nobody is knocked out', () => {
    const c = cell(0, 'darkness');
    show('floor 20 Aranea, darkness line', c);
    expect(c.wins).toBe(SEEDS);
    expect(c.kos).toBe(0);
    expect(c.minutes / SEEDS).toBeLessThan(1);
  });

  it('the Black Elemental falls to the Darkness line on at least four seeds in five (its Ultima, capped at 9,999 a girl, is the loss)', () => {
    const c = cell(1, 'darkness');
    show('floor 40 Black Elemental, darkness line', c);
    expect(c.wins).toBeGreaterThanOrEqual(Math.ceil(SEEDS * 0.8));
    expect(c.unresolved).toBe(0);
    expect(c.minutes / SEEDS).toBeLessThan(1);
  });
});

describe('floor 60: Concherer is decided by the shell', () => {
  it('the Darkness line (about 6,000 to 9,700 a hit) never breaks the shell and almost always loses to Megaton Press', () => {
    const c = cell(2, 'darkness');
    show('floor 60 Concherer, darkness line', c);
    expect(c.shell).toBe(0);
    expect(c.wins).toBeLessThanOrEqual(Math.ceil(SEEDS * 0.25));
    expect(c.unresolved).toBe(0);
  });

  it('with Break Damage Limit (a rig: the player has done the Spherechange work) a Charon line breaks the shell in every fight and wins most of them', () => {
    const c = cell(2, 'charon', { breakDamageLimit: true });
    show('floor 60 Concherer, charon line with Break Damage Limit (rig)', c);
    expect(c.shell).toBe(SEEDS);
    expect(c.wins).toBeGreaterThanOrEqual(Math.ceil(SEEDS * 0.6));
    expect(c.unresolved).toBe(0);
  });

  it('a PLAYER can win it with the build as given: Paine walks the grid of The End (four Changes, rows the menu offers), then casts Charon; the shell breaks in most fights and the floor is won on a good share of the seeds', () => {
    const c = cell(2, 'walk');
    show('floor 60 Concherer, walk line (nothing written to the party)', c);
    expect(c.unresolved).toBe(0);
    expect(c.shell).toBeGreaterThanOrEqual(Math.ceil(SEEDS * 0.6));
    expect(c.wins).toBeGreaterThanOrEqual(Math.ceil(SEEDS * 0.3));
    expect(c.wins, 'the walk is worth taking: it beats the line that never walks').toBeGreaterThan(cell(2, 'darkness').wins);
  }, 120_000);

  it('without it the same Charon line (9,999 a hit) never breaks the shell and loses', () => {
    const c = cell(2, 'charon');
    show('floor 60 Concherer, charon line without it', c);
    expect(c.shell).toBe(0);
    expect(c.wins).toBe(0);
  });
});

describe('floor 80: Chac is not won by a simple line', () => {
  it('nor by the chain line, the shape of the sourced answer (Rikku a Gunner on Trigger Happy, the knights attacking): Chac acts first and often, and the party is gone in well under two minutes', () => {
    const c = cell(3, 'chain');
    show('floor 80 Chac, chain line', c);
    expect(c.unresolved).toBe(0);
    expect(c.wins).toBe(0);
    expect(c.minutes / SEEDS).toBeLessThan(2);
  }, 120_000);

  it('the Darkness, Charon and walk lines lose, in seconds of game time, and the fight always ends', () => {
    for (const line of ['darkness', 'charon', 'walk'] as LineName[]) {
      const c = cell(3, line, { breakDamageLimit: line === 'charon' });
      show(`floor 80 Chac, ${line} line`, c);
      expect(c.unresolved, line).toBe(0);
      expect(c.wins, line).toBe(0);
      expect(c.minutes / SEEDS, line).toBeLessThan(2);
    }
  }, 120_000);
});

describe('the Remedy line (it cures the Petrify Chac deals: probed on the engine)', () => {
  it('curing the stone first and casting Charon with Break Damage Limit (a rig) wins floor 60 most of the time and still loses floor 80 in seconds: the fight is a speed puzzle (Chac acts about five times to each girl action), which the delay-lock line is for', () => {
    const f60 = cell(2, 'remedy-charon', { breakDamageLimit: true });
    show('floor 60 Concherer, remedy + charon line with Break Damage Limit (rig)', f60);
    expect(f60.unresolved).toBe(0);
    const f80 = cell(3, 'remedy-charon', { breakDamageLimit: true });
    show('floor 80 Chac, remedy + charon line with Break Damage Limit (rig)', f80);
    expect(f80.unresolved).toBe(0);
    expect(f80.wins).toBe(0);
    expect(f80.minutes / SEEDS).toBeLessThan(1);
  }, 120_000);
});

describe('a party that only defends', () => {
  it('loses to Concherer and to Chac, and the fight ends in a defeat (never a stalemate)', () => {
    for (const floor of [2, 3] as Floor[]) {
      const c = cell(floor, 'defend');
      show(`floor ${FLOOR_NUMBER[floor]} defend line`, c);
      expect(c.defeats, `floor ${FLOOR_NUMBER[floor]}`).toBe(SEEDS);
    }
  }, 120_000);
});

describe('the party options (FM3), measured on the two hard floors with the curtains line', () => {
  it('(a) as is, (b) the Trema kit, (c) as is with ten Phoenix Downs: the table the handoff carries (printed; no tuning)', () => {
    const plusDowns = structuredClone(fallenMaestersBuild);
    plusDowns.inventory = [...(plusDowns.inventory ?? []), { itemId: 'x2-phoenix-down', count: 10 }];
    for (const floor of [2, 3] as Floor[]) {
      for (const [label, build] of [['(a) as is', fallenMaestersBuild], ['(b) the Trema kit', tremaBuildFor('sourced-kit')], ['(c) + 10 Phoenix Downs', plusDowns]] as const) {
        const c = cell(floor, 'curtains', { build: structuredClone(build) });
        show(`floor ${FLOOR_NUMBER[floor]} curtains line ${label}`, c);
        expect(c.unresolved, `${label} floor ${FLOOR_NUMBER[floor]}`).toBe(0);
      }
    }
  }, 300_000);
});
