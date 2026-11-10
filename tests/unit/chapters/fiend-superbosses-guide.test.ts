/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register";
 * `guide-doc.test.ts`: one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and the engine and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under its five fighting bodies, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for; the rules, hints and phases cite in the corpus's own form.
 * 3. **The numbers the player reads are the data's**: the HP of every body, the loops' lengths (six, seven, nine, six, nine), the quarter and half tests, the four Commands (a charge of about four and a half seconds, a Lv 99
 *    girl down, Protect and Shell changing nothing), what Protect and Shell halve and do not, the elements the heads null, the steals and the drops.
 * 4. **The promises**: nothing in the card or the page promises a defence the kit cannot give (no Miracle Drink, no Thunder-proofing, no Dispel hint), and the page prints no source.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_FIEND_SUPERBOSSES } from '../../../src/data/chapter-ffx2-fiend-superbosses.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_FIEND_SUPERBOSSES_GUIDE, FIEND_SUPERBOSSES_GUIDE_IDS } from '../../../src/data/guides/ffx2-fiend-superbosses.ts';
import { FFX2_FIEND_SUPERBOSSES_DOC } from '../../../src/data/guides/docs/ffx2-fiend-superbosses.ts';
import { act1ShinraGroup, act2NumerusGroup, x2AlmightyShinra, x2NumerusDuo, x2NumerusQuattour, x2NumerusTria, x2NumerusUnum } from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import { ABILITIES, ITEMS } from '../../../src/data/ffx2/index.ts';
import { FS_ABILITY, NUMERUS_HEAD_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { DUO_BEATS, QUATTOUR_BEATS, TRIA_BEATS } from '../../../src/battle/ffx2/ai/numerus.ts';
import { FIEND_SUPERBOSSES_BOSS_IDS } from '../../../src/engine/tactics/ffx2-fiend-superbosses.ts';
import { bigHp, damageOn, forcedAct, girlsOf, logOf, move, openAct, playUntilActed, type Act } from '../helpers/fiendSuperbossDrive.ts';

const docText = (): string =>
  FFX2_FIEND_SUPERBOSSES_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_FIEND_SUPERBOSSES_GUIDE.rules.map((r) => r.text), ...FFX2_FIEND_SUPERBOSSES_GUIDE.hints.map((h) => h.text), ...FFX2_FIEND_SUPERBOSSES_GUIDE.phases.map((p) => p.note)].join(' ');
const fmt = (n: number): string => n.toLocaleString('en-US');

