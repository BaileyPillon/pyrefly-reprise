/**
 * Cuts one fight-start run (the marks of `fight-start-instrument.mjs`) into its parts (post-conference lane "post-fight-start", PR-0481; both games; pure: no DOM, no browser, no clock).
 *
 * The parts follow one another from the press to the first command menu, each named for what the screen is doing in it:
 *
 *   press-wait    the press has been made and nothing has changed on the screen yet (the board is still up, or the flow is between screens)
 *   party-prep    the prep menu (select path)
 *   after-prep    prep is gone, the next screen is not up
 *   scene         the pre-battle scene (select path) or the short voiced intro (demo, Chapter I): authored time, to the script's last step
 *   after-scene   the script has ended and the entry has not begun: a held frame
 *   entry-load    the entry transition is up (the crack, the swirl) and the battle screen loads under it, to the presenter being built (the presenter's mark is read a frame late, or a task late)
 *   first-draw    the presenter exists; the battle's last awaits (the first draw of the field with its figures) run, to the battle's own card
 *   card          the boss card holds (authored: 1.9 s, 0.7 s hurried; shorter when the card over the entry has been up as long as its hold)
 *   card-to-sweep the card is gone and the opening has not begun
 *   sweep         the opening: the party walks on, the boss is revealed (authored)
 *   sweep-to-menu the opening is over and the first menu is not yet up (the first turn's cut-in)
 *
 * `deadMs` is the sum of the parts that are waits and not authored content: press-wait, after-prep, after-scene, card-to-sweep. `loadMs` is entry-load plus first-draw (what the battle needs before its card can
 * go up). `authoredMs` is scene, card, sweep and sweep-to-menu. The entry overlay's own span and the loading card's are reported apart (they overlap the load and the card), and `facts.frozenMs` is the
 * longest task that starts inside the entry-load part (the frame the entry's animation cannot draw).
 *
 * The exact marks (`entry-add`, `loadcard-add`, `bosscard-add`, `push`, `pop`, taken at the call) are used where the run has them; a run from the first draft of the instrument (frame-polled `entry`,
 * `loadcard`, `bosscard`, `screen`) is read through those, a frame or a long task late.
 */

const round = (n) => Math.round(n);

/** @typedef {{ t: number, k: string, v: unknown }} Mark */

/** The first mark of `k` at or after `from` whose value passes `test`. */
function firstAfter(marks, k, from, test = () => true) {
  return marks.find((m) => m.k === k && m.t >= from && test(m.v)) ?? null;
}

/**
 * @param {{ marks: Mark[], gaps: Array<[number, number]>, long?: Array<[number, number]>, warm?: Array<{ ms: number, what: string }> | null }} ft
 * @returns {{ totalMs: number, parts: Array<{ name: string, startMs: number, endMs: number, ms: number }>, deadMs: number, loadMs: number, authoredMs: number, facts: Record<string, number | null>, warm: { before: string[], after: Array<{ atMs: number, what: string }> }, worstGapMs: number, gapsOver100: number, gapsOver250: number, lostMs: number, lostFirst9sMs: number }}
 */
