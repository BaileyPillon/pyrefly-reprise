/**
 * Stand-ins shared by the two tests of the hidden 3D Bahamut's shipped models (`yrp-ship-set.test.ts`, `yrp-models-verify.test.ts`; ch-yrp, FFX-2 only): a manifest as the installer writes it, a whole binary glTF header,
 * and a way to lay files into a temporary tree.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { YRP_MODEL_DIRS } from '../../../src/data/yrp-ids.ts';

export const BASE = YRP_MODEL_DIRS.base;
export const HD = YRP_MODEL_DIRS.hd;
export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** A manifest as the installer writes it: all 46 folders, most with an HD file. */
export function fullManifest(): { version: number; game: string; source: string; starts: Record<string, string>; entries: Array<Record<string, unknown>> } {
  const dresses = ['alchemist', 'berserker', 'black-mage', 'dark-knight', 'gun-mage', 'gunner', 'lady-luck', 'mascot', 'samurai', 'songstress', 'thief', 'trainer', 'warrior', 'white-mage'];
  const entries = GIRLS.flatMap((girl) => dresses.map((dress) => ({ girl, dress, folder: `${girl}-${dress}`, hd: dress !== 'samurai', weapons: 1, tier: 'b' })));
  return { version: 1, game: 'FFX-2 only', source: 'dress-map.json', starts: { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' }, entries };
}

/** A binary glTF whose header is whole: magic, version 2 and a length equal to its own (24 bytes). */
export const tinyGlb = (): Buffer => {
  const b = Buffer.alloc(24);
  b.write('glTF', 0, 'latin1');
  b.writeUInt32LE(2, 4);
  b.writeUInt32LE(24, 8);
  return b;
};

/** Write `files` (relative path to content) under `root`. */
export function lay(root: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
}
