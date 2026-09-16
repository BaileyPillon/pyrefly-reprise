/**
 * FFX-2 string-literal id unions.
 *
 * **Contract file.** Data agents import these so a typo in an id is a compile
 * error. Every id is `kebab-case`.
 *
 * Sources: `research/ffx2-combat-core.md`, `research/ffx2-bahamut.md`,
 * `research/ffx2-vegnagun-shuyin.md`.
 *
 * Baseline: **FFX-2 International + Last Mission / HD Remaster**
 * [ffx-combat-core §0]. That is why `psychic` and `festivalist` exist even
 * though neither of our two encounters uses them.
 */

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

/**
 * The Gullwings. Always exactly these three, always all three on the field —
 * FFX-2 has no reserve bench.
 *
 * **A character's combat stats are a function of (dressphere x level) only**:
 * Yuna, Rikku and Paine have identical stats in the same dressphere at the same
 * level. The only exceptions are Trainer and Mascot, which have per-girl
 * variants because the ability sets differ [ffx2-combat-core §5.1].
 */
export type CharacterId = 'yuna' | 'rikku' | 'paine';

export const CHARACTER_IDS: readonly CharacterId[] = ['yuna', 'rikku', 'paine'] as const;

// ---------------------------------------------------------------------------
// Dresspheres
// ---------------------------------------------------------------------------

/**
 * Standard dresspheres [ffx2-combat-core §3.1–3.14], plus the two
 * International/HD additions.
 *
 * Long-range dresspheres (no run-in, so they never break a chain by approach
 * time): Gunner, Lady Luck, Alchemist, Trainer, Gun Mage.
 */
export type StandardDressphereId =
  /** Yuna's default. Long range, high Accuracy/Agility, **no charge times**. Mastery 800 AP. */
  | 'gunner'
  /** Rikku's default. Best Evasion, second-best Agility. Attack strikes twice. Mastery 1060 AP. */
  | 'thief'
  /** Paine's default. High HP/Str/Def, terrible MDef. Mastery 740 AP. */
  | 'warrior'
  /** Sustained-aura dressphere. No Attack command; every Dance is `2xRT`. Mastery 740 AP. */
  | 'songstress'
  /** No Attack command. Best MDef, high MP/Mag. Mastery 750 AP. */
  | 'white-mage'
  /** No Attack command. Highest MP and Magic of the standard set. Mastery 680 AP. */
  | 'black-mage'
  /** The Blue Mage. Long range, quadruple damage vs matching species. 360 AP + 16 Blue Bullets. */
  | 'gun-mage'
  /** Highest HP+Def of the standard set, slow (Agility 39–41). Cheapest to master at 490 AP. */
  | 'dark-knight'
  /** Gil-throwing and instant-death specialist. All self-buffs. Mastery 750 AP. */
  | 'samurai'
  /** Highest HP and Agility, the counter-attack dressphere. Mastery 1360 AP. */
  | 'berserker'
  /** Free consumables and the Mix system. Long range. Mastery 2249 AP — the most expensive. */
  | 'alchemist'
  /** Luck/critical specialist, slot machines, gil manipulation. Long range. Mastery 1050 AP. */
  | 'lady-luck'
  /** One pet per girl, three entirely different ability sets. Long range. 600 AP per girl. */
  | 'trainer'
  /** The endgame dressphere. Best all-round stats plus two borrowed skillsets each. 653 AP per girl. */
  | 'mascot'
  /** International / HD only. Not used by our two encounters. */
  | 'psychic'
  /** International / HD only. Not used by our two encounters. */
  | 'festivalist';

/**
 * Special dresspheres (SDSP) [ffx2-combat-core §3.15].
 *
 * Unlock: the girl must have worn **every** dressphere on her equipped Garment
 * Grid this battle, and every node on that Grid must be occupied. Then L1, R1,
 * X. The other two girls leave the field and she fights alone as three
 * independently-commanded parts. Every accessory stops working while
 * transformed; every part has Ribbon plus Auto-Life and cannot be Ejected;
 * there is no Item and no Escape command.
 */
