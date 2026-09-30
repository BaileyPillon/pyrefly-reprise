/**
 * Status display O3 (Bailey's pick, 2026-09-29; `docs/concepts/status-display-0929/`): the per-game
 * tables, pinned. **Game case (AGENTS.md rule 14): two tables, never merged**; every figure look is
 * the one `research/status-display.md` describes for that game (§2 FFX, §3 FFX-2), and a status whose
 * look no source describes **draws nothing** on the figure (rule 6).
 */

import { describe, expect, it } from 'vitest';
import type { StatusId } from '../../src/battle/common/types.ts';
import { captionOf, figureLookIds, figureLookOf, iconIdsOf, iconSet, isHarmful } from '../../src/ui/common/statusLooks.ts';
import { HEAD_DROP, marksFor, markScale, REFERENCE_HEIGHT, wearsLooks } from '../../src/ui/common/statusMarks.ts';
import { paintLookOf } from '../../src/ui/common/statusFigureTint.ts';
import { hasGlyph, iconCountOf, statusIconHtml } from '../../src/ui/common/statusIcons.ts';
import { cureHint, hintStatuses, landsLine, leavesLine, messageStatuses } from '../../src/ui/common/statusWords.ts';
import { joinNames, lineText } from '../../src/ui/common/statusMessageLine.ts';

const on = (...ids: string[]): Record<string, unknown> => Object.fromEntries(ids.map((id) => [id, { id }]));

describe('FFX figure looks (research/status-display.md §2)', () => {
  it('draws exactly the sourced looks', () => {
    expect(figureLookIds('ffx').sort()).toEqual(
      ['auto-life', 'berserk', 'confuse', 'curse', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'poison', 'protect', 'sleep', 'zombie'].sort(),
    );
    expect(figureLookOf('ffx', 'zombie')?.marks).toEqual(['smoke']);
    expect(figureLookOf('ffx', 'zombie')?.glow).toBeTruthy(); // "a glowing green body"
    expect(figureLookOf('ffx', 'poison')?.marks).toEqual(['bubbles']);
    expect(figureLookOf('ffx', 'sleep')?.marks).toEqual(['zzz']);
    expect(figureLookOf('ffx', 'confuse')?.marks).toEqual(['stars']);
    expect(figureLookOf('ffx', 'auto-life')?.marks).toEqual(['halo']);
    expect(figureLookOf('ffx', 'berserk')?.tint).toBeDefined(); // red hue
    expect(figureLookOf('ffx', 'curse')?.tint).toBeDefined(); // murky brown hue
    expect(figureLookOf('ffx', 'protect')?.shieldOnPhysicalHit).toBe(true);
    for (const [s, m] of [['nulblaze', 'orb-red'], ['nulfrost', 'orb-white'], ['nulshock', 'orb-yellow'], ['nultide', 'orb-blue']] as const) {
      expect(figureLookOf('ffx', s)?.marks).toEqual([m]);
    }
  });

  it('a status no source describes draws nothing on the figure', () => {
    for (const s of ['silence', 'darkness', 'slow', 'haste', 'shell', 'reflect', 'regen', 'provoke', 'threaten', 'guard', 'defend',
      'power-break', 'magic-break', 'armor-break', 'mental-break', 'doom', 'petrify'] as StatusId[]) {
      expect(figureLookOf('ffx', s), s).toBeUndefined();
    }
    expect(marksFor('ffx', on('silence', 'darkness', 'slow', 'shell', 'reflect'))).toEqual([]);
    expect(paintLookOf('ffx', on('silence', 'darkness', 'slow', 'shell', 'reflect'))).toEqual({ tint: null, glow: null, freeze: false, pulse: false });
  });

  it('has no FFX-2-only look (no Silence bubble, no Darkness cloud, no Stop freeze)', () => {
    expect(marksFor('ffx', on('silence', 'darkness'))).toEqual([]);
    expect(paintLookOf('ffx', on('stop', 'pointless'))).toEqual({ tint: null, glow: null, freeze: false, pulse: false });
  });

  it('the Chapter I moment: Zombie + Poison + Protect wears smoke and bubbles, the green body and glow', () => {
    expect(marksFor('ffx', on('zombie', 'poison', 'protect'))).toEqual(['smoke', 'bubbles']);
    const look = paintLookOf('ffx', on('zombie', 'poison', 'protect'));
    expect(look.tint).toBe(0xa6e39a); // the approved base frame's recipe (options/src/capture.mjs)
    expect(look.glow?.colour).toBe(0x6dff7a);
  });
});

