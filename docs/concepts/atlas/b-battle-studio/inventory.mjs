// Pyrefly Studio (atlas option B): the rule inventory behind the piece counts on all three frames.
// Every entry is a named row, formula or list item in the research docs; `cite` says where.
// Nothing here is invented: names are the docs' own, formula lines are the docs' formulas in plain symbols.
// FFX only (chapters 1 to 3). Component 08 is the chapter layer: chapter 1's boss moves, from the data file.
//
// size: L = a mechanism with a formula line, M = a named rule, S = a single value.
// c: component number, 1 to 8.
const CC = 'research/ffx-combat-core.md';

export const COMPONENTS = [
  { c: 1, id: 'turn', name: 'Turn order', plain: 'Who goes next, and why', cite: `${CC} §1` },
  { c: 2, id: 'command', name: 'Command', plain: 'What you pick, what it costs', cite: `${CC} §1.3, §1.7, §1.8` },
  { c: 3, id: 'hit', name: 'Hit roll', plain: 'Does it land? Is it critical?', cite: `${CC} §2.11, §2.12` },
  { c: 4, id: 'damage', name: 'Damage', plain: 'How the number is worked out', cite: `${CC} §2.1 to §2.4` },
  { c: 5, id: 'element', name: 'Element and affinity', plain: 'Weak, resist, immune, absorb', cite: `${CC} §3` },
  { c: 6, id: 'status', name: 'Status', plain: 'Zombie, Poison, Haste and more', cite: `${CC} §4, §2.10` },
  { c: 7, id: 'overdrive', name: 'Overdrive gauge', plain: 'What fills the big attack', cite: `${CC} §5.1, §5.2` },
  { c: 8, id: 'boss', name: "The boss's next move", plain: 'His script, read ahead', cite: 'research/ffx-seymour-flux.md §3, §4' },
];

const L = (c, name, line, cite) => ({ c, size: 'L', name, line, cite });
const M = (c, name, cite) => ({ c, size: 'M', name, cite });
const S = (c, name, cite) => ({ c, size: 'S', name, cite });

export const PIECES = [
  // ---- 01 Turn order (8) ------------------------------------------------------------
  L(1, 'The core clock', 'lowest counter acts next', '§1.1'),
  L(1, 'Agility to base ticks', 'Agility 30 gives 8 ticks', '§1.2'),
  L(1, 'Turn-list forecast', 'others assumed at rank 3', '§1.6'),
  ...['Preemptive', 'Normal', 'Ambush'].map((n) => S(1, n, '§1.9')),
  ...['Weak delay', 'Strong delay'].map((n) => S(1, n, '§1.5')),
  // ---- 02 Command (13) --------------------------------------------------------------
  ...Array.from({ length: 10 }, (_, i) => S(2, `Rank ${i + 1}`, '§1.3')),
  M(2, 'Switch', '§1.7'), M(2, 'Escape', '§1.8'), M(2, 'Flee', '§1.8'),
  // ---- 03 Hit roll (6) --------------------------------------------------------------
  L(3, 'Hit chance', '40% of Accuracy − Evasion', '§2.11'),
  L(3, 'Critical chance', 'your Luck − target Luck + weapon', '§2.12'),
  ...['Aim', 'Reflex', 'Luck', 'Jinx'].map((n) => S(3, n, '§2.9')),
  // ---- 04 Damage (34) ---------------------------------------------------------------
  L(4, 'Shared skeleton', 'power × mitigation ÷ 730', '§2.1'),
  L(4, 'Mitigation', 'Defense 0: 730 · 255: 21', '§2.3'),
  L(4, 'Strength', 'STR³ ÷ 32 + 30', '§2.2'),
  L(4, 'Piercing Strength', 'same, Defense counts as 0', '§2.2'),
  L(4, 'Magic', '(MAG² ÷ 6 + power) × power ÷ 4', '§2.2'),
  L(4, 'Piercing Magic', 'same, Magic Defense as 0', '§2.2'),
  L(4, 'Special Magic', 'MAG³ ÷ 32 + 30, no Magic Def', '§2.2'),
  L(4, 'Healing', '(MAG + power) ÷ 2 × power', '§2.2'),
  ...['Fixed', 'Fixed (no variance)', 'Percentage Total', 'Percentage Current', 'HP formula', 'CTB formula', 'Gil formula', 'Deal 9999'].map((n) => M(4, n, '§2.2')),
  ...['Immunity', 'Critical ×2', 'Boost ×1.5', 'Shield ÷4', 'Affinity', 'Physical only', 'Magical only', 'Alchemy ×2', 'Offense +%', 'Defense +%', 'Armored ÷3', 'Drain sign', 'OD timing', 'Damage limit', 'Heal sign', 'Damage 9999']
    .map((n, i) => M(4, `Step ${i} · ${n}`, '§2.4')), // the doc's own order, 0 to 15
  ...['Cheer', 'Focus'].map((n) => S(4, n, '§2.9')),
  // ---- 05 Element and affinity (10) ---------------------------------------------------
  ...['Fire', 'Ice', 'Thunder', 'Water', 'Holy'].map((n) => S(5, n, '§3')),
  ...['Weak ×1.5', 'Neutral ×1.0', 'Resists ×0.5', 'Immune ×0', 'Absorbs ×−1'].map((n) => S(5, n, '§3')),
  // ---- 06 Status (37) -----------------------------------------------------------------
  L(6, 'Landing a status', 'chance − resistance > roll', '§4.1'),
  L(6, 'Regen tick', 'ticks × max HP ÷ 256 + 100', '§4.3'),
  L(6, 'Threaten decay', 'each success × 0.7, floor 1%', '§4.4'),
  ...['Death / KO', 'Zombie', 'Petrify', 'Poison', 'Silence', 'Sleep', 'Darkness', 'Slow', 'Haste', 'Berserk', 'Confuse', 'Doom', 'Curse', 'Provoke', 'Threaten',
    'Guard', 'Sentinel', 'Defend', 'Protect', 'Shell', 'Reflect', 'Regen', 'Nul statuses ×4', 'Auto-Life', 'Critical (SOS)', 'Shield (aeon)', 'Boost (aeon)', 'Eject', 'Scan', 'Mix flags ×7']
    .map((n) => M(6, n, '§4.2')),
  ...['Power Break', 'Magic Break', 'Armor Break', 'Mental Break'].map((n) => M(6, n, '§2.10')),
  // ---- 07 Overdrive gauge (18) ---------------------------------------------------------
  L(7, 'Timed-input bonus', 'up to +50% for a fast input', '§5.2'),
  ...['Stoic', 'Warrior', 'Comrade', 'Healer', 'Tactician', 'Victim', 'Dancer', 'Avenger', 'Slayer', 'Hero', 'Rook', 'Victor', 'Coward', 'Ally', 'Sufferer', 'Daredevil', 'Loner']
    .map((n) => M(7, `${n} mode`, '§5.1')),
  // ---- 08 The boss's next move (11): src/data/ffx/enemies/seymour-flux.ts abilityIds -------
  ...['Lance of Atrophy', 'Full-Life', 'Cross Cleave', 'Total Annihilation', 'Flare', 'Banish', 'Slowga', 'Protect', 'Reflect', 'Dispel', 'Mortibsorption']
    .map((n) => M(8, n, 'ffx-seymour-flux §3')),
];

export const countFor = (c) => PIECES.filter((p) => p.c === c).length;
export const TOTAL = PIECES.length;
