// Scenario definitions: steps are menu choices by who/regex path. FFX-2 menus: Attack / Skill-or-White Magic / Change / Item.
export const SCENARIOS = {
  // Chapter VI (FFX-2 only): Yuna Gunner Trigger Happy, then the three changes (Yuna -> Thief, Rikku -> Warrior, Paine -> Thief), then actions
  ch6: {
    chapter: 'ffx2-leblanc',
    maxMenus: 40,
    // Rikku's Warrior and Paine's Thief sit on no shipped one-link ring (chateau.ts), so `swap` sets the dressphere in the
    // engine state and re-stages the painting, the way a spherechange event would (same in live and preview runs).
    prepare: async ({ page }) => { await page.evaluate(() => window.__previewHp?.()); },
    steps: [
      { who: 'yuna', tag: 'a-yuna-trigger', path: [/skill/i, /trigger/i], burst: 9 },
      { who: 'rikku', tag: 'b-rikku-steal', path: [/skill/i, /^steal/i], burst: 9 },
      { who: 'paine', tag: 'c-paine-thief-attack', swap: ['paine', 'thief'], path: [/^attack/i], burst: 9 },
      { who: 'yuna', tag: 'd-yuna-change', path: [/change/i, /thief/i], burst: 12, gap: 450 },
      { who: 'rikku', tag: 'e-rikku-warrior-attack', swap: ['rikku', 'warrior'], path: [/^attack/i], burst: 9 },
      { who: 'yuna', tag: 'f-yuna-thief-attack', path: [/^attack/i], burst: 9 },
      { who: 'paine', tag: 'g-paine-thief-attack2', path: [/^attack/i], burst: 9 },
      { who: 'rikku', tag: 'h-rikku-warrior-attack2', path: [/^attack/i], burst: 9 },
    ],
  },
};

/** After the scripted steps: hand the fight to the intended tactics and shoot a burst when `enemy` holds its wind-up.
 *  preview: the enemy's pose becomes 'telegraph'. live: the enemy's matching event has been logged and its pose leaves idle. */
export function telegraphAfter({ enemy, ability = null, chargeEvent = false, ms = 300000, tag, speed = 'normal', setup = null, fastUntilEnemy = false }) {
  return async ({ page, mark, sleep, burst, mode }) => {
    if (setup) await setup({ page });
    await page.evaluate(([sp, fast]) => { window.__pyrefly.autoBattle('intended'); if (fast) window.__pyrefly.setBattleSpeed('fast'); else if (sp !== 'normal') window.__pyrefly.setBattleSpeed(sp); }, [speed, fastUntilEnemy]);
    let slowed = !fastUntilEnemy;
    mark(`${tag}:auto`);
    const t0 = Date.now();
    const seqs = new Set();
    for (;;) {
      if (Date.now() - t0 > ms) throw new Error(`telegraph wait timed out (${tag})`);
      await page.evaluate(([fast, slowed]) => { const pr = window.__pyrefly.battle?.()?.battlePresenter; if (pr && !pr.isAuto) { window.__pyrefly.autoBattle('intended'); if (fast && !slowed) window.__pyrefly.setBattleSpeed('fast'); } }, [fastUntilEnemy, slowed]);
      const st = await page.evaluate(([enemy, ability, chargeEvent]) => {
        const log = window.__pyrefly.battleLog();
        const hits = log.filter((e) => (chargeEvent ? e.type === 'charge' && e.enemyId === enemy : e.type === 'action-start' && e.actorId === enemy && (e.abilityId ?? e.command?.id) === ability)).map((e) => e.seq);
        const pb = window.__pyrefly.snapshotState().screenState?.playback;
        const bs = window.__pyrefly.battleState();
        return { hits, played: (pb?.lastEvents ?? []).map((e) => e.seq), pose: window.__samp.last[enemy], over: !!bs?.result, here: !!bs?.enemyIds?.includes(enemy) };
      }, [enemy, ability, chargeEvent]);
      if (!slowed && st.here) { slowed = true; await page.evaluate(() => window.__pyrefly.setBattleSpeed('normal')); mark(`${tag}:enemy-here`); }
      if (st.over && !fastUntilEnemy) throw new Error(`battle ended before the telegraph (${tag})`);
      for (const h of st.hits) seqs.add(h);
      const playing = st.played.some((q) => seqs.has(q));
      if (st.pose === 'telegraph' || (mode === 'live' && playing)) break;
      await sleep(60);
    }
    mark(`${tag}:wind-up`);
    await burst(tag, 9, 260);
    mark(`${tag}:end`);
    await sleep(2500);
  };
}

SCENARIOS.ch4 = {
  chapter: 'ffx2-bahamut',
  prepare: async () => {},
  steps: [
    { who: 'rikku', tag: 'a-rikku-darkness', path: [/skill/i, /darkness/i], burst: 10 },
    { who: 'paine', tag: 'b-paine-sentinel', path: [/skill/i, /sentinel/i], burst: 10 },
    { who: 'yuna', tag: 'c-yuna-pray', path: [/white magic/i, /^cure$/i], burst: 10 },
  ],
  after: telegraphAfter({ enemy: 'bahamut', chargeEvent: true, tag: 'd-bahamut-telegraph' }),
};
SCENARIOS.ch5 = {
  chapter: 'ffx2-vegnagun-shuyin',
  steps: [],
  after: telegraphAfter({ enemy: 'shuyin', chargeEvent: true, tag: 'a-shuyin-telegraph', fastUntilEnemy: true, ms: 900000 }),
};
SCENARIOS.ch1flux = {
  chapter: 'seymour-flux',
  steps: [],
  telegraphHold: true,
  after: telegraphAfter({ enemy: 'seymour-flux', ability: 'lance-of-atrophy', tag: 'a-flux-telegraph' }),
};
SCENARIOS.ch8 = {
  chapter: 'evrae-airship',
  steps: [],
  telegraphHold: true,
  after: telegraphAfter({ enemy: 'evrae', ability: 'evrae-photon-spray', tag: 'a-evrae-telegraph' }),
};
SCENARIOS.ch13 = {
  chapter: 'ffx2-trema',
  steps: [],
  telegraphHold: true,
  after: telegraphAfter({ enemy: 'trema', ability: 'trema-meteor', tag: 'a-trema-telegraph', fastUntilEnemy: true, ms: 900000 }),
};

// Chapter VI split in two so each run is short and order-independent.
SCENARIOS.ch6a = { chapter: 'ffx2-leblanc', maxMenus: 60, steps: [
  { who: 'yuna', tag: 'a-yuna-trigger', path: [/skill/i, /trigger/i], burst: 11 },
  { who: 'rikku', tag: 'b-rikku-steal', path: [/skill/i, /^steal/i], burst: 11 },
] };
SCENARIOS.ch6b = { chapter: 'ffx2-leblanc', maxMenus: 80, quiet: false, steps: [
  { who: 'paine', tag: 'c-paine-thief-attack', swap: ['paine', 'thief'], path: [/^attack/i], burst: 10 },
  { who: 'yuna', tag: 'd-yuna-change', path: [/change/i, /thief/i], burst: 14, gap: 450 },
  { who: 'rikku', tag: 'e-rikku-warrior-attack', swap: ['rikku', 'warrior'], path: [/^attack/i], burst: 10 },
  { who: 'yuna', tag: 'f-yuna-thief-attack', path: [/^attack/i], burst: 10 },
] };
