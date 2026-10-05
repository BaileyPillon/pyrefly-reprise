// In-page: switch single passes, looks and parts off (or neutral) so one cause at a time can move the numbers.
// Every mod writes through window.__ov, which a wrapper around composer.render applies right before each draw (after the fx update, so it wins).
export function installMods(names) {
  const api = window.__pyrefly; const r = api.app.renderer; const fx = api.fx;
  window.__ov = window.__ov || { grade: {}, bloom: {}, tilt: {}, fig: {} };
  const ov = window.__ov;
  if (!window.__ovWrapped) {
    window.__ovWrapped = true;
    const comp = r.composer; const orig = comp.render.bind(comp);
    comp.render = (dt) => {
      const o = window.__ov;
      const g = r.gradePass.uniforms;
      for (const [k, v] of Object.entries(o.grade)) { if (!g[k]) continue; if (Array.isArray(v)) g[k].value.set(...v); else g[k].value = v; }
      for (const [k, v] of Object.entries(o.bloom)) r.bloomPass[k] = v;
      for (const [k, v] of Object.entries(o.tilt)) { r.tiltH.uniforms[k].value = v; r.tiltV.uniforms[k].value = v; }
      if (Object.keys(o.fig).length) {
        const stage = api.app.current && api.app.current.stage;
        if (stage && stage.actors) for (const [, s] of stage.actors) for (const sl of s.actor.slots) {
          const u = sl.material.uniforms;
          for (const [k, v] of Object.entries(o.fig)) { if (!u[k]) continue; if (Array.isArray(v)) u[k].value.set(...v); else u[k].value = v; }
        }
      }
      return orig(dt);
    };
  }
  const applied = [];
  let mixOff = [];
  for (const name of names) {
    const [kind, arg] = name.split(':');
    switch (kind) {
      case 'base': break;
      case 'grade0': Object.assign(ov.grade, { lift: [0, 0, 0], gain: [1, 1, 1], gamma: [1, 1, 1], saturation: 1, vignette: 0, grain: 0, dither: 0, shadowTintAmount: 0, lookAmount: 0 }); break;
      case 'lift0': ov.grade.lift = [0, 0, 0]; break;
      case 'gain1': ov.grade.gain = [1, 1, 1]; break;
      case 'gamma1': ov.grade.gamma = [1, 1, 1]; break;
      case 'gamma': { const v = Number(arg); ov.grade.gamma = [v, v, v]; break; }
      case 'sat1': ov.grade.saturation = 1; break;
      case 'stint0': ov.grade.shadowTintAmount = 0; break;
      case 'vig0': ov.grade.vignette = 0; break;
      case 'grain0': ov.grade.grain = 0; ov.grade.dither = 0; break;
      case 'look0': fx.sub('look', false); ov.grade.lookAmount = 0; break;
      case 'bloom0': ov.bloom.strength = 0; break;
      case 'tilt0': ov.tilt.maxBlur = 0; break;
      case 'rim0': fx.sub('rim', false); ov.fig.rimStrength = 0; break;
      case 'bounce0': ov.fig.bounceStrength = 0; break;
      case 'bright1': ov.fig.brightness = 1; break;
      case 'tint1': ov.fig.tint = [1, 1, 1]; break;
      case 'shade0': ov.fig.groundShade = 0; break;
      case 'fxoff': fx.set('a', false); fx.set('b', false); fx.set('c', false); break;
      case 'a0': fx.set('a', false); break;
      case 'b0': fx.set('b', false); break;
      case 'c0': fx.set('c', false); break;
      case 'sub': fx.sub(arg, false); break;
      case 'mix': if (arg === 'all') mixOff = false; else if (mixOff !== false) mixOff.push(arg); break;
      case 'crisp': api.crisp.preset(arg); break;
      case 'dial': { const [n, v] = arg.split('='); fx.dial(n, Number(v)); break; }
      default: throw new Error(`unknown mod ${name}`);
    }
    applied.push(name);
  }
  if (fx.mix && (mixOff === false || mixOff.length)) fx.mix.parts(mixOff);
  return applied;
}
