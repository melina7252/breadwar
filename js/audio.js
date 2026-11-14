// 빵들의 전쟁 - 8비트 효과음 & 배경음 (Web Audio 합성)
'use strict';
BW.Audio = (() => {
  let ctx = null, master, sfxBus, musBus, noiseBuf;
  let sfxOn = true, musOn = true;
  const last = {};

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.5 : 0; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = musOn ? 0.22 : 0; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (pendingTrack) { const t = pendingTrack; pendingTrack = null; playMusic(t); }
  }

  function tone({ type = 'square', f = 440, f2 = null, t = 0.1, v = 0.2, delay = 0, bus = null }) {
    if (!ctx) return;
    const st = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, st);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), st + t);
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(v, st + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, st + t);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(st); o.stop(st + t + 0.02);
  }

  function noise({ t = 0.2, v = 0.3, delay = 0, lp = 3000, lp2 = null, hp = 0, bus = null }) {
    if (!ctx) return;
    const st = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(lp, st);
    if (lp2) f.frequency.exponentialRampToValueAtTime(lp2, st + t);
    let node = f;
    if (hp) { const h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; f.connect(h); node = h; }
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, st);
    g.gain.exponentialRampToValueAtTime(0.0001, st + t);
    s.connect(f); node.connect(g); g.connect(bus || sfxBus);
    s.start(st, Math.random() * 0.5); s.stop(st + t + 0.02);
  }

  function gate(name, ms) {
    const now = performance.now();
    if (last[name] && now - last[name] < ms) return false;
    last[name] = now; return true;
  }

  const sfx = {
    click() { tone({ f: 900, f2: 1300, t: 0.05, v: 0.12 }); },
    back() { tone({ f: 700, f2: 450, t: 0.07, v: 0.12 }); },
    deny() { tone({ f: 220, t: 0.08, v: 0.15 }); tone({ f: 180, t: 0.12, v: 0.15, delay: 0.08 }); },
    deploy() { if (!gate('deploy', 50)) return; tone({ f: 380, f2: 900, t: 0.12, v: 0.16 }); tone({ type: 'triangle', f: 760, t: 0.08, v: 0.12, delay: 0.06 }); },
    hit() { if (!gate('hit', 45)) return; noise({ t: 0.06, v: 0.18, lp: 2200 }); },
    hitE() { if (!gate('hitE', 55)) return; tone({ type: 'square', f: 160, f2: 90, t: 0.06, v: 0.1 }); },
    shoot() { if (!gate('shoot', 60)) return; tone({ f: 1200, f2: 600, t: 0.07, v: 0.07 }); },
    laser() { if (!gate('laser', 70)) return; tone({ type: 'sawtooth', f: 1600, f2: 300, t: 0.12, v: 0.06 }); },
    die() { if (!gate('die', 60)) return; tone({ f: 600, f2: 120, t: 0.18, v: 0.1 }); },
    pop() { if (!gate('pop', 50)) return; tone({ type: 'triangle', f: 300, f2: 900, t: 0.08, v: 0.15 }); noise({ t: 0.08, v: 0.08, lp: 5000 }); },
    boom() { noise({ t: 0.6, v: 0.5, lp: 1800, lp2: 80 }); tone({ type: 'sine', f: 120, f2: 30, t: 0.5, v: 0.4 }); },
    bigboom() { noise({ t: 1.4, v: 0.6, lp: 2500, lp2: 60 }); tone({ type: 'sine', f: 90, f2: 25, t: 1.2, v: 0.5 }); noise({ t: 0.9, v: 0.4, lp: 900, delay: 0.25 }); },
    cannon() { tone({ type: 'sawtooth', f: 90, f2: 900, t: 0.35, v: 0.15 }); noise({ t: 0.8, v: 0.45, lp: 4000, lp2: 200, delay: 0.3 }); tone({ type: 'square', f: 70, f2: 35, t: 0.7, v: 0.3, delay: 0.3 }); },
    coin() { tone({ f: 988, t: 0.06, v: 0.12 }); tone({ f: 1319, t: 0.18, v: 0.12, delay: 0.06 }); },
    upgrade() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, t: 0.09, v: 0.12, delay: i * 0.05 })); },
    evolve() {
      [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone({ f, t: 0.14, v: 0.12, delay: i * 0.07 }));
      tone({ type: 'triangle', f: 2093, t: 0.6, v: 0.12, delay: 0.5 });
    },
    heal() { if (!gate('heal', 300)) return; tone({ type: 'triangle', f: 880, f2: 1760, t: 0.2, v: 0.08 }); },
    ready() { tone({ f: 660, t: 0.07, v: 0.1 }); tone({ f: 990, t: 0.1, v: 0.1, delay: 0.07 }); },
    warn() { tone({ f: 440, t: 0.15, v: 0.15 }); tone({ f: 440, t: 0.15, v: 0.15, delay: 0.25 }); tone({ f: 440, t: 0.15, v: 0.15, delay: 0.5 }); },
    win() {
      const n = [523, 659, 784, 1047, 784, 1047, 1319];
      n.forEach((f, i) => tone({ f, t: i === n.length - 1 ? 0.5 : 0.12, v: 0.14, delay: i * 0.11 }));
      [262, 330, 392, 523].forEach((f, i) => tone({ type: 'triangle', f, t: 0.2, v: 0.12, delay: i * 0.22 }));
    },
    lose() { [392, 370, 349, 330, 262].forEach((f, i) => tone({ f, t: i === 4 ? 0.6 : 0.22, v: 0.13, delay: i * 0.22 })); },
    drum() { for (let i = 0; i < 14; i++) noise({ t: 0.05, v: 0.12 + i * 0.012, lp: 1500, delay: i * 0.07 }); },
    reveal(r) {
      const base = r === 3 ? [784, 988, 1175, 1568, 1976] : r === 2 ? [659, 784, 988, 1319] : [523, 659, 784];
      base.forEach((f, i) => tone({ f, t: 0.12, v: 0.12, delay: i * 0.06 }));
      if (r === 3) tone({ type: 'triangle', f: 2093, t: 0.8, v: 0.1, delay: 0.3 });
    },
    type() { if (!gate('type', 35)) return; tone({ f: 1400, t: 0.02, v: 0.04 }); },
  };

  // ───── 배경음 시퀀서 ─────
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const midi = (n) => { const m = n.match(/^([A-G]#?)(\d)$/); return 12 * (+m[2] + 1) + NOTE[m[1]]; };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function parse(str) {
    const out = [];
    str.replace(/\|/g, ' ').trim().split(/\s+/).forEach((tk) => {
      if (tk === '-') { if (out.length) out[out.length - 1].len++; out.push(null); }
      else if (tk === '.') out.push(null);
      else out.push({ m: midi(tk), len: 1 });
    });
    return out;
  }
  function bassFrom(chords, pattern) {
    const out = [];
    chords.split(/\s+/).forEach((c) => {
      const r = midi(c);
      pattern.forEach((p) => out.push(p === null ? null : { m: r + p, len: 1 }));
    });
    return out;
  }

  const TRACKS = {
    menu: {
      bpm: 116, leadType: 'square', leadV: 0.09, bassV: 0.13, drums: false,
      lead: parse('C5 E5 G5 E5 F5 A5 G5 - | E5 G5 C6 G5 A5 F5 E5 - | D5 F5 A5 F5 G5 B5 A5 G5 | E5 D5 C5 D5 E5 - . . | C5 E5 G5 E5 F5 A5 G5 - | A5 G5 F5 E5 D5 E5 F5 - | G5 E5 C5 E5 D5 B4 G4 B4 | C5 - G4 - C5 - . .'),
      bass: bassFrom('C3 F3 C3 F3 D3 G3 C3 C3 C3 F3 F3 D3 C3 G3 C3 C3', [0, null, 7, null]),
    },
    battle: {
      bpm: 144, leadType: 'square', leadV: 0.08, bassV: 0.14, drums: true,
      lead: parse('A4 . A4 C5 E5 . D5 C5 | B4 . B4 D5 G5 . F5 E5 | A4 . A4 C5 E5 . A5 G5 | F5 E5 D5 B4 C5 - . . | F5 . F5 A5 C6 . A5 F5 | G5 . G5 B5 D6 . B5 G5 | E5 . E5 G#5 B5 . G#5 E5 | A5 - E5 - A4 - . .'),
      bass: bassFrom('A2 A2 G2 G2 A2 A2 F2 G2 F2 F2 G2 G2 E2 E2 A2 A2', [0, 12, 0, 12]),
    },
    boss: {
      bpm: 156, leadType: 'sawtooth', leadV: 0.05, bassV: 0.15, drums: true,
      lead: parse('D5 . D5 F5 A5 . G#5 A5 | A#5 . A5 G5 F5 . E5 F5 | D5 . D5 F5 A5 . D6 C6 | A#5 A5 G5 E5 F5 - . . | G5 . G5 A#5 D6 . C6 A#5 | A5 . A5 C6 E6 . D6 C6 | A#5 A5 G5 F5 E5 F5 G5 E5 | D5 - A4 - D5 - . .'),
      bass: bassFrom('D2 D2 A#1 C2 D2 D2 A#1 A1 G1 G1 A1 A1 A#1 C2 D2 D2', [0, 12, 0, 12]),
    },
  };

  let cur = null, curName = null, timer = null, step = 0, nextT = 0, pendingTrack = null;
  function playMusic(name) {
    if (curName === name) return;
    stopMusic();
    if (!ctx) { pendingTrack = name; return; }
    curName = name; cur = TRACKS[name]; step = 0; nextT = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 60);
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; cur = null; curName = null; }
  function schedule() {
    if (!cur || !ctx) return;
    const stepDur = 60 / cur.bpm / 2;
    while (nextT < ctx.currentTime + 0.25) {
      const L = cur.lead[step % cur.lead.length];
      const B = cur.bass[step % cur.bass.length];
      const delay = nextT - ctx.currentTime;
      if (L) tone({ type: cur.leadType, f: hz(L.m), t: stepDur * L.len * 0.92, v: cur.leadV, delay, bus: musBus });
      if (B) tone({ type: 'triangle', f: hz(B.m), t: stepDur * 0.9, v: cur.bassV, delay, bus: musBus });
      if (cur.drums) {
        if (step % 4 === 0) tone({ type: 'sine', f: 140, f2: 40, t: 0.12, v: 0.35, delay, bus: musBus });
        if (step % 4 === 2) noise({ t: 0.08, v: 0.12, lp: 6000, hp: 1200, delay, bus: musBus });
        noise({ t: 0.025, v: 0.05, lp: 9000, hp: 6000, delay, bus: musBus });
      }
      step++; nextT += stepDur;
    }
  }

  function setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.5 : 0; }
  function setMusic(on) { musOn = on; if (musBus) musBus.gain.value = on ? 0.22 : 0; }

  return { init, sfx, playMusic, stopMusic, setSfx, setMusic, get sfxOn() { return sfxOn; }, get musOn() { return musOn; } };
})();
