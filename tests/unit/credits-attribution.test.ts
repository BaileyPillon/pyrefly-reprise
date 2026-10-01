/**
 * The credits screen (D-305, option O1) owes every licence that asks for a
 * credit. This fails when a shipped audio source whose licence requires
 * attribution (CC BY, CC Sampling Plus) is missing from the credits data.
 *
 * Three records are held against each other:
 *
 * - `src/app/credits/audioSources.ts`: the in-repo list of what the shipped
 *   audio was made with (the audio tools' own `sources.json` lives outside the
 *   repository), checked here against `public/audio/manifest.json`;
 * - `docs/audio/CREDITS.md`: the audio tracks' record of licences and of the
 *   lines that "must appear in the game credits";
 * - `src/app/credits/creditsData.ts`: what the panel prints.
 *
 * Game case: both.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { AUDIO_SOURCES, requiresAttribution } from '../../src/app/credits/audioSources.ts';
import { ATTRIBUTION_REQUIRED_SOURCES, CREDIT_GROUPS, FAN_NOTICE, LICENCE_LINKS } from '../../src/app/credits/creditsData.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CREDITS_MD = readFileSync(join(ROOT, 'docs', 'audio', 'CREDITS.md'), 'utf8');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'public', 'audio', 'manifest.json'), 'utf8')) as Record<
  string,
  unknown
>;

const entries = CREDIT_GROUPS.flatMap((g) => g.entries);
const norm = (s: string): string => s.toLowerCase().replace(/[-\s]+/g, ' ').trim();

/**
 * Every line `docs/audio/CREDITS.md` marks as owing a credit:
 * a table row whose licence cell is CC BY / CC Sampling Plus or which says
 * `**required**`; an `### Library` section with "Attribution required: yes";
 * and every line of a code block introduced as "verbatim".
 */
function requiredLinesInCreditsMd(md: string): string[] {
  const out: string[] = [];
  const lines = md.split(/\r?\n/);
  let heading = '';
  let lastText = '';
  let inBlock = false;
  let blockIsVerbatim = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inBlock) blockIsVerbatim = /verbatim/i.test(lastText);
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) {
      if (blockIsVerbatim && line.trim()) out.push(line.trim());
      continue;
    }
    if (line.startsWith('#')) heading = line;
    if (line.trim()) lastText = line;
    if (line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim());
      if (cells.some((c) => requiresAttribution(c)) || /\*\*required\*\*/i.test(line)) out.push(line);
    }
    if (/Attribution required\*\*:\s*\*\*yes/i.test(line)) out.push(`${heading} ${line}`);
  }
  return out;
}

