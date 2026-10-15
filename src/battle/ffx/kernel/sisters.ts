/**
 * The Magus Sisters: the standing order, the chance test, motivation and the gauge changes, the menu builders and the Combine powers
 * gate (re-parity lane FFX-K, row K4; **FFX only**).
 *
 * **Game case: FFX only** (FFX-2 has no aeons in this sense). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; note
 * `FFX-G08` sections 2, 6.1 to 6.4 and 6.6 (our words here). The Sisters' orders and menus are battle-script events (workers 60, 61 and 62
 * of the system script); the exe supplies small pieces. What is proven against the game:
 *
 * | Function here | VA / script | Proof |
 * |---|---|---|
 * | {@link magusRoll} | 0x007a3300 (+0x7a8ad0), script call 0x70F3 | machine code, 60,000 vectors |
 * | {@link storeStandingOrder} | 0x007a3420 / 0x007a3440 | machine code, 3,000 |
 * | {@link increaseMotivation} | 0x007a3a10 (0x70FD) | machine code, 20,000 |
 * | {@link setMotivationChange} | 0x007a3b80 (0x70FE) | machine code, 20,000 |
 * | {@link positiveCaseTest} | 0x0078bf50 | machine code, 30,000 |
 * | {@link afterAction} | 0x007afb60 `pp_BtlOdAfterAction` | machine code, 50,000 |
 * | {@link sisterMenu} | workers 60 to 62, function 2 (event 12) | the game's script VM, 9,000 runs |
 *
 * Together 183,000 machine-code vectors and 9,000 VM runs, 0 mismatches (`tests/unit/parity-ffx-sisters.test.ts` replays stratified
 * subsets of them from `tests/fixtures/parity/ffx/sisters_natives.json` and `sisters_menu.json`). The joint-action counters of the Delta Attack are
 * `./aeon-stats.ts#summonCtb`, replayed from `joint_ctb.json` (4,000 vectors).
 *
 * **Read only, not run** (the note's label [R]; nothing proves it against the game): {@link combineParticipant}, the count behind the menu's
 * Combine powers test (property 282, from the getter's decompile), and {@link combineEvent}, the Combine powers handler (note 6.6, the
 * chance and the motivation changes). The other orders' handlers (6.5) are NOT here: their target searches use filters nobody has decoded
 * (note, open question 5), so no number of theirs is taken from this note.
 *
 * Pure and deterministic (AGENTS.md rule 1): draws are callbacks; nothing here imports the DOM, `three` or the engine.
 */

/** The random stream every Magus Sisters draw uses (`RollMagusRandom` and the menu builders). */
export const MAGUS_STREAM = 18;

/** The three Sisters' character numbers. */
export const SISTER_CINDY = 0xf;
export const SISTER_SANDY = 0x10;
export const SISTER_MINDY = 0x11;

/** The eight order commands. */
export const SisterOrder = {
  /** Free choice (clears the standing order). */
  Free: 0x3124,
  /** Repeat the last command (offered from the second turn). */
  Repeat: 0x3125,
  /** The attack order: her own special first, then Attack. */
  Attack: 0x3126,
  /** Cindy only: heal, drain and the big spells. */
  CindyBig: 0x3127,
  /** Cindy only: revive and support. */
  CindySupport: 0x3128,
  /** Combine powers: the Delta Attack. */
  Combine: 0x3129,
  /** Sandy only: Shell, Protect, Haste, NulAll and the Cure family. */
  SandySupport: 0x312a,
  /** Mindy only: drain-type. */
  MindyDrain: 0x312b,
} as const;

/** The rest command a sister performs on herself when nothing in her list was taken. */
export const SISTER_REST = 0x312c;
/** The Delta Attack, the joint action. */
export const DELTA_ATTACK = 0x30ea;
/** The Dismiss every sister's menu ends with. */
export const SISTER_DISMISS = 0x3056;
/** Each sister's own special (Camisade, Razzia, Passado). */
export const SISTER_SPECIAL: Readonly<Record<number, number>> = { [SISTER_CINDY]: 0x30e5, [SISTER_SANDY]: 0x30e7, [SISTER_MINDY]: 0x30e9 };

