#!/usr/bin/env node
/**
 * Songstress production poses (FFX-2 only) on the recommended pick per girl: the art5 method
 * (docs/concepts/art5/README.md): body-only pose tags, the art5 `flask` OpenPose skeletons (the set
 * Yuna's Songstress poses were drawn on), IP-Adapter 0.5 ease-in 0.2..0.8 K+V on TWO of our own
 * images: the picked idle square-padded on white and its head crop. Victory follows the written
 * victory poses (research/visual-bible.md 1.24) with no skeleton, because the flask victory
 * skeleton (both arms up) is Yuna's, not theirs.
 *   node docs/concepts/songstress-2026-09-29/render-poses.mjs <girl>[,<girl>] <slot>[,<slot>] [--n=4] [--from=1]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, CAND, COMMON_NEG, STYLE_TAGS, QUALITY_TAGS } from './gpu.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const O = JSON.parse(readFileSync(join(HERE, 'options.json'), 'utf8'));
const P = JSON.parse(readFileSync(join(HERE, 'poses.json'), 'utf8'));
const args = process.argv.slice(2);
const girls = args[0].split(','); const slots = args[1].split(',');
const n = +(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 4);
const from = +(args.find((a) => a.startsWith('--from='))?.slice(7) ?? 1);
const SKEL = join(HERE, '..', 'art5', 'skeletons', 'flask');
const CN = { 1: 0.65, 2: 0.75, 3: 0.85, 4: 0.75, 5: 0.7, 6: 0.8, 7: 0.75, 8: 0.85, 9: 0.7, 10: 0.8, 11: 0.75, 12: 0.85 };
const SEED0 = { rikku: 39000, paine: 39500 };
const SLOT_OFF = { attack: 0, cast: 40, item: 80, hurt: 120, ko: 160, victory: 200, dance: 240 };

const jobs = [];
for (const girl of girls) {
  const g0 = O.girls[girl]; const gp = P.girls[girl];
  const g = process.env.IDENTITY_B && g0.identityB ? { ...g0, identity: g0.identityB, neg: `${g0.neg}, bob cut, (flat hair:1.1)` } : g0;
  for (const slot of slots) {
    const s = { ...P.slots[slot], ...(gp.slots?.[slot] ?? {}) };
    const ko = slot === 'ko';
    const view = ko ? '' : 'three-quarter view, looking at viewer, full body, feet visible, ';
    for (let i = from; i < from + n; i++) {
      jobs.push({
        key: `${girl}-songstress/${slot}`, n: i, dir: join(CAND, 'poses', `${girl}-songstress`, slot),
        seed: SEED0[girl] + SLOT_OFF[slot] + i, size: ko ? [1216, 832] : [832, 1216], composition: ko ? 'prone' : 'full',
        positive: `1girl, solo, ${s.tags.replace('{face}', gp.face)}, ${g.identity}, ${g.costume}, ${view}simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
        negative: `${COMMON_NEG}, ${ko ? '' : 'from behind, facing away, '}${s.neg}, ${g.neg}${gp.neg && i > 2 ? `, ${gp.neg}` : ''}`,
        refs: [`${CAND}/refs/${girl}-songstress-idle-square.png`, `${CAND}/refs/${girl}-songstress-head.png`],
        ipa: { weight: 0.5, type: 'ease in', start: 0.2, end: 0.8 },
        ...(s.skeleton === false ? {} : { skeleton: join(SKEL, `${slot}.png`), cn: CN[i] ?? 0.75 }),
        extra: { girl, slot, pick: gp.pick },
      });
    }
  }
}
await run(jobs);
