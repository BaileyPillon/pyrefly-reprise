(() => {
  // VARIANT and STATE are prepended by the runner. Reads the REAL card's text from the live DOM, then lays
  // it out at phone width (390 px, native CSS px, no letterbox scale) in an overlay. Nothing under src/ changes.
  const q = (s, r = document) => r.querySelector(s);
  const card = q('.prepchap');
  const d = {
    game: q('.cpanel__game', card).textContent, num: q('.cpanel__numeral', card).textContent,
    title: q('.cpanel__title', card).textContent, subtitle: q('.cpanel__subtitle', card).textContent,
    where: q('.cpanel__where', card).textContent, blurb: q('.cpanel__blurb', card).textContent.trim(),
    snaps: [...card.querySelectorAll('.cpanel__snap')].map((f) => ({ img: q('.cpanel__snap-img', f).style.backgroundImage, cap: q('.cpanel__snap-cap', f).textContent })),
    objectives: [...card.querySelectorAll('.cpanel__objective-label')].map((e) => e.textContent),
    tip: q('.cpanel__tip-text', card).textContent,
    hero: getComputedStyle(q('.prepchap__hero')).backgroundImage,
    whereTop: q('.prep__where').textContent.trim(),
    tabs: [...document.querySelectorAll('.prep__tab')].map((t) => t.textContent.trim()),
    slots: [...document.querySelectorAll('.prep__slot')].map((s) => ({ name: q('.prep__slot-name', s).textContent, sub: q('.prep__slot-sub', s).textContent,
      role: q('.prep__slot-role', s).textContent, face: [...s.querySelectorAll('img')].pop()?.getAttribute('src') })),
  };
  const ffx2 = document.querySelector('.ig--ffx2') !== null;
  const acc = ffx2 ? '247,182,217' : '227,185,74';
  const accInk = ffx2 ? '184,67,126' : '184,134,42';
  const css = `
  #zz-phone{position:fixed;inset:0;z-index:2147483647;overflow-y:auto;overflow-x:hidden;background:#04060b;color:rgb(244,241,232);
    font-family:"Exo 2","Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;scrollbar-width:none}
  #zz-phone *{box-sizing:border-box}
  #zz-phone .zp-bgwash{position:fixed;inset:0;background:${getComputedStyle(q('.prep__wash')).backgroundImage} center/cover;filter:blur(6px) brightness(.28) saturate(.6);z-index:-1}
  #zz-phone .zp-lab{font-family:"Chakra Petch",Bahnschrift,sans-serif;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
  #zz-phone .zp-top{display:flex;justify-content:space-between;align-items:baseline;padding:18px 16px 8px}
  #zz-phone .zp-top .zp-ey{font-size:12px;color:rgb(${acc});display:flex;align-items:center;gap:8px}
  #zz-phone .zp-top .zp-ey:before{content:"";width:18px;height:1.5px;background:rgb(${acc})}
  #zz-phone .zp-top .zp-wh{font-size:12px;color:rgba(244,241,232,.62);letter-spacing:.12em}
  #zz-phone .zp-tabs{display:flex;gap:18px;padding:6px 16px 0;overflow:hidden;white-space:nowrap;border-bottom:1px solid rgba(244,241,232,.12);-webkit-mask-image:linear-gradient(to right,#000 82%,transparent);mask-image:linear-gradient(to right,#000 82%,transparent)}
  #zz-phone .zp-tabs span{font-size:12px;padding:8px 0 9px;color:rgba(244,241,232,.5);letter-spacing:.14em}
  #zz-phone .zp-tabs span.zp-on{color:#fff;box-shadow:inset 0 -2px 0 rgb(${acc})}
  #zz-phone .zp-tabs .zp-more{color:rgba(244,241,232,.3)}
  #zz-phone .zp-card{margin:12px 12px 0;background:rgb(244,241,232);color:rgb(11,10,18);overflow:hidden;border-bottom-right-radius:2px}
  #zz-phone .zp-hero{position:relative;height:150px;overflow:hidden;contain:paint;background:${d.hero};background-size:cover;background-position:60% 28%}
  #zz-phone .zp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(244,241,232,1) 0%,rgba(244,241,232,.95) 42%,rgba(244,241,232,.25) 78%,transparent)}
  #zz-phone .zp-hero .zp-t{position:absolute;left:16px;right:16px;bottom:8px;z-index:1}
  #zz-phone .zp-eyb{font-size:12px;color:rgb(${accInk});letter-spacing:.24em}
  #zz-phone h2{margin:2px 0 0;font:700 34px/1 "Cormorant Garamond",Georgia,serif;letter-spacing:-.01em}
  #zz-phone .zp-sub{font:italic 600 16px/1.2 "Cormorant Garamond",Georgia,serif;color:rgba(11,10,18,.72);margin-top:2px}
  #zz-phone .zp-in{padding:4px 16px 16px}
  #zz-phone .zp-where{font-size:12px;color:rgba(11,10,18,.5);letter-spacing:.14em;margin:6px 0 8px}
  #zz-phone .zp-blurb{font-size:14px;line-height:1.5;color:rgba(11,10,18,.78);margin:0}
  #zz-phone .zp-snaps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 4px}
  #zz-phone .zp-snap{margin:0}
  #zz-phone .zp-snap i{display:block;height:72px;background-size:cover;background-position:50% 25%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  #zz-phone .zp-snap figcaption{font:italic 600 13px/1.2 "Cormorant Garamond",Georgia,serif;color:rgba(11,10,18,.72);margin-top:5px}
  #zz-phone .zp-h{font-size:12px;letter-spacing:.24em;color:rgba(11,10,18,.5);margin:14px 0 6px;display:flex;align-items:center;gap:8px}
  #zz-phone .zp-h:after{content:"";flex:1;height:1px;background:rgba(11,10,18,.16)}
  #zz-phone ul{list-style:none;margin:0;padding:0}
  #zz-phone li{display:flex;gap:10px;align-items:baseline;font-size:15px;line-height:1.35;padding:4px 0;font-weight:600}
  #zz-phone li:before{content:"";flex:none;width:7px;height:7px;transform:rotate(45deg) translateY(-2px);background:rgb(${accInk})}
  #zz-phone .zp-tip{margin-top:12px;background:rgba(11,10,18,.06);border-left:3px solid rgb(${accInk});padding:9px 12px;font-size:14px;line-height:1.45}
  #zz-phone .zp-tip b{font-family:"Chakra Petch",sans-serif;font-size:12px;letter-spacing:.2em;color:rgb(${accInk});margin-right:8px}
  #zz-phone .zp-party{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 12px 0}
  #zz-phone .zp-slot{background:rgb(244,241,232);color:rgb(11,10,18);padding:6px 6px 7px;display:grid;grid-template-columns:34px 1fr;gap:0 6px;align-items:center}
  #zz-phone .zp-slot .zp-face{display:block;width:34px;height:34px;background-size:cover;background-position:50% 12%;grid-row:span 2}
  #zz-phone .zp-slot .zp-n{font:700 17px/1 "Cormorant Garamond",Georgia,serif}
  #zz-phone .zp-slot .zp-r{font-size:12px;color:rgb(${accInk});letter-spacing:.06em}
  #zz-phone .zp-slot .zp-s{grid-column:1/3;font:700 12px/1.1 Rajdhani,sans-serif;color:rgb(42,37,51);margin-top:4px}
  #zz-phone .zp-dock{position:sticky;bottom:0;margin-top:14px;padding:12px 12px 16px;background:linear-gradient(to top,#04060b 60%,rgba(4,6,11,0))}
  #zz-phone .zp-start{display:block;text-align:center;background:rgb(${acc});color:rgb(11,10,18);font-size:14px;letter-spacing:.24em;padding:14px 0;clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)}
  #zz-phone .zp-cue{position:sticky;bottom:78px;height:0;z-index:2;text-align:center}
  #zz-phone .zp-cue span{position:relative;top:-30px;display:inline-block;font-size:12px;letter-spacing:.2em;background:rgba(11,10,18,.88);color:rgb(${acc});padding:6px 12px;border:1px solid rgba(${acc},.5)}
  #zz-phone .zp-subtabs{display:flex;border-bottom:1px solid rgba(11,10,18,.16);margin:8px 0 12px}
  #zz-phone .zp-subtabs span{flex:1;text-align:center;font-size:12px;letter-spacing:.18em;padding:10px 0;color:rgba(11,10,18,.45)}
  #zz-phone .zp-subtabs span.zp-on{color:rgb(11,10,18);box-shadow:inset 0 -3px 0 rgb(${accInk})}
  #zz-phone .zp-dots{font-size:12px;color:rgba(11,10,18,.4);text-align:center;margin-top:10px;letter-spacing:.2em}
  #zz-phone .zp-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid rgba(11,10,18,.14);font-size:12px;letter-spacing:.2em;color:rgb(${accInk})}
  #zz-phone .zp-row em{font-style:normal;color:rgba(11,10,18,.55);letter-spacing:.1em;text-transform:none;font:500 14px/1.3 "Exo 2",sans-serif;flex:1;margin:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #zz-phone .zp-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  #zz-phone .zp-more{font-size:12px;color:rgb(${accInk});letter-spacing:.2em;margin-top:6px;display:inline-block}
  #zz-phone .zp-strip{display:flex;gap:8px;margin:12px 0 0}
  #zz-phone .zp-strip i{flex:1;height:44px;background-size:cover;background-position:50% 25%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25)}
  `;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const top = `<div class="zp-bgwash"></div><div class="zp-top"><span class="zp-ey zp-lab">Party prep</span><span class="zp-wh zp-lab">${esc(d.game)} · ${esc(d.num)}</span></div>
    <div class="zp-tabs zp-lab">${d.tabs.map((t, i) => `<span class="${i === 0 ? 'zp-on' : ''}">${esc(t)}</span>`).join('')}</div>`;
  const head = `<div class="zp-hero"><div class="zp-t"><div class="zp-eyb zp-lab">${esc(d.game)} · ${esc(d.num)}</div><h2>${esc(d.title)}</h2><div class="zp-sub">${esc(d.subtitle)}</div></div></div>`;
  const snaps = `<div class="zp-snaps">${d.snaps.map((s) => `<figure class="zp-snap"><i style='background-image:${s.img}'></i><figcaption>${esc(s.cap)}</figcaption></figure>`).join('')}</div>`;
  const objs = `<div class="zp-h zp-lab">Objectives</div><ul>${d.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`;
  const tip = `<div class="zp-tip"><b>TIP</b>${esc(d.tip)}</div>`;
  const party = `<div class="zp-party">${d.slots.map((s) => `<div class="zp-slot"><i class="zp-face" style='background-image:url("${s.face}")'></i><span class="zp-n">${esc(s.name)}</span><span class="zp-r zp-lab">${esc(s.role)}</span><span class="zp-s">${esc(s.sub)}</span></div>`).join('')}</div>`;
  const dock = `<div class="zp-dock"><span class="zp-start zp-lab">▶&nbsp; Start battle</span></div>`;
  let body = '';
  if (VARIANT === 'stack') {
    body = `${top}<div class="zp-card">${head}<div class="zp-in"><div class="zp-where zp-lab">${esc(d.where)}</div><p class="zp-blurb">${esc(d.blurb)}</p>${snaps}${objs}${tip}</div></div>
      <div class="zp-h zp-lab" style="margin:18px 12px 0;color:rgba(244,241,232,.5)">Party</div>${party}${STATE === 'top' ? '<div class="zp-cue"><span class="zp-lab">▼ More below</span></div>' : ''}${dock}`;
  } else if (VARIANT === 'tabs') {
    const pages = { story: `<p class="zp-blurb">${esc(d.blurb)}</p>${snaps}`, goals: `${objs.replace('class="zp-h zp-lab"', 'class="zp-h zp-lab" style="margin-top:4px"')}${tip}` };
    body = `${top}<div class="zp-card">${head}<div class="zp-in"><div class="zp-where zp-lab">${esc(d.where)}</div>
      <div class="zp-subtabs zp-lab"><span class="${STATE === 'story' ? 'zp-on' : ''}">Story</span><span class="${STATE === 'goals' ? 'zp-on' : ''}">Objectives · Tip</span></div>
      ${pages[STATE]}<div class="zp-dots zp-lab">L1 · R1 &nbsp;or swipe</div></div></div>${party}${dock}`;
  } else {
    const tipRow = STATE === 'open'
      ? `<div class="zp-row zp-lab" style="border-bottom:0;padding-bottom:4px"><span>TIP</span><em></em><span>▲</span></div><div class="zp-tip" style="margin-top:0">${esc(d.tip)}</div>`
      : `<div class="zp-row zp-lab"><span>TIP</span><em>${esc(d.tip)}</em><span>▼</span></div>`;
    const storyRow = STATE === 'open'
      ? `<p class="zp-blurb">${esc(d.blurb)}</p>${snaps}`
      : `<p class="zp-blurb zp-clamp">${esc(d.blurb)}</p><span class="zp-more zp-lab">Read more ▼</span><div class="zp-strip">${d.snaps.map((s) => `<i style='background-image:${s.img}'></i>`).join('')}</div>`;
    body = `${top}<div class="zp-card">${head}<div class="zp-in"><div class="zp-where zp-lab">${esc(d.where)}</div>${objs.replace('class="zp-h zp-lab"', 'class="zp-h zp-lab" style="margin-top:6px"')}
      <div style="margin-top:10px">${tipRow}</div><div class="zp-h zp-lab">Story</div>${storyRow}</div></div>${party}${dock}`;
  }
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  document.querySelectorAll('canvas').forEach((c) => { c.style.visibility = 'hidden'; });
  const root = document.createElement('div'); root.id = 'zz-phone'; root.innerHTML = body; document.body.appendChild(root);
  return { variant: VARIANT, state: STATE, objectives: d.objectives.length, snaps: d.snaps.length };
})()