export type SpecialDressphereId =
  /** Yuna. Parts: main + Left Pistil + Right Pistil. */
  | 'floral-fallal'
  /** Rikku. Parts: main + Smasher-R + Crusher-L. */
  | 'machina-maw'
  /** Paine. Parts: main + two blade satellites. */
  | 'full-throttle';

/** Any dressphere. */
export type DresspheresId = StandardDressphereId | SpecialDressphereId;

export const STANDARD_DRESSPHERE_IDS: readonly StandardDressphereId[] = [
  'gunner',
  'thief',
  'warrior',
  'songstress',
  'white-mage',
  'black-mage',
  'gun-mage',
  'dark-knight',
  'samurai',
  'berserker',
  'alchemist',
  'lady-luck',
  'trainer',
  'mascot',
  'psychic',
  'festivalist',
] as const;

export const SPECIAL_DRESSPHERE_IDS: readonly SpecialDressphereId[] = [
  'floral-fallal',
  'machina-maw',
  'full-throttle',
] as const;

/**
 * SDSP part ids. Each is a separate {@link FFX2Combatant} with its own ATB
 * gauge and command menu. Only the `-main` part's stats scale with the Garment
 * Grid's node count (2–6).
 */
export type SpecialDresspherePartId =
  | 'floral-fallal-main'
  | 'floral-fallal-left-pistil'
  | 'floral-fallal-right-pistil'
  | 'machina-maw-main'
  | 'machina-maw-smasher-r'
  | 'machina-maw-crusher-l'
  | 'full-throttle-main'
  | 'full-throttle-left'
  | 'full-throttle-right';

// ---------------------------------------------------------------------------
// Garment Grids
// ---------------------------------------------------------------------------

/**
 * Garment Grids realistically available at our two build points
 * [ffx2-combat-core §4.3].
 *
 * A Grid has **2–6 nodes** and **0–4 gates** (red / green / blue / yellow).
 * Equip effects (`P-`) are active while the Grid is equipped; gate effects
 * (`T-`) are granted by passing through a gate during an in-battle spherechange
 * and are lost at the end of the battle, but survive KO and revival.
 */