/** A signed byte. */
const s8 = (v: number): number => ((v & 0xff) ^ 0x80) - 0x80;
/** A signed 32-bit integer. */
const s32 = (v: number): number => v | 0;
/** C integer division (truncates toward zero). */
const tdiv = (a: number, b: number): number => Math.trunc(a / b);
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

// ---------------------------------------------------------------------------
// The standing order and the chance test
// ---------------------------------------------------------------------------

/**
 * The standing order is a command id stored as 16 bits (`0x01136410`): the store keeps the low 16 bits of its argument, the load
 * zero-extends them (0x007a3420 / 0x007a3440).
 */
export function storeStandingOrder(value: number): number {
  return value & 0xffff;
}

/**
 * `RollMagusRandom(a, b)` (0x007a3300): with `b < 0` it is true without a draw. If `a` is 0 or no order stands it draws once (stream 18)
 * and is true when `(draw & 0xFF) < b`. If an order stands and `a` is not 0 it is true exactly when `a` equals the order (the whole
 * 32-bit `a` against the 16-bit order), false for every other command, and no draw is taken. In a target search the script passes the
 * candidate command as `a`; with `a = 0` (the menu builders) it is always a plain roll.
 */
export function magusRoll(a: number, b: number, order: number, draw: () => number): { value: 0 | 1; drew: boolean } {
  if (s32(b) < 0) return { value: 1, drew: false };
  if (a >>> 0 === 0 || order === 0) return { value: (draw() & 0xff) < s32(b) ? 1 : 0, drew: true };
  return { value: a >>> 0 === order ? 1 : 0, drew: false };
}

// ---------------------------------------------------------------------------
// Motivation and the gauge
// ---------------------------------------------------------------------------

/**
 * The bytes of one sister's character structure that the motivation machinery reads and writes: `Chr+0x6e1` (motivation, 0..100),
 * `Chr+0x5bc` / `+0x5bd` (her own Overdrive gauge and its maximum, 20 for an aeon), the two flags `+0x714` / `+0x715` and the four signed
 * change bytes `+0x726..+0x729`. All are bytes; the gauge and the motivation are unsigned, the changes signed.
 */
export interface MagusChr {
  motivation: number;
  gauge: number;
  gaugeMax: number;
  /** `+0x714`: a pair of changes is waiting to be applied. */
  f714: number;
  /** `+0x715`: the positive case (the action had an effect); bit 0 chooses the column. */
  f715: number;
  /** `+0x726`, `+0x727`: the motivation change (negative case, positive case). */
  b726: number;
  b727: number;
  /** `+0x728`, `+0x729`: the gauge change (negative case, positive case). */
  b728: number;
  b729: number;
}

/** A sister with no change waiting, at the given gauge and motivation. */
export function newMagusChr(motivation: number, gauge: number, gaugeMax: number): MagusChr {
  return { motivation, gauge, gaugeMax, f714: 0, f715: 0, b726: 0, b727: 0, b728: 0, b729: 0 };
}

/**
 * `increaseMagusMotivationAndOverdrive(gauge, motivation)` (0x007a3a10, script call 0x70FD): only while no order stands, it writes the
 * same pair into both columns, sets `+0x714` and clears `+0x715`. (The community's call labels put the two arguments the other way round.)
 */
export function increaseMotivation(c: MagusChr, order: number, gaugeChange: number, motivationChange: number): void {
  if (order !== 0) return;
  c.f714 = 1;
  c.f715 = 0;
  c.b726 = c.b727 = motivationChange & 0xff;
  c.b728 = c.b729 = gaugeChange & 0xff;
}

/**
 * `setMagusMotivationAndOverdriveChangeInPositiveOrNegativeCase(gaugePos, motivationPos, gaugeNeg, motivationNeg)` (0x007a3b80, call
 * 0x70FE): always writes the two columns separately, sets `+0x714` and clears `+0x715`.
 */
