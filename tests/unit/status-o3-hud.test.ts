// @vitest-environment jsdom
/**
 * Status display O3 (Bailey's pick, 2026-09-29): the HUD rows (O2), and the tap (O1 marks and
 * tints, O3 message line and Zombie forecast) **driven by a real engine** (AGENTS.md rule 3): a
 * Chapter I battle played by the guide's own line, its events piped through `withStatusLooks` the
 * way the presenter pipes them. Presentation only (rule 1): the tap never writes the state.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEvent, BattleState, Command, CombatantId, Decision, FFX2Combatant, FFXCombatant, TurnPreview } from '../../src/battle/common/types.ts';
import type { HudPort as Hud } from '../../src/engine/HudPort.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { registerFFXAbilities, registerFFXItems } from '../../src/battle/ffx/registry.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { isPhysicalAction } from '../../src/engine/EnemyActionPose.ts';
import { abilityFactsFor } from '../../src/app/screens/battleAbilityFacts.ts';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { CtbList } from '../../src/ui/ffx/CtbList.ts';
import { partyRowHtml } from '../../src/ui/ffx2/PartyRows.ts';
import { enemyGaugesHtml } from '../../src/ui/ffx2/BossGauges.ts';
import { withStatusLooks, type StatusLooksApi } from '../../src/ui/common/withStatusLooks.ts';
import { StatusFigureTint } from '../../src/ui/common/statusFigureTint.ts';
import { zombieForecasts, forecastHtml, zombieWarningHtml } from '../../src/ui/ffx/statusRailsFfx.ts';
import { noteHtml } from '../../src/ui/ffx/targetCursorParts.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));
beforeAll(() => {
  registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
});

type Input = Extract<Decision, { kind: 'player-input' }>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** A fake painted figure: records its tint, carries the painted planes' flash cells. */
function fakeFigure() {
  const cells = { flashAmount: { value: 0 }, flashFloorCut: { value: 0 }, flashColor: { value: { hex: 0, set(c: number) { this.hex = c; } } } };
  const fig = {
    tint: 0xffffff as number | string,
    clock: 0,
    setTint(c: number | string) { this.tint = c; },
    update(dt: number) { this.clock += dt; },
    traverse(fn: (o: unknown) => void) { fn({ material: { uniforms: cells } }); },
    cells,
  };
  return fig;
}
type Fig = ReturnType<typeof fakeFigure>;

/** The smallest HUD a tap can wrap: a root element and no-op ports. */
function stubHud(): Hud {
  let el: HTMLElement | null = null;
  return {
    mount(root: HTMLElement) {
      el = document.createElement('div');
      el.dataset['role'] = 'ffx-hud';
      el.innerHTML = '<div class="ffxhud__stage"></div>';
      root.appendChild(el);
    },
    unmount() { el?.remove(); },
    sync() {},
    onEvent() {},
    async chooseCommand() { return { kind: 'defend', targets: [] } as Command; },
    setProjector() {},
    setVisible() {},
    update() {},
  } as unknown as Hud;
}