export type GarmentGridId =
  // --- available by Chapter 2/3 (Bevelle build) ---------------------------
  /** 6 nodes, no gates. The default. Also the strongest SDSP host by node count. */
  | 'first-steps'
  /** 5 nodes, R G B Y. Equip: STR +5, MAG +5. Per-gate +5. */
  | 'vanguard'
  /** 5 nodes, R G B Y. Equip: DEF +5, MDEF +5. */
  | 'protection-halo'
  /** 3 nodes, R G Y. Equip: Fire Eater + Use Fire. Y = Firestrike; G+R+Y = Use Firaga. */
  | 'heart-of-flame'
  /** 3 nodes, R G Y. Equip: Water Eater + Use Water. */
  | 'menace-of-the-deep'
  /** 3 nodes, R G Y. Equip: Lightning Eater + Use Thunder. */
  | 'thunder-spawn'
  /** 3 nodes, R G Y. Equip: Ice Eater + Use Blizzard. */
  | 'ice-queen'
  /** 5 nodes, R G B Y. Use Sleep / Use Bio; per-gate Sleepproof / Poisonproof. */
  | 'restless-sleep'
  /** 3 nodes. Healing-themed. */
  | 'healing-wind'
  /** 3 nodes, R B. Use Life / Use Cure; B = Use Cura; B+R = Use Curaga. */
  | 'heart-reborn'
  /** 4 nodes, R G Y. Use Cure; R+G+Y = Use Full-Cure. */
  | 'healing-light'
  /** 3 nodes, R G Y. Gravity Eater; G+R+Y = Double HP. */
  | 'downtrodder'
  /** 5 nodes, R G B Y. Equip: DEF +10, MDEF +10. */
  | 'hour-of-need'
  /** 4 nodes, R G B Y. Equip: DEF +10; **DEF +15 per gate** (all four). */
  | 'stonehewn'
  /** 5 nodes, R G B Y. Equip: STR +10, MAG +10. */
  | 'bum-rush'
  /** **2 nodes, no gates** — the fastest route to a special dressphere, and the weakest. */
  | 'unerring-path'
  /** 3 nodes, R B. R = Use Osmose; B = Use Drain. */
  | 'covetous'
  /** 4 nodes, R G B Y. Equip: MDEF +10; **MDEF +15 per gate**. */
  | 'enigma-plate'
  /** 4 nodes, R G B Y. Equip: First Strike; all four = SOS Haste. */
  | 'highroad-winds'
  /** 5 nodes, R. Use Mug; R = Double Items. */
  | 'treasure-hunt'
  /** 6 nodes, R G B Y. Use Bushido; **STR +15 per gate**; all four = Bushido wait down. */
  | 'samurais-honor'
  /** 5 nodes, R G B Y. Use Confuse; per-gate Confuseproof / Berserkproof. */
  | 'raging-giant'
  // --- added by Chapter 3–5 (Farplane build) ------------------------------
  /** 6 nodes, R G B Y. Use Swordplay; **STR +15 per gate**; all four = Swordplay wait down. */
  | 'pride-of-the-sword'
  /** 6 nodes, R G B Y. Use Instinct; **STR +15 per gate**. */
  | 'blood-of-the-beast'
  /** 6 nodes, R G B Y. Use Arcana; **MAG +15 per gate**. */
  | 'chaos-maelstrom'
  /** 6 nodes, R G B Y. Use Black Magic; **MAG +15 per gate**. */
  | 'black-tabard'
  /** 5 nodes, R G. G = Double HP; R = Double MP. */
  | 'tempered-will'
  /** 6 nodes, R G Y. Per-gate skillset wait-downs. */
  | 'tricks-of-the-trade'
  /** 4 nodes, R B Y. Equip: Half MP Cost; R+Y+B = One MP Cost. */
  | 'font-of-power'
  /** 5 nodes, R G B Y. Equip: STR +20, MAG +20; +20 per gate. */
  | 'flash-of-steel'
  /** 5 nodes, R G B Y. Per-gate status immunities. */
  | 'scourgebane'
  /** 5 nodes, R G B Y. Per-gate ...touch riders; all four = Stonetouch. */
  | 'disaster-in-bloom'
  /** 4 nodes, R G Y. Use Life / Use Cure; R+G+Y = Use Full-Life. */
  | 'immortal-soul'
  /** 4 nodes, R G B. Use Black Magic; R+B+G = Use Flare. */
  | 'conflagration'
  /** 5 nodes, R G Y. All gates = Use Ultima. */
  | 'megiddo'
  /** 5 nodes, R G B Y. Use Death / Use Doom; per-gate Deathproof / Doomproof. */
  | 'bitter-farewell'
  /** 5 nodes, B Y. B = Double AP; Y = Double EXP. */
  | 'covenant-of-growth'
  /** 5 nodes, R G B Y. Equip: Break HP Limit; G+R = Break Damage Limit; all four = Use Finale. */
  | 'the-end'
  /** 6 nodes, R G B Y. Included for completeness — a 6-node SDSP host. */
  | 'white-signet'
  /** 4 nodes, R G B Y. Per-gate stat bonus allocated to every gate. */
  | 'ray-of-hope'
  /** 5 nodes. Per-gate stat bonus allocated to every gate. */
  | 'seething-cauldron'
  /** 5 nodes. Per-gate stat bonus allocated to every gate. */
  | 'strength-of-one'
  /** 4 nodes. Per-gate stat bonus allocated to every gate. */
  | 'howling-wind';

/**
 * Six-node Grids — the strongest SDSP hosts, since the main part's HP, MP, Str,
 * Mag, Def and MDef scale with node count [ffx2-combat-core §3.15].
 */
export const SIX_NODE_GRID_IDS: readonly GarmentGridId[] = [
  'first-steps',
  'black-tabard',
  'blood-of-the-beast',
  'chaos-maelstrom',
  'pride-of-the-sword',
  'samurais-honor',
  'tricks-of-the-trade',
  'white-signet',
] as const;

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