describe('FFX-2 figure looks (research/status-display.md §3)', () => {
  it('draws exactly the sourced looks', () => {
    expect(figureLookIds('ffx2').sort()).toEqual(
      ['auto-life', 'confuse', 'curse', 'darkness', 'poison', 'pointless', 'protect', 'silence', 'sleep', 'stop'].sort(),
    );
    expect(figureLookOf('ffx2', 'silence')?.marks).toEqual(['ellipsis']);
    expect(figureLookOf('ffx2', 'darkness')?.marks).toEqual(['cloud']);
    expect(figureLookOf('ffx2', 'stop')?.freeze).toBe(true);
    expect(figureLookOf('ffx2', 'pointless')?.pulse).toBe(true);
    expect(figureLookOf('ffx2', 'curse')?.tint).toBeDefined(); // darkened model
  });

  it('a status no source describes draws nothing on the figure', () => {
    for (const s of ['berserk', 'shell', 'regen', 'doom', 'reflect', 'haste', 'slow', 'invincible', 'null-magic', 'null-physical',
      'spellspring', 'itchy', 'str-up', 'def-down', 'luck-down', 'petrify', 'zombie', 'nulblaze'] as StatusId[]) {
      expect(figureLookOf('ffx2', s), s).toBeUndefined();
    }
    // The Up/Down family: "There are no visual changes to the battle model when affected".
    expect(marksFor('ffx2', on('str-up', 'mag-down', 'def-up'))).toEqual([]);
  });

  it('the Chapter IV moment: Rikku wears bubbles and the ellipsis bubble; Yuna Z\'s; Paine darkened', () => {
    expect(marksFor('ffx2', on('poison', 'silence'))).toEqual(['bubbles', 'ellipsis']);
    expect(marksFor('ffx2', on('sleep'))).toEqual(['zzz']);
    expect(paintLookOf('ffx2', on('curse', 'haste')).tint).not.toBeNull();
  });

  it('never shows FFX-only looks (Zombie smoke, Nul orbs, Berserk red)', () => {
    expect(marksFor('ffx2', on('zombie', 'nulblaze'))).toEqual([]);
    expect(paintLookOf('ffx2', on('berserk')).tint).toBeNull();
  });
});

describe('who wears looks, and how big', () => {
  const alive = { alive: true, removed: false, flags: {}, statuses: {} } as never;
  it('KO, removed, hidden, petrified and a finished battle wear nothing', () => {
    expect(wearsLooks(alive, null)).toBe(true);
    expect(wearsLooks({ ...(alive as object), alive: false } as never, null)).toBe(false);
    expect(wearsLooks({ ...(alive as object), removed: true } as never, null)).toBe(false);
    expect(wearsLooks({ ...(alive as object), flags: { hidden: true } } as never, null)).toBe(false);
    expect(wearsLooks({ ...(alive as object), statuses: { petrify: {} } } as never, null)).toBe(false);
    expect(wearsLooks(alive, { outcome: 'victory' })).toBe(false);
  });
  it('marks scale with the figure (the mockup\'s 261 px Kimahri is 1)', () => {
    expect(markScale(REFERENCE_HEIGHT)).toBe(1);
    expect(markScale(0)).toBe(1);
    expect(markScale(10)).toBe(0.25);
    expect(markScale(2000)).toBe(1.4);
    expect(HEAD_DROP).toBeGreaterThan(0);
  });
});

