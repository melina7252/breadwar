// 빵들의 전쟁 - 전투 엔진 (로직 + 모션 + 렌더링)
'use strict';
BW.OVEN_MAX_LV = 8;
BW.ovenInfo = (lv) => ({ max: 15 + 5 * lv, rate: 1 + 0.2 * (lv - 1), up: 6 * lv + 4 });
BW.CANNON_T = 35;

BW.PROJ = {
  berry: { arc: 18, sp: 150 }, crumb: { arc: 30, sp: 120 }, acid: { arc: 22, sp: 120 }, cream: { arc: 14, sp: 140 },
  plasma: { arc: 12, sp: 140 }, ring: { sp: 170 }, swirl: { sp: 130 }, laser: { sp: 320 },
  mustard: { arc: 16, sp: 140 }, pep: { sp: 200 }, egg: { arc: 22, sp: 130 }, snow: { arc: 26, sp: 120 },
  shell: { arc: 46, sp: 150, trail: '#b8b0a8' }, toast: { sp: 230 }, missile: { sp: 180, trail: '#e8e8f0' },
  ice: { sp: 170 }, bomb: { arc: -6, sp: 90 }, goo: { arc: 14, sp: 140 },
};

BW.Battle = class Battle {
  constructor(g, opts = {}) {
    this.idx = g;
    this.st = BW.STAGES[g];
    this.headless = !!opts.headless;
    this.onEnd = opts.onEnd || (() => {});
    this.onEvent = opts.onEvent || (() => {});
    if (!this.headless) {
      this.cv = opts.canvas;
      this.ctx = this.cv.getContext('2d');
      this.bg = BW.Scenes.background(this.st.theme, g + 1);
    }
    this.t = 0; this.speed = 1; this.paused = false;
    this.over = null; this.endT = 0; this.ended = false;
    // 오븐 강화 (레시피 북에서 골드로 올리는 영구 강화)
    const up = opts.ovenUp || (!this.headless && BW.Save.data && BW.Save.data.oven) || {};
    this.up = { hp: up.hp || 0, fire: up.fire || 0, start: up.start || 0, cannon: up.cannon || 0 };
    this.cost = 5 + 2 * this.up.start; this.ovenLv = 1; this.cannon = 0.5;
    const ovenHp = Math.round(this.st.oven * (1 + 0.1 * this.up.hp));
    this.E = { isCastle: true, team: 'e', x: 32, hw: 18, hp: this.st.base, max: this.st.base, dmgT: 0 };
    this.P = { isCastle: true, team: 'b', x: 444, hw: 22, hp: ovenHp, max: ovenHp, dmgT: 0 };
    this.units = []; this.projs = []; this.parts = []; this.floats = []; this.corpses = [];
    this.spawners = this.st.waves.map((w) => ({ ...w, next: w.t, count: 0 }));
    this.triggers = this.st.triggers.map((tr) => ({ ...tr, done: false }));
    this.laterQ = [];
    this.nextRush = this.st.rush ? this.st.rush.first : 1e9;
    const owned = opts.owned || BW.Save.data.owned;
    this.cards = (opts.party || []).map((id) => {
      const lv = owned[id] || 1;
      return { id, lv, s: BW.breadStats(id, lv), cd: 0 };
    });
    this.shake = 0; this.beamT = 0; this.cannonFx = 0; this.boss = null;
    this.smokeT = 0; this.sparkT = 0; this.auraT = 0; this.hitStop = 0; this.ovenPop = 0; this.portalPop = 0;
    this.comboN = 0; this.comboT = -9;
    this.stats = { deployed: 0, kills: 0 };
    this.diff = opts.diff || this.st.diff || 1;
    this.rp = opts.rp || (this.st.rush && this.st.rush.pow) || 1.3;
  }

  get oven() { const o = BW.ovenInfo(this.ovenLv); o.rate *= 1 + 0.05 * this.up.fire; return o; }
  sfx(name, ...a) { if (!this.headless) BW.Audio.sfx[name](...a); }
  later(delay, fn) { this.laterQ.push({ at: this.t + delay, fn }); }
  foes(team) { return this.units.filter((u) => u.team !== team && !u.dead); }

  // ───── 플레이어 행동 ─────
  canDeploy(i) { const c = this.cards[i]; return c && !this.over && c.cd <= 0 && this.cost >= c.s.cost; }
  deploy(i) {
    const c = this.cards[i];
    if (!c || this.over || this.paused) return false;
    if (c.cd > 0 || this.cost < c.s.cost) { this.sfx('deny'); return false; }
    this.cost -= c.s.cost; c.cd = c.s.cd;
    const B = BW.BREADS[c.id];
    const n = (c.s.evo && B.evoUp && B.evoUp.multi) || B.multi || 1;
    for (let k = 0; k < n; k++) this.later(k * 0.14, () => { if (!this.over) this.spawn('b', c.id, c.s, c.s.evo); });
    this.stats.deployed++;
    this.ovenPop = 0.18;
    this.sfx('deploy');
    return true;
  }
  upgradeOven() {
    if (this.over || this.paused) return false;
    if (this.ovenLv >= BW.OVEN_MAX_LV || this.cost < this.oven.up) { this.sfx('deny'); return false; }
    this.cost -= this.oven.up; this.ovenLv++; this.ovenPop = 0.3;
    this.float(this.P.x, 112, '화력 UP!', '#ffd23f', 1.2, 8);
    this.burst(this.P.x - 10, 168, ['#ffd23f', '#ff8a2a', '#ffffff'], 22, 70, 0.7, -40);
    this.sfx('upgrade');
    return true;
  }
  fireCannon() {
    if (this.over || this.paused || this.cannon < 1) { if (!this.over) this.sfx('deny'); return false; }
    this.cannon = 0; this.cannonFx = 0.32;
    this.sfx('cannon');
    this.later(0.3, () => {
      if (this.over) return;
      this.beamT = 0.7; this.shake = 8; this.ovenPop = 0.3;
      const dmg = Math.round((110 + 26 * this.idx) * (1 + 0.1 * this.up.cannon));
      for (const u of this.units) {
        if (u.team !== 'e' || u.dead || u.x < this.P.x - 330) continue;
        this.hit({ team: 'b', atk: dmg, raw: true }, u, dmg);
        if (!u.dead) this.knock(u, u.boss ? 0.6 : 1.4);
      }
    });
    return true;
  }

  // ───── 유닛 생성 ─────
  spawn(team, id, s, evo, atX, el) {
    const base = team === 'b' ? BW.BREADS[id] : BW.ENEMIES[id];
    let D = evo && base.evoUp ? { ...base, ...base.evoUp } : base;
    // 속성 외계인의 공격 특성
    if (el === 'w') D = { ...D, kb: Math.max(D.kb || 0, 0.55), kbPow: 1.5 };
    else if (el === 'd') D = { ...D, dot: Math.max(D.dot || 0, 0.45) };
    else if (el === 'i') D = { ...D, stun: Math.max(D.stun || 0, 0.3), stunT: D.stunT || 0.9 };
    const SD = BW.Sprites.DEF[id];
    const u = {
      team, id, evo: !!evo, D, el: el || null, res: (team === 'b' && D.res) || '', bane: (team === 'b' && D.bane) || '',
      hp: s.hp, max: s.hp, atk: s.atk, def: s.def, spd: s.spd, aspd: s.aspd, range: s.range,
      hw: D.hw, splash: D.splash ? D.splash + (evo ? 6 : 0) : 0, fly: !!D.fly, boss: !!D.boss, big: !!D.big, bounty: D.bounty || 0,
      sh: SD ? SD.h - (SD.oy || 0) - 4 : 18,
      x: atX !== undefined ? atX : (team === 'b' ? this.P.x - 6 : this.E.x + 8),
      lane: D.boss ? 4 : Math.floor(Math.random() * 9), z: 0,
      state: 'walk', atkT: 0.55, animT: Math.random() * 3, lungeT: 0, flashT: 0, hurtT: 0, spawnT: atX !== undefined ? 0.2 : 0.38, stepN: 0,
      slowT: 0, slowF: 1, stunT: 0, dotT: 0, dotDps: 0, dotAcc: 0, shredT: 0, shredF: 0, buffT: 0, buffDr: 0,
      kbT: 0, kbV: 0, first: D.first || 0,
      shieldMax: D.shield ? Math.round(s.hp * D.shield) : 0, shield: D.shield ? Math.round(s.hp * D.shield) : 0, shieldT: 0,
      summonT: D.summon ? D.summon.every * 0.6 : 0, enraged: false,
      kbHits: D.boss ? [0.66, 0.33] : [0.5], dead: false,
    };
    this.units.push(u);
    if (u.boss) {
      this.boss = u; this.shake = 6;
      this.onEvent('boss', u); this.sfx('warn');
    }
    return u;
  }
  spawnEnemy(id, atX, pow, el) {
    const E = BW.ENEMIES[id];
    if (!E.boss && this.units.filter((u) => u.team === 'e').length >= 45) return false;
    el = el || E.el || null;
    const es = BW.enemyStats(id, this.idx);
    if (this.diff !== 1) { es.hp = Math.round(es.hp * this.diff); es.atk = Math.round(es.atk * this.diff); }
    if (pow) { es.hp = Math.round(es.hp * pow); es.atk = Math.round(es.atk * pow); es.spd = es.spd * 1.3; }
    // 속성 보정: 불 = 공격력, 바람 = 속도, 어둠 = 체력, 얼음 = 방어력
    if (el === 'f') es.atk = Math.round(es.atk * 1.6);
    else if (el === 'w') { es.spd *= 1.2; es.aspd *= 1.1; }
    else if (el === 'd') es.hp = Math.round(es.hp * 1.1);
    else if (el === 'i') es.def = Math.round(es.def * 1.3 + 4);
    const nu = this.spawn('e', id, es, false, atX, el);
    if (pow) nu.elite = true;
    if (atX === undefined) { this.portalPop = 0.25; this.burst(this.E.x + 10, 176, ['#5fff9a', '#2fbf6a', '#d8ffe6'], 8, 40, 0.5, -20); }
    return true;
  }

  // ───── 전투 판정 ─────
  target(u) {
    const dir = u.team === 'b' ? -1 : 1;
    let best = null, bg = 1e9;
    for (const o of this.units) {
      if (o.team === u.team || o.dead) continue;
      const rel = (o.x - u.x) * dir;
      if (rel < -(u.hw + o.hw)) continue;
      const gap = rel - u.hw - o.hw;
      if (gap <= u.range && gap < bg) { bg = gap; best = o; }
    }
    const c = u.team === 'b' ? this.E : this.P;
    const gap = (c.x - u.x) * dir - u.hw - c.hw;
    if (gap <= u.range && gap <= bg) return c;
    return best;
  }
  inRange(u) {
    const dir = u.team === 'b' ? -1 : 1, out = [];
    for (const o of this.units) {
      if (o.team === u.team || o.dead) continue;
      const rel = (o.x - u.x) * dir;
      if (rel < -(u.hw + o.hw)) continue;
      const gap = rel - u.hw - o.hw;
      if (gap <= u.range) out.push([gap, o]);
    }
    return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }
  castleInRange(u) {
    const dir = u.team === 'b' ? -1 : 1, c = u.team === 'b' ? this.E : this.P;
    return (c.x - u.x) * dir - u.hw - c.hw <= u.range ? c : null;
  }
  src(u) {
    const D = u.D;
    return {
      team: u.team, atk: u.atk, owner: u, splash: u.splash, crit: D.crit, kb: D.kb, slow: D.slow, slowDur: u.evo ? 3 : 2,
      shred: D.shred, dot: D.dot, stun: D.stun, stunT: D.stunT, lifesteal: D.lifesteal,
      el: u.el, bane: u.bane, kbPow: D.kbPow || 1,
    };
  }
  knock(o, power = 1) {
    if (o.isCastle || o.dead) return;
    if (o.res && o.res.includes('w')) return; // 바람 저항: 밀쳐내기 면역
    const away = o.team === 'b' ? 1 : -1;
    o.kbT = 0.32; o.kbV = away * 80 * power * (o.boss ? 0.5 : 1); o.state = 'kb'; o.atkT = Math.min(o.atkT, 0.3);
  }
  hit(src, o, dmg) {
    if (o.dead) return;
    if (o.isCastle) {
      if (this.over) return;
      const d = Math.round(dmg * BW.rand(0.9, 1.1));
      o.hp -= d; o.dmgT = 0.12; this.shake = Math.max(this.shake, 1.5);
      if (!this.headless) {
        this.float(o.x + BW.rand(-10, 10), 110 + BW.rand(-6, 6), d, o.team === 'e' ? '#ffffff' : '#ff8a8a', 0.7, 6);
        this.burst(o.x + (o.team === 'e' ? 14 : -16), BW.rand(130, 180), o.team === 'e' ? ['#8a8fa8', '#5fff9a', '#ffffff'] : ['#b5523b', '#7d3424', '#ffd23f'], 4, 50, 0.5, 80);
      }
      this.sfx(o.team === 'e' ? 'hit' : 'hitE');
      return;
    }
    const def = o.def * (o.shredT > 0 ? 1 - o.shredF : 1);
    let d = src.raw ? dmg : dmg * 60 / (60 + def);
    let crit = false, big = false;
    const ow = src.owner;
    if (ow && ow.first && !src.noFirst) { d *= ow.first; ow.first = 0; big = true; }
    if (src.crit && Math.random() < src.crit) { d *= 2.5; crit = true; }
    if (o.buffT > 0) d *= 1 - o.buffDr;
    // 속성 상성: 저항(받는 피해 감소) / 특효(주는 피해 증가)
    let aff = 0;
    if (src.el && o.res && o.res.includes(src.el)) { d *= src.el === 'f' ? 0.4 : 0.6; aff = -1; }
    if (src.bane && o.el && src.bane.includes(o.el)) { d *= 1.75; aff = 1; }
    d = Math.max(1, Math.round(d * BW.rand(0.9, 1.1)));
    let absorbed = 0;
    if (o.shield > 0) { absorbed = Math.min(o.shield, d); o.shield -= absorbed; d -= absorbed; }
    if (o.shieldMax) o.shieldT = 6;
    o.hp -= d; o.flashT = 0.09; o.hurtT = 0.12;
    if (!this.headless && !src.quiet) {
      const y = this.uy(o) - o.sh + 4 - (o.fly ? 14 : 0);
      if (absorbed && !d) this.float(o.x, y, '막음', '#5ff1ff', 0.5, 6);
      else if (crit || big) { this.float(o.x, y - 4, d + '!', '#ffd23f', 0.9, 9); this.hitStop = Math.max(this.hitStop, 0.05); this.shake = Math.max(this.shake, 3); }
      else if (aff > 0) this.float(o.x + BW.rand(-3, 3), y - 2, d, BW.shadeHex(BW.EL[o.el].col, 0.45), 0.75, 8);
      else if (aff < 0) this.float(o.x + BW.rand(-3, 3), y, d, '#c8d0dc', 0.5, 5);
      else this.float(o.x + BW.rand(-3, 3), y, d, o.team === 'e' ? '#ffffff' : '#ff9a9a', 0.6, 6);
      const cols = o.team === 'e' ? ['#69d35c', '#b8ff9a', '#ffffff'] : (o.D.group === 'robot' ? ['#a9b6c6', '#5ff1ff', '#ffd23f'] : ['#c9772f', '#f6d8a0', '#8e4b1c']);
      this.burst(o.x, y + 6, cols, crit || big ? 9 : 3, 45, 0.4, 120);
      this.parts.push({ type: 'star', x: o.x + BW.rand(-3, 3), y: y + 8 + BW.rand(-3, 3), life: 0.12, max: 0.12, s: crit || big ? 6 : 3 });
    }
    if (!src.quiet) this.sfx(o.team === 'e' ? 'hit' : 'hitE');
    const res = o.boss ? 0.35 : 1;
    const rI = o.res && o.res.includes('i'), rD = o.res && o.res.includes('d');
    if (src.slow && !rI) { o.slowT = src.slowDur || 2; o.slowF = 1 - src.slow * (o.boss ? 0.5 : 1); }
    if (src.shred) { o.shredT = 4; o.shredF = src.shred; }
    if (src.dot && !rD) { o.dotT = 4; o.dotDps = Math.max(o.dotDps, src.atk * src.dot); o.dotEl = src.el; }
    if (src.stun && !rI && Math.random() < src.stun) { o.stunT = Math.max(o.stunT, (src.stunT || 0.8) * res); if (src.el === 'i') o.frozen = true; }
    if (src.lifesteal && ow && !ow.dead) ow.hp = Math.min(ow.max, ow.hp + Math.round(d * src.lifesteal));
    if (o.hp <= 0) { this.kill(o); return; }
    if (o.boss && !o.enraged && o.hp / o.max < 0.5) {
      o.enraged = true; this.shake = 6; this.onEvent('enrage', o);
      this.burst(o.x, this.uy(o) - o.sh / 2, ['#ff3b3b', '#ff8a2a', '#ffffff'], 30, 110, 0.6, 0);
    }
    if (o.kbHits.length && o.hp / o.max <= o.kbHits[0]) { o.kbHits.shift(); this.knock(o); }
    else if (src.kb && Math.random() < src.kb) this.knock(o, (o.boss ? 0.4 : 0.8) * (src.kbPow || 1));
  }
  explode(team, x, dmg, r, fy) {
    const src = { team, atk: dmg, splash: r };
    for (const o of this.units) if (o.team !== team && !o.dead && Math.abs(o.x - x) <= r + o.hw) this.hit(src, o, dmg);
    const c = team === 'b' ? this.E : this.P;
    if (Math.abs(c.x - x) <= r + c.hw) this.hit(src, c, dmg);
    if (!this.headless) { this.boomFx(x, fy || 180, r); this.shake = Math.max(this.shake, 3); }
    this.sfx('boom');
  }
  kill(o) {
    if (o.dead) return;
    o.dead = true; o.hp = 0;
    const D = o.D;
    if (o.team === 'e') {
      this.cost = Math.min(this.oven.max, this.cost + o.bounty);
      this.stats.kills++;
      if (o === this.boss) { this.boss = null; this.shake = 10; this.hitStop = 0.25; this.sfx('bigboom'); this.onEvent('bossDown', o); }
      if (D.split && !this.over) {
        const [id, n] = D.split;
        for (let k = 0; k < n; k++) this.later(0.05, () => { if (!this.over) this.spawnEnemy(id, o.x + (k - (n - 1) / 2) * 10, undefined, o.el); });
      }
    }
    if (D.burst && !this.over) this.later(0.06, () => this.explode(o.team, o.x, o.atk * D.burst, 32, this.uy(o) - 8));
    if (this.headless) return;
    const y = this.uy(o) - o.sh / 2 - (o.fly ? 14 : 0);
    const away = o.team === 'b' ? 1 : -1;
    this.corpses.push({ id: o.id, evo: o.evo, el: o.el, team: o.team, boss: o.boss, x: o.x, y: this.uy(o) - (o.fly ? 14 : 0), vx: away * BW.rand(30, 70), vy: -BW.rand(90, 140), rot: 0, vr: away * BW.rand(6, 12), t: 0, life: o.boss ? 1.3 : 0.55, sh: o.sh });
    if (o.team === 'e') {
      if (o.bounty && !this.over) this.float(o.x, y - 6, '+' + o.bounty, '#ffb02e', 0.8, 6);
      this.burst(o.x, y, ['#69d35c', '#5fff9a', '#2c6b28', '#ffffff'], o.boss ? 40 : 8, o.boss ? 120 : 60, 0.6, 150);
      this.sfx('pop');
      if (this.t - this.comboT < 1.3) this.comboN++; else this.comboN = 1;
      this.comboT = this.t;
      if (this.comboN >= 3 && !this.over) this.float(o.x, y - 16, this.comboN + ' COMBO!', '#ff8a2a', 0.9, 8);
    } else {
      this.burst(o.x, y, D.group === 'robot' ? ['#a9b6c6', '#5a6b80', '#5ff1ff', '#ffd23f'] : ['#c9772f', '#f6d8a0', '#8e4b1c', '#fbeccb'], 10, 60, 0.6, 150);
      this.sfx('die');
    }
  }
  attack(u, tg) {
    const D = u.D, src = this.src(u), dir = u.team === 'b' ? -1 : 1;
    u.lungeT = 0.2;
    const atX = u.x + dir * (u.hw + 4);
    const fy = this.uy(u) - u.sh * 0.55 - (u.fly ? 14 : 0);
    if (D.suicide) {
      this.explode(u.team, tg.isCastle ? atX : tg.x, u.atk, u.splash, this.uy(u) - 8);
      this.kill(u);
      return;
    }
    if (D.beam) {
      const list = this.inRange(u), c = this.castleInRange(u);
      list.forEach((o) => this.hit(src, o, u.atk));
      if (c) this.hit(src, c, u.atk);
      if (!this.headless) this.parts.push({ type: 'beam', x1: u.x + dir * u.hw, x2: u.x + dir * (u.range + u.hw + 6), y: fy + 2, life: 0.22, max: 0.22, col: u.evo ? '#ff5a5a' : '#5ff1ff' });
      this.sfx('laser');
    } else if (D.chain) {
      const seen = new Set([tg]);
      let cur = tg, dmg = u.atk;
      const pts = [[u.x + dir * u.hw, fy], [tg.x, tg.isCastle ? 165 : this.uy(tg) - tg.sh * 0.5]];
      this.hit(src, tg, dmg);
      for (let k = 1; k < D.chain && !cur.isCastle; k++) {
        let next = null, bd = 50;
        for (const o of this.units) { if (o.team === u.team || o.dead || seen.has(o)) continue; const d = Math.abs(o.x - cur.x); if (d < bd) { bd = d; next = o; } }
        if (!next) break;
        seen.add(next); cur = next; dmg *= 0.78;
        pts.push([next.x, this.uy(next) - next.sh * 0.5]);
        this.hit({ ...src, noFirst: true }, next, dmg);
      }
      if (!this.headless) this.parts.push({ type: 'bolt', pts, life: 0.2, max: 0.2, col: u.evo ? '#c27dff' : '#ffe14d' });
      this.sfx('laser');
    } else if (D.proj) {
      let list = [tg];
      if (D.targets > 1) { list = this.inRange(u).slice(0, D.targets); if (!list.length) list = [tg]; }
      list.forEach((t2, i) => this.later(i * 0.07, () => this.fire(u, t2, src)));
    } else {
      this.strike(src, tg, atX);
      if (D.hits > 1) for (let k = 1; k < D.hits; k++) this.later(0.14 * k, () => { if (!u.dead && !(tg.dead)) { u.lungeT = 0.16; this.strike(src, tg, atX); this.slashFx(u, tg, atX, true); } });
      this.slashFx(u, tg, atX);
    }
    if (D.heal) {
      let healed = 0;
      const h = Math.round(u.atk * D.heal);
      for (const a of this.units) {
        if (a.team !== u.team || a.dead || a === u || Math.abs(a.x - u.x) > 62) continue;
        if (D.cleanse && (a.dotT > 0 || a.stunT > 0 || a.slowT > 0)) {
          a.dotT = 0; a.dotDps = 0; a.stunT = 0; a.slowT = 0; a.frozen = false;
          if (!this.headless) this.float(a.x, this.uy(a) - a.sh - 4, '정화', '#b8ffe0', 0.6, 6);
        }
        if (a.hp >= a.max) continue;
        a.hp = Math.min(a.max, a.hp + h); healed++;
        if (!this.headless) { this.float(a.x, this.uy(a) - a.sh, '+' + h, '#7dff8a', 0.7, 6); this.burst(a.x, this.uy(a) - 8, ['#7dff8a', '#ffffff'], 3, 20, 0.6, -40); }
      }
      if (healed) this.sfx('heal');
    }
  }
  slashFx(u, tg, atX, alt) {
    if (this.headless) return;
    const dir = u.team === 'b' ? -1 : 1;
    const x = tg.isCastle ? atX : (tg.x + u.x + dir * u.hw) / 2 + dir * 3;
    const D = u.D;
    if (D.flame) {
      for (let i = 0; i < 9; i++) this.parts.push({ x: u.x + dir * u.hw, y: this.uy(u) - 12 + BW.rand(-2, 2), vx: dir * BW.rand(60, 130), vy: BW.rand(-22, 14), g: -30, life: BW.rand(0.2, 0.4), max: 0.4, col: BW.pick(u.evo ? ['#5fd8ff', '#d6fbff', '#3d7bff'] : ['#ff4d1a', '#ffb02e', '#ffe14d']), s: 2 });
      return;
    }
    const col = u.team === 'e' ? '#b8ff9a' : D.splash ? '#ffb02e' : D.group === 'robot' ? '#5ff1ff' : '#ffffff';
    this.parts.push({ type: 'slash', x, y: this.uy(u) - u.sh * 0.5 - (u.fly ? 14 : 0), dir, alt: !!alt, life: 0.14, max: 0.14, col, r: u.big || u.boss ? 14 : 8 });
  }
  strike(src, tg, atX) {
    if (src.splash) {
      const cx = tg.isCastle || tg.x === undefined ? atX : tg.x;
      for (const o of this.units) {
        if (o.team === src.team || o.dead) continue;
        if (Math.abs(o.x - cx) <= src.splash + o.hw) this.hit(src, o, src.atk);
      }
      const c = src.team === 'b' ? this.E : this.P;
      if (Math.abs(c.x - cx) <= src.splash + c.hw) this.hit(src, c, src.atk);
      if (!this.headless && src.splash >= 18) this.boomFx(cx, tg.isCastle || tg.sh === undefined ? 172 : this.uy(tg) - 8, src.splash);
    } else if (tg.sh !== undefined || tg.isCastle) this.hit(src, tg, src.atk);
  }
  fire(u, tg, src) {
    const dir = u.team === 'b' ? -1 : 1;
    const sx = u.x + dir * u.hw, sy = this.uy(u) - u.sh * 0.6 - (u.fly ? 14 : 0);
    const P = BW.PROJ[u.D.proj];
    const alive = tg.isCastle || !tg.dead;
    const tx = tg.isCastle ? tg.x - dir * tg.hw : tg.x;
    const ty = tg.isCastle ? 170 : this.uy(tg) - tg.sh * 0.5 - (tg.fly ? 14 : 0);
    const dist = Math.abs(tx - sx);
    this.projs.push({ type: u.D.proj, src, tgt: alive ? tg : null, x: sx, y: sy, sx, sy, tx, ty, dir, t: 0, dur: Math.max(0.2, dist / P.sp), arc: P.arc || 0, sp: P.sp, trail: P.trail, trT: 0, pierce: !!u.D.pierce, maxD: u.range + u.hw + 30, hits: new Set(), rot: 0 });
    this.sfx(['laser', 'plasma', 'missile', 'ice'].includes(u.D.proj) ? 'laser' : 'shoot');
  }
  uy(u) { return BW.GY + u.lane; }

  // ───── 업데이트 ─────
  step(realDt) {
    if (this.paused) return;
    if (this.hitStop > 0) { this.hitStop -= realDt; return; }
    let dt = Math.min(0.05, realDt) * this.speed;
    if (this.over && this.endT < 0.9) dt *= 0.35;
    while (dt > 0) { const d = Math.min(dt, 0.025); this.update(d); dt -= d; }
  }
  update(dt) {
    this.t += dt;
    const ov = this.oven;
    if (this.laterQ.length) {
      const due = this.laterQ.filter((q) => q.at <= this.t);
      if (due.length) { this.laterQ = this.laterQ.filter((q) => q.at > this.t); due.forEach((q) => q.fn()); }
    }
    if (!this.over) {
      this.cost = Math.min(ov.max, this.cost + ov.rate * dt);
      this.cannon = Math.min(1, this.cannon + dt / BW.CANNON_T);
      for (const c of this.cards) c.cd = Math.max(0, c.cd - dt);
      for (const s of this.spawners) {
        if (this.t >= s.next && (!s.n || s.count < s.n)) {
          if (this.spawnEnemy(s.e, undefined, undefined, s.el)) s.count++;
          // 전투 흐름: 90~150초에 적의 공세가 절정에 달하고, 이후에는 증원이 점점 바닥남
          const T = this.t;
          const pace = T < 90 ? 1 : T < 150 ? 1 - 0.4 * (T - 90) / 60 : Math.min(2.6, 0.6 + 2 * (T - 150) / 180);
          s.next += (s.i || 9999) * pace;
        }
      }
      const ratio = this.E.hp / this.E.max;
      for (const tr of this.triggers) {
        if (!tr.done && ratio <= tr.hp) {
          tr.done = true;
          for (let k = 0; k < tr.n; k++) this.later(k * 0.7, () => { if (!this.over) this.spawnEnemy(tr.e, undefined, undefined, tr.el); });
          this.onEvent('reinforce', tr); this.shake = 3;
        }
      }
      // 대공세
      if (this.t >= this.nextRush) {
        const R = this.st.rush;
        this.nextRush += R.every;
        if (R.pool.length) {
          for (let k = 0; k < R.n; k++) this.later(0.8 + k * 0.45, () => { if (!this.over) { const p = BW.pick(R.pool); this.spawnEnemy(p.e, undefined, this.rp, p.el); } });
          this.onEvent('rush'); this.sfx('warn');
        }
      }
      // 오라 갱신
      this.auraT -= dt;
      if (this.auraT <= 0) {
        this.auraT = 0.25;
        for (const a of this.units) {
          if (a.dead || !a.D.aura) continue;
          for (const o of this.units) if (o.team === a.team && !o.dead && Math.abs(o.x - a.x) <= 56) { o.buffT = 0.45; o.buffDr = Math.max(o.buffT > 0 ? o.buffDr : 0, a.D.aura); }
        }
      }
    }

    for (const u of this.units) {
      if (u.dead) continue;
      const D = u.D;
      u.animT += dt; u.flashT -= dt; u.hurtT -= dt; u.lungeT -= dt; u.spawnT -= dt;
      if (u.slowT > 0) u.slowT -= dt;
      if (u.shredT > 0) u.shredT -= dt;
      if (u.buffT > 0) { u.buffT -= dt; if (u.buffT <= 0) u.buffDr = 0; }
      if (u.dotT > 0) {
        u.dotT -= dt; u.dotAcc += dt;
        if (u.dotAcc >= 0.5) {
          u.dotAcc -= 0.5;
          const d = Math.max(1, Math.round(u.dotDps * 0.5));
          u.hp -= d; u.flashT = 0.05;
          if (!this.headless) this.float(u.x + BW.rand(-4, 4), this.uy(u) - u.sh, d, '#ffb02e', 0.45, 5);
          if (u.hp <= 0) { this.kill(u); continue; }
        }
        if (u.dotT <= 0) u.dotDps = 0;
      }
      if (u.shieldMax && u.shield < u.shieldMax) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = Math.min(u.shieldMax, u.shield + u.shieldMax * 0.15 * dt); }
      if (this.over) { if (u.team === (this.over === 'win' ? 'b' : 'e')) u.state = 'cheer'; continue; }
      if (D.summon) {
        u.summonT -= dt;
        if (u.summonT <= 0) {
          u.summonT = D.summon.every;
          for (let k = 0; k < D.summon.n; k++) this.spawnEnemy(D.summon.e, u.x + 6 + k * 9, undefined, u.el);
          if (!this.headless) this.burst(u.x + 10, this.uy(u) - 10, ['#b46cff', '#5fff9a', '#ffffff'], 16, 70, 0.5, 0);
        }
      }
      if (u.kbT > 0) {
        u.kbT -= dt; u.x += u.kbV * dt;
        u.z = Math.sin((1 - u.kbT / 0.32) * Math.PI) * 8;
        if (u.kbT <= 0) { u.z = 0; u.state = 'walk'; if (!this.headless) this.dust(u.x, this.uy(u), 3); }
        u.x = BW.clamp(u.x, this.E.x + 4, this.P.x - 4);
        continue;
      }
      if (u.stunT > 0) { u.stunT -= dt; u.state = 'stun'; if (u.stunT <= 0) u.frozen = false; continue; }
      const sf = (u.slowT > 0 ? u.slowF : 1) * (u.enraged ? 1.35 : 1);
      const tg = this.target(u);
      if (tg) {
        u.state = 'atk';
        const rage = D.rage ? 1 + D.rage * (1 - u.hp / u.max) : 1;
        u.atkT += dt * u.aspd * sf * rage;
        if (u.atkT >= 1) { u.atkT -= 1; this.attack(u, tg); }
      } else {
        u.state = 'walk';
        u.x += (u.team === 'b' ? -1 : 1) * u.spd * sf * dt;
        u.atkT = Math.max(u.atkT, 0.55);
      }
    }
    this.updateProjs(dt);
    this.units = this.units.filter((u) => !u.dead);

    if (!this.over) {
      if (this.E.hp <= 0) this.finish('win');
      else if (this.P.hp <= 0) this.finish('lose');
    } else {
      this.endT += dt;
      if (!this.headless && this.endT < 1.8 && Math.random() < 0.45) {
        const c = this.over === 'win' ? this.E : this.P;
        this.boomFx(c.x + BW.rand(-24, 24), BW.rand(110, 180), 10);
        if (Math.random() < 0.15) this.sfx('boom');
      }
      if (!this.headless && this.over === 'win' && this.endT < 2.2 && Math.random() < 0.6) {
        this.parts.push({ type: 'confetti', x: BW.rand(60, 460), y: -4, vx: BW.rand(-20, 20), vy: BW.rand(40, 90), g: 20, life: 2.6, max: 2.6, col: BW.pick(['#ffd23f', '#ff6fa5', '#5ff1ff', '#7dff8a', '#ffffff', '#ff8a2a']), s: 2 });
      }
      if (this.endT > 2.6 && !this.ended) { this.ended = true; this.onEnd(this.over === 'win'); }
    }
    if (!this.headless) this.updateFx(dt);
  }
  finish(res) {
    this.over = res;
    this.E.hp = Math.max(0, this.E.hp); this.P.hp = Math.max(0, this.P.hp);
    this.shake = 12; this.hitStop = 0.3;
    this.sfx('bigboom');
    for (const u of this.units) if (u.team === (res === 'win' ? 'e' : 'b')) this.kill(u);
    this.onEvent(res);
  }
  updateProjs(dt) {
    for (const p of this.projs) {
      if (p.done) continue;
      p.t += dt; p.rot += dt * 12;
      const foeTeam = p.src.team === 'b' ? 'e' : 'b';
      if (p.trail && !this.headless) {
        p.trT -= dt;
        if (p.trT <= 0) { p.trT = 0.035; this.parts.push({ type: 'smoke', x: p.x, y: p.y, vx: 0, vy: -4, s: 1.5, life: 0.4, max: 0.4, col: p.trail }); }
      }
      if (p.pierce) {
        p.x += p.dir * p.sp * dt;
        for (const o of this.units) {
          if (o.team !== foeTeam || o.dead || p.hits.has(o)) continue;
          if (Math.abs(o.x - p.x) <= o.hw + 2) { p.hits.add(o); this.hit(p.src, o, p.src.atk); }
        }
        const c = foeTeam === 'e' ? this.E : this.P;
        if (Math.abs(c.x - p.x) <= c.hw) { this.hit(p.src, c, p.src.atk); p.done = true; }
        if (Math.abs(p.x - p.sx) > p.maxD) p.done = true;
        continue;
      }
      const alive = p.tgt && !p.tgt.dead && (!p.tgt.isCastle || p.tgt.hp > 0);
      if (alive && !p.tgt.isCastle) { p.tx = p.tgt.x; p.ty = this.uy(p.tgt) - p.tgt.sh * 0.5 - p.tgt.z - (p.tgt.fly ? 14 : 0); }
      if (p.arc) {
        const k = Math.min(1, p.t / p.dur);
        p.x = BW.lerp(p.sx, p.tx, k); p.y = BW.lerp(p.sy, p.ty, k) - Math.sin(Math.PI * k) * p.arc;
        if (k >= 1) this.impact(p, alive);
      } else {
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), mv = p.sp * dt;
        if (d <= mv + 2) { p.x = p.tx; p.y = p.ty; this.impact(p, alive); }
        else { p.x += dx / d * mv; p.y += dy / d * mv; }
      }
    }
    this.projs = this.projs.filter((p) => !p.done);
  }
  impact(p, alive) {
    p.done = true;
    if (p.src.splash) this.strike(p.src, alive ? p.tgt : {}, p.x);
    else if (alive) this.hit(p.src, p.tgt, p.src.atk);
    if (!this.headless) {
      if (p.type === 'snow') this.burst(p.x, p.y, ['#ffffff', '#d6f3ff', '#9ad8ff'], 14, 70, 0.5, 40);
      else if (!p.src.splash) {
        const cols = { berry: ['#4b3a8c', '#8a7fd6'], cream: ['#fff6c8', '#ffffff'], swirl: ['#c98a4a', '#fffaf0'], laser: ['#ff6a6a', '#ffffff'], ring: ['#c27a3b'], mustard: ['#ffd23f', '#fff3a0'], pep: ['#b03024', '#f2cc50'], egg: ['#ffd84a', '#ffffff'], toast: ['#d99a4a', '#fbeccb'], ice: ['#9ad8ff', '#ffffff'], goo: ['#7dff8a', '#ffffff'] }[p.type] || ['#ffffff'];
        this.burst(p.x, p.y, cols, 5, 45, 0.3, 60);
      }
    }
  }

  // ───── 이펙트 ─────
  burst(x, y, cols, n, sp, life, grav = 100, size = 1) {
    if (this.headless) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, g: grav, life: life * (0.6 + Math.random() * 0.6), max: life, col: BW.pick(cols), s: size + (Math.random() < 0.3 ? 1 : 0) });
    }
  }
  dust(x, y, n = 4) {
    if (this.headless) return;
    for (let i = 0; i < n; i++) this.parts.push({ type: 'smoke', x: x + BW.rand(-4, 4), y: y, vx: BW.rand(-14, 14), vy: -BW.rand(4, 12), s: 2, life: 0.35, max: 0.35, col: '#e8dcc0' });
  }
  boomFx(x, y, r) {
    if (this.headless) return;
    this.parts.push({ type: 'ring', x, y, r: 2, max: 0.35, life: 0.35, R: r + 6 });
    this.burst(x, y, ['#ffd23f', '#ff8a2a', '#ff4d1a', '#ffffff'], 10 + r / 2, 60 + r * 2, 0.45, 60);
  }
  float(x, y, text, col, life = 0.7, size = 6) { if (!this.headless) this.floats.push({ x, y, text: String(text), col, life, max: life, size }); }
  updateFx(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      if (p.type === 'ring') { p.r = BW.lerp(p.R, 2, p.life / p.max); continue; }
      if (p.type === 'smoke') { p.x += p.vx * dt; p.y += p.vy * dt; p.s += dt * 5; continue; }
      if (!p.vx && !p.vy && !p.g) continue;
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'confetti') { p.vx += Math.sin(this.t * 6 + p.y) * 2; continue; }
      if (p.y > BW.GY + 10 && p.g > 0) { p.y = BW.GY + 10; p.vy *= -0.3; p.vx *= 0.6; }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const c of this.corpses) {
      c.t += dt;
      if (c.boss) { if (Math.random() < 0.5) this.boomFx(c.x + BW.rand(-14, 14), c.y - BW.rand(4, c.sh), 6); continue; }
      c.vy += 380 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    }
    this.corpses = this.corpses.filter((c) => {
      if (c.t < c.life) return true;
      if (c.boss) { this.boomFx(c.x, c.y - c.sh / 2, 40); this.burst(c.x, c.y - c.sh / 2, ['#69d35c', '#5fff9a', '#ffffff', '#ffd23f'], 60, 160, 0.9, 120, 2); this.shake = 10; this.sfx('bigboom'); }
      else this.burst(c.x, Math.min(c.y, BW.GY + 4), c.team === 'e' ? ['#d8d8e0', '#ffffff', '#69d35c'] : ['#fbeccb', '#ffffff', '#c9772f'], 6, 40, 0.4, 60);
      return false;
    });
    for (const f of this.floats) { f.life -= dt; f.y -= 18 * dt; }
    this.floats = this.floats.filter((f) => f.life > 0);
    this.shake = Math.max(0, this.shake - dt * 18);
    this.beamT = Math.max(0, this.beamT - dt);
    this.cannonFx = Math.max(0, this.cannonFx - dt);
    this.ovenPop = Math.max(0, this.ovenPop - dt);
    this.portalPop = Math.max(0, this.portalPop - dt);
    this.E.dmgT -= dt; this.P.dmgT -= dt;
    this.smokeT -= dt;
    if (this.smokeT <= 0 && this.over !== 'lose') {
      this.smokeT = 0.35 - this.ovenLv * 0.025;
      this.parts.push({ type: 'smoke', x: this.P.x - 33 + 50 + BW.rand(-2, 2), y: 106, vx: BW.rand(-6, -2), vy: -14, s: 2, life: 2.2, max: 2.2, col: '#d8d0c8' });
    }
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.1;
      for (const u of this.units) {
        const y = this.uy(u) - (u.fly ? 14 : 0);
        if (u.evo && Math.random() < 0.12) this.parts.push({ type: 'spark', x: u.x + BW.rand(-u.hw, u.hw), y: y - BW.rand(4, u.sh), vx: 0, vy: -8, g: 0, life: 0.5, max: 0.5, col: '#fff3a0' });
        if (u.dotT > 0 && Math.random() < 0.5) this.parts.push({ x: u.x + BW.rand(-u.hw, u.hw), y: y - BW.rand(2, u.sh), vx: 0, vy: -20, g: -10, life: 0.3, max: 0.3, col: u.dotEl === 'd' ? BW.pick(['#a05ae0', '#5a2a8a']) : BW.pick(['#ff8a2a', '#ffd23f']), s: 1 });
        // 속성 오라
        if (u.el && Math.random() < 0.3) {
          const px = u.x + BW.rand(-u.hw, u.hw), py = y - BW.rand(2, u.sh), col = BW.EL[u.el].col;
          if (u.el === 'f') this.parts.push({ x: px, y: py, vx: 0, vy: -26, g: 0, life: 0.35, max: 0.35, col: BW.pick([col, '#ffd23f']), s: 1 });
          else if (u.el === 'w') this.parts.push({ x: px, y: py, vx: -50, vy: BW.rand(-6, 6), g: 0, life: 0.25, max: 0.25, col: '#d8fff0', s: 2 });
          else if (u.el === 'd') this.parts.push({ x: px, y: py, vx: BW.rand(-6, 6), vy: -10, g: 0, life: 0.5, max: 0.5, col: BW.pick([col, '#3a1466']), s: 2 });
          else this.parts.push({ type: 'spark', x: px, y: py, vx: 0, vy: 6, g: 0, life: 0.45, max: 0.45, col: '#d6f3ff' });
        }
        if (u.fly && u.state === 'walk' && Math.random() < 0.4) this.parts.push({ x: u.x - (u.team === 'b' ? -1 : 1) * u.hw, y: y - 4, vx: 0, vy: 14, g: 0, life: 0.25, max: 0.25, col: u.team === 'b' ? '#9ad8ff' : '#b46cff', s: 1 });
        if ((u.enraged || u.elite) && Math.random() < (u.elite ? 0.3 : 0.5)) this.parts.push({ x: u.x + BW.rand(-u.hw, u.hw), y: y - u.sh, vx: 0, vy: -30, g: 0, life: 0.4, max: 0.4, col: '#ff3b3b', s: u.elite ? 1 : 2 });
        // 걸음 먼지 (큰 유닛)
        if ((u.big || u.boss) && u.state === 'walk' && !u.fly) {
          const n = Math.floor(u.animT * (1.6 + u.spd / 16));
          if (n !== u.stepN) { u.stepN = n; this.dust(u.x, this.uy(u), 3); if (u.boss) this.shake = Math.max(this.shake, 1.2); }
        }
      }
    }
  }

  // ───── 렌더링 ─────
  render() {
    const c = this.ctx, S = BW.Sprites, GY = BW.GY;
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.imageSmoothingEnabled = false;
    if (this.shake > 0) c.translate(Math.round(BW.rand(-1, 1) * this.shake) / 2, Math.round(BW.rand(-1, 1) * this.shake) / 2);
    c.drawImage(this.bg, 0, 0);
    BW.Scenes.anim(c, this.st.theme, this.t);

    // 적 기지
    const eR = this.E.hp / this.E.max, eD = eR > 0.6 ? 0 : eR > 0.3 ? 1 : 2;
    const eb = S.get('base', eD);
    const esh = this.E.dmgT > 0 ? Math.round(BW.rand(-1, 1)) : 0;
    const ex = Math.round(this.E.x - eb.w / 2) + esh, ey = GY + 8 - eb.h;
    this.drawCastle(c, eb, S.white('base', eD), ex, ey, this.E, this.over === 'win', this.portalPop > 0 ? 1 + this.portalPop * 0.12 : 1);
    if (this.over !== 'win') {
      const pr = 5 + Math.sin(this.t * 6) * 1 + this.portalPop * 16;
      c.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 6);
      c.fillStyle = '#5fff9a'; c.beginPath(); c.ellipse(ex + 37, ey + 72, pr, pr + 1, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; c.fillStyle = '#d8ffe6'; c.fillRect(Math.round(ex + 37 + Math.cos(a) * 4), Math.round(ey + 72 + Math.sin(a) * 5), 1, 1); }
      if (Math.floor(this.t * 2) % 2 === 0) { c.fillStyle = '#ff3b3b'; c.fillRect(ex + 26, ey + 1, 3, 3); }
    }

    // 오븐
    const pR = this.P.hp / this.P.max, pD = pR > 0.6 ? 0 : pR > 0.3 ? 1 : 2;
    const ob = S.get('oven', pD);
    const osh = this.P.dmgT > 0 ? Math.round(BW.rand(-1, 1)) : 0;
    const ox = Math.round(this.P.x - 33) + osh, oy = GY + 8 - ob.h;
    this.drawCastle(c, ob, S.white('oven', pD), ox, oy, this.P, this.over === 'lose', 1 + this.ovenPop * 0.25);
    if (this.over !== 'lose') {
      BW.Scenes.fire(c, ox + 33, oy + 64, this.t, 0.7 + this.ovenLv * 0.08 + this.ovenPop * 2);
      if (this.cannonFx > 0) {
        const k = 1 - this.cannonFx / 0.32;
        c.globalAlpha = 0.5 + 0.5 * k; c.fillStyle = '#fff3a0';
        c.beginPath(); c.arc(ox + 33, oy + 56, 3 + k * 12, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ox + 33, oy + 56, 1 + k * 6, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      }
    }

    // 연기 (뒤쪽)
    for (const p of this.parts) if (p.type === 'smoke') {
      c.globalAlpha = 0.4 * (p.life / p.max); c.fillStyle = p.col || '#d8d0c8';
      const s = Math.round(p.s); c.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    c.globalAlpha = 1;

    // 유닛 & 시체
    const list = this.units.slice().sort((a, b) => a.lane - b.lane || (a.team === 'b' ? 1 : -1));
    for (const u of list) this.drawUnit(c, u);
    for (const k of this.corpses) {
      const spr = (k.t < 0.08 || (k.boss && Math.floor(k.t * 14) % 2) ? S.white : S.get)(k.id, 0, k.evo, k.el);
      c.save();
      c.globalAlpha = k.boss ? 1 : Math.max(0, 1 - k.t / k.life * 0.7);
      c.translate(Math.round(k.x + (k.boss ? BW.rand(-2, 2) : 0)), Math.round(k.y - spr.h / 2 + 2));
      c.rotate(k.rot);
      c.drawImage(spr.cv, -spr.w / 2, -spr.h / 2);
      c.restore();
    }

    // 투사체
    for (const p of this.projs) this.drawProj(c, p);

    // 파티클
    for (const p of this.parts) {
      if (p.type === 'smoke') continue;
      const a = Math.min(1, p.life / p.max * 1.5);
      c.globalAlpha = a;
      if (p.type === 'ring') {
        c.strokeStyle = '#fff3a0'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 0.5, 0, 0, Math.PI * 2); c.stroke();
      } else if (p.type === 'slash') {
        const k = 1 - p.life / p.max;
        c.strokeStyle = p.col; c.lineWidth = 2.5 * (1 - k * 0.6);
        c.beginPath();
        const a0 = p.alt ? 0.9 : -0.9, sw = (p.alt ? -1 : 1) * (0.6 + k * 1.2);
        if (p.dir < 0) c.arc(p.x + p.r * 0.6, p.y, p.r, Math.PI - a0, Math.PI - a0 - sw, sw > 0);
        else c.arc(p.x - p.r * 0.6, p.y, p.r, a0, a0 + sw, sw < 0);
        c.stroke();
      } else if (p.type === 'star') {
        c.fillStyle = '#ffffff';
        const x = Math.round(p.x), y = Math.round(p.y), s = p.s;
        c.fillRect(x - s, y, s * 2 + 1, 1); c.fillRect(x, y - s, 1, s * 2 + 1); c.fillRect(x - 1, y - 1, 3, 3);
      } else if (p.type === 'beam') {
        const w = 1 + 4 * (p.life / p.max);
        const x1 = Math.min(p.x1, p.x2), x2 = Math.max(p.x1, p.x2);
        c.fillStyle = p.col; c.fillRect(x1, p.y - w / 2, x2 - x1, w);
        c.fillStyle = '#ffffff'; c.fillRect(x1, p.y - w / 4, x2 - x1, w / 2);
      } else if (p.type === 'bolt') {
        c.strokeStyle = p.col; c.lineWidth = 1.5;
        c.beginPath();
        for (let i = 0; i < p.pts.length - 1; i++) {
          const [x1, y1] = p.pts[i], [x2, y2] = p.pts[i + 1];
          c.moveTo(x1, y1);
          for (let s = 1; s <= 4; s++) c.lineTo(x1 + (x2 - x1) * s / 4 + (s < 4 ? BW.rand(-3, 3) : 0), y1 + (y2 - y1) * s / 4 + (s < 4 ? BW.rand(-4, 4) : 0));
        }
        c.stroke();
        c.fillStyle = '#ffffff'; p.pts.slice(1).forEach(([x, y]) => c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3));
      } else if (p.type === 'spark') {
        c.fillStyle = p.col; const x = Math.round(p.x), y = Math.round(p.y); c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1);
      } else if (p.type === 'confetti') {
        c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), Math.sin(this.t * 10 + p.x) > 0 ? 2 : 1, 2);
      } else { c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    }
    c.globalAlpha = 1;

    // 오븐 대포 광선
    if (this.beamT > 0) {
      const k = this.beamT / 0.7, y = 160, x0 = this.P.x - 345;
      c.globalAlpha = Math.min(1, k * 2);
      c.fillStyle = '#ff8a2a'; c.fillRect(x0, y - 15 * k, 335, 30 * k);
      c.fillStyle = '#ffd23f'; c.fillRect(x0, y - 9 * k, 335, 18 * k);
      c.fillStyle = '#ffffff'; c.fillRect(x0, y - 4 * k, 335, 8 * k);
      c.strokeStyle = '#fff3a0'; c.lineWidth = 1;
      for (let i = 0; i < 5; i++) { const rx = this.P.x - 20 - ((this.t * 400 + i * 70) % 330); c.beginPath(); c.ellipse(rx, y, 4, 18 * k + 4, 0, 0, Math.PI * 2); c.stroke(); }
      c.globalAlpha = 1;
    }

    // 떠오르는 숫자 (팝 효과)
    for (const f of this.floats) {
      const age = f.max - f.life;
      const sc = 1 + 0.9 * Math.max(0, 1 - age / 0.12);
      c.globalAlpha = Math.min(1, f.life / f.max * 2.5);
      c.font = `${Math.round(f.size * sc)}px Galmuri11, monospace`; c.textAlign = 'center';
      c.fillStyle = '#1a0a04'; c.fillText(f.text, Math.round(f.x) + 0.5, Math.round(f.y) + 0.5);
      c.fillStyle = f.col; c.fillText(f.text, Math.round(f.x), Math.round(f.y));
    }
    c.globalAlpha = 1;

    // 성 체력바
    if (this.over !== 'win') this.castleBar(c, this.E, ex + eb.w / 2, ey - 8, '#e8384f');
    if (this.over !== 'lose') this.castleBar(c, this.P, ox + 33, oy - 6, '#5fd16a');

    // 보스 체력바
    if (this.boss && !this.boss.dead) {
      const b = this.boss, w = 170, x = (BW.W - w) / 2, y = 36;
      c.fillStyle = '#1a0a1a'; c.fillRect(x - 1, y - 1, w + 2, 7);
      c.fillStyle = '#5a1a3a'; c.fillRect(x, y, w, 5);
      c.fillStyle = b.enraged ? '#ff5a2a' : '#ff4d8a'; c.fillRect(x, y, Math.round(w * b.hp / b.max), 5);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x, y, Math.round(w * b.hp / b.max), 1);
      c.font = '6px Galmuri11, monospace'; c.textAlign = 'center';
      const nm = BW.ENEMIES[b.id].name + (b.enraged ? ' (분노)' : '');
      c.fillStyle = '#000'; c.fillText(nm, BW.W / 2 + 0.5, y - 2.5);
      c.fillStyle = b.enraged ? '#ffb38a' : '#ffd6e6'; c.fillText(nm, BW.W / 2, y - 3);
    }
  }
  drawCastle(c, spr, white, x, y, k, collapsing, pop) {
    const GY = BW.GY;
    c.save();
    if (collapsing) {
      const sink = Math.min(spr.h, this.endT * 34);
      c.beginPath(); c.rect(x - 10, 0, spr.w + 20, GY + 8); c.clip();
      c.translate(Math.round(BW.rand(-2, 2)), sink);
    }
    if (pop !== 1) {
      c.translate(x + spr.w / 2, y + spr.h); c.scale(2 - pop, pop); c.drawImage(spr.cv, -spr.w / 2, -spr.h);
      if (k.dmgT > 0) { c.globalAlpha = 0.35; c.drawImage(white.cv, -spr.w / 2, -spr.h); }
    } else {
      c.drawImage(spr.cv, x, y);
      if (k.dmgT > 0) { c.globalAlpha = 0.35; c.drawImage(white.cv, x, y); }
    }
    c.restore();
  }
  castleBar(c, k, cx, y, col) {
    const w = 46, x = Math.round(cx - w / 2), r = Math.max(0, k.hp / k.max);
    c.fillStyle = '#1a0a04'; c.fillRect(x - 1, y - 1, w + 2, 5);
    c.fillStyle = '#3a2a2a'; c.fillRect(x, y, w, 3);
    c.fillStyle = col; c.fillRect(x, y, Math.round(w * r), 3);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x, y, Math.round(w * r), 1);
    c.font = '6px Galmuri11, monospace'; c.textAlign = 'center';
    const txt = BW.fmt(Math.max(0, k.hp)) + ' / ' + BW.fmt(k.max);
    c.fillStyle = '#1a0a04'; c.fillText(txt, cx + 0.5, y - 2.5);
    c.fillStyle = '#ffffff'; c.fillText(txt, cx, y - 3);
  }
  drawUnit(c, u) {
    const S = BW.Sprites, D = u.D;
    const dir = u.team === 'b' ? -1 : 1;
    const anim = D.anim || (u.fly ? 'hover' : (u.big || u.boss) ? 'heavy' : 'walk');
    const gy = this.uy(u);
    let f = 0, z = u.z, sx = 1, sy = 1, rot = 0, ox = 0, mid = false, alpha = 1;
    const ph = u.animT * (1.6 + u.spd / 16), k = ph % 1;
    const ranged = !!(D.proj || D.beam || D.chain);
    if (u.state === 'walk') {
      if (anim === 'roll') { f = 2; rot = u.x / Math.max(5, u.hw - 1); mid = true; z += Math.abs(Math.sin(ph * Math.PI * 2)) * 1; }
      else if (anim === 'ooze') { const s = Math.sin(ph * Math.PI * 2); sx = 1 + 0.13 * s; sy = 1 - 0.13 * s; f = s > 0 ? 1 : 0; }
      else if (anim === 'hover') { f = Math.floor(ph * 3) % 2; rot = dir * 0.1; }
      else if (anim === 'drive') { f = Math.floor(ph * 4) % 2; z += f * 0.5; }
      else {
        const hop = anim === 'leap' ? 8 : anim === 'heavy' ? 1.5 : 2.6, s = Math.sin(k * Math.PI);
        z += s * hop; sy = 0.93 + 0.14 * s; sx = 1.07 - 0.12 * s; f = Math.floor(ph) % 2; rot = dir * 0.07 * s;
        if (anim === 'leap') rot = dir * (0.5 - k) * 0.6;
      }
    } else if (u.state === 'atk') {
      const br = Math.sin(u.animT * 6) * 0.03;
      sy = 1 + br; sx = 1 - br;
      if (anim === 'hover' || anim === 'roll') f = Math.floor(u.animT * 6) % 2;
      const w = Math.max(0, (u.atkT - 0.72) / 0.28);
      if (ranged) { sx *= 1 + 0.08 * w; sy *= 1 - 0.08 * w; }
      else { ox -= dir * 3 * w; rot = -dir * 0.2 * w; sx *= 1 + 0.06 * w; sy *= 1 - 0.06 * w; }
    } else if (u.state === 'cheer') { z += Math.abs(Math.sin(u.animT * 8)) * 7; f = Math.floor(u.animT * 6) % 2; sy = 1 + 0.08 * Math.sin(u.animT * 16); sx = 2 - sy; }
    else if (u.state === 'stun') { rot = Math.sin(u.animT * 22) * 0.07; }
    else if (u.state === 'kb') { rot = -dir * (1 - u.kbT / 0.32) * 1.4; mid = true; }
    if (u.lungeT > 0) {
      const l = u.lungeT / 0.2;
      if (ranged) { ox -= dir * 3 * l; rot = -dir * 0.12 * l; }
      else { ox += dir * 6 * l; rot = dir * 0.32 * l; sx *= 1 + 0.1 * l; sy *= 1 - 0.06 * l; }
    }
    if (u.hurtT > 0 && u.state !== 'kb') { ox -= dir * 2; sx *= 0.9; sy *= 1.1; }
    if (u.enraged) { sx *= 1.06; sy *= 1.06; }
    if (u.elite) { sx *= 1.14; sy *= 1.14; }
    if (u.spawnT > 0) {
      const tot = u.team === 'b' ? 0.38 : 0.2, kk = BW.clamp(1 - u.spawnT / tot, 0, 1);
      if (u.team === 'b') { z += Math.sin(kk * Math.PI) * 18; ox += (1 - kk) * 14; sx *= 0.5 + 0.5 * kk; sy *= 0.5 + 0.5 * kk; rot = (1 - kk) * 1.2; }
      else { sx *= 0.3 + 0.7 * kk; sy *= 0.3 + 0.7 * kk; alpha = 0.4 + 0.6 * kk; }
      if (kk >= 0.92 && !u.landed) { u.landed = true; this.dust(u.x, gy, 4); }
    }
    const fly = u.fly ? (D.low ? 6 : 14) + Math.sin(u.animT * 4) * 2 : 0;
    const spr = (u.flashT > 0 ? S.white : S.get)(u.id, f, u.evo, u.frozen ? 'i' : u.el);
    const px = Math.round(u.x + ox), py = Math.round(gy - z - fly);
    // 그림자
    c.fillStyle = 'rgba(20,10,20,0.28)';
    const sw = Math.max(4, Math.round((u.hw * 2 - (u.fly ? 4 : 0)) * (1 - Math.min(0.5, z / 30))));
    c.fillRect(Math.round(u.x - sw / 2), gy, sw, 1);
    c.fillRect(Math.round(u.x - sw / 2 + 2), gy + 1, sw - 4, 1);
    if (u.buffT > 0) { c.fillStyle = 'rgba(95,241,255,0.55)'; c.fillRect(Math.round(u.x - sw / 2), gy + 2, sw, 1); }
    c.globalAlpha = alpha;
    if (rot || sx !== 1 || sy !== 1) {
      c.save();
      if (mid) { c.translate(px, py - spr.h / 2 + 2); c.rotate(rot); c.scale(sx, sy); c.drawImage(spr.cv, -spr.w / 2, -spr.h / 2); }
      else { c.translate(px, py + 2); c.rotate(rot); c.scale(sx, sy); c.drawImage(spr.cv, -spr.w / 2, -spr.h); }
      c.restore();
    } else c.drawImage(spr.cv, Math.round(px - spr.w / 2), py - spr.h + 2);
    c.globalAlpha = 1;
    const top = py - u.sh - 2;
    if (u.shield > 0) {
      c.strokeStyle = `rgba(95,241,255,${0.45 + 0.25 * Math.sin(u.animT * 8)})`; c.lineWidth = 1;
      c.beginPath(); c.ellipse(px, py - u.sh / 2, u.hw + 4, u.sh / 2 + 3, 0, 0, Math.PI * 2); c.stroke();
    }
    if (u.slowT > 0) {
      c.fillStyle = '#9ad8ff';
      const t = u.animT * 6;
      for (let i = 0; i < 3; i++) c.fillRect(Math.round(u.x + Math.cos(t + i * 2.1) * 6), Math.round(top + 4 + Math.sin(t + i * 2.1) * 2), 1, 1);
    }
    if (u.stunT > 0) {
      const t = u.animT * 9;
      for (let i = 0; i < 3; i++) { const sxp = Math.round(u.x + Math.cos(t + i * 2.1) * 6), syp = Math.round(top + 1 + Math.sin(t + i * 2.1) * 2); c.fillStyle = '#ffe14d'; c.fillRect(sxp - 1, syp, 3, 1); c.fillRect(sxp, syp - 1, 1, 3); }
    }
    if (u.shredT > 0) { c.fillStyle = '#ffffff'; c.fillRect(px - 2, top + 5, 1, 3); c.fillRect(px + 1, top + 4, 1, 3); c.fillStyle = '#c8d0dc'; c.fillRect(px - 1, top + 7, 2, 1); }
    if (u.hp < u.max && !u.boss) {
      const w = Math.max(10, u.hw * 2), bx = Math.round(u.x - w / 2), by = top;
      c.fillStyle = '#1a0a04'; c.fillRect(bx - 1, by - 1, w + 2, 3);
      c.fillStyle = u.team === 'b' ? '#7dff6a' : '#ff5a5a';
      c.fillRect(bx, by, Math.max(1, Math.round(w * u.hp / u.max)), 1);
      if (u.shield > 0) { c.fillStyle = '#5ff1ff'; c.fillRect(bx, by - 1, Math.max(1, Math.round(w * u.shield / u.shieldMax)), 1); }
    }
  }
  drawProj(c, p) {
    const x = Math.round(p.x), y = Math.round(p.y);
    const R = (col, xx, yy, w, h) => { c.fillStyle = col; c.fillRect(xx, yy, w, h); };
    const o = Math.round(Math.sin(p.rot) * 1);
    switch (p.type) {
      case 'berry': R('#1a1030', x - 2, y - 1, 4, 3); R('#1a1030', x - 1, y - 2, 2, 5); R('#4b3a8c', x - 1, y - 1, 2, 3); R('#8a7fd6', x - 1, y - 1, 1, 1); break;
      case 'crumb': R('#5a3418', x - 2, y - 2, 5, 5); R('#e9ab55', x - 1, y - 1, 3, 3); R('#f6c779', x - 1, y - 1, 1, 1); break;
      case 'cream': R('#c8a050', x - 2, y - 1, 4, 3); R('#fff6c8', x - 1, y - 1, 2, 2); break;
      case 'goo': R('#1a5a2a', x - 2, y - 2, 4, 4); R('#7dff8a', x - 1, y - 1, 2, 2); break;
      case 'acid': R('#3d4f12', x - 2, y - 2, 4, 4); R('#b8ff3a', x - 1, y - 1, 2, 2); R('#b8ff3a', x - 3 * p.dir, y, 1, 1); break;
      case 'plasma': R('#1a5a2a', x - 3, y - 3, 7, 7); R('#5fff9a', x - 2, y - 2, 5, 5); R('#ffffff', x - 1, y - 1, 2, 2); break;
      case 'laser': R(p.src.team === 'e' ? '#ff4d4d' : '#ffd23f', x - 4, y, 8, 1); R('#ffffff', x - 2, y, 4, 1); break;
      case 'ice': R('#1a3a6a', x - 3, y - 1, 7, 3); R('#9ad8ff', x - 2, y, 5, 1); R('#ffffff', x + 2 * p.dir, y, 1, 1); break;
      case 'mustard': R('#8a6a00', x - 2, y - 2, 5, 5); R('#ffd23f', x - 1, y - 1, 3, 3); R('#fff3a0', x - 1, y - 1, 1, 1); break;
      case 'egg': R('#8a6a2a', x - 3, y - 2, 6, 5); R('#ffffff', x - 2, y - 1, 4, 3); R('#ffd84a', x - 1, y, 2, 1); break;
      case 'snow': R('#5a8ac8', x - 3, y - 3, 7, 7); R('#ffffff', x - 2, y - 2, 5, 5); R('#d6f3ff', x, y, 2, 2); break;
      case 'shell': R('#1a1a22', x - 3, y - 3, 7, 7); R('#5a6270', x - 2, y - 2, 5, 5); R('#c8d0dc', x - 2, y - 2, 2, 2); break;
      case 'bomb': R('#141022', x - 3, y - 3, 6, 7); R('#3a3550', x - 2, y - 2, 4, 5); R('#ff3b3b', x - 1, y + 2, 2, 1); break;
      case 'pep': R('#3b1d0c', x - 3, y - 2 + o, 6, 5); R('#b03024', x - 2, y - 1 + o, 4, 3); R('#f2cc50', x - 1, y + o, 1, 1); break;
      case 'toast': R('#3b1d0c', x - 3, y - 3 + o, 7, 7); R('#d99a4a', x - 2, y - 2 + o, 5, 5); R('#fbeccb', x - 1, y - 1 + o, 3, 3); break;
      case 'missile': {
        R('#1c2a3a', x - 4, y - 2, 9, 4); R('#d8dde6', x - 3, y - 1, 7, 2); R('#e8384f', x + 3 * p.dir, y - 1, 2, 2);
        R(Math.floor(p.rot) % 2 ? '#ffd23f' : '#ff8a2a', x - 5 * p.dir, y - 1, 2, 2); break;
      }
      case 'ring': R('#3b1d0c', x - 3, y - 3 + o, 7, 7); R('#c27a3b', x - 2, y - 2 + o, 5, 5); R('#e8a85a', x - 2, y - 2 + o, 2, 1); R('#3b1d0c', x - 1, y - 1 + o, 3, 3); break;
      case 'swirl': {
        for (let i = 0; i < 6; i++) { const a = p.rot + i * 1.05, r = 1 + i * 0.5; R(i % 2 ? '#fffaf0' : '#8a4a22', Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
        R('#d39150', x, y, 1, 1); break;
      }
      default: R('#ffffff', x - 1, y - 1, 2, 2);
    }
  }
};