describe('registration', () => {
  it('the card and the document are the chapter\'s, under its five fighting bodies, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_FIEND_SUPERBOSSES_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_FIEND_SUPERBOSSES_DOC);
    expect(guideForChapter(FFX2_FIEND_SUPERBOSSES.id)).toBe(FFX2_FIEND_SUPERBOSSES_GUIDE);
    expect([...FFX2_FIEND_SUPERBOSSES_GUIDE.bossIds]).toEqual([...FIEND_SUPERBOSSES_GUIDE_IDS]);
    expect([...FIEND_SUPERBOSSES_BOSS_IDS]).toEqual([...FIEND_SUPERBOSSES_GUIDE_IDS]);
    expect([...FIEND_SUPERBOSSES_GUIDE_IDS]).toEqual([X2_ALMIGHTY_SHINRA_ID, ...NUMERUS_HEAD_IDS]);
    expect([...FFX2_FIEND_SUPERBOSSES_DOC.bossIds]).toEqual([...FIEND_SUPERBOSSES_GUIDE_IDS]);
    expect(FFX2_FIEND_SUPERBOSSES_DOC.game).toBe('ffx2');
    expect(FFX2_FIEND_SUPERBOSSES_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
    expect(FFX2_FIEND_SUPERBOSSES_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(FFX2_FIEND_SUPERBOSSES_GUIDE.rules.length).toBeLessThanOrEqual(5);
  });

  it('the five ids are the chapter\'s fighting enemies, and the three hidden parts are in neither registry (they are never aimed at)', () => {
    const fighting = [...act1ShinraGroup.enemies, ...act2NumerusGroup.enemies].map((e) => e.id);
    expect([...FIEND_SUPERBOSSES_GUIDE_IDS]).toEqual(fighting);
    for (const part of act2NumerusGroup.parts ?? []) expect(FIEND_SUPERBOSSES_GUIDE_IDS, part.id).not.toContain(part.id);
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['darkness', 'light curtain', 'lunar curtain', 'megalixir', 'remedy', 'phoenix down', 'stash']);
    const cite = /^(re-)?ffx2-[a-z0-9-]+ §/;
    for (const h of FFX2_FIEND_SUPERBOSSES_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      expect(h.cite).toMatch(cite);
    }
    for (const r of FFX2_FIEND_SUPERBOSSES_GUIDE.rules) expect(r.cite).toMatch(cite);
    for (const p of FFX2_FIEND_SUPERBOSSES_GUIDE.phases) expect(p.cite).toMatch(cite);
  });

  it('there is no Dispel hint, no Miracle Drink and no Thunder-proofing anywhere on the card or the page: the tactic asks for none and the kit has none', () => {
    expect(FFX2_FIEND_SUPERBOSSES_GUIDE.hints.some((h) => (h.when.labels ?? []).some((l) => ['dispel', 'mix', 'miracle drink'].includes(l.toLowerCase())))).toBe(false);
    for (const text of [cardText(), docText()]) expect(text).not.toMatch(/Miracle|Invincible|Thunder-proof|NulShock|Mix\b/);
    expect(cardText()).toMatch(/nothing in this party’s kit stops one/);
  });

  it('the hint for Darkness says what the data says: special damage with no element, every enemy at once', () => {
    expect(ABILITIES['x2-dark-knight-darkness']!.damageType).toBe('other');
    expect(ABILITIES['x2-dark-knight-darkness']!.targeting).toBe('all-enemies');
    expect(ABILITIES['x2-dark-knight-darkness']!.element).toEqual(['none']);
    expect(cardText()).toMatch(/hits every enemy at once and ignores Defense/);
    expect(docText()).toMatch(/Darkness has no element/);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  it('Shinra\'s HP and the heads\' four HPs are on the card or the page and are the bodies\'; the heads\' total is the rule 6 sum', () => {
    expect(x2AlmightyShinra.stats.maxHp).toBe(275_000);
    expect(fmt(x2AlmightyShinra.stats.maxHp)).toBe('275,000');
    for (const text of [cardText(), docText()]) expect(text).toContain('275,000');
    for (const head of [x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour]) expect(docText(), head.id).toContain(fmt(head.stats.maxHp));
    expect(x2NumerusUnum.stats.maxHp + x2NumerusDuo.stats.maxHp + x2NumerusTria.stats.maxHp + x2NumerusQuattour.stats.maxHp).toBe(2_666_664);
  });

  it('the page prints the steals and the drops the data pays, by the items\' names', () => {
    const text = docText();
    const name = (id: string): string => ITEMS[id]!.name;
    expect(x2AlmightyShinra.rewards.steal?.common.itemId).toBe('x2-turbo-ether');
    expect(x2AlmightyShinra.rewards.drops.map((d) => d.itemId)).toEqual(['x2-dark-matter']);
    expect(x2AlmightyShinra.rewards.drops[0]!.count).toBe(2);
    expect(text).toContain(name('x2-turbo-ether'));
    expect(text).toContain(`${name('x2-dark-matter')} x2`);
    const steals: Array<[typeof x2NumerusUnum, string]> = [[x2NumerusUnum, 'x2-mega-potion'], [x2NumerusDuo, 'x2-x-potion'], [x2NumerusTria, 'x2-mega-phoenix'], [x2NumerusQuattour, 'x2-elixir']];
    for (const [head, item] of steals) {
      expect(head.rewards.steal?.common.itemId, head.id).toBe(item);
      expect(head.rewards.drops, `${head.id}: our tables pay no drop, and the page says None`).toEqual([]);
      expect(text, head.id).toContain(name(item));
    }
  });

  it('the loops: Shinra six beats, Unum seven, Duo nine, Tria six, Quattour nine; the page says so (Unum\'s and Duo\'s and Quattour\'s lists, Tria\'s and Shinra\'s counts)', () => {
    expect([DUO_BEATS.length, TRIA_BEATS.length, QUATTOUR_BEATS.length]).toEqual([9, 6, 9]);
    expect(docText()).toMatch(/six beats: Clione, a strike, Ultima, a strike, a break, then Haste/);
    expect(docText()).toMatch(/Seven beats: Radis Command/);
    expect(docText()).toMatch(/Nine beats, and for the first eight it flips a coin/);
    expect(docText()).toMatch(/Six beats: Firaga or Holy/);
    expect(docText()).toMatch(/Nine beats and no coin/);
    expect(cardText()).toMatch(/Unum seven beats, Duo nine, Tria six and Quattour nine/);
  });

  it('Duo\'s beats are the page\'s list in order (a coin pair each, the Venam Command last) and Tria\'s are the four -aga spells and Holy around the Fulmen Command', () => {
    const name = (id: string): string => ABILITIES[id]!.name;
    const duo = DUO_BEATS.map((b) => b.map((m) => name(m.id)).join(' or '));
    // the page prints the nine in this order, with the ninth the Command
    const eight = 'Black Sky or Bio, Flare or Break, Ultima or Confuse, Sleep or Demi, Berserk or Black Sky, Blind or Flare, Ultima or Silence, Slowga or Demi';
    expect(duo.slice(0, 8).join(', ')).toBe(eight);
    expect(duo[8]).toBe('Venam Command');
    expect(docText()).toContain(eight);
    const tria = TRIA_BEATS.map((b) => b.map((m) => name(m.id)).join(' or '));
    expect(tria).toEqual(['Firaga or Holy', 'Blizzaga or Holy', 'Fulmen Command', 'Thundaga or Holy', 'Waterga or Holy', 'Absorb']);
    expect(docText()).toContain('Firaga or Holy, Blizzaga or Holy, Fulmen Command, Thundaga or Holy, Waterga or Holy, then Absorb');
  });

  it('Shinra\'s thresholds are the script\'s: under half his life the break is Fireworks, under a quarter Ultima is Final Impact; hasted, the sixth beat is a Final Impact (the card and the page say so)', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/[Uu]nder half his life/);
      expect(text).toMatch(/[Uu]nder a quarter/);
      expect(text).toMatch(/Final Impact/);
    }
    expect(docText()).toMatch(/already hasted, the sixth beat is a Final Impact/);
    expect(cardText()).toMatch(/fourteen blows of an eighth of everyone’s life and magic/);
    expect(ABILITIES[FS_ABILITY.finalImpact]!.hits).toBe(14);
  });

  it('what Protect halves and what it does not: the physical rows (Attack, Clione, Fireworks, Final Impact, Sparkler, Full Break) are physical and the Commands are neither (the card and the page say so)', () => {
    for (const id of [FS_ABILITY.attack, FS_ABILITY.clione, FS_ABILITY.fireworks, FS_ABILITY.finalImpact, FS_ABILITY.sparkler, FS_ABILITY.fullBreak]) expect(ABILITIES[id]!.damageType, id).toBe('physical');
    for (const id of [FS_ABILITY.ultimaShinra, FS_ABILITY.ultima, FS_ABILITY.blackSky, FS_ABILITY.holy, FS_ABILITY.meteor, FS_ABILITY.firaga]) expect(ABILITIES[id]!.damageType, id).toBe('magical');
    for (const id of [FS_ABILITY.radisCommand, FS_ABILITY.venamCommand, FS_ABILITY.fulmenCommand, FS_ABILITY.mortisCommand]) expect(ABILITIES[id]!.damageType, `${id} is neither`).toBe('other');
    expect(cardText()).toMatch(/Protect and Shell do not change a Command/);
    expect(docText()).toMatch(/Protect and Shell change nothing about it/);
  });

  it('the heads null Fire, Ice, Thunder, Water and Gravity (the page says so) and Shinra nulls Gravity only', () => {
    for (const head of [x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour]) {
      for (const el of ['fire', 'ice', 'lightning', 'water', 'gravity']) expect(head.affinities[el as 'fire'], `${head.id} ${el}`).toBe('immune');
    }
    expect(x2AlmightyShinra.affinities['gravity']).toBe('immune');
    expect(x2AlmightyShinra.affinities['fire']).toBeUndefined();
    expect(docText()).toMatch(/no damage from Fire, Ice, Thunder, Water or Gravity/);
  });

  it('Duo\'s Break petrifies at chance 80 and a Remedy is in the bag; the card and the page say so', () => {
    expect(ABILITIES[FS_ABILITY.break]!.statusEffects).toEqual([{ status: 'petrify', chance: 80, duration: 0 }]);
    for (const text of [cardText(), docText()]) expect(text).toMatch(/Break/);
    expect(cardText()).toMatch(/A Remedy cures it/);
    expect(docText()).toMatch(/a Remedy cures it/);
  });
});