describe('icons (O2): shape per game, red = harm, teal = help', () => {
  it('every icon-set status has a drawn glyph, in both games', () => {
    for (const g of ['ffx', 'ffx2'] as const) for (const s of iconSet(g)) expect(hasGlyph(s), `${g} ${s}`).toBe(true);
  });
  it('FFX is round, FFX-2 square; the rim follows harm/help', () => {
    expect(statusIconHtml('ffx', 'zombie')).toMatch(/sti--round sti--harm/);
    expect(statusIconHtml('ffx', 'protect')).toMatch(/sti--round sti--help/);
    expect(statusIconHtml('ffx2', 'sleep')).toMatch(/sti--tag sti--harm/);
    expect(statusIconHtml('ffx2', 'haste')).toMatch(/sti--tag sti--help/);
    expect(isHarmful('doom')).toBe(true);
    expect(isHarmful('auto-life')).toBe(false);
  });
  it('rows list the most alarming first and leave KO and bookkeeping out', () => {
    expect(iconIdsOf('ffx', on('protect', 'poison', 'zombie', 'ko'))).toEqual(['zombie', 'poison', 'protect']);
    expect(iconIdsOf('ffx', on('shell', 'reflect'))).toEqual(['shell', 'reflect']);
    expect(iconIdsOf('ffx2', on('silence', 'poison'))).toEqual(['poison', 'silence']);
    expect(iconIdsOf('ffx2', on('delay-effect', 'shattering', 'action-cancel', 'ko'))).toEqual([]);
    // Each game's own set: FFX has no Stop or Up/Down; FFX-2 has no Zombie, Nul or Breaks.
    expect(iconIdsOf('ffx', on('stop', 'str-up'))).toEqual([]);
    expect(iconIdsOf('ffx2', on('zombie', 'nulblaze', 'power-break'))).toEqual([]);
  });
  it('Doom carries its count: FFX from the turn countdown; FFX-2 only when the engine carries one', () => {
    expect(iconCountOf('doom', { turnsRemaining: 3 })).toBe(3);
    expect(iconCountOf('doom', { turnsRemaining: null, ticksRemaining: 900 } as never)).toBeNull();
    expect(statusIconHtml('ffx', 'doom', { count: 3 })).toMatch(/sti__n">3</);
  });
});

describe('O3 captions: only where a status takes the command away', () => {
  it('FFX and FFX-2 each by their own rules', () => {
    expect(captionOf('ffx', on('sleep'))).toBe('ASLEEP');
    expect(captionOf('ffx2', on('sleep'))).toBe('ASLEEP');
    expect(captionOf('ffx2', on('stop'))).toBe('STOPPED');
    expect(captionOf('ffx', on('stop'))).toBeNull(); // not an FFX status
    expect(captionOf('ffx', on('confuse'))).toBe('CONFUSED'); // "acts automatically"
    expect(captionOf('ffx2', on('confuse'))).toBeNull(); // "may use any command she has"
    // A status that seals part of the menu carries no caption (the approved frame: Rikku's Silence).
    expect(captionOf('ffx', on('silence', 'poison', 'curse'))).toBeNull();
    expect(captionOf('ffx2', on('silence', 'poison', 'curse'))).toBeNull();
  });
});

describe('O3 words: the message line and the cure hints', () => {
  it('the message line reads as the mockup', () => {
    expect(landsLine('Kimahri', 'zombie')).toBe('Kimahri became a Zombie.');
    expect(landsLine('Yuna', 'sleep')).toBe('Yuna fell asleep.');
    expect(leavesLine('Yuna', 'sleep', 'cured')).toBe('Yuna woke up.');
    expect(leavesLine('Yuna', 'sleep', 'ko')).toBeNull(); // a KO or an overwrite says nothing
    expect(lineText({ status: 'poison', lands: true, names: ['Tidus', 'Yuna'], reason: '' })).toBe('Tidus and Yuna were poisoned.');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C');
    expect(messageStatuses()).not.toContain('protect'); // buffs that change nothing a player acts on stay quiet
  });

  it('FFX\'s hints are FFX\'s cure table (ffx-combat-core §4.2): Esuna does not cure Zombie; Holy Water does', () => {
    const z = cureHint('ffx', 'zombie', 'Kimahri', 'kimahri')!;
    expect(z.html).toMatch(/Phoenix Down<\/b> would KO him/);
    expect(z.html).toMatch(/Holy Water<\/b> or a <b>Remedy<\/b> cures it; Esuna does not/);
    expect(cureHint('ffx', 'curse', 'Tidus', 'tidus')!.html).toMatch(/Holy Water<\/b> or <b>Dispel<\/b> cures it; Esuna and Remedy do not/);
    expect(hintStatuses('ffx')).toEqual(['zombie', 'sleep', 'silence', 'curse']);
  });

  it('FFX-2\'s hints are FFX-2\'s cure table (ffx2-combat-core §2.8)', () => {
    expect(cureHint('ffx2', 'sleep', 'Yuna', 'yuna')!.html).toMatch(/her gauge is frozen and she cannot act/);
    expect(cureHint('ffx2', 'silence', 'Rikku', 'rikku')!.short).toMatch(/Echo Screen/);
    expect(cureHint('ffx2', 'curse', 'Paine', 'paine')!.html).toMatch(/cannot change dresspheres/);
    expect(cureHint('ffx2', 'zombie', 'Yuna', 'yuna')).toBeNull(); // no Zombie in FFX-2
    expect(cureHint('ffx', 'poison', 'Tidus', 'tidus')).toBeNull(); // no sourced rule worth a card
  });
});
