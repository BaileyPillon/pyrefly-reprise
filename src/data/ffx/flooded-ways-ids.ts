/**
 * The ids and tables of the hidden **Flooded Ways** chapter (FFX only; number 36, the word `geosgaeno`): Evrae Altana and the two Gate Locks in the three areas of the Via Purifico, then Geosgaeno in the Baaj Temple.
 * **No imports**, so the scene, the door and the battle layer can name these without the chapter's record graph. Every number is the game's own, from `research/re-ffx-geosgaeno-evrae-altana.md` ("RE n": the monster
 * files `m109`, `m120`, `m162`, `m171`, the formations `stbv00_10` to `_12` and `bjyt02_02`, and the move rows of `monmagic2.bin`), tagged there `[bytes]` or `[run]`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: none of these exist in FFX-2 or FF7.
 */

export const FLOODED_WAYS_CHAPTER_ID = 'flooded-ways' as const;
export const FLOODED_WAYS_SCENE = 'flooded-ways';

/** Combatant ids. The two Gate Locks are two different monster files (`m162`, `m171`) that wear one model (RE 1.1). */
export const EVRAE_ALTANA_ID = 'evrae-altana'; // m120
export const GATE_LOCK_IDS = ['gate-lock-1', 'gate-lock-2'] as const; // m162, m171
export const GEOSGAENO_ID = 'geosgaeno'; // m109
export const GATE_LOCK_NAME = 'Gate Lock';

/** AI script ids (`EnemyDef.aiScriptId`). */
export const FLOODED_SCRIPTS = {
  evrae: 'evrae-altana',
  lock: 'gate-lock',
  geosgaeno: 'geosgaeno',
} as const;

/** Move rows (ability ids): the game's `monmagic2` ids in the comments (RE 5). */
export const FLOODED_ROWS = {
  stonePunch: 'geosgaeno-stone-punch', // 0x6032
  koPunch: 'geosgaeno-ko-punch', // 0x6033
  swallow: 'geosgaeno-swallow', // 0x602E
  regurgitate: 'geosgaeno-regurgitate', // 0x602F
  altanaAttack: 'evrae-altana-attack', // 0x6000
  stoneGaze: 'evrae-altana-stone-gaze', // 0x604C
  photonSpray: 'evrae-altana-photon-spray', // 0x604B (0x606B in area 3 is identical in every mapped field: carried once)
  struggle: 'struggle', // 0x3109, the held character's one command (a trigger)
  openLock: 'open-lock', // 0x312F, the party's key to the Gate Locks (a trigger)
} as const;

/** The twin of the area-3 Photon Spray row (RE 5, `monmagic2` 0x606B): identical to 0x604B in power, hits and targeting, differing in animation words only. */
export const PHOTON_SPRAY_TWIN = 0x606b;

/** The party of both links: Tidus (character 0), Wakka (4) and Rikku (6), with Switch off (RE 2.3). */
export const SWIMMERS = ['tidus', 'wakka', 'rikku'] as const;

/** The Via Purifico plate, standing in for all four places (the art list in the handoff: three derived water plates and a Baaj plate are owed). */
export const FLOODED_PLATE = 'via-purifico';

/** One link of the chain, in order: the three areas of the Via Purifico, then the Baaj Temple. */
export interface FloodedLink {
  key: 'area-1' | 'area-2' | 'area-3' | 'geosgaeno';
  /** The formation id (`EnemyGroupDef.id`). */
  groupId: string;
  /** The game's formation file (RE 2.1). */
  formation: string;
  bodyId: string;
  headline: string;
  plate: string;
  /** The Via Purifico area (1 to 3), 0 for the Baaj Temple. */
  area: 0 | 1 | 2 | 3;
}

export const FLOODED_LINKS: readonly FloodedLink[] = [
  { key: 'area-1', groupId: 'flooded-area-1', formation: 'stbv00_10', bodyId: EVRAE_ALTANA_ID, headline: 'Evrae Altana', plate: FLOODED_PLATE, area: 1 },
  { key: 'area-2', groupId: 'flooded-area-2', formation: 'stbv00_11', bodyId: EVRAE_ALTANA_ID, headline: 'Evrae Altana', plate: FLOODED_PLATE, area: 2 },
  { key: 'area-3', groupId: 'flooded-area-3', formation: 'stbv00_12', bodyId: EVRAE_ALTANA_ID, headline: 'Evrae Altana', plate: FLOODED_PLATE, area: 3 },
  { key: 'geosgaeno', groupId: 'flooded-geosgaeno', formation: 'bjyt02_02', bodyId: GEOSGAENO_ID, headline: 'Geosgaeno', plate: FLOODED_PLATE, area: 0 },
];

/** group id -> link, for the setup and the rules. */
export const FLOODED_LINK_OF_GROUP: Readonly<Record<string, FloodedLink>> = Object.fromEntries(FLOODED_LINKS.map((l) => [l.groupId, l]));

/** One record: the columns of RE 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
export type FloodedRecord10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.2 (`[bytes]`). */
export const FLOODED_RECORDS = {
  geosgaeno: [32_767, 128, 36, 50, 40, 50, 48, 15, 0, 50],
  evraeAltana: [16_384, 200, 32, 0, 27, 0, 25, 15, 0, 100],
  gateLock: [500, 1, 1, 0, 0, 0, 0, 0, 0, 0],
} as const satisfies Record<string, FloodedRecord10>;