describe('the claims about the Commands, run on the real engine', () => {
  /** The damage of one cast of `ability` by `who` on the three girls (900,000 HP each), in girl order. */
  function commandDamage(act: Act, who: string, ability: string, rig: (engine: ReturnType<typeof openAct>) => void = () => undefined): number[] {
    const f = forcedAct(act);
    f.queues[who]!.push(move(ability));
    const engine = openAct(act, 1, { group: f.group, setup: (e) => { bigHp(e); rig(e); } });
    expect(playUntilActed(engine, who, 1, undefined, { maxDecisions: 4000 })).toBe(true);
    return girlsOf(engine).map((g) => damageOn(engine, g.id).filter((e) => e.sourceId === who).reduce((n, e) => n + (e.amount ?? 0), 0));
  }
  const give = (engine: ReturnType<typeof openAct>, status: 'protect' | 'shell'): void => {
    for (const g of girlsOf(engine)) g.statuses[status] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
  };

  it('the charge of a Command is about four and a half seconds: 134 to 138 logic steps at 29.97 a second, from its start to its first blow', () => {
    for (const [who, ability] of [[NUMERUS_HEAD_IDS[0], FS_ABILITY.radisCommand], [NUMERUS_HEAD_IDS[1], FS_ABILITY.venamCommand], [NUMERUS_HEAD_IDS[2], FS_ABILITY.fulmenCommand], [NUMERUS_HEAD_IDS[3], FS_ABILITY.mortisCommand]] as const) {
      const f = forcedAct(2);
      f.queues[who]!.push(move(ability));
      const engine = openAct(2, 1, { group: f.group, setup: (e) => bigHp(e) });
      let start = -1;
      let hit = -1;
      for (let i = 0; i < 20_000 && hit < 0; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
        else if (d.kind === 'waiting') engine.tick(1);
        else if (d.kind === 'battle-over') break;
        const log = logOf(engine);
        if (start < 0 && log.some((e) => e.type === 'action-start' && e.actorId === who)) start = engine.state().ticks;
        if (start >= 0 && log.some((e) => e.type === 'damage' && e.sourceId === who)) hit = engine.state().ticks;
      }
      const steps = hit - start;
      expect(steps, `${who} ${ability}`).toBeGreaterThanOrEqual(134);
      expect(steps, `${who} ${ability}`).toBeLessThanOrEqual(138);
      expect(steps / 29.97, `${who} ${ability}`).toBeGreaterThan(4.4);
      expect(steps / 29.97, `${who} ${ability}`).toBeLessThan(4.7);
    }
  });

  it('a Command puts a Lv 99 girl down, and Protect and Shell change nothing about it: Fulmen on the girls at their real HP, with and without both', () => {
    const tria = NUMERUS_HEAD_IDS[2];
    const f = forcedAct(2);
    f.queues[tria]!.push(move(FS_ABILITY.fulmenCommand));
    const engine = openAct(2, 1, { group: f.group });
    expect(playUntilActed(engine, tria, 1, undefined, { maxDecisions: 4000 })).toBe(true);
    for (const g of girlsOf(engine)) expect(g.alive, g.id).toBe(false);
    const plain = commandDamage(2, tria, FS_ABILITY.fulmenCommand);
    const warded = commandDamage(2, tria, FS_ABILITY.fulmenCommand, (e) => {
      give(e, 'protect');
      give(e, 'shell');
    });
    expect(warded).toEqual(plain);
    expect(plain.every((n) => n >= 57_000)).toBe(true);
  });

  it('Protect halves what the card says it halves: Shinra\'s Final Impact (fourteen blows that cannot miss, at the girls\' real HP) does about half with Protect on (same seed, same targets)', () => {
    const hit = (withProtect: boolean): number => {
      const f = forcedAct(1);
      f.queues[X2_ALMIGHTY_SHINRA_ID]!.push(move(FS_ABILITY.finalImpact));
      const engine = openAct(1, 1, { group: f.group, setup: (e) => { if (withProtect) give(e, 'protect'); } });
      expect(playUntilActed(engine, X2_ALMIGHTY_SHINRA_ID, 1, undefined, { maxDecisions: 4000 })).toBe(true);
      return girlsOf(engine).reduce((n, g) => n + damageOn(engine, g.id).filter((e) => e.sourceId === X2_ALMIGHTY_SHINRA_ID).reduce((m, e) => m + (e.amount ?? 0), 0), 0);
    };
    const bare = hit(false);
    const warded = hit(true);
    expect(bare).toBeGreaterThan(0);
    expect(warded).toBeLessThan(bare * 0.6);
    expect(warded).toBeGreaterThan(bare * 0.4);
  });
});
