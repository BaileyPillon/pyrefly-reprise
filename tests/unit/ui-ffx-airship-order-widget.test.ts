// @vitest-environment jsdom
/**
 * `AirshipOrderWidget` — Evrae, THIS CHAPTER ONLY.
 *
 * Option A of the widget options round (Bailey, 2026-09-23, D-032), and since 2026-10-09 ("Yes, match the game", re-parity row
 * D-08) one order at a time: the widget lists the Trigger row the engine offers — Pull back at NEAR, Close in at FAR, Cancel while
 * an order stands — and nothing greyed. These tests check its mount gate, that it lists only what the engine enabled, its cost
 * slab (Cancel costs the turn alone) and its keyboard and click reachability.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { AirshipOrderWidget } from '../../src/ui/ffx/AirshipOrderWidget.ts';

type OrderId = 'pull-back' | 'close-in' | 'cancel-order';

function triggerCommand(id: OrderId, enabled = true): AvailableCommand {
  return {
    label: id,
    enabled,
    command: { kind: 'trigger', id, targets: [] },
    validTargets: [],
  } as unknown as AvailableCommand;
}

/** What the engine publishes to an order owner: all three rows, exactly one enabled. */
const offer = (on: OrderId): AvailableCommand[] =>
  (['pull-back', 'close-in', 'cancel-order'] as const).map((id) => triggerCommand(id, id === on));

const labels = (widget: AirshipOrderWidget): string[] =>
  [...widget.el.querySelectorAll('.ffx-cmd--trigger__label')].map((e) => e.textContent ?? '');

describe('AirshipOrderWidget.applies — the mount gate', () => {
  it('is true only for the two real range values', () => {
    expect(AirshipOrderWidget.applies('near')).toBe(true);
    expect(AirshipOrderWidget.applies('far')).toBe(true);
  });

  it('is false for undefined, for any other flag value, and for every other chapter (no airship.range flag at all)', () => {
    expect(AirshipOrderWidget.applies(undefined)).toBe(false);
    expect(AirshipOrderWidget.applies('near-ish')).toBe(false);
    expect(AirshipOrderWidget.applies(1)).toBe(false);
    expect(AirshipOrderWidget.applies(null)).toBe(false);
  });
});

describe('AirshipOrderWidget', () => {
  it('lists the one order the engine offers, and nothing greyed (no "Already near/far", no "Ordered")', () => {
    for (const [on, label] of [
      ['pull-back', 'Pull back'],
      ['close-in', 'Close in'],
      ['cancel-order', 'Cancel'],
    ] as const) {
      const widget = new AirshipOrderWidget();
      document.body.appendChild(widget.el);
      void widget.open(offer(on), 3);
      expect(labels(widget), on).toEqual([label]);
      expect(widget.el.querySelectorAll('.ig-cmd--disabled'), on).toHaveLength(0);
      expect(widget.el.textContent).not.toMatch(/Already|Ordered/);
      widget.dispose();
    }
  });

  it('resolves with the real TriggerCommand for the chosen row, unmodified', async () => {
    for (const id of ['pull-back', 'close-in', 'cancel-order'] as const) {
      const widget = new AirshipOrderWidget();
      document.body.appendChild(widget.el);
      const promise = widget.open(offer(id), 2);
      const rows = widget.el.querySelectorAll('[data-ui-action]');
      expect(rows).toHaveLength(1);
      (rows[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await expect(promise).resolves.toEqual({ kind: 'trigger', id, targets: [] });
      widget.dispose();
    }
  });

  it('is keyboard reachable: Enter confirms the row on offer', async () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    const promise = widget.open(offer('close-in'), 1);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(promise).resolves.toEqual({ kind: 'trigger', id: 'close-in', targets: [] });
    widget.dispose();
  });

  it('never offers a row the engine did not actually enable', () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    // Pull back disabled, Close in enabled: only Close in is listed, whatever the ship's range is.
    void widget.open([triggerCommand('pull-back', false), triggerCommand('close-in', true), triggerCommand('cancel-order', false)], 0);
    expect(labels(widget)).toEqual(['Close in']);
    widget.dispose();
  });

  it('prices an order at the turn, Cid\'s next turn and a volley, and Cancel at the turn alone', () => {
    const order = new AirshipOrderWidget();
    document.body.appendChild(order.el);
    void order.open(offer('pull-back'), 2);
    expect(order.el.textContent).toMatch(/This order costs/);
    expect(order.el.textContent).toMatch(/Turn now · Cid's next turn · 1 volley/);
    expect(order.el.textContent).toMatch(/Volleys left 2/);
    order.dispose();

    const cancel = new AirshipOrderWidget();
    document.body.appendChild(cancel.el);
    void cancel.open(offer('cancel-order'), 2);
    expect(cancel.el.textContent).toMatch(/Cancelling costs/);
    expect(cancel.el.textContent).toMatch(/Turn now · Cid keeps his turn/);
    expect(cancel.el.textContent).not.toMatch(/volley/i);
    cancel.dispose();
  });
});