/**
 * Chapter 4 — Bevelle Underground, Vegnagun's empty hangar [ffx2-bahamut].
 *
 * Bestiary #182. Lv 20, HP 8 400, **Def 160 / MDef 10** — physical attacks are
 * near-worthless and anything routing through Magic or ignoring Defense is
 * dominant. Holy is **not** a weakness; Gravity is Immune.
 *
 * Note: ARCHITECTURE.md labels this "Ch. 3"; three independent sources put the
 * encounter in **Chapter 2, Limbo** [writing-bible §0.3]. The label is
 * cosmetic; write dialogue to Chapter 2 knowledge.
 */
export type BahamutEnemyId = 'bahamut';

/**
 * Chapter 5 — Heart of the Farplane, the four-part Vegnagun chain then Shuyin
 * [ffx2-vegnagun-shuyin §2, §3].
 *
 * Battle order: Tail -> Leg + Nodes -> Body/Core + Bulwarks -> Head + Redoubts
 * -> Shuyin. Vegnagun battles open with a **black-hole suck-in**, not the
 * normal shattering-glass wipe.
 *
 * Stat blocks in the data files are **SinirothX's values and are correct as
 * written** — do not "fix" them against the wiki, whose Mag/Def columns are
 * transposed on four of the nine entries.
 */
export type VegnagunEnemyId =
  /** Battle 1. Lv 41, HP 34 200. Gravity immune; Armor/Mental Break DO work. */
  | 'vegnagun-tail'
  /** Battle 2. Lv 38. Flanked by three colour-cycling Nodes. */
  | 'vegnagun-leg'
  /** Node A. Red = offensive magic, Yellow = buffs/status, Green = recovery. Lv 52, Def 244. */
  | 'node-a'
  | 'node-b'
  | 'node-c'
  /** Battle 3, the point of no return. Lv 43. Mag 42 / Def 98 (NOT the wiki's 98/42). */
  | 'vegnagun-body'
  /** Casting arm, right. Lv 39. Every offensive move is `fractional`, so its Level/Str/Mag are dead stats. */
  | 'bulwark-r'
  /** Casting arm, left. */
  | 'bulwark-l'
  /** Battle 4. Lv 57. Real-time fail timer: if the cannon charge completes, Spira is destroyed. */
  | 'vegnagun-head'
  /** Turret pod, right. Lv 40. */
  | 'redoubt-r'
  /** Turret pod, left. Def 0. */
  | 'redoubt-l'
  /** Battle 5. Lv 55-ish, Str 47 / Def 132 / Mag 42 / MDef 92. Biased toward targeting Yuna. */
  | 'shuyin';

/** Every FFX-2 enemy combatant across the two chapters. */
export type FFX2EnemyId = BahamutEnemyId | VegnagunEnemyId;

/** The five battles of the Vegnagun chain, in order. */
export const VEGNAGUN_CHAIN_ORDER: readonly VegnagunEnemyId[] = [
  'vegnagun-tail',
  'vegnagun-leg',
  'vegnagun-body',
  'vegnagun-head',
  'shuyin',
] as const;

/** Any FFX-2 combatant id. */
export type FFX2CombatantId = CharacterId | SpecialDresspherePartId | FFX2EnemyId;

// ---------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------

/**
 * Accessories used by the two builds [ffx2-combat-core §5.4].
 * Two slots per girl, hard limit. **All accessories stop working inside an
 * SDSP.** This is not the full game list — only what the two builds equip,
 * extended by the data agent as needed.
 */
export type AccessoryId =
  | 'amulet'
  | 'wristband'
  | 'mythril-gloves'
  | 'defense-veil'
  | 'iron-bangle'
  | 'gauntlets'
  | 'tiara'
  | 'titanium-bangle'
  | 'mythril-bangle'
  | 'crystal-bangle'
  | 'silver-bracer'
  | 'gold-bracer'
  | 'rune-bracer'
  | 'muscle-belt'
  | 'circlet'
  | 'power-wrist'
  | 'tarot-card'
  | 'diamond-gloves'
  | 'mystery-veil'
  | 'black-belt'
  | 'hyper-wrist'
  | 'talisman'
  | 'favorite-outfit'
  | 'ribbon'
  | 'adamantite'
  | 'shmooth-shailing'
  /** Curseproof, Def +4 / MDef +4. Bahamut's own drop (common AND rare slot) [ffx2-bahamut §1.6]. */
  | 'gris-gris-bag';
