/**
 * The rig fixture of `rig-fixture.ts` made a format v2 file (2026-10-18): a `scar` part that is hidden at rest and that `attack` brings in, a `head` with two variants (`back`, the head's own
 * mesh with another image; `wide`, a mesh and a box of its own, rigid on the head bone), and keys that hide, show and swap. Used by the reader, the engine and the gate/runtime agreement tests.
 */
import type { RigFile } from '../../../src/data/art/rigTypes.ts';
import { makeRigFile } from './rig-fixture.ts';

export function makeRigFileV2(over: Partial<RigFile> = {}): RigFile {
  const f = makeRigFile();
  const parts = f.parts.map((p) =>
    p.name === 'head'
      ? {
          ...p,
          variants: {
            back: { png: 'head.back.png', rim: 'head.back.rim.png' },
            wide: { png: 'head.wide.png', box: [130, 100, 140, 160] as [number, number, number, number], bone: 'head' },
          },
        }
      : p,
  );
  parts.push({ name: 'scar', order: 6, png: 'scar.png', box: [170, 130, 40, 40], bone: 'head', hidden: true });
  return {
    ...f,
    version: 2,
    parts,
    keys: {
      ...f.keys,
      attack: { ...f.keys['attack']!, parts: { head: { image: 'back' }, scar: {} } },
      hurt: { ...f.keys['hurt']!, parts: { head: { image: 'wide' }, arm: { show: false } } },
    },
    ...over,
  };
}
