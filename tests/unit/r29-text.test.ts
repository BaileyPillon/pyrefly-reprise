// @vitest-environment jsdom
/**
 * Critic round 15, the text batch (`docs/plans/r29-text-review.md`, `docs/handoff/r29-text.md`).
 * Each block names its game case (AGENTS.md rule 14). Boards come from running the real engines (rule 3).
 *
 *  - PR-0234 (both): the advisor card gives a real reason and prints "always hits" only on damage.
 *  - PR-0235 (FFX-2 only): the Darkness card names the payer and the cost.
 *  - PR-0241 (FFX only): a member the AP rule excluded says why on the results rows.
 *  - PR-0230 (FFX-2 only): the Chapter V coda names the glen, not the chamber.
 *  - PR-0231 (FFX only): Chapter III's phase-2 callout asks for nothing the player cannot do.
 *  - PR-0161 / PR-0058 (FFX-2 only): Farplane voices are voices; the Gullwings crew have plates.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { FALLBACK_REASON, buildAdvisorView, clearAdvisorCache, type AdvisorView, type MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { cardHtml } from '../../src/ui/common/MoveAdvisor.ts';
import { chapterById, runChapter } from '../../critic/bench/advisor-v3/drive.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { desktopPageHtml, type ResultsPageModel } from '../../src/ui/common/resultsPage.ts';
import { phonePageHtml } from '../../src/ui/common/resultsPhone.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { backdrop } from '../../src/story/dsl.ts';
import { CutsceneRunner, createNoopPorts } from '../../src/story/runner/CutsceneRunner.ts';
import { swapCutscenePlate } from '../../src/app/screens/cutscenePlate.ts';
import { ffx2VegnagunShuyinScripts } from '../../src/story/scripts/ffx2-vegnagun-shuyin.ts';
import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { speakerRole } from '../../src/ui/common/speaker-roles.ts';
import { braskasFinalAeonScripts } from '../../src/story/scripts/braskas-final-aeon.ts';

class Stop extends Error {
  constructor(readonly value: unknown) {
    super('found');
  }
}

/** The card the live HUD would show at the first player decision of `chapter` (seed 1). */
async function firstCard(chapter: string): Promise<AdvisorView> {
  try {
    await runChapter(chapterById(chapter), 1, (ctx) => {
      const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      clearAdvisorCache();
      throw new Stop(buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions }));
    });
  } catch (e) {
    if (e instanceof Stop) return e.value as AdvisorView;
    throw e;
  }
  throw new Error('no decision');
}

describe('PR-0234: the first card says why and does not say "always hits" on a non-attack (both games)', () => {
  for (const [chapter, label] of [
    ['seymour-natus', 'Talk'],
    ['evrae-airship', 'Pull back'],
    ['isaaru-via-purifico', 'Grand Summon'],
  ] as const) {
    it(`${chapter}: ${label}`, async () => {
      const view = await firstCard(chapter);
      const top = view.suggestions[0]!;
      expect(top.label).toBe(label);
      expect(top.reason).not.toBe(FALLBACK_REASON);
      expect(top.reason.length).toBeGreaterThan(30); // the chapter guide's own sentence, not the stand-in
      const html = cardHtml(view);
      expect(html).not.toMatch(/always hits/i);
      expect(html).not.toContain('The best of what is offered');
    });
  }

  it('a move that deals damage keeps the chip, and a move that can miss keeps its percentage', () => {
    const base = { label: 'Attack', menu: '', targetName: 'Boss', effect: '', mpCost: 0, critChance: 0, statuses: [], cures: [], reason: 'r', warning: '' };
    const dmg = { ...base, hitChance: null, estimate: { kind: 'damage', min: 1, mid: 2, max: 3, hits: 1, killsTarget: false } };
    const slow = { ...base, hitChance: 60, estimate: null };
    const talk = { ...base, hitChance: null, estimate: null };
    const html = (s: object): string => cardHtml({ actorId: 'a', actorName: 'A', suggestions: [s as unknown as MoveSuggestion], note: '', considered: 1 } as unknown as AdvisorView);
    expect(html(dmg)).toMatch(/always hits/);
    expect(html(slow)).toMatch(/60% to hit/);
    expect(html(talk)).not.toMatch(/always hits|to hit/);
  });
});

describe('PR-0235: the Darkness card names who pays (FFX-2 only)', () => {
  it('Chapter XI: "Costs Paine 12.5% of max HP", never "the party"', async () => {
    let found: string | null = null;
    try {
      await runChapter(chapterById('ffx2-fallen-aeons'), 1, (ctx) => {
        const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
        clearAdvisorCache();
        const v = buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions, v3: true });
        const s = v?.suggestions.find((x) => x.label === 'Darkness' && x.warning);
        if (s && ctx.decision.actorId === 'paine') throw new Stop(s.warning);
        return (v?.suggestions[0]?.command ?? null) as Command | null;
      });
    } catch (e) {
      if (e instanceof Stop) found = e.value as string;
      else throw e;
    }
    expect(found).toBe('Costs Paine 12.5% of max HP');
  }, 600_000);
});