export function setMotivationChange(c: MagusChr, gaugePos: number, motivationPos: number, gaugeNeg: number, motivationNeg: number): void {
  c.f714 = 1;
  c.f715 = 0;
  c.b726 = motivationNeg & 0xff;
  c.b727 = motivationPos & 0xff;
  c.b728 = gaugeNeg & 0xff;
  c.b729 = gaugePos & 0xff;
}

/**
 * The positive-case test (0x0078bf50, called by the hit calculation): raises `+0x715` to 1 when the action had a real effect, a damage
 * command with any of its three result numbers above 0, or a healing command (bit 0x10 of the command's flag byte `Cmd+0x20`) with any
 * below 0; `force` makes it always 1. The byte is only ever raised, never cleared here. Returns the test's result (1 or 0).
 */
export function positiveCaseTest(c: MagusChr, commandFlags: number, results: readonly [number, number, number], force: number): number {
  const heal = (commandFlags & 0x10) !== 0;
  const pos = results.some((v) => (heal ? s32(v) < 0 : s32(v) > 0));
  if (force !== 0) {
    c.f715 = 1;
    return 1;
  }
  if (pos) c.f715 = 1;
  return pos ? 1 : 0;
}

/**
 * `pp_BtlOdAfterAction` (0x007afb60), run after every finished action of the character: when a pair is waiting (`+0x714`) the gauge and
 * the motivation change by the signed bytes the positive-case flag selects (`+0x715` bit 0: 0 uses `+0x726` / `+0x728`, 1 uses `+0x727` /
 * `+0x729`); the gauge is clamped to 0..its maximum and the motivation to 0..100. The pair stays set (nothing but a setter clears `+0x714`).
 */
export function afterAction(c: MagusChr): void {
  if (c.f714 === 0) return;
  const idx = c.f715 & 1;
  c.gauge = clamp(s8(idx === 0 ? c.b728 : c.b729) + c.gauge, 0, c.gaugeMax);
  c.motivation = clamp(s8(idx === 0 ? c.b726 : c.b727) + c.motivation, 0, 100);
}

// ---------------------------------------------------------------------------
// The menu (event 12)
// ---------------------------------------------------------------------------

/** What the menu builder reads: the sister's own facts and two sums over the front line. */
export interface SisterMenuState {
  /** The developer start (a debug byte): offers her own special first. 0 in normal play. */
  debug: number;
  /** Turns (parsed actions) she has taken: the repeat order is offered when it is above 0. */
  turns: number;
  /** Her motivation. */
  motivation: number;
  /** Her own HP, MP and their maxima (Mindy's tests). */
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  /** Property 281 over the front line: how many have HP below half of the maximum (Sandy's test). */
  nearDeath: number;
  /** Property 282 over the front line: how many Sisters are ready to Combine (the menu offers Combine powers at 3). */
  combineReady: number;
}

/** What the menu builder does to the world, in the order it does it. */
export interface SisterMenuHost {
  /** `clearOwnCommands`. */
  clear(): void;
  /** `addCommandToSelf(command)`. */
  add(command: number): void;
  /** `RollMagusRandom(0, threshold)`: a negative threshold is true without a draw; otherwise one draw on stream 18 and `(draw & 0xFF) < threshold`. */
  roll(threshold: number): boolean;
}

/**
 * The sister's command menu (script event 12, worker 60 Cindy / 61 Sandy / 62 Mindy, function 2; 9,000 VM runs). The script's `or` and
 * `and` run both sides, so a roll is drawn even when the answer is already fixed (Sandy's 128/256 roll is drawn when someone is already
 * below half HP). `who` is the character number (0xF, 0x10 or 0x11).
 */