export function splitTimeline(ft) {
  const marks = ft.marks;
  const press = marks.find((m) => m.k === 'press');
  const menu = press ? firstAfter(marks, 'menu', press.t, (v) => Boolean(v)) : null;
  if (!press || !menu) return { totalMs: 0, parts: [], deadMs: 0, loadMs: 0, authoredMs: 0, facts: {}, warm: { before: [], after: [] }, worstGapMs: 0, gapsOver100: 0, gapsOver250: 0, lostMs: 0, lostFirst9sMs: 0 };
  const t0 = press.t;
  const t1 = menu.t;
  const rel = (m) => (m ? m.t - t0 : null);

  // the screens, from the stack calls where the run has them, else from the frame-polled name
  const pushes = marks.filter((m) => m.k === 'push' && m.t >= t0 && m.t <= t1);
  const polled = marks.filter((m) => m.k === 'screen' && m.t >= t0 && m.t <= t1);
  const exact = pushes.length > 0;
  const screenOn = (name) => (exact ? pushes : polled).find((m) => (exact ? m.v === name : m.v === name)) ?? null;
  const screenOff = (name, on) => {
    if (!on) return null;
    if (exact) return marks.find((m) => m.k === 'pop' && m.v === name && m.t >= on.t) ?? pushes.find((m) => m.t > on.t && m.v !== name) ?? null;
    return polled.find((m) => m.t > on.t && m.v !== name) ?? null;
  };
  const prepOn = screenOn('party-prep');
  const prepOff = screenOff('party-prep', prepOn);
  const sceneOn = screenOn('cutscene');
  const sceneDone = sceneOn ? firstAfter(marks, 'scene-finished', sceneOn.t, (v) => v === true) : null;
  const battleOn = screenOn('battle');

  const entryOn = firstAfter(marks, 'entry-add', t0) ?? firstAfter(marks, 'entry', t0, (v) => typeof v === 'string' && v !== '');
  const entryOff = entryOn ? firstAfter(marks, 'entry-remove', entryOn.t) ?? firstAfter(marks, 'entry', entryOn.t, (v) => v === '') : null;
  const loadOn = firstAfter(marks, 'loadcard-add', t0) ?? firstAfter(marks, 'loadcard', t0, (v) => v === true);
  const loadOff = loadOn ? firstAfter(marks, 'loadcard-remove', loadOn.t) ?? firstAfter(marks, 'loadcard', loadOn.t, (v) => v === false) : null;
  const presenterUp = firstAfter(marks, 'phase', t0);
  const cardOn = firstAfter(marks, 'bosscard-add', t0) ?? firstAfter(marks, 'bosscard', t0, (v) => v === 'on');
  const cardOff = cardOn ? firstAfter(marks, 'bosscard-remove', cardOn.t) ?? firstAfter(marks, 'bosscard', cardOn.t, (v) => v === '') : null;
  const sweepOn = firstAfter(marks, 'phase', t0, (v) => v === 'moment:battle-start');
  const sweepOff = sweepOn ? firstAfter(marks, 'phase', sweepOn.t, (v) => v !== 'moment:battle-start') : null;

  /** Breakpoints in time order: the interval that starts at each is named for it. */
  const raw = [
    { at: 0, name: 'press-wait' },
    prepOn && { at: rel(prepOn), name: 'party-prep' },
    prepOff && { at: rel(prepOff), name: 'after-prep' },
    sceneOn && { at: rel(sceneOn), name: 'scene' },
    sceneDone && { at: rel(sceneDone), name: 'after-scene' },
    entryOn && { at: rel(entryOn), name: 'entry-load' },
    presenterUp && { at: rel(presenterUp), name: 'first-draw' },
    cardOn && { at: rel(cardOn), name: 'card' },
    cardOff && { at: rel(cardOff), name: 'card-to-sweep' },
    sweepOn && { at: rel(sweepOn), name: 'sweep' },
    sweepOff && { at: rel(sweepOff), name: 'sweep-to-menu' },
  ].filter(Boolean).filter((b) => b.at >= 0 && b.at <= t1 - t0).sort((a, b) => a.at - b.at);
  // a part that would start where the next one does has no time and is not listed (an entry that opens the moment the scene ends has no held frame)
  const parts = [];
  for (let i = 0; i < raw.length; i++) {
    const start = raw[i].at;
    const end = i + 1 < raw.length ? raw[i + 1].at : t1 - t0;
    if (end - start < 0.5) continue;
    parts.push({ name: raw[i].name, startMs: round(start), endMs: round(end), ms: round(end - start) });
  }
  const sum = (names) => parts.filter((p) => names.includes(p.name)).reduce((a, p) => a + p.ms, 0);

  const within = ft.gaps.filter(([t]) => t >= t0 && t <= t1);
  const lost = (list) => list.reduce((a, [, g]) => a + Math.max(0, g - 16.7), 0);
  // the longest task that starts while the entry is up and the battle loads: the frame the entry's own animation cannot draw
  const loadStart = entryOn ? entryOn.t : t0;
  const loadEnd = cardOn ? cardOn.t : t1;
  const frozen = (ft.long ?? []).filter(([t]) => t >= loadStart - 5 && t <= loadEnd).reduce((a, [, d]) => Math.max(a, d), 0);
  return {
    totalMs: round(t1 - t0),
    parts,
    deadMs: sum(['press-wait', 'after-prep', 'after-scene', 'card-to-sweep']),
    loadMs: sum(['entry-load', 'first-draw']),
    authoredMs: sum(['scene', 'card', 'sweep', 'sweep-to-menu']),
    facts: {
      screenBattleMs: battleOn ? round(rel(battleOn)) : null,
      entryOnMs: entryOn ? round(rel(entryOn)) : null,
      entryMs: entryOn && entryOff ? round(entryOff.t - entryOn.t) : null,
      loadCardOnMs: loadOn ? round(rel(loadOn)) : null,
      loadCardMs: loadOn && loadOff ? round(loadOff.t - loadOn.t) : null,
      presenterUpMs: presenterUp ? round(rel(presenterUp)) : null,
      cardOnMs: cardOn ? round(rel(cardOn)) : null,
      cardMs: cardOn && cardOff ? round(cardOff.t - cardOn.t) : null,
      /** how long the card over the entry had been up when the battle's own card went on (its hold is counted from here, `loadingCard.ts`) */
      loadCardUpAtCardMs: loadOn && cardOn ? round(cardOn.t - loadOn.t) : null,
      sweepMs: sweepOn && sweepOff ? round(sweepOff.t - sweepOn.t) : null,
      frozenMs: frozen ? round(frozen) : null,
    },
    warm: {
      before: (ft.warm ?? []).filter((w) => w.ms <= t0).map((w) => w.what), // the steps of the demo warm done before the press
      after: (ft.warm ?? []).filter((w) => w.ms > t0).map((w) => ({ atMs: round(w.ms - t0), what: w.what })), // and those that ended after it (a step in flight at the press)
    },
    worstGapMs: round(within.reduce((a, [, g]) => Math.max(a, g), 0)),
    gapsOver100: within.filter(([, g]) => g > 100).length,
    gapsOver250: within.filter(([, g]) => g > 250).length,
    lostMs: round(lost(within)),
    lostFirst9sMs: round(lost(within.filter(([t]) => t - t0 <= 9000))),
  };
}
