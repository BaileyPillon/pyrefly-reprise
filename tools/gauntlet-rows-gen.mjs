// Generates tests/fixtures/parity/ffx/gauntlet_rows.json: the Monster Arena creations' stat records, loot records, arena prices and move rows (FFX only; the hidden Gauntlet chapter, number 54).
//
//   node tools/gauntlet-rows-gen.mjs --rec <rec-arena.out.txt> [--kernel-dir tests/fixtures/parity/ffx] [--out tests/fixtures/parity/ffx/gauntlet_rows.json]
//
// The input is the research lane's read-only record dump of the game's monster files (`research/re-ffx-monster-arena-creations.md`, "RE n"; Steam build 25501027, monster files m105, m272,
// m273, m277, m279 to m282, m311, m314, m317), one block per monster; the file lives outside the repository (it quotes the game's own text), so its path is an argument. Nothing is typed
// by hand: every number in the fixture is parsed from that dump. The rows the dump does not list (Don Tonberry's four moves and the Head's relay, whose monster records carry an empty command
// list) are taken from the repository's own kernel fixtures (`command_records.json`, `command_status.json`: the game's 979 command records), flagged `source: 'kernel-fixture'`; and every row the
// dump DOES list is compared with the kernel fixtures field by field, the generator refusing to write on a difference.
//
// The script reads text and JSON and writes one JSON file. It starts no process and touches nothing else.

import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const recPath = arg('rec');
if (recPath === undefined) {
  console.error('usage: node tools/gauntlet-rows-gen.mjs --rec <rec-arena.out.txt> [--kernel-dir <dir>] [--out <file>]');
  process.exit(2);
}
const kernelDir = arg('kernel-dir', 'tests/fixtures/parity/ffx');
const outPath = arg('out', 'tests/fixtures/parity/ffx/gauntlet_rows.json');

/** The creations, by monster file: our key, in the order of the arena's unlock tiers. */
const CREATURES = [
  [314, 'cactuar-king'],
  [317, 'don-tonberry'],
  [311, 'jormungand'],
  [279, 'earth-eater'],
  [281, 'greater-sphere'],
  [277, 'catastrophe'],
  [282, 'thuban'],
  [105, 'neslug'],
  [280, 'ultima-buster'],
  [272, 'ultima-buster-head'],
  [273, 'ultima-buster-arm'],
];

/** Rows the dump does not list (the monster record's command list is empty): taken from the kernel fixtures, named by the research note's section 2 and 3. */
const EXTRA_ROWS = new Map([
  [0x4062, 'Attack'], // Don Tonberry's Attack (monster magic 1 row 98)
  [0x40ea, 'Voodoo'],
  [0x40ff, 'Karma'],
  [0x4081, 'Waddle'],
  [0x6001, 'Special 1'], // the Head's relay (`performCommand(20, 24577)` in the Head's script); the same row Sinspawn Gui's head uses
]);

const STATUS_NUMBER = {
  Death: 0, Zombie: 1, Petrify: 2, Poison: 3, PowerBreak: 4, MagicBreak: 5, ArmorBreak: 6, MentalBreak: 7, Confuse: 8, Berserk: 9, Provoke: 10, Threaten: 11, Sleep: 12, Silence: 13, Darkness: 14,
  Shell: 15, Protect: 16, Reflect: 17, NulTide: 18, NulBlaze: 19, NulShock: 20, NulFrost: 21, Regen: 22, Haste: 23, Slow: 24,
};
/** The temporal statuses' duration slots (the command record's bytes 0x47 to 0x53). */
const DURATION_SLOT = { Sleep: 0, Silence: 1, Darkness: 2, Shell: 3, Protect: 4, Reflect: 5, NulTide: 6, NulBlaze: 7, NulShock: 8, NulFrost: 9, Regen: 10, Haste: 11, Slow: 12 };

const hex = (s) => Number.parseInt(s, 16);
function must(m, what, where) {
  if (m === null || m === undefined) throw new Error(`gauntlet-rows-gen: cannot read ${what} in ${where}`);
  return m;
}
const int = (s) => Number.parseInt(s, 10);