describe('the audio sources list', () => {
  it('names only manifest sections that ship something', () => {
    for (const s of AUDIO_SOURCES) {
      for (const section of s.feeds) {
        const value = MANIFEST[section];
        expect(value, `${s.id} feeds "${section}", which public/audio/manifest.json does not have`).toBeTruthy();
        expect(Object.keys(value as object).length, `${s.id}: manifest section "${section}" is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('knows which licences ask for a credit', () => {
    expect(requiresAttribution('CC BY 4.0')).toBe(true);
    expect(requiresAttribution('CC-BY 3.0')).toBe(true);
    expect(requiresAttribution('CC Sampling Plus 1.0')).toBe(true);
    expect(requiresAttribution('CC0 1.0')).toBe(false);
    expect(requiresAttribution('CC BY-NC 4.0')).toBe(false);
    expect(requiresAttribution('Public domain')).toBe(false);
    expect(requiresAttribution('MIT')).toBe(false);
  });

  it('has the seven sources that owe a credit on this branch (main + music-v2 + sfx-v2)', () => {
    expect([...ATTRIBUTION_REQUIRED_SOURCES].sort()).toEqual(
      ['arvedi', 'bonfire', 'drskit', 'glass', 'salamander', 'sonatina', 'thunderclap'].sort(),
    );
  });
});

describe('docs/audio/CREDITS.md against the list', () => {
  const required = requiredLinesInCreditsMd(CREDITS_MD);

  it('finds the required lines at all (the parser still reads the file)', () => {
    expect(required.length).toBeGreaterThanOrEqual(7);
  });

  it.each(required)('a source in audioSources.ts covers: %s', (line) => {
    const hit = AUDIO_SOURCES.find((s) => s.match.some((m) => line.toLowerCase().includes(m.toLowerCase())));
    expect(hit, `CREDITS.md owes "${line.slice(0, 120)}" and no audio source matches it`).toBeDefined();
    const credited = entries.some((e) => e.sources?.some((id) => id === hit!.id));
    expect(credited, `${hit!.id} is owed by CREDITS.md and missing from the credits panel`).toBe(true);
  });
});

describe('the credits panel data', () => {
  it.each(ATTRIBUTION_REQUIRED_SOURCES)('credits %s as a REQUIRED line with its licence', (id) => {
    const source = AUDIO_SOURCES.find((s) => s.id === id)!;
    const entry = entries.find((e) => e.sources?.some((s) => s === id));
    expect(entry, `${id} (${source.licence}) is not on the credits panel`).toBeDefined();
    expect(entry!.required, `${id} is listed but not marked required`).toBe(true);
    expect(norm(entry!.licence)).toContain(norm(source.licence));
    expect(entry!.by.trim().length).toBeGreaterThan(0);
  });

  it('credits every audio source, required or not', () => {
    const credited = new Set(entries.flatMap((e) => e.sources ?? []));
    for (const s of AUDIO_SOURCES) expect(credited.has(s.id), `${s.id} has no line`).toBe(true);
  });

  it('puts the REQUIRED lines first in each group', () => {
    for (const g of CREDIT_GROUPS) {
      const flags = g.entries.map((e) => e.required === true);
      const firstCourtesy = flags.indexOf(false);
      if (firstCourtesy >= 0) expect(flags.slice(firstCourtesy).includes(true), g.id).toBe(false);
    }
  });

  it('groups as the approved frames do, and ends on the fan-work notice', () => {
    expect(CREDIT_GROUPS.map((g) => g.heading)).toEqual(['Music', 'Sound effects', 'Type', 'Art and tools']);
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    expect(readme).toContain(FAN_NOTICE);
  });
});

/**
 * CC BY 4.0 section 3(a)(1) (and CC BY 3.0 section 4, CC Sampling Plus 1.0
 * section 4) ask a credit for more than a name: whether the work was
 * modified, a link to the material where one is reasonably practicable, and
 * the licence's URI. The independent check of audio-rel35 found all three
 * missing for the first CC BY 4.0 SFX to ship.
 */
describe('what the licences ask a REQUIRED line to carry', () => {
  const required = entries.filter((e) => e.required);
  const COMMONS_FILES: Record<string, string> = {
    thunderclap: 'commons.wikimedia.org/wiki/File:Nosferatu_thunderclap_-_Richard_Humphries.wav',
    bonfire: 'commons.wikimedia.org/wiki/File:WWS_Bonfireignition.ogg',
    glass: 'commons.wikimedia.org/wiki/File:Glass_breaking_(Gravity_Sound).wav',
  };

  it.each(required.map((e) => [e.title, e] as const))('%s says it was modified or what it was used in', (_t, e) => {
    expect(e.note ?? '', `${e.title}: no note saying the work was edited or used in our own work`).toMatch(
      /edited|original music|decoded|processed/i,
    );
  });

  it.each(Object.entries(COMMONS_FILES))('%s links its Commons file page, as CREDITS.md records it', (id, url) => {
    const e = entries.find((x) => x.sources?.some((s) => s === id))!;
    expect(e.note).toContain(url);
    expect(e.note).toMatch(/edited: cut, filtered and layered/);
    expect(CREDITS_MD).toContain(`https://${url}`);
  });

  it('gives the URI of every licence a REQUIRED line is under', () => {
    const uri: Record<string, string> = {
      'cc by 4.0': 'creativecommons.org/licenses/by/4.0',
      'cc by 3.0': 'creativecommons.org/licenses/by/3.0',
      'cc sampling plus 1.0': 'creativecommons.org/licenses/sampling+/1.0',
    };
    for (const e of required) {
      const want = uri[norm(e.licence)];
      expect(want, `${e.title}: no URI known for "${e.licence}"`).toBeDefined();
      expect(LICENCE_LINKS).toContain(want!);
    }
  });
});
