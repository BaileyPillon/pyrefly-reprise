/**
 * **The formation host** (`src/engine/ffxcam/formation.ts`): the table of who is on the field that answers a camera program's questions. Synthetic roster and frames (rule 8).
 *
 * Pins the selectors (SPEC.md 7.3), the property stand-ins and what overrides them, every value query the programs of the Evrae fight ask, the constants from the loaded data, the character-number
 * conversions, the frame sources, and that a name it has never heard of answers `undefined` (so the VM logs it).
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { FormationHost, PROP, type RosterEntry } from '../../src/engine/ffxcam/formation.ts';
import { PresentationRandom } from '../../src/engine/ffxcam/host.ts';
import { frame } from './helpers/ffxcamKit.ts';

const ROSTER: RosterEntry[] = [
  { id: 'tidus', chr: 0, side: 'party' },
  { id: 'wakka', chr: 4, side: 'party' },
  { id: 'rikku', chr: 6, side: 'party' },
  { id: 'lulu', chr: 5, side: 'reserve' },
  { id: 'kimahri', chr: 3, side: 'reserve' },
  { id: 'valefor', chr: 8, side: 'aeon' },
  { id: 'evrae', chr: 20, side: 'monster', monsterNumber: 119 },
  { id: 'cid', chr: 21, side: 'monster', monsterNumber: 149 },
];

function host(over: { constants?: Record<string, number>; onWrite?: (chrs: readonly number[], p: number, v: number) => void } = {}): FormationHost {
  const h = new FormationHost({ random: new PresentationRandom(1), ...over });
  h.setRoster(ROSTER);
  return h;
}

describe('selectors', () => {
  it('a character number is that character, if it is on the field', () => {
    const h = host();
    expect(h.select(0)).toEqual([0]);
    expect(h.select(20)).toEqual([20]);
    expect(h.select(13)).toEqual([]);
  });

  it('0x1000 + n is the monster of that number', () => {
    const h = host();
    expect(h.select(0x1000 + 119)).toEqual([20]);
    expect(h.select(0x1000 + 149)).toEqual([21]);
    expect(h.select(0x1000 + 7)).toEqual([]);
  });

  it('-2, -13 and -18 are the acting one; -3 and -4 the targets that are on the field; none set names nobody', () => {
    const h = host();
    expect(h.select(-2)).toEqual([]);
    expect(h.select(-3)).toEqual([]);
    h.setActing(4);
    h.setTargets([20, 99, 21]);
    for (const s of [-2, -13, -18]) expect(h.select(s), String(s)).toEqual([4]);
    for (const s of [-3, -4]) expect(h.select(s), String(s)).toEqual([20, 21]);
  });

  it('-6..-8 are the first three of the party in slot order, -9..-12 the reserve', () => {
    const h = host();
    expect([-6, -7, -8].map((s) => h.select(s))).toEqual([[0], [4], [6]]);
    expect(h.select(-9)).toEqual([5]);
    expect(h.select(-10)).toEqual([3]);
    expect(h.select(-11)).toEqual([]);
  });

  it('-14 is the front line (party and aeons), -15 the monsters, -19 the party and the reserve, -20 the aeons, -5 everyone, -1 nobody', () => {
    const h = host();
    expect(h.select(-14)).toEqual([0, 4, 6, 8]);
    expect(h.select(-15)).toEqual([20, 21]);
    expect(h.select(-19)).toEqual([0, 4, 6, 5, 3]);
    expect(h.select(-20)).toEqual([8]);
    expect(h.select(-5)).toEqual(ROSTER.map((e) => e.chr));
    expect(h.select(-21)).toEqual(ROSTER.map((e) => e.chr));
    expect(h.select(-1)).toEqual([]);
    expect(h.select(-99)).toEqual([]);
  });

  it('the roster can be replaced', () => {
    const h = host();
    h.setRoster([{ id: 'tidus', chr: 0, side: 'party' }]);
    expect(h.select(-5)).toEqual([0]);
    expect(h.chrOf('wakka')).toBeUndefined();
    expect(h.chrOf('tidus')).toBe(0);
  });
});

describe('properties', () => {
  it('stand-ins for what nobody has set: alive for everyone on the field, front line for the party and aeons, Position the party slot, BattleDistance 0', () => {
    const h = host();
    expect(h.query('readBtlChrProperty', [0, PROP.alive])).toBe(1);
    expect(h.query('readBtlChrProperty', [20, PROP.alive])).toBe(1);
    expect(h.query('readBtlChrProperty', [0, PROP.frontline])).toBe(1);
    expect(h.query('readBtlChrProperty', [8, PROP.frontline])).toBe(1);
    expect(h.query('readBtlChrProperty', [20, PROP.frontline])).toBe(0);
    expect([0, 4, 6].map((c) => h.query('readBtlChrProperty', [c, PROP.position]))).toEqual([0, 1, 2]);
    expect(h.query('readBtlChrProperty', [20, PROP.battleDistance])).toBe(0);
    expect(h.query('readBtlChrProperty', [0, 6])).toBe(0); // petrified: no
  });

  it('what the owner sets wins, per character and property; nobody named reads 0', () => {
    const h = host();
    h.setProperty(20, PROP.battleDistance, 3);
    h.setProperty(0, PROP.alive, 0);
    expect(h.query('readBtlChrProperty', [20, PROP.battleDistance])).toBe(3);
    expect(h.query('readBtlChrProperty', [21, PROP.battleDistance])).toBe(0);
    expect(h.query('readBtlChrProperty', [0, PROP.alive])).toBe(0);
    expect(h.getProperty(20, PROP.battleDistance)).toBe(3);
    expect(h.getProperty(21, PROP.battleDistance)).toBeUndefined();
    expect(h.query('readBtlChrProperty', [-1, PROP.alive])).toBe(0);
    expect(h.query('readBtlChrProperty', [-3, PROP.alive])).toBe(0); // no targets set
  });

  it('reads the first character a selector names', () => {
    const h = host();
    h.setTargets([21, 20]);
    h.setProperty(21, PROP.battleDistance, 3);
    expect(h.query('readBtlChrProperty', [-3, PROP.battleDistance])).toBe(3);
  });
});

describe('value queries', () => {
  it('the chosen command, reflect, and the last actor and death', () => {
    const h = host();
    h.command = 0x3042;
    h.reflect = 1;
    h.lastActor = 4;
    h.lastDead = 6;
    expect(h.query('chosenCommand', [])).toBe(0x3042);
    expect(h.query('btlGetReflect', [])).toBe(1);
    expect(h.query('btlGetLastActionChr', [])).toBe(4);
    expect(h.query('btlGetLastDeathChr', [])).toBe(6);
  });

  it('countChrOverlap counts the characters two selectors share', () => {
    const h = host();
    h.setActing(0);
    h.setTargets([20, 21]);
    expect(h.query('countChrOverlap', [-15, -3])).toBe(2);
    expect(h.query('countChrOverlap', [-2, -15])).toBe(0);
    expect(h.query('countChrOverlap', [-2, -14])).toBe(1);
    expect(h.query('countChrOverlap', [-14, -14])).toBe(4);
  });

  it('dereferenceCharacter: the party number, 0x1000 | the monster number, -1 for nobody', () => {
    const h = host();
    expect(h.query('dereferenceCharacter', [4])).toBe(4);
    expect(h.query('dereferenceCharacter', [20])).toBe(0x1000 | 119);
    expect(h.query('dereferenceCharacter', [-1])).toBe(-1);
    expect(h.query('dereferenceCharacter', [13])).toBe(-1);
  });

  it('dereferenceEnemy: a monster\'s formation index, -6 - slot for the party, 0xFF for anyone else', () => {
    const h = host();
    expect(h.query('dereferenceEnemy', [20])).toBe(0);
    expect(h.query('dereferenceEnemy', [21])).toBe(1);
    expect([0, 4, 6].map((c) => h.query('dereferenceEnemy', [c]))).toEqual([-6, -7, -8]);
    expect(h.query('dereferenceEnemy', [5])).toBe(0xff); // reserve
    expect(h.query('dereferenceEnemy', [-1])).toBe(0xff);
  });

  it('heights, widths and headings come from the frames; no frame reads 0', () => {
    const h = host();
    h.setFrame(20, frame(-140, -35, 80, { height: 200, width: 120, heading: Math.PI / 2 }));
    expect(h.query('btlGetCamHeight', [20])).toBe(200);
    expect(h.query('btlGetHeight', [20])).toBe(200);
    expect(h.query('btlGetCamWidth', [20])).toBe(120);
    expect(h.query('btlGetChrDir', [20])).toBeCloseTo(90, 9);
    expect(h.query('btlGetChrTargetDir2', [20])).toBeCloseTo(90, 9); // the same heading: their difference, which the spell shots use as a yaw, is 0
    expect(h.query('btlGetCamHeight', [0])).toBe(0);
    expect(h.query('btlGetChrDir', [0])).toBe(0);
  });

  it('wraps a heading to +-180 degrees', () => {
    const h = host();
    h.setFrame(0, frame(0, 0, 0, { heading: 3 * Math.PI })); // 540 degrees
    expect(Math.abs(h.query('btlGetChrDir', [0]) as number)).toBeCloseTo(180, 9);
    h.setFrame(0, frame(0, 0, 0, { heading: -Math.PI / 2 }));
    expect(h.query('btlGetChrDir', [0])).toBeCloseTo(-90, 9);
  });

  it('constants from the loaded data answer by name, ahead of everything else', () => {
    const h = host({ constants: { CurrentBattle: 37027840, chosenCommand: 5 } });
    h.command = 9;
    expect(h.query('CurrentBattle', [])).toBe(37027840);
    expect(h.query('chosenCommand', [])).toBe(5);
    expect(host().query('CurrentBattle', [])).toBeUndefined(); // without the data nobody knows it
    expect(host({ constants: {} }).query('constructor', [])).toBeUndefined(); // a name from the prototype is not a constant
  });

  it('the presentation questions answer 0; a name nobody has heard of answers undefined', () => {
    const h = host();
    for (const name of ['isWater?', 'SubtitlesEnabled?', 'btlGetVoiceStatus', 'btlDistTarget', 'btlDistTargetFrame2', 'btlGetChrTargetDir', 'btlGetTargetDir']) expect(h.query(name, [0]), name).toBe(0);
    expect(h.query('findMatchingChr', [-14])).toBe(0);
    expect(h.query('btlSearchChrCamera', [-15])).toBe(20);
    expect(h.query('nobodyKnowsThis', [1])).toBeUndefined();
    expect(h.query('toString', [])).toBeUndefined();
  });
});

describe('frames', () => {
  it('a set frame is the actor\'s; a live source wins over it and can be taken away', () => {
    const h = host();
    expect(h.actor(0)).toBeUndefined();
    h.setFrame(0, frame(1, 2, 3));
    expect(h.actor(0)?.pos).toEqual([1, 2, 3]);
    h.setSource((chr) => (chr === 0 ? frame(9, 9, 9) : undefined));
    expect(h.actor(0)?.pos).toEqual([9, 9, 9]);
    h.setFrame(4, frame(4, 4, 4));
    expect(h.actor(4)?.pos).toEqual([4, 4, 4]); // the source has nothing for 4: the set frame
    h.setSource(undefined);
    expect(h.actor(0)?.pos).toEqual([1, 2, 3]);
    h.setFrame(0, undefined);
    expect(h.actor(0)).toBeUndefined();
  });
});

describe('writes and random', () => {
  it('a write resolves its selector to the characters it names right now and hands them to the owner', () => {
    const seen: Array<[readonly number[], number, number]> = [];
    const h = host({ onWrite: (chrs, p, v) => seen.push([chrs, p, v]) });
    h.write(-7, 216, 0);
    h.write(-15, 216, 1);
    expect(seen).toEqual([
      [[4], 216, 0],
      [[20, 21], 216, 1],
    ]);
    expect(() => host().write(-7, 216, 0)).not.toThrow(); // no owner: ignored
  });

  it('draws from the presentation source it was given', () => {
    const random = new PresentationRandom(3);
    const h = new FormationHost({ random });
    const a = h.random(14);
    expect(random.drawsOf(14)).toBe(1);
    expect(a).toBe(new PresentationRandom(3).next(14));
  });
});