/** `Poison:254,ArmorBreak:255` to `[[3, 254], [6, 255]]` (status numbers, ascending as printed). */
function chances(text, where) {
  if (text === '') return [];
  return text.split(',').map((p) => {
    const [name, byte] = p.split(':');
    const n = STATUS_NUMBER[name];
    if (n === undefined) throw new Error(`gauntlet-rows-gen: unknown status ${name} in ${where}`);
    return [n, int(byte)];
  });
}
function durations(text, where) {
  if (text === '') return [];
  return text.split(',').map((p) => {
    const [name, byte] = p.split(':');
    const n = DURATION_SLOT[name];
    if (n === undefined) throw new Error(`gauntlet-rows-gen: unknown duration status ${name} in ${where}`);
    return [n, int(byte)];
  });
}

/** One move row line of the dump. */
function parseRow(line, where) {
  const m = must(line.match(/^ {2}0x([0-9a-f]+) "([^"]*)" \[(monmagic1|monmagic2|command) row (\d+)\] type\(\+0x17\)=(\d+) targetByte=0x([0-9a-f]+)\([^)]*\) dmgType\(\+0x20&3\)=(\d+) dmgClass\(\+0x23\)=(\d+) accFormula=(\d+) accByte=(\d+) formula=(\d+) power=(\d+) hits=(\d+) element=0x([0-9a-f]+)\([^)]*\) crit=(\d+) shatter=(\d+) rank\(\+0x24\)=(\d+) mp=(\d+) od\(\+0x26\)=(\d+) statusChance=\[([^\]]*)\] statusDur=\[([^\]]*)\] extraWord\(\+0x54\)=0x([0-9a-f]+)(?:\([^)]*\))? stageBuff\(\+0x56\)=0x([0-9a-f]+)\/\+0x59=(\d+) buffFlags\(\+0x5a\)=0x([0-9a-f]+) flags\[[^\]]*\] flags1c=0x([0-9a-f]+) flags20=0x([0-9a-f]+)$/), 'a move row', where);
  const id = hex(m[1]);
  const row = {
    id,
    name: m[2],
    table: m[3] === 'command' ? 'command' : m[3],
    row: int(m[4]),
    type: int(m[5]),
    targetByte: hex(m[6]),
    damageKind: int(m[7]),
    damageClass: int(m[8]),
    accuracyFormula: int(m[9]),
    accuracyByte: int(m[10]),
    formula: int(m[11]),
    power: int(m[12]),
    hits: int(m[13]),
    element: hex(m[14]),
    critBonus: int(m[15]),
    shatter: int(m[16]),
    rank: int(m[17]),
    mp: int(m[18]),
    chances: chances(m[20], where),
    durations: durations(m[21], where),
    extra: hex(m[22]),
    stageMask: hex(m[23]),
    stageAmount: int(m[24]),
    buff: hex(m[25]),
    flagsMisc: hex(m[26]),
    flagsDamage: hex(m[27]),
    source: 'research-record-dump',
  };
  return row;
}

/** A hexadecimal item number to the dump's own spelling is dropped: numbers only. */
function itemList(text, where) {
  return text.split(';').map((s) => {
    const t = s.trim();
    if (t.startsWith('(none)')) return 0;
    return hex(must(t.match(/^0x([0-9a-f]+)/), 'an item number', where)[1]);
  });
}
const qtyList = (text) => text.split(',').map((s) => int(s.trim()));