export function sisterMenu(who: number, st: SisterMenuState, host: SisterMenuHost): void {
  host.clear();
  if (st.debug !== 0) host.add(SISTER_SPECIAL[who] as number);
  host.add(SisterOrder.Free);
  if (st.turns !== 0) host.add(SisterOrder.Repeat);
  const m = st.motivation;
  if (who === SISTER_CINDY) {
    if (host.roll(m + 50)) host.add(SisterOrder.Attack);
    if (host.roll(128)) host.add(SisterOrder.CindyBig);
    if (host.roll(200)) host.add(SisterOrder.CindySupport);
  } else if (who === SISTER_SANDY) {
    if (host.roll(m + 150)) host.add(SisterOrder.Attack);
    const near = st.nearDeath !== 0;
    const r = host.roll(128); // drawn whatever `near` is
    if (near || r) host.add(SisterOrder.SandySupport);
  } else {
    if (host.roll(m + 150)) host.add(SisterOrder.Attack);
    if (tdiv(st.hp * 4, st.maxHp) === 0 || tdiv(st.mp * 4, st.maxMp) === 0) {
      if (host.roll(200)) host.add(SisterOrder.MindyDrain);
    } else if (tdiv(st.hp * 2, st.maxHp) === 0 || tdiv(st.mp * 2, st.maxMp) === 0) {
      if (host.roll(128)) host.add(SisterOrder.MindyDrain);
    }
  }
  if (st.combineReady === 3) host.add(SisterOrder.Combine);
  host.add(SISTER_DISMISS);
}

// ---------------------------------------------------------------------------
// Combine powers (read only, [R])
// ---------------------------------------------------------------------------

/** What counts one Sister for the Combine powers test (property 282 of one character; `FFX-G08` 6.4, the getter 0x007b2dc0 case 0x11a). */
export interface CombineFacts {
  /** Her character number: only 0xF, 0x10 and 0x11 count. */
  id: number;
  gauge: number;
  gaugeMax: number;
  /** The debug byte 0x0112a90c: counts the gauge as full. 0 in normal play. */
  debugReady: boolean;
  /** The dead byte `+0xdcc`. */
  dead: boolean;
  /** The Curse bit 0x400 of the word at `+0x616`. */
  cursed: boolean;
  /** `pp_BtlCanAct(chr, 1, 1, 1)`: not Petrified, Confused, Berserk, asleep, ejected, out of the battle, Provoked or Threatened. */
  canAct: boolean;
}

/**
 * Does this character add 1 to property 282? Her number is a Sister's, her gauge is at least its maximum (unsigned bytes) or the debug byte
 * is set, she is not dead and not Cursed, and she can act. [R: the getter's decompile and disassembly, not run.]
 */
export function combineParticipant(c: CombineFacts): boolean {
  if (c.id !== SISTER_CINDY && c.id !== SISTER_SANDY && c.id !== SISTER_MINDY) return false;
  if (c.gauge < c.gaugeMax && !c.debugReady) return false;
  if (c.dead || c.cursed) return false;
  return c.canAct;
}

/** The sum the menu tests against 3: how many of the characters count. */
export function combineCount(chars: readonly CombineFacts[]): number {
  return chars.filter(combineParticipant).length;
}

/** What the Combine powers handler does in the world. */
export interface CombineHost {
  /** `RollMagusRandom(0x30EA, threshold)` with no order standing: one draw on stream 18, `(draw & 0xFF) < threshold`. */
  roll(threshold: number): boolean;
  /** The target search for the Delta Attack (a target the command can reach exists, and its mask is stored for the joint action). */
  target(): boolean;
}

/** What the Combine powers handler decided. */
export interface CombineOutcome {
  /** The Delta Attack is queued (as Cindy's action, special kind 8) against the stored target set. */
  queued: boolean;
  /** The motivation change the handler wrote: +10, or -10 when nothing was queued (and she then performs the rest command on herself). */
  motivationChange: 10 | -10;
}

/**
 * The Combine powers order (event 18; note 6.6, read from the disassembly [R], not run): the standing order is cleared, the Delta Attack is
 * tried with the chance `200 + motivation` (one plain draw on stream 18) and a target search; the target mask is stored for the joint
 * action; motivation +10 when it was queued, -10 when not. The order of the roll and the search is the note's order of the three tests (the
 * roll first); a failed roll takes no search.
 */
export function combineEvent(motivation: number, host: CombineHost): CombineOutcome {
  if (host.roll(200 + motivation) && host.target()) return { queued: true, motivationChange: 10 };
  return { queued: false, motivationChange: -10 };
}