describe('PR-0241: a member the AP rule excluded says why (FFX only; ffx-combat-core 10.1)', () => {
  const chapter = getChapter('seymour-flux');
  const win = (sphere: Record<string, number>, turns: Record<string, number>) =>
    ({ outcome: 'victory', turns: 9, elapsedTicks: 0, elapsedMs: 60000, ap: 10000, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: sphere, turnsTaken: turns }) as never;

  it('rows: KO or petrified at the end after taking turns; no full turn for the rest; nothing for an earner', () => {
    const rows = buildMemberRows(chapter, win({ tidus: 0 }, { tidus: 3, kimahri: 2 }));
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by['tidus']!.noAward).toBeUndefined();
    expect(by['kimahri']!.award).toBe(0);
    expect(by['kimahri']!.noAward?.long).toMatch(/KO/);
    expect(by['kimahri']!.noAward?.short).toBe('OUT · NO AP');
    const untouched = rows.find((r) => r.id !== 'tidus' && r.id !== 'kimahri');
    if (untouched) expect(untouched.noAward?.long).toMatch(/no full turn/);
  });

  it('a defeat has no AP to explain', () => {
    const rows = buildMemberRows(chapter, { ...(win({}, { kimahri: 2 }) as object), outcome: 'defeat' } as never);
    expect(rows.every((r) => r.noAward === undefined)).toBe(true);
  });

  it('both layouts print it (desktop detail line, phone chip)', () => {
    const rows = buildMemberRows(chapter, win({ tidus: 0 }, { tidus: 3, kimahri: 2 }));
    const model: ResultsPageModel = {
      victory: true, silent: false, heading: 'Victory', clock: '1:00', tags: [], quip: undefined,
      ledger: [], rows, progress: 1, actionIndex: 0,
    };
    expect(desktopPageHtml(model)).toMatch(/KO’d or petrified at the end · no AP/);
    expect(phonePageHtml(model, '')).toMatch(/OUT · NO AP/);
  });

  it('FFX-2 rows are untouched (EXP for the party)', () => {
    const ffx2 = getChapter('ffx2-fallen-aeons');
    const rows = buildMemberRows(ffx2, { outcome: 'victory', turns: 5, elapsedTicks: 0, elapsedMs: 1, ap: 0, exp: 900, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as never);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.noAward === undefined)).toBe(true);
  });
});

describe('PR-0230: Chapter V\'s coda names the Farplane Glen (FFX-2 only)', () => {
  it('the coda script carries a backdrop step with the place, before the fade back up', () => {
    const post = ffx2VegnagunShuyinScripts.post;
    const at = post.findIndex((s) => s.type === 'backdrop');
    expect(at).toBeGreaterThan(post.findIndex((s) => s.type === 'results'));
    expect(post[at]).toMatchObject({ key: 'farplane', ms: 0, place: 'The Farplane Glen' });
  });

  it('the builder is additive and the runner forwards the place', async () => {
    expect(backdrop('a', 300)).toEqual({ type: 'backdrop', key: 'a', ms: 300 });
    const got: Array<string | undefined> = [];
    await new CutsceneRunner(createNoopPorts({ backdrop: (_k, _m, place) => void got.push(place) })).run([backdrop('a', 0, 'The Farplane Glen'), backdrop('b', 0)]);
    expect(got).toEqual(['The Farplane Glen', undefined]);
  });

  it('the screen keeps "CHAPTER V ·" and swaps the place; with no place the eyebrow steps out (Ixion)', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<div class="cutscene__eyebrow"><span class="cutscene__eyebrow-label">CHAPTER V · HEART OF THE FARPLANE — VEGNAGUN’S CHAMBER</span></div>';
    await swapCutscenePlate(root, 'farplane', 0, () => Promise.resolve(), 'The Farplane Glen');
    const eyebrow = root.querySelector<HTMLElement>('.cutscene__eyebrow')!;
    expect(eyebrow.hidden).toBe(false);
    expect(eyebrow.textContent).toBe('CHAPTER V · THE FARPLANE GLEN');
    await swapCutscenePlate(root, 'bevelle-underground', 0, () => Promise.resolve());
    expect(eyebrow.hidden).toBe(true);
  });
});

describe('PR-0231: the Chapter III phase-2 callout is an instruction the player can follow (FFX only)', () => {
  it('Auron no longer asks the party to spread out', () => {
    const lines = (braskasFinalAeonScripts.midScripts['bfa-sword'] ?? []).filter((s) => s.type === 'say') as Array<{ who: string; text: string }>;
    const auron = lines.find((l) => l.who === 'auron')!;
    expect(auron.text).toBe('It hits all of us. Keep everyone up.');
    expect(lines.some((l) => /spread/i.test(l.text))).toBe(false);
  });
});

describe('PR-0161 / PR-0058: Farplane voices and Gullwings plates (FFX-2 only)', () => {
  const plate = (game: 'ffx' | 'ffx2', who: 'jecht' | 'braska' | 'auron' | 'shinra' | 'buddy' | 'brother-x2'): { role: string; voice: boolean } => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const box = new DialogueBox({ root, game });
    box.mount();
    void box.say({ type: 'say', who, text: 'Line.' } as never);
    return {
      role: root.querySelector<HTMLElement>('.dbox__role')?.hidden ? '' : (root.querySelector<HTMLElement>('.dbox__role')?.textContent ?? ''),
      voice: root.querySelector('.dbox')?.classList.contains('dbox--voice') ?? false,
    };
  };

  it('in an FFX-2 box the FFX dead are Farplane voices, with no FFX role plate', () => {
    expect(plate('ffx2', 'jecht')).toEqual({ role: 'Farplane', voice: true });
    expect(plate('ffx2', 'braska')).toEqual({ role: 'Farplane', voice: true });
    expect(plate('ffx2', 'auron')).toEqual({ role: 'Farplane', voice: true });
  });

  it('in FFX they keep the plates they had', () => {
    expect(plate('ffx', 'jecht')).toEqual({ role: 'Final Aeon', voice: false });
    expect(plate('ffx', 'braska')).toEqual({ role: 'High Summoner', voice: false });
  });

  it('Shinra, Brother (X-2) and Buddy have a Gullwings plate; FFX Brother stays bare', () => {
    for (const who of ['shinra', 'buddy', 'brother-x2'] as const) expect(speakerRole(who)).toBe('Gullwings');
    expect(speakerRole('brother')).toBeUndefined();
  });
});
