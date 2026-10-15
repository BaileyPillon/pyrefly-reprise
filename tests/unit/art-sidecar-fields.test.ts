/**
 * A shipped painting sidecar carries only the fields the game reads (r47-rc, FOC46-06; both games, build plumbing).
 *
 * The review of the r46 candidate found the sidecars still carried the owner's first name (969 files) and links to private claude.ai pages (620) in
 * their provenance notes. The build now writes each sidecar as exactly the fields the game reads, values untouched, key order kept
 * (`tools/art-sidecar-fields.mjs`, `projectSidecarText`). This file proves the projection on constructed texts (the rule, the edge cases) and on every
 * sidecar of the master folder (skipped where a checkout has no art): that each kept field is the master's own value, that nothing else is left, that the
 * split between sidecars and the two manifests the game reads whole is the one `NON_SIDECAR_ART_JSON` says, and that no shipped sidecar names a person or a
 * private page. Which fields the game reads is `art-sidecar-redact.test.ts` (table `READERS`, with a guard over `src/`); it also proves the list equals that union.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { NON_SIDECAR_ART_JSON, SIDECAR_FIELDS, isSidecarJson, keysOutsideList, projectSidecarText, topLevelMembers } from '../../tools/art-sidecar-fields.mjs';
import { listMasterSidecars, shippedArtJsonText } from '../../tools/art-sidecar-redact.mjs';
import { findLocalPaths, findPrivateLinks } from '../../tools/dist-local-paths.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const PUBLIC = join(ROOT, 'public');
const HAVE_ART = existsSync(join(PUBLIC, 'art', 'manifest.json'));

describe('SIDECAR_FIELDS', () => {
  it('is the ten fields the game reads, with no duplicate', () => {
    expect([...SIDECAR_FIELDS].sort()).toEqual(['anchorY', 'baselineY', 'facing', 'focal', 'headTop', 'height', 'prompt', 'scale', 'seed', 'width']);
    expect(new Set(SIDECAR_FIELDS).size).toBe(SIDECAR_FIELDS.length);
  });

  it('is frozen: nothing adds a field at run time', () => {
    expect(Object.isFrozen(SIDECAR_FIELDS)).toBe(true);
    expect(Object.isFrozen(NON_SIDECAR_ART_JSON)).toBe(true);
  });
});

describe('isSidecarJson', () => {
  it('every art JSON is a sidecar except the two manifests and the build\'s own record', () => {
    expect(isSidecarJson('art/characters/yuna/idle.json')).toBe(true);
    expect(isSidecarJson('art/backdrops/besaid.json')).toBe(true);
    expect(isSidecarJson('art/portraits/yuna.json')).toBe(true);
    expect(isSidecarJson('art/pause/yuna@2x.json')).toBe(true);
    expect(isSidecarJson('art/CHARACTERS/YUNA/IDLE.JSON')).toBe(true);
    expect(isSidecarJson('art\\characters\\yuna\\idle.json')).toBe(true);
    for (const rel of NON_SIDECAR_ART_JSON) expect(isSidecarJson(rel), rel).toBe(false);
    expect(NON_SIDECAR_ART_JSON).toEqual(['art/manifest.json', 'art/portrait-parts/manifest.json', 'art/derived.json']);
  });

  it('a JSON outside art/ and a file that is not JSON are not sidecars', () => {
    expect(isSidecarJson('fx/besaid/depth.json')).toBe(false);
    expect(isSidecarJson('audio/manifest.json')).toBe(false);
    expect(isSidecarJson('art/characters/yuna/idle.png')).toBe(false);
    expect(isSidecarJson('data/art/x.json')).toBe(false);
  });
});

describe('projectSidecarText: the rule', () => {
  const pretty = (o: Record<string, string>): string => `{\n${Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${v}`).join(',\n')}\n}\n`;

  it('keeps the listed keys in the MASTER\'s order, one per line, and leaves every other key out', () => {
    const master = '{"status":"approved by Bailey","height":1536,"source":"https://claude.ai/artifact/abc","width":1024,"facing":"right","model":"x"}';
    const r = projectSidecarText(master);
    expect(r.text).toBe('{\n  "height": 1536,\n  "width": 1024,\n  "facing": "right"\n}\n');
    expect(r.kept).toEqual(['height', 'width', 'facing']);
    expect(r.dropped).toEqual(['status', 'source', 'model']);
    expect(Object.keys(JSON.parse(r.text))).toEqual(['height', 'width', 'facing']);
  });

  it('leaves every value as the master spelt it: numbers, escapes, null, and a seed no double can hold', () => {
    const master = [
      '{',
      '  "width": 1024.0,',
      '  "baselineY": 1e3,',
      '  "scale": 0.50,',
      '  "anchorY": -0,',
      '  "seed": 18446744073709551615,',
      '  "prompt": "a \\u00e9 and \\/ and \\" and \\\\( kept\\n",',
      '  "facing": null',
      '}',
    ].join('\n');
    const r = projectSidecarText(master);
    expect(r.text).toBe(
      pretty({
        width: '1024.0',
        baselineY: '1e3',
        scale: '0.50',
        anchorY: '-0',
        seed: '18446744073709551615', // JSON.stringify(JSON.parse(...)) would write 18446744073709552000
        prompt: '"a \\u00e9 and \\/ and \\" and \\\\( kept\\n"',
        facing: 'null',
      }),
    );
  });

  it('drops the white space between the tokens of an object or array value, and keeps the white space inside its strings', () => {
    const master = '{\r\n  "focal" : {\r\n    "x" : 0.5 ,\r\n    "y": 0.25, "note": "two  spaces,\\ttab"\r\n  },\r\n  "headTop": [ 0.52 ,\r\n 0.12 ]\r\n}\r\n';
    const r = projectSidecarText(master);
    expect(r.text).toBe('{\n  "focal": {"x":0.5,"y":0.25,"note":"two  spaces,\\ttab"},\n  "headTop": [0.52,0.12]\n}\n');
    expect(r.text).not.toContain('\r');
  });

  it('does not depend on how the master was laid out or on its line ends', () => {
    const a = '{"width":1,"height":2,"focal":{"x":0.1,"y":0.2}}';
    const b = '{\r\n\t"width": 1,\r\n\t"height": 2,\r\n\t"focal": {\r\n\t\t"x": 0.1,\r\n\t\t"y": 0.2\r\n\t}\r\n}';
    const c = '\n\n  {  "width"  :  1  ,  "height" :2,"focal" :  { "x" : 0.1 , "y" : 0.2 } }  \n\n';
    expect(projectSidecarText(a).text).toBe(projectSidecarText(b).text);
    expect(projectSidecarText(a).text).toBe(projectSidecarText(c).text);
  });

  it('gives {} and a final newline when no listed key is there', () => {
    expect(projectSidecarText('{"master":"x","status":"y"}').text).toBe('{}\n');
    expect(projectSidecarText('{}').text).toBe('{}\n');
    expect(JSON.parse(projectSidecarText('{ }').text)).toEqual({});
  });

  it('reads a key spelt with escapes as the key it is, and writes it plainly', () => {
    expect(projectSidecarText('{"wid\\u0074h": 5, "\\u0073tatus": "x"}').text).toBe('{\n  "width": 5\n}\n');
  });

  it('a key that appears twice keeps the value JSON.parse would give it, at the place of its first appearance', () => {
    const master = '{"width": 1, "height": 2, "width": 3}';
    const r = projectSidecarText(master);
    expect(r.text).toBe('{\n  "width": 3,\n  "height": 2\n}\n');
    expect(JSON.parse(r.text)).toEqual({ width: JSON.parse(master).width, height: 2 });
  });

  it('is idempotent', () => {
    const master = '{\r\n "x": 1, "width": 10.0, "prompt": "p", "focal": { "x": 1, "y": 2 }, "seed": null, "status": "s" }';
    const once = projectSidecarText(master).text;
    expect(projectSidecarText(once).text).toBe(once);
  });

  it('keeps a __proto__ or constructor key out and does not let one change a result', () => {
    const r = projectSidecarText('{"__proto__": {"width": 9}, "constructor": 1, "width": 4}');
    expect(r.text).toBe('{\n  "width": 4\n}\n');
    expect(r.dropped).toEqual(['__proto__', 'constructor']);
  });

  it('refuses a text that is not a JSON object: a sidecar is an object, and nothing is guessed about a file that is not', () => {
    for (const bad of ['[1,2]', '3', '"width"', 'null', 'true']) expect(() => projectSidecarText(bad), bad).toThrow(TypeError);
    for (const bad of ['', '{', '{"width": }', '{"width": 1,}', "{'width': 1}", '\uFEFF{"width": 1}']) expect(() => projectSidecarText(bad), bad).toThrow(SyntaxError);
  });

  it('no name, link or note of the provenance survives', () => {
    const master = JSON.stringify({
      width: 10,
      status: 'approved by Bailey on 2026-09-30',
      source: 'https://claude.ai/artifact/FsGq1',
      note: 'see C:/Users/someone/Pictures/x.png',
      prompt: 'a painted room, warm light',
    });
    const text = projectSidecarText(master).text;
    expect(text).not.toMatch(/Bailey|claude\.ai|Users|someone|approved/);
    expect(findPrivateLinks(text)).toEqual([]);
    expect(findLocalPaths(text)).toEqual([]);
    expect(JSON.parse(text)).toEqual({ width: 10, prompt: 'a painted room, warm light' });
  });
});

describe('topLevelMembers and keysOutsideList', () => {
  it('lists the top-level members in order with the offset of each key, and skips nested keys, strings with braces and brackets', () => {
    const text = '{ "a": {"b": [1, {"c": "}]"}], "status": 1}, "d": "x, \\"y\\": z", "e": [ ] }';
    expect(topLevelMembers(text).map((m) => m.key)).toEqual(['a', 'd', 'e']);
    for (const m of topLevelMembers(text)) expect(text.slice(m.keyStart, m.keyStart + m.key.length + 2)).toBe(JSON.stringify(m.key));
  });

  it('answers the keys outside the list, and null for a text that is not a JSON object', () => {
    expect(keysOutsideList('{"width":1,"status":"x","model":2}')?.map((k) => k.key)).toEqual(['status', 'model']);
    expect(keysOutsideList('{"width":1,"height":2}')).toEqual([]);
    expect(keysOutsideList('[1]')).toBeNull();
    expect(keysOutsideList('not json')).toBeNull();
    const text = '{\n  "width": 1,\n  "status": "x"\n}';
    expect(keysOutsideList(text)?.[0]?.offset).toBe(text.indexOf('"status"'));
  });
});

describe('shippedArtJsonText: the one function the build and the gate use', () => {
  it('cuts a sidecar and only replaces the paths of any other art JSON', () => {
    const sidecar = shippedArtJsonText('art/characters/yuna/idle.json', '{"width":1,"installedFrom":"D:/Tools/x/y.png"}');
    expect(sidecar).toMatchObject({ sidecar: true, text: '{\n  "width": 1\n}\n', kept: ['width'], dropped: ['installedFrom'] });
    const manifest = shippedArtJsonText('art/manifest.json', '{"version":2,"where":"D:/Tools/x/y.png"}');
    expect(manifest).toMatchObject({ sidecar: false, text: '{"version":2,"where":"y.png"}', strings: 1, paths: 1 });
    const same = '{ "version": 2, "subjects": {} }\n';
    expect(shippedArtJsonText('art/portrait-parts/manifest.json', same).text).toBe(same);
  });

  it('names the file when a sidecar is not a JSON object', () => {
    expect(() => shippedArtJsonText('art/characters/yuna/idle.json', '[1]')).toThrow(/art\/characters\/yuna\/idle\.json: a painting sidecar must be a JSON object/);
  });
});

describe.skipIf(!HAVE_ART)('every JSON of the master folder, as the build ships it', () => {
  const masters = listMasterSidecars(PUBLIC);
  const hasPainting = (rel: string): boolean => ['.png', '.webp', '.jpg', '.jpeg'].some((e) => existsSync(join(PUBLIC, rel.replace(/\.json$/i, e))));

  it('the split is the one NON_SIDECAR_ART_JSON says: a sidecar has a painting beside it, the manifests have none', () => {
    const odd = masters.filter((m) => isSidecarJson(m.rel) !== hasPainting(m.rel)).map((m) => m.rel);
    expect(odd).toEqual([]);
    const others = masters.filter((m) => !isSidecarJson(m.rel)).map((m) => m.rel);
    expect(others).toEqual(['art/manifest.json', 'art/portrait-parts/manifest.json']); // art/derived.json is the build's own, so it is not a master
    expect(masters.filter((m) => isSidecarJson(m.rel)).length).toBeGreaterThan(1000);
  });

  it('keeps exactly the listed keys of each sidecar, in the master\'s order, each value the master\'s own, and nothing else', () => {
    const problems: string[] = [];
    let dropped = 0;
    let withPrompt = 0;
    for (const m of masters) {
      if (!isSidecarJson(m.rel)) continue;
      const text = readFileSync(m.full, 'utf8');
      const master = JSON.parse(text) as Record<string, unknown>;
      const r = projectSidecarText(text);
      const after = JSON.parse(r.text) as Record<string, unknown>;
      const want = Object.keys(master).filter((k) => (SIDECAR_FIELDS as readonly string[]).includes(k));
      if (Object.keys(after).join() !== want.join()) problems.push(`${m.rel}: keys ${Object.keys(after).join(',')} against ${want.join(',')}`);
      for (const k of want) if (JSON.stringify(after[k]) !== JSON.stringify(master[k])) problems.push(`${m.rel}: ${k} changed`);
      for (const k of Object.keys(after)) if (!(SIDECAR_FIELDS as readonly string[]).includes(k)) problems.push(`${m.rel}: ${k} is not on the list`);
      if (keysOutsideList(r.text)?.length !== 0) problems.push(`${m.rel}: the gate would find a key outside the list`);
      if (projectSidecarText(r.text).text !== r.text) problems.push(`${m.rel}: not idempotent`);
      dropped += r.dropped.length;
      if ('prompt' in after) withPrompt++;
    }
    expect(problems).toEqual([]);
    expect(dropped, 'the master folder carries provenance today; the test would prove nothing without it').toBeGreaterThan(10000);
    expect(withPrompt).toBeGreaterThan(900);
  });

  it('leaves every number as the master spelt it (the text of each kept scalar is found in the master\'s)', () => {
    const problems: string[] = [];
    for (const m of masters) {
      if (!isSidecarJson(m.rel)) continue;
      const text = readFileSync(m.full, 'utf8');
      const after = projectSidecarText(text).text;
      for (const mem of topLevelMembers(after)) {
        const literal = after.slice(mem.valueStart, mem.valueEnd);
        if (/^[-\d]/.test(literal) && !new RegExp(`"${mem.key}"\\s*:\\s*${literal.replace(/[.+*?^$()|[\]\\{}]/g, '\\$&')}\\s*[,}]`).test(text)) problems.push(`${m.rel}: ${mem.key} ${literal} is not spelt so in the master`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('names no person, no private page and no local path in any shipped sidecar', () => {
    const problems: string[] = [];
    for (const m of masters) {
      if (!isSidecarJson(m.rel)) continue;
      const text = projectSidecarText(readFileSync(m.full, 'utf8')).text;
      if (/bailey|pillon/i.test(text)) problems.push(`${m.rel}: a name`);
      if (findPrivateLinks(text).length) problems.push(`${m.rel}: a claude.ai link`);
      if (findLocalPaths(text).length) problems.push(`${m.rel}: a local path`);
      if (/https?:\/\/|www\./i.test(text)) problems.push(`${m.rel}: a link`);
      if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text.replace(/@\d+x\b/g, ''))) problems.push(`${m.rel}: an e-mail address`);
    }
    expect(problems).toEqual([]);
  });

  it('the two manifests the game reads whole ship exactly as they are (no path in either)', () => {
    for (const rel of ['art/manifest.json', 'art/portrait-parts/manifest.json']) {
      const text = readFileSync(join(PUBLIC, rel), 'utf8');
      expect(shippedArtJsonText(rel, text), rel).toMatchObject({ sidecar: false, text, strings: 0, paths: 0, plain: false });
    }
  });
});