function parseBlock(file, lines) {
  const where = `m${file}`;
  const find = (re, what) => {
    for (const l of lines) {
      const m = l.match(re);
      if (m !== null) return m;
    }
    throw new Error(`gauntlet-rows-gen: cannot read ${what} in ${where}`);
  };
  const hp = find(/^HP (\d+) MP (\d+) overkill>(\d+)$/, 'HP');
  const stats = find(/^STR (\d+) DEF (\d+) MAG (\d+) MDF (\d+) AGI (\d+) LCK (\d+) EVA (\d+) ACC (\d+)$/, 'the stats');
  const flags = find(/^flags28 0x([0-9a-f]+) ([^;]*); flags29 0x([0-9a-f]+) ([^;]*); poison% (\d+)$/, 'the flag bytes');
  const elem = find(/^elem absorb (.*?) immune (.*?) resist (.*?) weak (.*?) raw (\d+),(\d+),(\d+),(\d+)$/, 'the element row');
  const stat = find(/^status bytes 0x2f\.\.0x47: (.*)$/, 'the status bytes');
  const auto = find(/^autoPerm (.*?) autoTemp (.*?) autoExtra (.*?) extraImmune (.*?) raw 0x([0-9a-f]+),0x([0-9a-f]+),0x([0-9a-f]+),0x([0-9a-f]+)$/, 'the auto words');
  const cmds = find(/^commands: (.*)$/, 'the command list');
  const forced = find(/^forcedAction 0x([0-9a-f]+) [^;]*; \+0x72 (\d+); \+0x74 0x([0-9a-f]+); ctbIcon \+0x76 (\d+); doom \+0x77 (\d+); \+0x78 (\d+); \+0x79\.\.0x7f raw ([0-9a-f ]+)$/, 'the trailing record bytes');
  const loot = find(/^gil (\d+) AP (\d+) APoverkill (\d+) learnedMoveWord\(\+6\) 0x([0-9a-f]+)$/, 'the loot head');
  const chance = find(/^item chance bytes: slot1 (\d+) slot2 (\d+); steal chance (\d+); gear chance (\d+)$/, 'the chance bytes');
  const normal = find(/^normal drop ids \[[^\]]*\]: (.*) qty \[ ([\d, ]+) \]$/, 'the normal drops');
  const over = find(/^overkill drop ids: (.*) qty \[ ([\d, ]+) \]$/, 'the overkill drops');
  const steal = find(/^steal ids \[[^\]]*\]: (.*) qty \[ ([\d, ]+) \]$/, 'the steal pair');
  const bribe = find(/^bribe item (\(none\)|0x[0-9a-f]+.*) factor\(\+0x2c\) (\d+)$/, 'the bribe item');
  const gear = find(/^gear: baseSlots \+0x2d (\d+) formula \+0x2e (\d+) crit \+0x2f (\d+) power \+0x30 (\d+) extraTries \+0x31 (\d+)$/, 'the gear scalars');
  const tail = find(/^\+0x110 (\d+) \+0x111 (\d+) Zanmato\(\+0x112\) (\d+) PilferGil\(\+0x113\) (\d+) ArenaPrice\(\+0x114,u32\) (\d+)$/, 'the arena price line');
  const lootLen = find(/^-- loot chunk length (\d+)$/, 'the loot chunk length');
  const statusBytes = {};
  for (const p of stat[1].trim().split(/\s+/)) {
    const [name, byte] = p.split(':');
    if (STATUS_NUMBER[name] === undefined) throw new Error(`gauntlet-rows-gen: unknown status ${name} in ${where}`);
    statusBytes[name] = int(byte);
  }
  const commandIds = cmds[1].trim() === '' ? [] : cmds[1].split('|').map((s) => hex(must(s.trim().match(/^0x([0-9a-f]+)/), 'a command id', where)[1]));
  const bribeItem = bribe[1] === '(none)' ? 0 : hex(bribe[1].match(/^0x([0-9a-f]+)/)[1]);
  return {
    file,
    record: {
      hp: int(hp[1]), mp: int(hp[2]), overkill: int(hp[3]),
      str: int(stats[1]), def: int(stats[2]), mag: int(stats[3]), mdef: int(stats[4]), agi: int(stats[5]), luck: int(stats[6]), eva: int(stats[7]), acc: int(stats[8]),
      flags28: hex(flags[1]), flags28Names: flags[2].trim() === '' ? [] : flags[2].trim().split(','), flags29: hex(flags[3]), flags29Names: flags[4].trim() === '' ? [] : flags[4].trim().split(','), poisonByte: int(flags[5]),
      elementAbsorb: int(elem[5]), elementImmune: int(elem[6]), elementResist: int(elem[7]), elementWeak: int(elem[8]),
      elementImmuneNames: elem[2].trim() === '' ? [] : elem[2].trim().split(','),
      statusBytes,
      autoPermanent: hex(auto[5]), autoTemporary: hex(auto[6]), autoExtra: hex(auto[7]), extraImmune: hex(auto[8]),
      commands: commandIds,
      forcedAction: hex(forced[1]), monsterIndex: int(forced[2]), modelWord: hex(forced[3]), ctbIcon: int(forced[4]), doomCounter: int(forced[5]), byte78: int(forced[6]),
    },
    loot: {
      chunkLength: int(lootLen[1]),
      gil: int(loot[1]), ap: int(loot[2]), apOverkill: int(loot[3]), learnedMoveWord: hex(loot[4]),
      itemChance: [int(chance[1]), int(chance[2])], stealChance: int(chance[3]), gearChance: int(chance[4]),
      normalDrop: itemList(normal[1], where), normalDropQty: qtyList(normal[2]),
      overkillDrop: itemList(over[1], where), overkillDropQty: qtyList(over[2]),
      steal: itemList(steal[1], where), stealQty: qtyList(steal[2]),
      bribeItem, bribeFactor: int(bribe[2]),
      gear: { baseSlots: int(gear[1]), formula: int(gear[2]), crit: int(gear[3]), power: int(gear[4]), extraTries: int(gear[5]) },
      unmapped110: int(tail[1]), unmapped111: int(tail[2]),
      zanmatoByte: int(tail[3]), pilferGilFactor: int(tail[4]), arenaPrice: int(tail[5]),
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
const text = fs.readFileSync(recPath, 'utf8').replace(/\r\n/g, '\n');
const blocks = new Map();
let current = null;
for (const line of text.split('\n')) {
  const head = line.match(/^===== m(\d+) /);
  if (head !== null) {
    current = int(head[1]);
    blocks.set(current, []);
  } else if (current !== null) blocks.get(current).push(line);
}

const creatures = {};
const rowsById = new Map();
for (const [file, key] of CREATURES) {
  const lines = blocks.get(file);
  if (lines === undefined) throw new Error(`gauntlet-rows-gen: the dump has no block for m${file}`);
  const parsed = parseBlock(file, lines);
  creatures[key] = parsed;
  for (const line of lines) {
    if (!/^ {2}0x[0-9a-f]+ "/.test(line)) continue;
    const row = parseRow(line, `m${file}`);
    const seen = rowsById.get(row.id);
    if (seen !== undefined) {
      const a = JSON.stringify({ ...seen, name: '' });
      const b = JSON.stringify({ ...row, name: '' });
      if (a !== b) throw new Error(`gauntlet-rows-gen: row 0x${row.id.toString(16)} is listed twice with different fields`);
    } else rowsById.set(row.id, row);
  }
  // Every command a record lists has a row in the dump.
  for (const id of parsed.record.commands) {
    if (!rowsById.has(id)) throw new Error(`gauntlet-rows-gen: m${file} lists command 0x${id.toString(16)} but the dump has no row for it`);
  }
}

// The kernel fixtures: the game's 979 command records, read as the repository holds them.
const records = JSON.parse(fs.readFileSync(path.join(kernelDir, 'command_records.json'), 'utf8'));
const statuses = JSON.parse(fs.readFileSync(path.join(kernelDir, 'command_status.json'), 'utf8'));
const recById = new Map(records.rows.map((r) => [r[0], r]));
const stById = new Map(statuses.rows.map((r) => [r[0], r]));
// records columns: id,type,flagsMisc,flagsDamage,damageClass,critBonus,formula,accuracy,power,hits,shatter,element
// statuses columns: id,rank,extra,stageMask,stageAmount,buff,chances,durations
const sameList = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mismatches = [];
let compared = 0;
for (const row of rowsById.values()) {
  const r = recById.get(row.id);
  const s = stById.get(row.id);
  if (r === undefined || s === undefined) {
    mismatches.push(`0x${row.id.toString(16)}: no kernel fixture row`);
    continue;
  }
  compared++;
  const same = r[1] === row.type && r[2] === row.flagsMisc && r[3] === row.flagsDamage && r[4] === row.damageClass && r[5] === row.critBonus && r[6] === row.formula && r[7] === row.accuracyByte
    && r[8] === row.power && r[9] === row.hits && r[10] === row.shatter && r[11] === row.element
    && s[1] === row.rank && s[2] === row.extra && s[3] === row.stageMask && s[4] === row.stageAmount && s[5] === row.buff && sameList(s[6], row.chances) && sameList(s[7], row.durations);
  if (!same) mismatches.push(`0x${row.id.toString(16)} ${row.name}: the dump and the kernel fixture differ`);
}
for (const [id, name] of EXTRA_ROWS) {
  const r = recById.get(id);
  const s = stById.get(id);
  if (r === undefined || s === undefined) {
    mismatches.push(`0x${id.toString(16)}: no kernel fixture row`);
    continue;
  }
  if (rowsById.has(id)) continue; // the dump lists it already
  rowsById.set(id, {
    id, name, table: id >= 0x6000 ? 'monmagic2' : 'monmagic1', row: id & 0xfff, type: r[1], targetByte: null, damageKind: r[3] & 3, damageClass: r[4], accuracyFormula: (r[2] >> 3) & 7, accuracyByte: r[7],
    formula: r[6], power: r[8], hits: r[9], element: r[11], critBonus: r[5], shatter: r[10], rank: s[1], mp: null, chances: s[6], durations: s[7], extra: s[2], stageMask: s[3], stageAmount: s[4], buff: s[5],
    flagsMisc: r[2], flagsDamage: r[3], source: 'kernel-fixture',
  });
}
if (mismatches.length > 0) {
  console.error(`gauntlet-rows-gen: refusing to write:\n  ${mismatches.join('\n  ')}`);
  process.exit(1);
}

const out = {
  note: 'The Monster Arena creations that the hidden Gauntlet chapter fights (FFX only; chapter 54): the stat record (chunk 2, offsets 0x14 to 0x7F), the loot record (chunk 4, with the arena price at +0x114) and the move rows of the nine creations, the Ultima Buster\'s Head and its two Arms, as decoded fields. Numbers only. Source: the Steam HD build 25501027 battle files m105, m272, m273, m277, m279, m280, m281, m282, m311, m314 and m317 and the monster-magic and command tables, as read by the research lane (research/re-ffx-monster-arena-creations.md). Generated by tools/gauntlet-rows-gen.mjs from that lane\'s record dump; nothing was typed by hand. A row marked source "kernel-fixture" is not in the dump (the monster record\'s command list is empty) and was taken from the repository\'s own kernel fixtures (command_records.json, command_status.json) and so has no target byte.',
  offsets: {
    record: { hp: '0x14', mp: '0x18', overkill: '0x1c', str: '0x20', def: '0x21', mag: '0x22', mdef: '0x23', agi: '0x24', luck: '0x25', eva: '0x26', acc: '0x27', flags28: '0x28', flags29: '0x29', poisonByte: '0x2a', elementAbsorb: '0x2b', elementImmune: '0x2c', elementResist: '0x2d', elementWeak: '0x2e', statusBytes: '0x2f..0x47', autoPermanent: '0x48', autoTemporary: '0x4a', autoExtra: '0x4c', extraImmune: '0x4e', commands: '0x50 (u16 x16)', forcedAction: '0x70', monsterIndex: '0x72', modelWord: '0x74', ctbIcon: '0x76', doomCounter: '0x77', byte78: '0x78' },
    loot: { gil: '0x0', ap: '0x2', apOverkill: '0x4', learnedMoveWord: '0x6', itemChance: '0x8', stealChance: '0xa', gearChance: '0xb', normalDrop: '0xc', normalDropQty: '0x14', overkillDrop: '0x18', overkillDropQty: '0x20', steal: '0x24', stealQty: '0x28', bribeItem: '0x2a', bribeFactor: '0x2c', gear: '0x2d..0x31', unmapped110: '0x110', unmapped111: '0x111', zanmatoByte: '0x112', pilferGilFactor: '0x113', arenaPrice: '0x114 (u32)' },
    move: { type: '0x17', targetByte: '0x1a', flagsMisc: '0x1c', flagsDamage: '0x20', damageClass: '0x23', rank: '0x24', critBonus: '0x27', formula: '0x28', accuracyByte: '0x29', power: '0x2a', hits: '0x2b', shatter: '0x2c', element: '0x2d', chances: '0x2e..0x46 as [status number, byte]', durations: '0x47..0x53 as [slot, byte]', extra: '0x54', stageMask: '0x56', stageAmount: '0x59', buff: '0x5a' },
  },
  kernelAgreement: { rowsCompared: compared, differences: 0, extraRowsFromKernelFixture: [...EXTRA_ROWS.keys()] },
  creatures,
  rows: [...rowsById.values()].sort((a, b) => a.id - b.id),
};
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 1)}\n`);
console.log(`gauntlet-rows-gen: ${Object.keys(creatures).length} creatures, ${out.rows.length} rows (${compared} compared with the kernel fixtures, 0 differences) -> ${outPath}`);