describe('O2: the HUD rows replace the old pips and chips', () => {
  const kimahri = {
    id: 'kimahri', name: 'Kimahri', side: 'party', alive: true, removed: false, hp: 840, mp: 130, flags: {},
    stats: { maxHp: 2310, maxMp: 130 }, overdrive: { gauge: 40 },
    statuses: { zombie: { id: 'zombie' }, poison: { id: 'poison' }, protect: { id: 'protect' } },
  } as unknown as FFXCombatant;

  it('FFX party plate: round medallions, most alarming first, red rim on Zombie; no old pips', () => {
    const win = new PartyStatusWindow();
    win.render(['kimahri'], { kimahri } as never, null);
    const row = win.el.querySelector('[data-actor="kimahri"] .ffx-stat__statuses.sti-row')!;
    expect([...row.querySelectorAll('.sti')].map((e) => e.getAttribute('data-status'))).toEqual(['zombie', 'poison', 'protect']);
    expect(row.querySelector('[data-status="zombie"]')!.className).toMatch(/sti--round sti--harm/);
    expect(row.querySelector('[data-status="protect"]')!.className).toMatch(/sti--help/);
    expect(win.el.querySelectorAll('.ffx-stat__statuses > i').length).toBe(0);
  });

  it('FFX party plate: ASLEEP where Sleep takes the command; a KO\'d member shows no icons', () => {
    const win = new PartyStatusWindow();
    const asleep = { ...kimahri, statuses: { sleep: { id: 'sleep' } } };
    const ko = { ...kimahri, id: 'yuna', alive: false, hp: 0 };
    win.render(['kimahri', 'yuna'], { kimahri: asleep, yuna: ko } as never, null);
    expect(win.el.querySelector('[data-actor="kimahri"] .stcap')?.textContent).toBe('ASLEEP');
    expect(win.el.querySelector('[data-actor="yuna"] .sti')).toBeNull();
  });

  it('FFX turn list: medallions beside each unit\'s first row only', () => {
    const list = new CtbList();
    const seymour = { ...kimahri, id: 'seymour-flux', name: 'Seymour Flux', side: 'enemy', statuses: { shell: { id: 'shell' }, reflect: { id: 'reflect' } } };
    const preview = [
      { actorId: 'seymour-flux', tickValue: 0, index: 0, isParty: false, statusIcons: [], overdriveReady: false },
      { actorId: 'kimahri', tickValue: 10, index: 1, isParty: true, statusIcons: [], overdriveReady: false },
      { actorId: 'seymour-flux', tickValue: 20, index: 2, isParty: false, statusIcons: [], overdriveReady: false },
    ] as unknown as TurnPreview[];
    list.render(preview, { kimahri, 'seymour-flux': seymour } as never);
    const rows = [...list.el.querySelectorAll('.ig-ctb__row')];
    const ids = rows.map((r) => [...r.querySelectorAll('.sti')].map((e) => e.getAttribute('data-status')));
    expect(ids).toEqual([['shell', 'reflect'], ['zombie', 'poison', 'protect'], []]);
    expect(list.el.querySelector('.ffx-ctb-statuses > i')).toBeNull();
  });

  const girl = (id: string, statuses: Record<string, unknown>): FFX2Combatant => ({
    id, name: id[0]!.toUpperCase() + id.slice(1), side: 'party', alive: true, removed: false, hp: 690, mp: 126, flags: {},
    stats: { maxHp: 690, maxMp: 130 }, dresspheres: { current: 'white-mage' }, statuses,
  }) as unknown as FFX2Combatant;

  it('FFX-2 party row: square tags in place of the text chips; ASLEEP under the name', () => {
    const host = document.createElement('div');
    host.innerHTML = partyRowHtml(girl('yuna', { sleep: { id: 'sleep' } }), null, { actingId: null, index: 0 });
    expect(host.querySelector('.ffx2-status-chip')).toBeNull();
    expect(host.querySelector('.ffx2party__tags .sti--tag.sti--harm')?.getAttribute('data-status')).toBe('sleep');
    expect(host.querySelector('.stcap')?.textContent).toBe('ASLEEP');
    host.innerHTML = partyRowHtml(girl('rikku', { silence: { id: 'silence' }, poison: { id: 'poison' } }), null, { actingId: null, index: 1 });
    expect([...host.querySelectorAll('.sti')].map((e) => e.getAttribute('data-status'))).toEqual(['poison', 'silence']);
    expect(host.querySelector('.stcap')).toBeNull(); // Silence seals part of the menu: the guide says it
  });

  it('FFX-2 boss: a STATUS tab under the bar, with Doom\'s count when the engine carries one', () => {
    const bahamut = { ...girl('bahamut', { doom: { id: 'doom', turnsRemaining: null, charges: 3 } }), side: 'enemy', stats: { maxHp: 99999, maxMp: 0 } };
    const state = { enemyIds: ['bahamut'], combatants: { bahamut } } as unknown as BattleState;
    const host = document.createElement('div');
    host.innerHTML = enemyGaugesHtml(state, { bars: [] } as never, { revealed: new Set(), charging: new Map() });
    expect(host.querySelector('.ststab .ststab__label')?.textContent).toBe('STATUS');
    expect(host.querySelector('.ststab [data-status="doom"] .sti__n')?.textContent).toBe('3');
  });

  it('FFX\'s target plate: a Zombie note becomes a red ZOMBIE tag, its words kept in the title', () => {
    expect(noteHtml('Zombie: 1,000 damage')).toMatch(/ffx-target__note--harm" title="Zombie: 1,000 damage"><span>ZOMBIE</);
    expect(noteHtml('Doom 3')).toMatch(/<span>DOOM 3</);
    expect(noteHtml('Immune')).toBe('<span class="ffx-target__note">Immune</span>');
  });
});

/** Chapter I, played by the guide's line; every event batch goes through the tap. */
function playChapterOne(hud: Hud, api: StatusLooksApi, seed: number, onBoard?: (s: BattleState, d: Input) => boolean): { messages: string[]; shields: number; lands: BattleEvent[] } {
  const chapter = getChapter('seymour-flux')!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
  const messages: string[] = [];
  const lands: BattleEvent[] = [];
  let shields = 0;
  const feed = (events: BattleEvent[]): void => {
    hud.sync(engine.state() as BattleState, []);
    for (const e of events) {
      const before = document.querySelectorAll('.stm-shield').length;
      hud.onEvent(e);
      shields += document.querySelectorAll('.stm-shield').length - before;
      if (e.type === 'status-add') lands.push(e);
      const t = api.message.text;
      if (t && messages[messages.length - 1] !== t) messages.push(t);
      hud.update?.(0.4);
      const t2 = api.message.text;
      if (t2 && messages[messages.length - 1] !== t2) messages.push(t2);
    }
  };
  for (let i = 0; i < 300; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') { feed(d.events); continue; }
    if (d.kind !== 'player-input') continue;
    const state = engine.state() as BattleState;
    if (onBoard?.(state, d)) break;
    if (state.turn > 30) break;
    feed(engine.submit(recommendedCommand(state, d) ?? ({ kind: 'defend', targets: [] } as Command)));
  }
  return { messages, shields, lands };
}

describe('O1 + O3 on a real Chapter I battle (FFX only)', () => {
  it('the message line speaks each status as it lands; Protect flashes its shield on physical hits', () => {
    const figs = new Map<CombatantId, Fig>();
    const field = {
      actor: (id: CombatantId) => { if (!figs.has(id)) figs.set(id, fakeFigure()); return figs.get(id)!; },
      project: () => ({ x: 400, y: 300 }),
      projectRect: () => ({ x: 380, y: 280, w: 100, h: 261 }),
    };
    const facts = abilityFactsFor('ffx');
    const hud = withStatusLooks(stubHud(), 'ffx', () => field as never, (id) => isPhysicalAction(facts(id)));
    const root = document.createElement('div');
    document.body.appendChild(root);
    hud.mount(root);
    const api = (hud as Hud & { statusLooks: StatusLooksApi }).statusLooks;
    let zombieBoard: BattleState | null = null;
    const run = playChapterOne(hud, api, 1, (s) => {
      const k = s.combatants['kimahri'];
      if (k?.alive && (k.statuses as Record<string, unknown>)['zombie'] && !zombieBoard) zombieBoard = clone(s);
      return false;
    });
    // Every status that landed and has words produced its line (merged when several land at once).
    expect(run.lands.length).toBeGreaterThan(0);
    if (run.lands.some((e) => e.type === 'status-add' && e.status === 'zombie' && e.targetId === 'kimahri')) {
      expect(run.messages).toContain('Kimahri became a Zombie.');
    }
    console.info(`[status-o3] seed 1: ${run.lands.length} statuses landed, ${run.shields} Protect shields; lines: ${run.messages.join(' | ')}`);
    // Mighty Guard puts Protect on the party; the enemies' physical blows then meet it.
    expect(run.shields).toBeGreaterThan(0);
    // The tint layer painted Kimahri green while he was a Zombie (the tint is the figure's own control).
    hud.unmount();
    for (const f of figs.values()) expect(f.tint).toBe(0xffffff); // released on unmount
  });

  it('the Zombie forecast is the engine\'s own number: a Hi-Potion hurts Kimahri for 1000, a Phoenix Down KOs him', () => {
    let board: { state: BattleState; d: Input } | null = null;
    const hud = withStatusLooks(stubHud(), 'ffx', () => null);
    const api = (hud as Hud & { statusLooks: StatusLooksApi }).statusLooks;
    for (let seed = 1; seed <= 60 && !board; seed++) {
      playChapterOne(hud, api, seed, (s, d) => {
        const k = s.combatants['kimahri'];
        if (k?.alive && (k.statuses as Record<string, unknown>)['zombie'] && d.actorId !== 'kimahri') { board = { state: clone(s), d }; return true; }
        return false;
      });
    }
    expect(board, 'a seed that zombifies Kimahri').not.toBeNull();
    const { state, d } = board!;
    const before = JSON.stringify(state);
    const hi = d.commands.find((c) => c.label === 'Hi-Potion') as AvailableCommand;
    state.combatants['kimahri']!.hp = 840; // the mockup's moment
    const [f] = zombieForecasts(state, d.actorId, hi, ['kimahri']);
    expect(f).toMatchObject({ id: 'kimahri', amount: 1000, kills: true, hp: 840 });
    expect(forecastHtml(f!, hi)).toMatch(/HI-POTION ON A ZOMBIE.*−1000.*KO/);
    expect(zombieWarningHtml(f!, hi)).toBe('<b>Kimahri is a Zombie.</b> A Hi-Potion hurts him for 1000, and he has 840 HP left: it would KO him.');
    const pd = d.commands.find((c) => c.label === 'Phoenix Down') as AvailableCommand;
    const [k] = zombieForecasts(state, d.actorId, pd, ['kimahri']);
    expect(k?.kills).toBe(true);
    // A non-Zombie target gets no forecast; the preview never wrote the board (rule 1).
    expect(zombieForecasts(state, d.actorId, hi, ['tidus'])).toEqual([]);
    state.combatants['kimahri']!.hp = JSON.parse(before).combatants.kimahri.hp;
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('FFX-2 Stop freezes the figure, and never across an action that names it', () => {
  it('the figure\'s clock stands still under Stop, runs inside an action, and runs again when Stop ends', () => {
    const fig = fakeFigure();
    const tint = new StatusFigureTint('ffx2', () => ({ actor: () => fig }));
    const state = (statuses: Record<string, unknown>) => ({ result: null, combatants: { paine: { alive: true, removed: false, flags: {}, statuses } } }) as unknown as BattleState;
    tint.sync(state({ stop: { id: 'stop' } }));
    fig.update(1);
    expect(fig.clock).toBe(0);
    tint.setActing(['paine']);
    fig.update(1);
    expect(fig.clock).toBe(1);
    tint.setActing(null);
    tint.touch('paine'); // a hit lands: it thaws long enough to react
    fig.update(1);
    expect(fig.clock).toBe(2);
    tint.sync(state({}));
    fig.update(5);
    expect(fig.clock).toBe(7);
  });

  it('FFX never freezes (Stop is not an FFX status); FFX-2 Curse darkens; release restores the figure', () => {
    const fig = fakeFigure();
    const ffx = new StatusFigureTint('ffx', () => ({ actor: () => fig }));
    ffx.sync({ result: null, combatants: { a: { alive: true, removed: false, flags: {}, statuses: { stop: {} } } } } as unknown as BattleState);
    fig.update(1);
    expect(fig.clock).toBe(1);
    const x2 = new StatusFigureTint('ffx2', () => ({ actor: () => fig }));
    x2.sync({ result: null, combatants: { a: { alive: true, removed: false, flags: {}, statuses: { curse: {} } } } } as unknown as BattleState);
    expect(fig.tint).not.toBe(0xffffff);
    x2.dispose();
    expect(fig.tint).toBe(0xffffff);
  });
});
