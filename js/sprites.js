// 빵들의 전쟁 - 픽셀 스프라이트 생성기 (Canvas 2D 절차적 도트)
'use strict';
BW.Sprites = (() => {
  const sh = BW.shadeHex;
  const rgbCache = {};
  function rgba(hex) {
    if (rgbCache[hex]) return rgbCache[hex];
    const n = hex.slice(1);
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    const a = n.length >= 8 ? parseInt(n.slice(6, 8), 16) : 255;
    return (rgbCache[hex] = [r, g, b, a]);
  }

  // ───── 픽셀 그리드 ─────
  class G {
    constructor(w, h, oy = 0) { this.w = w; this.h = h; this.oy = oy; this.d = new Array(w * h).fill(0); }
    set(x, y, c) {
      x = Math.floor(x); y = Math.floor(y) + this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.d[y * this.w + x] = c;
    }
    get(x, y) {
      x = Math.floor(x); y = Math.floor(y) + this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.d[y * this.w + x];
    }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    eachEll(cx, cy, rx, ry, fn) {
      const y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
      const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
        if (d <= 1) fn(x, y, nx, ny, d);
      }
    }
    ell(cx, cy, rx, ry, c, maxY = 1e9) { this.eachEll(cx, cy, rx, ry, (x, y) => { if (y <= maxY) this.set(x, y, c); }); }
    clearEll(cx, cy, rx, ry) { this.eachEll(cx, cy, rx, ry, (x, y) => this.set(x, y, 0)); }
    // 왼쪽 위 광원 음영 타원
    sh(cx, cy, rx, ry, base, o = {}) {
      const hi = sh(base, o.hi ?? 0.3), lo = sh(base, -0.22), lo2 = sh(base, -0.38), spec = sh(base, 0.62);
      this.eachEll(cx, cy, rx, ry, (x, y, nx, ny, d) => {
        if (o.maxY !== undefined && y > o.maxY) return;
        if (o.minY !== undefined && y < o.minY) return;
        const v = nx * 0.55 + ny * 0.85;
        let c = base;
        if (v < -0.58) c = hi;
        if (v > 0.42) c = lo;
        if (d > 0.78 && v > 0.15) c = lo2;
        if (o.gloss && (nx + 0.42) ** 2 + (ny + 0.5) ** 2 < 0.035) c = spec;
        this.set(x, y, c);
      });
    }
    shRect(x, y, w, h, base) {
      const hi = sh(base, 0.28), lo = sh(base, -0.25);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        let c = base;
        if (j === 0) c = hi; else if (j === h - 1 || i === w - 1) c = lo; else if (i === 0) c = sh(base, 0.12);
        this.set(x + i, y + j, c);
      }
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // 채워진 픽셀에만 덧칠
    paint(x, y, c) { if (this.get(x, y)) this.set(x, y, c); }
    over(fn) {
      for (let ry = 0; ry < this.h; ry++) for (let x = 0; x < this.w; x++) {
        const c = this.d[ry * this.w + x];
        if (!c) continue;
        const r = fn(x, ry - this.oy, c);
        if (r !== undefined) this.d[ry * this.w + x] = r;
      }
    }
    outline(col) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.d[y * this.w + x]) continue;
        const f = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && this.d[yy * this.w + xx] && this.d[yy * this.w + xx] !== col;
        if (f(x - 1, y) || f(x + 1, y) || f(x, y - 1) || f(x, y + 1)) add.push(y * this.w + x);
      }
      add.forEach((i) => (this.d[i] = col));
    }
    canvas() {
      const cv = document.createElement('canvas');
      cv.width = this.w; cv.height = this.h;
      const cx = cv.getContext('2d');
      const img = cx.createImageData(this.w, this.h);
      for (let i = 0; i < this.d.length; i++) {
        const c = this.d[i];
        if (!c) continue;
        const [r, g, b, a] = rgba(c);
        img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = a;
      }
      cx.putImageData(img, 0, 0);
      return cv;
    }
  }

  // ───── 공통 파츠 ─────
  const EYE = '#1d1010', BLUSH = '#f2847c', MOUTH = '#5a1e14', FOOT = '#5a3418';
  function face(g, x, y, gap, o = {}) {
    const E = o.eye || EYE;
    g.rect(x, y, 1, 2, E); g.rect(x + gap, y, 1, 2, E);
    if (o.glint) { g.set(x, y, '#ffffff'); g.set(x + gap, y, '#ffffff'); }
    if (!o.noBlush) { g.set(x - 1, y + 2, BLUSH); g.set(x + gap + 1, y + 2, BLUSH); }
    const mx = o.mx ?? x + Math.floor(gap / 2), my = o.my ?? y + 2;
    if (o.mouth !== 'none') {
      g.set(mx, my, MOUTH);
      if (gap % 2 === 1 || o.mouth === 'wide') g.set(mx + 1, my, MOUTH);
    }
    if (o.angry) { g.set(x - 1, y - 2, E); g.set(x, y - 1, E); g.set(x + gap + 1, y - 2, E); g.set(x + gap, y - 1, E); }
  }
  function legs(g, xl, xr, top, bot, f, col = FOOT) {
    const lift = f === 1 ? 1 : 0;
    g.rect(xl - lift, top, 2, bot - top + 1 - lift, col);
    g.rect(xr + lift, top, 2, bot - top + 1, col);
  }
  function seeds(g, seed, n, cols, test) {
    const r = BW.seeded(seed);
    for (let k = 0; k < n * 4 && n > 0; k++) {
      const x = Math.floor(r() * g.w), y = Math.floor(r() * (g.h - g.oy));
      if (g.get(x, y) && (!test || test(x, y))) { g.set(x, y, cols[k % cols.length]); n--; }
    }
  }
  function crown(g, x, y, w, gem = '#e8384f', gold = '#ffd23f') {
    g.shRect(x, y + 2, w, 2, gold);
    for (let i = 0; i < w; i += 2) { g.set(x + i, y + 1, gold); if (i % 4 === 0) g.set(x + i, y, sh(gold, 0.3)); }
    g.set(x + Math.floor(w / 2), y + 2, gem);
  }

  // ───── 빵 스프라이트 (왼쪽을 바라봄) ─────
  const BREAD_OL = '#3b1d0c';
  const DEF = {};

  DEF.loaf = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#df922c' : '#c9772f', K = '#fbeccb', KD = '#ecd3a3';
    if (e) g.rect(16, 9, 4, 9, '#c0392b');
    g.sh(7.5, 7.5, 4.5, 4.2, C); g.sh(14.5, 7.5, 4.5, 4.2, C); g.shRect(3, 8, 16, 10, C);
    g.ell(7.5, 8.4, 3, 2.7, K); g.ell(14.5, 8.4, 3, 2.7, K); g.rect(5, 9, 12, 7, K);
    [[6, 14], [15, 10], [9, 9], [13, 15], [16, 13]].forEach(([x, y]) => g.set(x, y, KD));
    face(g, 8, 11, 5);
    legs(g, 6, 13, 18, 20, f);
    const B = e ? '#ffd84a' : '#d8dde6', BD = e ? '#c99a1a' : '#9aa3b0';
    g.rect(1, 4, 1, 9, B); g.rect(2, 5, 1, 8, BD); g.set(0, 3, B); g.set(2, 3, B); g.set(1, 3, B);
    g.rect(0, 13, 4, 1, '#8a6d3b'); g.rect(1, 14, 2, 2, '#6b4a24'); g.set(3, 14, C);
    if (e) { g.shRect(8, 2, 6, 3, '#ffe066'); g.set(9, 2, '#fffbe0'); }
  } };

  DEF.croissant = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#e8a23e' : '#d88a3a';
    if (e) { g.set(17, 9, '#d93636'); g.set(18, 10, '#d93636'); g.set(19, 10, '#b02a2a'); }
    [[3.5, 16, 2.8, 3], [18.5, 16, 2.8, 3], [6.5, 14, 3.2, 4.2], [15.5, 14, 3.2, 4.2], [11, 12.5, 4.3, 5.6]]
      .forEach(([x, y, rx, ry]) => g.sh(x, y, rx, ry, C, { gloss: e }));
    if (e) { g.over((x, y, c) => (c === C && (x + y) % 5 === 0 ? sh(C, -0.35) : undefined)); }
    face(g, 9, 11, 3);
    legs(g, 8, 12, 18, 20, f);
    if (e) { for (let x = 7; x <= 15; x++) g.paint(x, 8, '#d93636'); g.paint(16, 9, '#d93636'); }
  } };

  DEF.baguette = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#dd9a3c' : '#cf8636', CL = '#f6c27a';
    g.sh(12, 9.5, 3.8, 8.6, C, { gloss: true });
    [3, 7, 11].forEach((k) => g.line(10, k + 3, 14, k, CL));
    face(g, 10, 6, 3);
    legs(g, 9, 13, 18, 20, f);
    const S = e ? '#ffd84a' : '#d8dde6';
    g.line(0, 12, 9, 12, '#8b5a2b');
    g.set(0, 11, S); g.set(0, 13, S); g.set(1, 11, S); g.set(1, 13, S); g.set(-0, 12, S); g.set(1, 12, S); g.set(2, 12, S);
    g.set(9, 12, C); g.set(8, 13, C);
    if (e) { g.ell(12, -0.2, 4.6, 1.8, '#2c3e7a'); g.set(12, -2, '#2c3e7a'); g.set(10, -1, '#4a5fa8'); }
  } };

  DEF.danpat = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#93491f' : '#a8582a';
    g.sh(11, 12, 9, 6.6, C, { gloss: true });
    [[8, 7], [11, 6], [14, 7], [12, 8], [9, 9]].forEach(([x, y]) => g.set(x, y, '#fff1cf'));
    face(g, 8, 11, 5);
    legs(g, 6, 14, 18, 20, f);
    if (e) {
      g.sh(11, 8, 7.6, 4, '#9aa4b1', { maxY: 7 });
      g.set(7, 6, '#e6ecf2'); g.set(11, 4, '#e6ecf2'); g.set(15, 6, '#e6ecf2');
      g.sh(3.5, 13, 2.8, 4.8, '#8d96a3'); g.set(3, 13, '#ffd23f'); g.set(3, 12, '#d9b23a');
    }
  } };

  DEF.donut = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 11.5, 8.6, 7, '#dfa05a');
    const I = e ? '#6b3a1f' : '#f58bb4';
    g.sh(11, 10.2, 7.8, 5.6, I, { gloss: true });
    for (let x = 4; x <= 18; x += 3) g.paint(x, 15, I);
    g.clearEll(11, 11, 2.4, 1.9);
    const sp = e ? ['#ff4d4d', '#ffd23f', '#4dd2ff', '#7dff6a', '#ffffff', '#c27dff'] : ['#ffffff', '#ffd23f', '#6ad0ff', '#7ee87e'];
    [[6, 7], [9, 6], [13, 6], [16, 8], [5, 11], [17, 12], [8, 14], [14, 14], [11, 5]].forEach(([x, y], i) => g.paint(x, y, sp[i % sp.length]));
    face(g, 6, 10, 9, { mx: 11, my: 15, mouth: 'wide' });
    if (f !== 2) legs(g, 7, 13, 19, 20, f);
    if (e) { g.rect(4, 9, 4, 2, '#111111'); g.rect(14, 9, 4, 2, '#111111'); g.line(8, 9, 13, 9, '#111111'); g.set(5, 9, '#7fd3ff'); g.set(15, 9, '#7fd3ff'); }
  } };

  DEF.muffin = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const P = e ? '#f6d070' : '#b8d8f4', PD = sh(P, -0.14);
    for (let y = 12; y <= 18; y++) {
      const ins = Math.floor((y - 12) * 0.4);
      for (let x = 5 + ins; x <= 16 - ins; x++) g.set(x, y, (x % 3 === 0) ? PD : P);
    }
    g.rect(5, 12, 12, 1, sh(P, -0.3));
    g.sh(11, 9.5, 8, 5.2, '#c98a4a', { maxY: 12 });
    [[7, 7], [11, 5], [14, 8], [9, 10], [16, 11], [5, 10], [12, 9]].forEach(([x, y]) => { g.paint(x, y, '#4b3a8c'); g.paint(x + 1, y, '#3a2c70'); g.paint(x, y - 1, '#8a7fd6'); });
    face(g, 9, 14, 4);
    legs(g, 7, 13, 19, 20, f);
    if (e) { g.sh(11, 2.4, 4.2, 2.4, '#ffffff'); g.rect(8, 4, 7, 2, '#f1f1f1'); g.set(14, 5, '#d8d8d8'); }
  } };

  DEF.melonpan = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#a9d65c' : '#ecd77a';
    g.sh(11, 11, 9.6, 7.6, C, { gloss: true });
    g.over((x, y, c) => ((((x + y) % 4 === 0) || ((x - y + 40) % 4 === 0)) && y < 17 ? sh(c, -0.16) : undefined));
    face(g, 8, 11, 6);
    legs(g, 6, 14, 18, 20, f);
    if (e) { g.rect(11, 1, 1, 3, '#5a3a1a'); g.ell(13.6, 1.6, 2.2, 1.1, '#4caf50'); g.set(13, 1, '#7ddc7e'); }
  } };

  DEF.bagel = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#8f5226' : '#c27a3b';
    g.sh(11, 12, 9.2, 6.8, C, { gloss: true });
    g.clearEll(11, 11.5, 2.6, 1.9);
    seeds(g, 7, 14, e ? ['#fff3d6', '#222222'] : ['#fff3d6'], (x, y) => y < 11 || y > 15);
    face(g, 5, 11, 11, { mx: 10, my: 15 });
    legs(g, 7, 13, 18, 20, f);
    if (e) { for (let x = 2; x <= 20; x++) g.paint(x, 7, '#2e86de'); g.paint(20, 8, '#2e86de'); }
  } };

  DEF.soboro = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = '#d9953e';
    g.sh(11, 12, 8.6, 7, C);
    for (let k = 0; k <= 9; k++) {
      const a = Math.PI + (k / 9) * Math.PI;
      g.sh(11 + Math.cos(a) * 7.6, 12 + Math.sin(a) * 6, 1.6, 1.5, '#e9ab55');
    }
    seeds(g, 11, 26, ['#f6c779', '#b8742a', '#f0b860']);
    face(g, 8, 12, 5);
    legs(g, 6, 14, 18, 20, f);
    if (e) {
      g.line(3, 7, 19, 7, '#4a3a2a');
      g.sh(8.5, 7.5, 2, 2, '#666a72'); g.sh(13.5, 7.5, 2, 2, '#666a72');
      g.set(8, 7, '#7fd3ff'); g.set(13, 7, '#7fd3ff'); g.set(8, 6, '#d6f3ff'); g.set(13, 6, '#d6f3ff');
    }
  } };

  DEF.cinnamon = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 12, 8.6, 7.2, '#d39150');
    for (let t = 0.3; t < 4.3 * Math.PI; t += 0.04) {
      const r = t * 0.6;
      g.paint(11 + Math.cos(t) * r, 12 + Math.sin(t) * r * 0.82, '#8a4a22');
    }
    [[4, 9], [5, 10], [6, 11], [7, 10], [8, 9], [9, 8], [10, 9], [11, 10], [12, 9], [13, 8], [14, 9], [15, 10], [16, 9], [17, 8]].forEach(([x, y]) => g.paint(x, y, '#fffaf0'));
    face(g, 8, 12, 6);
    legs(g, 6, 14, 18, 20, f);
    if (e) {
      for (let y = -3; y <= 5; y++) { const hw = Math.floor((y + 3) * 0.75); g.rect(11 - hw, y, hw * 2 + 1, 1, y === 5 ? '#ffd23f' : (y < 1 ? '#6d4dc4' : '#5b3ea8')); }
      g.set(10, 2, '#ffd23f'); g.set(12, 0, '#fff3a0'); g.set(13, 3, '#ffd23f');
    }
  } };

  DEF.pretzel = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#7a3e14' : '#8a4a1c';
    g.sh(11, 14.6, 8.6, 4.8, C);
    g.clearEll(11, 13, 5.6, 2.6);
    g.sh(7, 8.6, 5, 4.6, C, { gloss: true }); g.sh(15, 8.6, 5, 4.6, C, { gloss: true });
    g.clearEll(7, 8.4, 2.4, 2.1); g.clearEll(15, 8.4, 2.4, 2.1); g.clearEll(11, 4.2, 1.2, 1.6);
    g.line(9, 12, 13, 16, sh(C, -0.3)); g.line(13, 12, 9, 16, C);
    seeds(g, 5, 12, ['#ffffff', '#e8f4ff'], (x, y) => y < 15);
    face(g, 8, 16, 6);
    legs(g, 7, 13, 19, 20, f);
    if (e) { for (let x = 1; x <= 21; x++) g.paint(x, 6, '#d93636'); g.set(19, 7, '#d93636'); g.set(20, 8, '#b02a2a'); }
  } };

  DEF.creampuff = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    if (e) { g.sh(2.6, 11, 2.3, 3.4, '#ffffff'); g.sh(19.4, 11, 2.3, 3.4, '#ffffff'); }
    const C = '#f0c070';
    g.sh(11, 14, 8.5, 5.5, C); g.sh(7, 10.5, 4.2, 4, C); g.sh(12, 8.5, 5, 4.5, C, { gloss: true }); g.sh(16, 11, 4, 3.8, C);
    for (let x = 4; x <= 18; x++) g.paint(x, 12, '#fff6c8');
    [[7, 13], [12, 13], [12, 14], [16, 13]].forEach(([x, y]) => g.paint(x, y, '#fff6c8'));
    face(g, 8, 15, 6);
    legs(g, 7, 13, 19, 20, f);
    g.rect(9, 3, 5, 2, '#ffffff'); g.set(11, 3, '#ff6fa5'); g.set(10, 3, '#ff9fc4'); g.set(12, 3, '#ff9fc4');
    if (e) { g.ell(11, 0.2, 4.2, 1.3, '#ffd23f'); g.ell(11, 0.2, 2.6, 0.5, 0); g.set(11, 0, 0); g.set(10, 0, 0); g.set(12, 0, 0); }
  } };

  DEF.curry = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#d2621a' : '#c46f22';
    g.sh(11, 12, 9, 6.8, C);
    seeds(g, 21, 30, ['#f2b45a', '#9b4f15', '#ffcf7a']);
    g.line(13, 7, 16, 9, '#7a3610'); g.set(15, 8, '#a35a12');
    face(g, 8, 12, 6, { angry: true, mouth: 'wide' });
    g.sh(2.6, 13, 1.9, 1.9, C);
    legs(g, 6, 14, 18, 20, f);
    if (e) {
      const fl = [['#ff4d1a', 4], ['#ffb02e', 5], ['#ff4d1a', 3], ['#ffe14d', 6], ['#ff4d1a', 3], ['#ffb02e', 5], ['#ff4d1a', 4]];
      fl.forEach(([c, hgt], i) => { const x = 7 + i; for (let y = 0; y < hgt; y++) g.set(x, 5 - y, y > hgt - 2 ? '#ffe14d' : c); });
    }
  } };

  DEF.pancake = { w: 28, h: 32, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const layers = e ? 5 : 4;
    for (let i = 0; i < layers; i++) g.sh(14, 22 - i * 4.2, 11.5, 2.9, '#e2a55a');
    const top = 22 - (layers - 1) * 4.2;
    g.ell(14, top - 1, 8, 1.3, '#8a3f12');
    [[5, 3], [21, 8], [17, 4], [9, 6]].forEach(([x, l]) => g.rect(x, top, 1, l, '#8a3f12'));
    g.shRect(11, top - 4, 6, 3, '#ffe27a');
    face(g, 10, 13, 7, { mouth: 'wide', my: 15 });
    legs(g, 8, 17, 25, 26, f);
    if (e) { g.sh(14, top - 6, 4.5, 2, '#ffffff'); g.sh(19, top - 4, 2.2, 2.2, '#e8384f'); g.set(19, top - 6, '#4caf50'); g.sh(9, top - 4, 2, 2, '#e8384f'); }
  } };

  DEF.garlic = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 13, 8.5, 5.6, '#d99a4a');
    g.ell(11, 11.6, 7, 3.4, '#f3d36b');
    seeds(g, 33, 9, ['#4f8a2b', '#6fb33f'], (x, y) => y < 13);
    g.sh(11, 5.5, 5, 4, e ? '#fff7e0' : '#f4efe6');
    [9, 11, 13].forEach((x) => { for (let y = 3; y <= 7; y++) g.paint(x, y, '#b48ac9'); });
    g.set(11, 1, '#e8dcc8'); g.set(11, 0, '#d6c8ae');
    face(g, 8, 13, 5, { angry: true });
    legs(g, 6, 14, 18, 20, f);
    const B = e ? '#ffe066' : '#d8dde6', BD = e ? '#c99a1a' : '#9aa3b0';
    g.rect(1, e ? 0 : 3, 1, e ? 13 : 10, B); g.rect(2, e ? 1 : 4, 1, e ? 12 : 9, BD); g.set(1, e ? -1 : 2, B);
    g.rect(0, 13, 4, 1, e ? '#e8384f' : '#8a6d3b'); g.rect(1, 14, 2, 2, '#6b4a24'); g.set(3, 14, '#d99a4a');
  } };

  DEF.brioche = { w: 30, h: 34, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const CP = e ? '#5b2a86' : '#b0213a';
    for (let y = 10; y <= 25; y++) { const a = 7 - (y - 10) * 0.3, b = 23 + (y - 10) * 0.3; g.rect(Math.round(a), y, Math.round(b - a), 1, y > 23 ? sh(CP, -0.2) : CP); }
    if (e) for (let x = 3; x <= 26; x++) { g.set(x, 26, x % 3 === 0 ? '#222' : '#ffffff'); }
    const C = e ? '#d06a1a' : '#c8641c';
    g.sh(15, 17.5, 9.6, 7.6, C, { gloss: true });
    g.sh(15, 8.5, 4.8, 4.2, C, { gloss: true });
    if (e) { crown(g, 9, 0, 13, '#3d7bff'); g.set(12, 2, '#e8384f'); g.set(18, 2, '#4caf50'); g.set(15, -1, '#ffd23f'); g.set(15, -2, '#fff3a0'); }
    else crown(g, 11, 1, 9);
    face(g, 11, 16, 7, { mouth: 'none' });
    g.rect(12, 19, 6, 1, '#5a3418'); g.set(11, 20, '#5a3418'); g.set(18, 20, '#5a3418');
    g.rect(3, 9, 1, 15, '#e0b84a'); g.sh(3.5, 8, 2.2, 2.2, '#ffd23f'); g.set(3, 7, e ? '#3d7bff' : '#e8384f');
    g.sh(5, 17, 1.9, 1.9, C);
    legs(g, 10, 18, 25, 26, f);
  } };

  // ───── 외계인 스프라이트 (오른쪽을 바라봄) ─────
  const AL_OL = '#141022';

  DEF.gloop = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    const C = '#69d35c', d = f ? 1 : 0;
    g.line(8, 8 + d, 6, 4 + d, '#3e9a36'); g.line(14, 8 + d, 16, 4 + d, '#3e9a36');
    g.sh(6, 3 + d, 1.4, 1.4, '#ffe14d'); g.sh(16, 3 + d, 1.4, 1.4, '#ffe14d');
    g.sh(11, 15 + d * 0.5, 8 + d * 0.8, 5.2 - d * 0.5, C, { gloss: true });
    g.sh(11, 11 + d, 5, 4, C, { gloss: true });
    g.ell(12, 12 + d, 2.7, 2.7, '#ffffff'); g.rect(13, 12 + d, 2, 2, '#1a1a1a'); g.set(13, 12 + d, '#ffffff');
    g.rect(9, 16 + d, 5, 1, '#2c6b28'); g.set(12, 16 + d, '#ffffff');
  } };

  DEF.grey = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.shRect(9, 12, 5, 6, '#6c7a89'); g.rect(9, 16, 5, 1, '#ffd23f');
    legs(g, 9, 12, 18, 20, f, '#4a5563');
    g.sh(11, 7.5, 5.6, 5, '#b8c4b0', { gloss: true });
    g.ell(13.4, 8, 1.9, 1.3, '#111111'); g.ell(9.4, 8, 1.5, 1.2, '#111111'); g.set(13, 7, '#ffffff'); g.set(9, 7, '#ffffff');
    g.set(12, 11, '#5a6458');
    g.rect(13, 14, 2, 1, '#b8c4b0'); g.shRect(14, 13, 5, 2, '#4a4f63'); g.set(19, 13, '#5fff7a'); g.set(19, 14, '#2fbf4a'); g.set(15, 15, '#4a4f63');
  } };

  DEF.zipbug = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    if (f) g.sh(8, 11, 5.4, 1.7, '#cfe8ff'); else g.sh(8, 8.5, 4.6, 2.6, '#cfe8ff');
    [5, 9, 12].forEach((x, i) => g.line(x, 16, x + ((i + f) % 2 ? 1 : -1), 20, '#3a1f5c'));
    g.sh(9, 14, 6.6, 3.8, '#8a4bd0', { gloss: true });
    [6, 9].forEach((x) => { for (let y = 10; y < 19; y++) g.paint(x, y, '#6a2fb0'); });
    g.sh(16, 13, 3.3, 3, '#7a3cc0', { gloss: true });
    g.rect(17, 12, 2, 1, '#ff4040'); g.line(17, 10, 19, 7, '#3a1f5c'); g.set(19, 6, '#ff9a4d');
    g.set(2, 14, '#3a1f5c'); g.set(1, 14, '#ff9a4d');
  } };

  DEF.squid = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    for (let i = 0; i < 5; i++) {
      const bx = 4 + i * 3;
      for (let y = 13; y <= 20; y++) {
        const x = bx + Math.round(Math.sin(y * 0.9 + f * Math.PI + i) * 1.1);
        g.rect(x, y, 2, 1, (y + i) % 3 === 0 ? '#e98ad5' : '#b0449a');
      }
    }
    g.sh(11, 8.5, 7.4, 6.6, '#d05ab8', { gloss: true });
    [[7, 6], [13, 4], [15, 9], [5, 10]].forEach(([x, y]) => g.paint(x, y, '#e98ad5'));
    g.ell(11.5, 10, 1.7, 1.7, '#ffe14d'); g.ell(15.5, 10, 1.7, 1.7, '#ffe14d');
    g.rect(12, 9, 1, 2, '#111'); g.rect(16, 9, 1, 2, '#111');
  } };

  DEF.drone = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.rect(9, 15, 4, 1, '#4a5568');
    const L = f ? 3 : 5;
    g.rect(10, 16, 2, L, '#7fd3ff'); g.set(10, 16 + L, '#ffffff'); g.set(11, 16, '#ffffff');
    g.sh(10.5, 9, 6.2, 5.6, '#8fa3b8', { gloss: true });
    for (let x = 4; x <= 17; x++) g.paint(x, 11, '#5a6b80');
    g.rect(3, 8, 1, 5, '#5a6b80'); g.rect(17, 8, 1, 5, '#5a6b80');
    g.ell(13.5, 8.5, 2.3, 2.3, '#2a2f3a'); g.rect(13, 8, 2, 2, '#ff3b3b'); g.set(13, 8, '#ffb3b3');
    g.line(10, 4, 10, 1, '#5a6b80'); g.set(10, 0, '#ff3b3b');
  } };

  DEF.brute = { w: 28, h: 32, oy: 4, ol: AL_OL, draw(g, f) {
    g.sh(4.5, 15, 3, 5.5, '#525a6c');
    g.rect(8, 22 - f, 4, 5 + f, '#4d5568'); g.rect(16, 22, 4, 5 - f, '#4d5568');
    g.sh(13, 15.5, 9.6, 8.6, '#6a7489');
    g.sh(16, 6.5, 5, 4.4, '#727c92', { gloss: true });
    g.rect(17, 6, 2, 1, '#9dff5a'); g.rect(20, 6, 1, 1, '#9dff5a'); g.rect(16, 9, 5, 1, '#3c4252');
    g.line(9, 11, 12, 15, '#3c4252'); g.line(12, 15, 10, 19, '#3c4252'); g.line(15, 18, 18, 21, '#3c4252');
    [[11, 14], [11, 17], [16, 19]].forEach(([x, y]) => g.paint(x, y, '#7cff6a'));
    g.sh(6, 9, 1.8, 2.4, '#b46cff'); g.set(6, 8, '#e3c4ff');
    g.sh(23, 15, 3.6, 6, '#5d6679'); g.sh(23.5, 22, 3.4, 3, '#7a8499', { gloss: true });
  } };

  DEF.spitter = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.rect(5, 18 + f, 3, 3 - f, '#7a9a22'); g.rect(14, 18 + (1 - f), 3, 2 + f, '#7a9a22');
    g.sh(11, 14.5, 8.6, 5.3, '#a6c93a');
    g.ell(11, 17, 5, 2.3, '#d8ec8a');
    g.sh(15, 10, 3.8, 3.2, '#d7ff6a', { gloss: true }); g.set(14, 10, '#f5ffd0'); g.set(16, 11, '#b8e83a');
    g.sh(7, 8.5, 2.4, 2.4, '#a6c93a'); g.sh(11.5, 8, 2.4, 2.4, '#a6c93a');
    g.ell(7.2, 8.4, 1.4, 1.4, '#ffffff'); g.ell(11.7, 7.9, 1.4, 1.4, '#ffffff'); g.set(8, 8, '#111'); g.set(12, 8, '#111');
    g.line(14, 15, 19, 14, '#3d4f12'); g.set(19, 15 + f, '#b8ff3a'); if (f) g.set(19, 17, '#b8ff3a');
  } };

  DEF.shieldbot = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    legs(g, 7, 11, 17, 20, f, '#3a4a66');
    g.shRect(5, 8, 10, 10, '#4a6fa5'); g.rect(9, 12, 2, 2, '#ffd23f');
    g.shRect(6, 2, 8, 6, '#5b80b8'); g.rect(8, 4, 6, 2, '#5ff1ff'); g.set(12, 4, '#ffffff');
    g.line(7, 1, 7, -1, '#3a4a66'); g.set(7, -2, '#ff3b3b');
    g.shRect(15, 4, 5, 15, '#a9b6c6'); for (let y = 4; y < 19; y++) { g.set(15, y, '#7d8a9a'); }
    g.rect(16, 9, 3, 3, '#5fff9a'); g.set(17, 8, '#5fff9a'); g.set(17, 12, '#2fbf6a'); g.set(17, 10, '#141022');
  } };

  DEF.zorg = { w: 38, h: 42, oy: 4, ol: AL_OL, draw(g, f) {
    for (let y = 12; y <= 32; y++) { const a = 9 - (y - 12) * 0.25; g.rect(Math.round(a), y, 16, 1, y > 30 ? '#4a1220' : '#6a1b2e'); }
    g.rect(11, 28 + f, 5, 7 - f, '#3b3550'); g.rect(20, 28 + (1 - f), 5, 6 + f, '#3b3550');
    g.rect(10, 34, 7, 2, '#2a2540'); g.rect(19, 34, 7, 2, '#2a2540');
    g.shRect(10, 15, 16, 14, '#4b3f72');
    for (let x = 10; x < 26; x++) { g.set(x, 21, '#e0b84a'); g.set(x, 27, '#c99a2a'); }
    g.rect(17, 22, 2, 2, '#5fff9a');
    g.sh(10, 15.5, 4.6, 3.2, '#6c5aa8', { gloss: true }); g.sh(26, 15.5, 4.6, 3.2, '#6c5aa8', { gloss: true });
    g.sh(18, 8, 6.8, 6.2, '#9a5fe0', { gloss: true });
    g.line(14, 4, 16, 6, '#7a3fc0'); g.line(20, 3, 21, 6, '#7a3fc0');
    [[15, 8], [19, 7], [22, 8]].forEach(([x, y]) => { g.rect(x, y, 2, 2, '#ffe14d'); g.set(x + 1, y + 1, '#111'); });
    g.rect(16, 12, 6, 1, '#3a1460'); g.set(17, 13, '#ffffff'); g.set(20, 13, '#ffffff');
    g.sh(8, 23, 2.4, 2.4, '#9a5fe0');
    g.shRect(26, 18, 9, 5, '#3d4458'); g.rect(35, 18, 1, 5, '#5fff9a'); g.rect(30, 19, 1, 3, '#5fff9a');
  } };

  DEF.queen = { w: 46, h: 50, oy: 4, ol: AL_OL, draw(g, f) {
    const legC = '#4a5068', s = f ? 1 : -1;
    [[10, 30, 5 + s, 44], [17, 31, 15 - s, 44], [29, 31, 31 + s, 44], [36, 30, 40 - s, 44]].forEach(([a, b, c, d]) => {
      g.line(a, b, c, d - 4, legC); g.line(a + 1, b, c + 1, d - 4, legC); g.line(c, d - 4, c, d, '#353a4e'); g.line(c + 1, d - 4, c + 1, d, '#353a4e');
    });
    g.sh(23, 16, 11.5, 10.5, '#a8ecffcc');
    g.sh(23, 17, 7.6, 6.6, '#f29ac2', { gloss: true });
    g.line(18, 13, 21, 15, '#c8619a'); g.line(25, 12, 27, 16, '#c8619a'); g.line(19, 19, 23, 18, '#c8619a');
    crown(g, 19, 7, 8, '#5fff9a');
    g.ell(21, 18, 1.6, 1.6, '#ffffff'); g.ell(26, 18, 1.6, 1.6, '#ffffff'); g.set(22, 18, '#111'); g.set(27, 18, '#111');
    [[15, 10], [14, 11], [14, 12], [16, 9]].forEach(([x, y]) => g.set(x, y, '#ffffff'));
    g.sh(23, 29, 19, 5.2, '#7d8aa3', { gloss: true });
    for (let x = 8; x <= 38; x += 3) g.set(x, 30, x % 2 ? '#ffe14d' : '#ff5f5f');
    g.ell(23, 33, 6, 1.4, '#5fff9a');
  } };

  // ───── 추가 빵 ─────
  DEF.rolls = { w: 16, h: 18, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#e6a23e' : '#dc9440';
    g.sh(8, 8, 6, 4.8, C, { gloss: true });
    g.set(8, 4, sh(C, -0.3)); g.set(8, 5, sh(C, -0.3));
    face(g, 6, 7, 3);
    legs(g, 5, 9, 12, 14, f);
    if (e) { g.rect(3, 2, 10, 2, '#2c4a8a'); g.rect(5, 0, 6, 2, '#2c4a8a'); g.set(12, 0, '#ffffff'); g.set(13, -1, '#ffffff'); g.set(13, 0, '#e8e8e8'); }
  } };

  DEF.bungeo = { w: 24, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#f2c14e' : '#d99a3e', CD = sh(C, -0.25);
    g.rect(18, 9, 2, 7, C); g.rect(20, 8, 2, 9, C); g.rect(22, 7, 1, 11, CD); g.set(21, 12, 0); g.set(22, 12, 0); g.set(22, 11, 0); g.set(22, 13, 0);
    g.sh(10, 12, 8.5, 5.2, C, { gloss: true });
    g.over((x, y) => (x > 7 && x < 18 && (x + y * 2) % 4 === 0 && y > 8 && y < 16 ? CD : undefined));
    g.rect(9, 6, 5, 1, CD); g.rect(10, 5, 3, 1, CD);
    g.rect(5, 10, 1, 2, EYE); g.set(4, 13, BLUSH); g.set(1, 12, MOUTH); g.set(2, 13, MOUTH);
    legs(g, 7, 12, 17, 20, f);
    if (e) { g.line(2, 14, 0, 16, '#8a5a1a'); g.line(3, 15, 2, 18, '#8a5a1a'); g.set(6, 8, '#fff3a0'); g.set(11, 9, '#fff3a0'); }
  } };

  DEF.kkwabaegi = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#e6a84a' : '#d08a38', B = e ? '#ffd84a' : '#d8dde6';
    g.line(4, 12, 1, 6, B); g.line(17, 12, 20, 6, B); g.set(5, 13, '#6b4a24'); g.set(16, 13, '#6b4a24');
    for (let k = 0; k < 6; k++) g.sh(11 + (k % 2 ? 1.2 : -1.2), 2.5 + k * 2.9, 4, 2.4, C, { gloss: k === 1 });
    seeds(g, 17, e ? 16 : 8, ['#ffffff', '#fff3d6']);
    face(g, 9, 8, 4);
    legs(g, 8, 13, 18, 20, f);
  } };

  DEF.jjinppang = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 12, 9, 7, '#f6efe2', { gloss: true });
    g.set(11, 6, '#e8384f'); g.set(10, 6, '#f08a8a'); g.set(12, 6, '#f08a8a');
    const st = f ? 1 : 0;
    if (!e) [[7, 2], [8, 1], [7, 0], [14, 1], [15, 0], [14, -1]].forEach(([x, y]) => g.set(x, y - st, '#ffffff'));
    face(g, 8, 11, 5);
    legs(g, 6, 14, 18, 20, f);
    if (e) { g.sh(11, 5.2, 8, 2.6, '#d8b070'); g.rect(4, 5, 15, 1, '#a8804a'); g.set(11, 2, '#a8804a'); [[5, 1], [17, 0]].forEach(([x, y]) => g.set(x, y - st, '#ffffff')); }
  } };

  DEF.saltbread = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#e2a850' : '#e9b55e';
    g.sh(3.6, 13.5, 3, 3.6, sh(C, -0.1)); g.sh(18.4, 13.5, 3, 3.6, sh(C, -0.1));
    g.sh(11, 12, 8.2, 5.8, C, { gloss: true });
    g.line(7, 7, 6, 16, sh(C, -0.25)); g.line(15, 7, 16, 16, sh(C, -0.25));
    [[9, 7], [12, 6], [11, 8], [14, 8]].forEach(([x, y]) => g.paint(x, y, '#ffffff'));
    face(g, 9, 11, 4);
    legs(g, 7, 13, 18, 20, f);
    g.rect(1, 9, 1, 5, e ? '#ffd84a' : '#d8dde6'); g.set(1, 8, '#ffffff'); g.rect(0, 14, 3, 1, '#6b4a24');
    if (e) { for (let x = 3; x <= 19; x++) g.paint(x, 10, '#22263a'); g.paint(19, 11, '#22263a'); g.set(20, 12, '#22263a'); }
  } };

  DEF.sausage = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 13.5, 9, 5.4, '#d99a4a');
    g.sh(11, 9.2, 8, 2.8, '#c0493a', { gloss: true });
    [[4, 9], [5, 8], [6, 9], [7, 10], [8, 9], [9, 8], [10, 9], [11, 10], [12, 9], [13, 8], [14, 9], [15, 10], [16, 9], [17, 8]].forEach(([x, y]) => g.paint(x, y, '#ffd23f'));
    face(g, 8, 14, 5);
    legs(g, 6, 14, 18, 20, f);
    g.shRect(1, 11, 3, 5, '#ffd23f'); g.set(2, 10, '#e8384f'); g.set(2, 9, '#e8384f');
    if (e) { g.sh(11, 5.4, 6, 2.4, '#8a5a2b'); g.rect(3, 6, 17, 1, '#6b4420'); g.rect(8, 6, 7, 1, '#e8384f'); g.set(11, 4, '#ffd23f'); }
  } };

  DEF.waffle = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = e ? '#e8ad4a' : '#e0a348', CD = sh(C, -0.28);
    g.shRect(4, 4, 15, 14, C);
    [4, 18].forEach((x) => { g.set(x, 4, 0); g.set(x, 17, 0); });
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) g.rect(6 + gx * 4, 6 + gy * 4, 3, 2, CD);
    face(g, 8, 8, 5, { my: 12 });
    legs(g, 7, 13, 18, 20, f);
    g.sh(2.6, 12, 2.3, 4.4, e ? '#ffd23f' : '#c98a3a'); g.set(2, 12, '#fff3d6');
    if (e) { g.sh(11, 2.4, 4, 2.2, '#ffffff'); g.sh(14, 1.2, 1.8, 1.8, '#e8384f'); g.set(14, -1, '#4caf50'); }
  } };

  DEF.croffle = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = '#d9963a';
    [[3.5, 16, 2.8, 3], [18.5, 16, 2.8, 3], [6.5, 14, 3.2, 4.2], [15.5, 14, 3.2, 4.2], [11, 12.5, 4.3, 5.6]].forEach(([x, y, rx, ry]) => g.sh(x, y, rx, ry, C));
    g.over((x, y, c) => ((x % 3 === 0 || y % 3 === 0) ? sh(c, -0.22) : undefined));
    face(g, 9, 11, 3);
    legs(g, 8, 12, 18, 20, f);
    if (e) { g.sh(11, 5, 3.4, 3, '#fff6e0', { gloss: true }); g.set(11, 1, '#e8384f'); g.set(12, 1, '#c02a3a'); [[6, 10], [7, 11], [15, 10], [14, 11]].forEach(([x, y]) => g.paint(x, y, '#8a3f12')); }
  } };

  DEF.pizza = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 12, 9.2, 7, '#d99a4a');
    g.ell(11, 10.4, 8, 4.8, '#c8402a'); g.ell(11, 10.2, 7, 4, '#f2cc50');
    [[7, 9], [13, 8], [10, 11], [15, 11]].forEach(([x, y]) => { g.rect(x, y, 2, 2, '#b03024'); g.set(x, y, '#d85040'); });
    [[9, 8], [12, 11], [6, 11]].forEach(([x, y]) => g.set(x, y, '#4f8a2b'));
    face(g, 8, 15, 5);
    legs(g, 6, 14, 18, 20, f);
    if (e) { [[11, 9], [8, 12], [14, 9]].forEach(([x, y]) => g.set(x, y, '#222222')); g.sh(11, 3.6, 4.4, 2.4, '#ffffff'); g.rect(8, 5, 7, 1, '#e8e8e8'); }
  } };

  DEF.eggtart = { w: 22, h: 24, oy: 2, ol: BREAD_OL, draw(g, f, e) {
    const C = '#d99a4a';
    for (let y = 10; y <= 18; y++) { const ins = Math.floor((y - 10) * 0.45); for (let x = 3 + ins; x <= 18 - ins; x++) g.set(x, y, x % 3 === 0 ? sh(C, -0.2) : C); }
    g.sh(11, 9.4, 8.6, 3.4, sh(C, 0.1));
    g.ell(11, 9, 7.2, 2.5, '#ffd84a'); [[8, 8], [12, 9], [14, 8], [10, 10]].forEach(([x, y]) => g.paint(x, y, '#b8742a')); g.paint(7, 9, '#fff3a0');
    face(g, 9, 13, 4);
    legs(g, 7, 13, 19, 20, f);
    if (e) { g.sh(11, 5.6, 5, 2.6, '#2e6ad8', { maxY: 6 }); g.rect(3, 6, 9, 1, '#1f4aa8'); g.set(11, 3, '#ffffff'); }
  } };

  DEF.stollen = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    g.sh(11, 13, 9.4, 6, '#c98a4a');
    g.sh(11, 10.4, 9, 4, '#ffffff', { maxY: 11 });
    [[4, 12], [7, 12], [8, 13], [12, 12], [15, 12], [16, 13], [18, 12]].forEach(([x, y]) => g.paint(x, y, '#ffffff'));
    [[5, 15], [16, 16], [11, 17], [14, 14]].forEach(([x, y], i) => g.paint(x, y, i % 2 ? '#4caf50' : '#e8384f'));
    face(g, 8, 14, 5);
    legs(g, 6, 14, 18, 20, f);
    g.line(2, 5, 2, 18, '#8b5a2b'); g.rect(1, 3, 3, 1, '#9ad8ff'); g.rect(2, 2, 1, 3, '#9ad8ff'); g.set(2, 3, '#ffffff');
    if (e) { g.sh(11, 5, 5.4, 3, '#e8384f', { maxY: 6 }); g.rect(5, 6, 13, 2, '#ffffff'); g.line(15, 3, 18, 5, '#e8384f'); g.sh(18.6, 6, 1.5, 1.5, '#ffffff'); }
  } };

  DEF.panettone = { w: 28, h: 32, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const P = e ? '#f2c14e' : '#b8743a';
    for (let y = 15; y <= 24; y++) for (let x = 6; x <= 22; x++) g.set(x, y, x % 4 < 2 ? P : sh(P, -0.22));
    g.sh(14, 10, 10.4, 8, '#d89a44', { gloss: true, maxY: 15 });
    g.rect(6, 15, 17, 1, sh(P, 0.3));
    seeds(g, 41, 12, ['#5a2a1a', '#e8384f', '#f2cc50'], (x, y) => y < 14 && y > 3);
    face(g, 10, 18, 7, { mouth: 'wide' });
    legs(g, 9, 17, 25, 26, f);
    g.shRect(0, 8, 9, 4, '#5a6270'); g.rect(0, 8, 1, 4, '#22262e'); g.rect(6, 12, 3, 3, '#8b5a2b');
    if (e) { g.shRect(0, 3, 7, 3, '#5a6270'); g.rect(0, 3, 1, 3, '#22262e'); g.rect(13, -1, 3, 1, '#ffd23f'); g.rect(14, -2, 1, 3, '#ffd23f'); }
  } };

  DEF.frenchtoast = { w: 22, h: 26, oy: 4, ol: BREAD_OL, draw(g, f, e) {
    const C = '#c8862a', K = '#f2c24e';
    g.sh(7.5, 7.5, 4.5, 4.2, C); g.sh(14.5, 7.5, 4.5, 4.2, C); g.shRect(3, 8, 16, 10, C);
    g.ell(7.5, 8.4, 3, 2.7, K); g.ell(14.5, 8.4, 3, 2.7, K); g.rect(5, 9, 12, 7, K);
    [[6, 14], [15, 10], [9, 9], [13, 15], [16, 13], [7, 10]].forEach(([x, y]) => g.set(x, y, '#d89a30'));
    [[8, 6], [9, 7], [13, 6], [14, 7], [14, 8]].forEach(([x, y]) => g.paint(x, y, '#8a3f12'));
    face(g, 8, 11, 5, { angry: true, mouth: 'wide' });
    legs(g, 6, 13, 18, 20, f);
    g.line(1, 5, 1, 17, '#6b4a24'); g.sh(2.4, 6, 2.6, 3, e ? '#ffd84a' : '#c8d0dc'); g.set(1, 4, '#c8d0dc');
    if (e) { for (let x = 3; x <= 19; x++) g.paint(x, 5, '#d93636'); g.sh(9, 2.6, 1.6, 1.6, '#e8384f'); g.sh(13, 2.6, 1.6, 1.6, '#3d5ad8'); }
  } };

  // ───── 로봇 빵 (특별 뽑기 시즌 1) ─────
  const MT = '#a9b6c6', MD = '#5a6b80', SCR = '#1c2a3a', CY = '#5ff1ff', ROBO_OL = '#161c28';

  DEF.toaster = { w: 22, h: 26, oy: 4, ol: ROBO_OL, draw(g, f, e) {
    const M = e ? '#e8c860' : '#b8c4d2', up = f ? 1 : 0;
    [5, 12].forEach((x) => { g.shRect(x, 2 - up, 5, 6, '#d99a4a'); g.rect(x + 1, 3 - up, 3, 4, '#fbeccb'); });
    g.shRect(3, 7, 16, 11, M); [[3, 7], [18, 7], [3, 17], [18, 17]].forEach(([x, y]) => g.set(x, y, 0));
    g.rect(5, 7, 5, 1, SCR); g.rect(12, 7, 5, 1, SCR);
    g.rect(6, 10, 10, 5, SCR); g.rect(8, 11, 1, 2, CY); g.rect(13, 11, 1, 2, CY); g.rect(10, 13, 2, 1, CY);
    g.rect(19, 10, 2, 1, MD); g.rect(20, 10, 1, 3, '#e8384f');
    legs(g, 6, 14, 18, 20, f, MD);
    if (e) { g.line(11, 6, 11, 3, MD); g.set(11, 2, '#ff3b3b'); g.rect(4, 16, 14, 1, '#ff8a2a'); }
  } };

  DEF.gearbagel = { w: 24, h: 26, oy: 2, ol: ROBO_OL, draw(g, f, e) {
    const T = e ? '#ffd23f' : MT;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + (f === 1 ? 0.39 : 0); g.rect(Math.round(12 + Math.cos(a) * 9.4 - 1), Math.round(11.5 + Math.sin(a) * 9.4 - 1), 2, 2, T); }
    g.sh(12, 11.5, 8.6, 8.6, '#c27a3b', { gloss: true });
    g.sh(12, 11.5, 3.2, 3.2, MD); g.ell(12, 11.5, 1.4, 1.4, e ? '#ff3b3b' : CY);
    g.rect(6, 6, 12, 2, SCR); g.set(8, 6, CY); g.set(8, 7, CY); g.set(15, 6, CY); g.set(15, 7, CY);
    if (f !== 2) legs(g, 8, 14, 20, 22, f, MD);
  } };

  DEF.whipdrone = { w: 22, h: 24, oy: 2, ol: ROBO_OL, draw(g, f, e) {
    const R = e ? '#ffd23f' : '#cfe8ff';
    g.rect(3, 6, 16, 1, MD); g.rect(3, 4, 1, 3, MD); g.rect(18, 4, 1, 3, MD);
    if (f) { g.rect(1, 3, 5, 1, R); g.rect(16, 3, 5, 1, R); } else { g.rect(2, 3, 3, 1, R); g.rect(17, 3, 3, 1, R); }
    g.sh(11, 12, 6.6, 5.6, '#f0c070', { gloss: true });
    g.sh(11, 6.4, 3.6, 2.6, '#ffffff'); g.set(11, 3, '#ffffff'); g.set(12, 4, '#f0f0f0');
    g.rect(7, 10, 9, 3, SCR); g.rect(9, 11, 1, 1, CY); g.rect(13, 11, 1, 1, CY);
    g.set(11, 15, '#ff6fa5'); g.set(10, 14, '#ff9fc4'); g.set(12, 14, '#ff9fc4');
    g.rect(10, 17, 2, 2, MD); g.set(10, 19, f ? '#ffffff' : '#fff6c8');
    if (e) { g.line(16, 8, 19, 9, MD); g.set(20, 9, '#ff3b3b'); }
  } };

  DEF.guardian = { w: 22, h: 26, oy: 4, ol: ROBO_OL, draw(g, f, e) {
    const C = e ? '#d8b040' : '#8fa3b8';
    g.sh(7.5, 7.5, 4.5, 4.2, C, { gloss: true }); g.sh(14.5, 7.5, 4.5, 4.2, C); g.shRect(3, 8, 16, 10, C);
    g.rect(5, 8, 12, 7, SCR); g.rect(6, 7, 3, 1, SCR); g.rect(13, 7, 3, 1, SCR);
    g.rect(8, 10, 1, 2, CY); g.rect(13, 10, 1, 2, CY); g.rect(10, 13, 2, 1, CY);
    [[4, 16], [17, 16], [4, 9], [17, 9]].forEach(([x, y]) => g.set(x, y, '#e6ecf2'));
    legs(g, 6, 13, 18, 20, f, MD);
    g.sh(2.6, 12, 2.6, 6.4, '#5ff1ffb0'); g.set(2, 9, '#ffffff'); g.set(2, 10, '#ffffff');
    if (e) { g.rect(10, 1, 2, 3, '#e8384f'); g.set(11, 0, '#ff9a9a'); }
  } };

  DEF.laserbaguette = { w: 22, h: 26, oy: 4, ol: ROBO_OL, draw(g, f, e) {
    const B = e ? '#ffd23f' : MT;
    g.sh(12, 9.5, 3.8, 8.6, '#cf8636', { gloss: true });
    [3, 12, 15].forEach((y) => { for (let x = 7; x <= 17; x++) g.paint(x, y, B); });
    g.rect(9, 6, 6, 3, SCR); g.rect(10, 7, 2, 1, '#ff3b3b'); g.set(13, 7, '#ff9a9a');
    g.shRect(1, 10, 9, 3, MD); g.rect(0, 10, 1, 3, e ? '#ff3b3b' : CY); g.rect(4, 13, 2, 1, MD);
    if (e) { g.shRect(2, 5, 7, 2, MD); g.rect(1, 5, 1, 2, '#ff3b3b'); g.line(12, 0, 12, -2, MD); g.set(12, -3, '#ff3b3b'); }
    legs(g, 9, 13, 18, 20, f, MD);
  } };

  DEF.jetcroissant = { w: 24, h: 24, oy: 2, ol: ROBO_OL, draw(g, f, e) {
    const C = '#d88a3a', W = e ? '#ffd23f' : MT;
    g.rect(13, 4, 4, 1, W); g.rect(12, 5, 6, 1, W); g.rect(11, 6, 8, 2, W);
    g.rect(20, 10, 3, 4, MD); g.rect(23, 11, 1, 2, f ? '#ffd23f' : '#ff8a2a');
    [[4, 12.5, 2.8, 2.8], [19, 12.5, 2.8, 2.8], [7, 11.5, 3.2, 3.8], [16, 11.5, 3.2, 3.8], [11.5, 10.5, 4.3, 4.8]].forEach(([x, y, rx, ry]) => g.sh(x, y, rx, ry, C, { gloss: true }));
    g.ell(9, 10, 3, 1.8, SCR); g.rect(7, 10, 1, 1, CY); g.rect(10, 10, 1, 1, CY); g.set(8, 9, '#9ad8ff');
    g.shRect(6, 16, 8, 2, '#d8dde6'); g.rect(5, 16, 1, 2, '#e8384f'); g.rect(13, 15, 1, 1, MD);
    if (e) { g.shRect(8, 18, 8, 2, '#d8dde6'); g.rect(7, 18, 1, 2, '#e8384f'); for (let x = 5; x <= 18; x += 3) g.paint(x, 13, '#e8384f'); }
  } };

  DEF.teslapretzel = { w: 22, h: 26, oy: 4, ol: ROBO_OL, draw(g, f, e) {
    const C = '#b87333', Z = e ? '#c27dff' : '#ffe14d';
    g.line(7, 4, 7, 1, MD); g.line(15, 4, 15, 1, MD); g.sh(7.5, 0.5, 1.5, 1.5, CY); g.sh(15.5, 0.5, 1.5, 1.5, CY);
    (f ? [[9, 0], [10, -1], [11, 0], [12, 1], [13, 0]] : [[9, 1], [10, 0], [11, 1], [12, 0], [13, -1]]).forEach(([x, y]) => g.set(x, y, Z));
    g.sh(11, 14.6, 8.6, 4.8, C); g.clearEll(11, 13, 5.6, 2.6);
    g.sh(7, 8.6, 5, 4.6, C, { gloss: true }); g.sh(15, 8.6, 5, 4.6, C, { gloss: true });
    g.clearEll(7, 8.4, 2.4, 2.1); g.clearEll(15, 8.4, 2.4, 2.1);
    [[3, 9], [11, 9], [19, 9], [4, 15], [18, 15]].forEach(([x, y]) => { g.paint(x, y, MT); g.paint(x, y + 1, MT); });
    g.rect(7, 16, 9, 3, SCR); g.rect(9, 17, 1, 1, CY); g.rect(13, 17, 1, 1, CY);
    legs(g, 7, 13, 19, 20, f, MD);
  } };

  DEF.oventron = { w: 30, h: 36, oy: 4, ol: ROBO_OL, draw(g, f, e) {
    const T = e ? '#ffd23f' : MT, FL = e ? '#5fd8ff' : '#ff8a2a';
    g.sh(15, 15, 11, 10, '#b5523b');
    g.over((x, y, c) => ((y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0) ? sh(c, -0.25) : undefined));
    g.shRect(19, 0, 5, 8, '#9a4433'); g.rect(18, -1, 7, 2, MD);
    if (e) { g.shRect(8, 1, 4, 6, '#9a4433'); g.rect(7, 0, 6, 2, MD); }
    g.rect(8, 24 - f, 5, 6 + f, MD); g.rect(18, 24, 5, 6 - f, MD); g.rect(7, 29, 7, 2, '#3a4658'); g.rect(17, 29, 7, 2, '#3a4658');
    g.sh(15, 17, 6, 5, '#3a1a10'); g.ell(15, 18, 4.6, 3.6, '#120806'); g.ell(15, 19, 3.4, 2.2, FL); g.ell(15, 19.5, 1.8, 1.2, '#fff3a0');
    g.rect(9, 10, 3, 2, '#ffe14d'); g.rect(18, 10, 3, 2, '#ffe14d'); g.set(10, 10, '#ffffff'); g.set(19, 10, '#ffffff');
    for (let x = 5; x <= 25; x++) g.paint(x, 23, T);
    g.shRect(0, 15, 7, 4, MD); g.rect(0, 16, 1, 2, FL); g.sh(26.5, 17, 2.6, 3.4, MD);
  } };

  // ───── 추가 외계인 ─────
  DEF.crab = { w: 24, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    const C = '#e2553a';
    [5, 8, 14, 17].forEach((x, i) => g.line(x, 17, x + (i < 2 ? -1 : 1) + ((i + f) % 2), 20, '#a8321e'));
    g.sh(5, 12, 2.6, 2.6, C);
    g.line(9, 11, 9, 7, '#a8321e'); g.line(14, 11, 14, 7, '#a8321e');
    g.sh(9.5, 6, 1.6, 1.6, '#ffffff'); g.sh(14.5, 6, 1.6, 1.6, '#ffffff'); g.set(10, 6, '#111111'); g.set(15, 6, '#111111');
    g.sh(11.5, 14, 7.6, 4.6, C, { gloss: true });
    g.rect(9, 16, 6, 1, '#7a1e10');
    g.sh(19.5, 11 - f, 3.4, 3.4, sh(C, 0.1), { gloss: true }); g.rect(20, 10 - f, 3, 1, 0); g.set(22, 11 - f, 0);
  } };

  DEF.jelly = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    for (let i = 0; i < 4; i++) { const bx = 6 + i * 3; for (let y = 12; y <= 19 - (i % 2); y++) g.set(bx + Math.round(Math.sin(y * 1.1 + f * Math.PI + i)), y, y % 3 === f ? '#ffe14d' : '#4fb8e8'); }
    g.sh(11, 8, 7, 5.6, '#7fd8ffd0', { gloss: true });
    g.ell(11, 7, 3.6, 2.2, '#d6f6ffd0');
    g.rect(9, 9, 1, 2, '#123a5a'); g.rect(13, 9, 1, 2, '#123a5a'); g.rect(10, 12, 3, 1, '#123a5a');
  } };

  DEF.boomer = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    [6, 9, 12, 15].forEach((x, i) => g.rect(x + ((i + f) % 2), 19, 1, 2, '#1e1a30'));
    g.line(11, 7, 13, 4, '#8b5a2b'); g.set(14, 3, f ? '#ffe14d' : '#ff4d1a'); g.set(13, 2, f ? '#ff4d1a' : '#ffe14d'); g.set(15, 2, '#ffe14d');
    g.sh(11, 13, 7, 6.6, '#3a3550', { gloss: true });
    g.rect(11, 11, 2, 2, '#ff5a3a'); g.rect(15, 11, 2, 2, '#ff5a3a'); g.set(10, 10, '#141022'); g.set(11, 10, '#141022'); g.set(16, 10, '#141022'); g.set(17, 10, '#141022');
    g.rect(12, 15, 5, 1, '#141022'); g.set(13, 15, '#ffffff'); g.set(15, 15, '#ffffff');
  } };

  DEF.medic = { w: 22, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.shRect(8, 12, 6, 6, '#f1f1f1'); g.rect(10, 13, 2, 2, '#3fbf6a');
    legs(g, 8, 12, 18, 20, f, '#5a8a78');
    g.sh(11, 7.5, 5.2, 4.8, '#9fe0c0', { gloss: true });
    g.ell(13, 8, 1.6, 1.2, '#111111'); g.ell(9.4, 8, 1.3, 1.1, '#111111'); g.set(13, 7, '#ffffff');
    g.rect(7, 2, 9, 2, '#ffffff'); g.rect(10, 2, 3, 2, '#3fbf6a');
    g.line(14, 15, 18, 11, '#c8d0dc'); g.sh(18.5, 9.5, 1.8, 1.8, f ? '#b8ffc8' : '#7dff8a');
  } };

  DEF.frost = { w: 22, h: 24, oy: 2, ol: '#1a3a6a', draw(g, f) {
    for (let y = 3; y <= 18; y++) { const hw = Math.round(6.5 - Math.abs(y - 10.5) * 0.85); for (let x = 11 - hw; x < 11 + hw; x++) g.set(x, y, x < 10 ? '#d6f3ff' : x < 12 ? '#9ad8ff' : '#5aa8e8'); }
    g.rect(9, 9, 1, 2, '#123a6a'); g.rect(13, 9, 1, 2, '#123a6a'); g.rect(10, 12, 3, 1, '#123a6a');
    const o = f ? 1 : 0;
    [[3, 6 + o], [18, 8 - o], [4, 15 - o], [18, 15 + o]].forEach(([x, y]) => { g.set(x, y, '#d6f3ff'); g.set(x, y + 1, '#9ad8ff'); });
  } };

  DEF.yeti = { w: 28, h: 32, oy: 4, ol: AL_OL, draw(g, f) {
    const C = '#e8eef4';
    g.sh(4.5, 15, 3, 5.5, '#c8d4e0');
    g.rect(8, 22 - f, 4, 5 + f, '#c8d4e0'); g.rect(16, 22, 4, 5 - f, '#c8d4e0');
    g.sh(13, 15.5, 9.6, 8.6, C);
    seeds(g, 51, 14, ['#c8d4e0', '#ffffff'], (x, y) => y > 9);
    g.sh(15, 7, 5.6, 5, C, { gloss: true });
    g.ell(16.5, 8, 3.4, 2.8, '#8fa3c8'); g.rect(15, 7, 1, 2, '#141022'); g.rect(18, 7, 1, 2, '#141022'); g.rect(15, 10, 4, 1, '#141022'); g.set(16, 10, '#ffffff');
    g.line(11, 4, 10, 1, CY); g.line(19, 3, 21, 0, CY);
    g.sh(23, 15, 3.6, 6, '#d8e2ec'); g.sh(23.5, 22, 3.4, 3, C, { gloss: true });
  } };

  DEF.saucer = { w: 24, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.sh(12, 16.4, 2, 2.6, '#3a3550'); g.set(12, 19, '#ff3b3b');
    g.sh(12, 7, 4.6, 4.2, '#a8ecffd0', { gloss: true }); g.sh(12, 8, 2, 2, '#69d35c'); g.set(12, 8, '#111111');
    g.sh(12, 11.5, 10.4, 3.4, '#9aa4b8', { gloss: true });
    for (let x = 4; x <= 20; x += 4) g.paint(x, 12, ((x / 4 + f) % 2) ? '#ffe14d' : '#ff5f5f');
  } };

  DEF.cyborg = { w: 24, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    g.sh(11, 7.5, 5.6, 5, '#b8c4b0', { gloss: true });
    g.over((x, y) => (x >= 12 ? (y % 3 === 0 ? '#5a6b80' : '#8fa3b8') : undefined));
    g.shRect(8, 12, 7, 6, '#3d4458'); g.rect(10, 14, 2, 2, CY);
    legs(g, 8, 12, 18, 20, f, '#2a2f3a');
    g.ell(9.2, 8, 1.5, 1.2, '#111111'); g.set(9, 7, '#ffffff'); g.rect(13, 7, 2, 2, '#ff3b3b'); g.set(13, 7, '#ffb3b3');
    g.shRect(14, 13, 8, 2, '#2a2f3a'); g.rect(22, 13, 1, 2, '#ff3b3b'); g.rect(16, 15, 2, 1, '#2a2f3a'); g.line(11, 2, 11, 0, '#5a6b80');
  } };

  DEF.tank = { w: 32, h: 30, oy: 2, ol: AL_OL, draw(g, f) {
    g.line(18, 10, 29, 5, '#3d4458'); g.line(18, 11, 29, 6, '#3d4458'); g.line(18, 12, 29, 7, '#2a2f3a'); g.rect(29, 4, 2, 4, '#5a6b80');
    g.sh(13, 12, 7, 5, '#6c5aa8', { gloss: true }); g.rect(11, 11, 4, 2, '#5fff9a'); g.set(11, 11, '#d8ffe6'); g.line(9, 8, 8, 4, '#5a6b80'); g.set(8, 3, '#ff3b3b');
    g.shRect(3, 15, 24, 7, '#5a4a8a'); for (let x = 5; x < 26; x += 5) g.set(x, 17, '#8a7ac0');
    g.sh(15, 23, 13.6, 3.6, '#2a2f3a');
    for (let x = 4; x <= 26; x += 4) g.paint(x + (f ? 2 : 0), 23, '#7d8aa3');
    for (let x = 3; x <= 27; x += 2) g.paint(x + (f ? 1 : 0), 26, '#5a6b80');
  } };

  DEF.splitter = { w: 24, h: 24, oy: 2, ol: AL_OL, draw(g, f) {
    const C = '#c05ad8', d = f ? 1 : 0;
    g.sh(12, 14.5 + d * 0.5, 9.6 + d * 0.8, 5.8 - d * 0.5, C, { gloss: true });
    g.sh(12, 10 + d, 6, 4.6, C, { gloss: true });
    g.ell(8.5, 16.5, 2.2, 1.6, '#8a3ab0'); g.ell(15.5, 16.5, 2.2, 1.6, '#8a3ab0'); g.set(8, 16, '#ffffff'); g.set(15, 16, '#ffffff');
    g.ell(10, 10.5 + d, 1.8, 1.8, '#ffffff'); g.ell(15, 10.5 + d, 1.8, 1.8, '#ffffff'); g.set(10, 10 + d, '#111111'); g.set(15, 10 + d, '#111111');
    g.rect(11, 13 + d, 4, 1, '#5a1e78');
  } };

  DEF.knight = { w: 24, h: 26, oy: 4, ol: AL_OL, draw(g, f) {
    g.rect(4, 10, 5, 9, '#6a1b2e'); g.rect(4, 18, 4, 1, '#4a1220');
    legs(g, 9, 13, 17, 20, f, '#2a2440');
    g.shRect(8, 10, 9, 8, '#3a3358'); g.rect(8, 13, 9, 1, '#8a5ad8'); g.rect(12, 11, 1, 6, '#8a5ad8');
    g.sh(12, 6, 4.8, 4.8, '#2a2440', { gloss: true }); g.rect(11, 6, 5, 1, '#ff3b5a'); g.set(15, 6, '#ffb3c0');
    g.line(8, 3, 6, 0, '#8a5ad8'); g.line(16, 3, 18, 0, '#8a5ad8');
    g.line(18, 16, 21, 3, '#c8c0ff'); g.line(19, 16, 22, 4, '#8a7ad8'); g.rect(16, 16, 5, 1, '#e0b84a');
  } };

  // ───── 추가 보스 ─────
  DEF.kraken = { w: 46, h: 52, oy: 4, ol: AL_OL, draw(g, f) {
    const C = '#2f7fa8', T = '#256a8f';
    for (let i = 0; i < 6; i++) { const bx = 8 + i * 6; for (let y = 24; y <= 46; y++) { const x = bx + Math.round(Math.sin(y * 0.45 + f * Math.PI + i * 1.3) * 2); g.rect(x, y, 3, 1, T); if ((y + i) % 4 === 0) g.set(x + 1, y, '#ff9ac8'); } }
    [[3, 1], [40, -1]].forEach(([bx, s], i) => { for (let y = 6; y <= 26; y++) { const x = bx + Math.round(Math.sin(y * 0.5 + f * 2 + i) * 2 + (26 - y) * 0.15 * s); g.rect(x, y, 3, 1, T); } });
    g.sh(23, 15, 14, 13, C, { gloss: true });
    [[14, 8], [30, 6], [33, 14], [12, 16], [20, 5]].forEach(([x, y]) => g.sh(x, y, 1.6, 1.4, '#5fb8e0'));
    [[19, 17], [29, 17]].forEach(([x, y]) => { g.sh(x, y, 3, 3, '#ffe14d'); g.rect(x, y - 2, 1, 4, '#111111'); g.rect(x + 1, y - 1, 1, 3, '#111111'); });
    g.line(15, 12, 21, 14, '#0e2a40'); g.line(32, 12, 27, 14, '#0e2a40');
    g.rect(21, 23, 7, 1, '#0e2a40'); g.set(22, 24, '#ffffff'); g.set(26, 24, '#ffffff');
  } };

  DEF.magma = { w: 46, h: 52, oy: 4, ol: '#1a0a0a', draw(g, f) {
    const R = '#4a3232', L = '#ff8a2a', Y = '#ffe14d';
    g.rect(13, 38 - f, 7, 9 + f, '#3a2626'); g.rect(26, 38, 7, 9 - f, '#3a2626');
    g.sh(6, 27, 5, 7, '#3e2a2a'); g.sh(23, 27, 14, 12, R);
    g.sh(23, 29, 6.5, 5.5, L); g.sh(23, 29.5, 4, 3.4, Y);
    g.line(11, 22, 16, 26, L); g.line(35, 20, 30, 25, L); g.line(14, 34, 18, 37, L); g.line(30, 35, 33, 32, Y);
    g.sh(23, 12, 8.6, 7.6, '#5a3c3c', { gloss: true });
    g.rect(18, 11, 3, 2, Y); g.rect(26, 11, 3, 2, Y); g.line(17, 9, 21, 10, '#1a0a0a'); g.line(30, 9, 26, 10, '#1a0a0a');
    g.rect(19, 16, 9, 2, '#1a0a0a'); for (let x = 19; x < 28; x += 2) g.set(x, 16, L);
    [[3, '#ff4d1a'], [5, '#ffb02e'], [4, '#ff4d1a'], [7, Y], [4, '#ff4d1a'], [6, '#ffb02e'], [3, '#ff4d1a'], [5, '#ffb02e'], [4, '#ff4d1a']]
      .forEach(([h, c], i) => { const x = 14 + i * 2, hh = h + ((i + f) % 2); g.rect(x, 5 - hh, 2, hh + 1, c); g.rect(x, 5 - hh, 2, 1, Y); });
    g.sh(40, 26, 5, 7, '#523636', { gloss: true }); g.sh(40.5, 34, 4.6, 4, '#5a3c3c'); g.set(40, 34, L); g.set(41, 35, L);
  } };

  DEF.mechazorg = { w: 46, h: 52, oy: 4, ol: AL_OL, draw(g, f) {
    g.rect(13, 36 + f, 7, 11 - f, '#3d4458'); g.rect(26, 37 - f, 7, 10 + f, '#3d4458'); g.rect(11, 45, 11, 2, '#2a2f3a'); g.rect(24, 45, 11, 2, '#2a2f3a');
    g.shRect(12, 18, 22, 19, '#5d6679'); g.rect(12, 26, 22, 1, '#e0b84a'); g.rect(12, 34, 22, 1, '#3d4458');
    g.sh(23, 30, 3.6, 3.6, SCR); g.sh(23, 30, 2.2, 2.2, f ? '#d6fbff' : CY);
    g.sh(11, 19, 5.6, 4, '#7a8499', { gloss: true }); g.sh(35, 19, 5.6, 4, '#7a8499', { gloss: true });
    g.shRect(33, 9, 12, 4, '#3d4458'); g.rect(44, 9, 1, 4, '#ff3b3b'); g.shRect(33, 14, 10, 3, '#3d4458'); g.rect(42, 14, 1, 3, '#ff3b3b');
    g.sh(23, 10, 8, 7, '#8fa3b8', { gloss: true }); g.sh(23, 6.4, 5.6, 3.6, '#9a5fe0', { maxY: 6 });
    [[19, 10], [23, 9], [27, 10]].forEach(([x, y]) => { g.rect(x, y, 2, 2, '#ff3b3b'); g.set(x, y, '#ffb3b3'); });
    g.rect(19, 14, 9, 1, SCR); for (let x = 20; x < 28; x += 2) g.set(x, 14, '#e6ecf2');
    g.sh(8, 28, 3.4, 5, '#5d6679'); g.shRect(34, 24, 9, 6, '#3d4458'); g.rect(43, 25, 1, 4, '#5fff9a');
  } };

  DEF.emperor = { w: 52, h: 56, oy: 4, ol: AL_OL, draw(g, f) {
    const C = '#3fae5a', d = f ? 1 : 0;
    for (let y = 18; y <= 48; y++) { const a = 10 - (y - 18) * 0.25; g.rect(Math.round(a), y, Math.round(52 - 2 * a), 1, y > 45 ? '#3a1460' : '#5b2a86'); }
    for (let x = 4; x <= 47; x += 3) g.set(x, 48, '#ffffff');
    g.sh(26, 37 + d * 0.5, 20 + d, 12.5 - d * 0.5, C, { gloss: true });
    g.sh(26, 23 + d, 13, 11, C, { gloss: true });
    [[12, 40], [38, 42], [20, 45], [33, 37]].forEach(([x, y]) => g.sh(x, y, 2, 1.6, '#7be08a'));
    g.sh(27, 23 + d, 5.6, 5.6, '#ffffff'); g.sh(28.5, 23 + d, 3, 3, '#e8384f'); g.rect(29, 22 + d, 2, 2, '#111111'); g.set(25, 20 + d, '#ffffff');
    g.rect(19, 32 + d, 16, 2, '#14401e'); for (let x = 20; x < 35; x += 3) { g.set(x, 32 + d, '#ffffff'); g.set(x + 1, 33 + d, '#ffffff'); }
    crown(g, 18, 6 + d, 17, '#e8384f'); g.rect(18, 10 + d, 17, 2, '#e0b84a'); g.set(22, 10 + d, '#3d7bff'); g.set(30, 10 + d, '#3d7bff');
    g.line(46, 16, 46, 46, '#e0b84a'); g.line(47, 16, 47, 46, '#c99a2a'); g.sh(46.5, 13, 3.4, 3.4, '#b46cff', { gloss: true }); g.set(46, 12, '#ffffff');
    g.sh(43, 30, 3, 2.6, C);
  } };

  // ───── 기타 (초상화, 아이콘) ─────
  // 속성 아이콘
  DEF.i_elf = { w: 11, h: 12, ol: '#5a1000', draw(g) { g.sh(5.5, 7.5, 3.8, 3.6, '#ff5a2a'); g.ell(5.5, 4.5, 2.2, 3, '#ff5a2a'); g.set(5, 1, '#ff5a2a'); g.set(8, 3, '#ff5a2a'); g.ell(5.5, 8, 1.9, 2, '#ffd23f'); g.set(5, 6, '#fff3a0'); } };
  DEF.i_elw = { w: 12, h: 12, ol: '#0a4a34', draw(g) { const C = '#3fe0a8', L = '#c8ffe6'; g.rect(2, 2, 6, 1, C); g.set(8, 3, C); g.set(8, 4, C); g.rect(6, 5, 2, 1, C); g.rect(1, 5, 4, 1, L); g.rect(3, 7, 7, 1, C); g.set(10, 8, C); g.rect(8, 9, 2, 1, C); g.rect(1, 9, 5, 1, L); g.set(2, 2, L); } };
  DEF.i_eld = { w: 12, h: 12, ol: '#1a0630', draw(g) { g.sh(6, 6, 4.6, 4.6, '#a05ae0', { gloss: true }); g.ell(7.6, 4.8, 3.2, 3.2, '#3a1466'); g.set(3, 8, '#e0b8ff'); g.set(8, 4, '#ffffff'); } };
  DEF.i_eli = { w: 11, h: 11, ol: '#0a3a6a', draw(g) { const C = '#8ad8ff'; g.rect(5, 1, 1, 9, C); g.rect(1, 5, 9, 1, C); g.line(2, 2, 8, 8, C); g.line(8, 2, 2, 8, C); g.set(5, 5, '#ffffff'); g.set(5, 1, '#ffffff'); g.set(1, 5, '#ffffff'); g.set(9, 5, '#ffffff'); g.set(5, 9, '#ffffff'); } };
  DEF.i_shield = { w: 10, h: 11, ol: '#1c2a3a', draw(g) { g.shRect(2, 1, 6, 5, '#c8d4e0'); g.rect(3, 6, 4, 2, '#a9b6c6'); g.rect(4, 8, 2, 1, '#8a98aa'); g.rect(4, 2, 2, 4, '#5a8ad8'); } };
  DEF.i_sword = { w: 10, h: 11, ol: '#3a1f0e', draw(g) { g.line(7, 1, 3, 6, '#e6ecf2'); g.line(8, 2, 4, 7, '#a9b6c6'); g.line(1, 5, 5, 8, '#e0b84a'); g.line(2, 8, 1, 9, '#8b5a2b'); } };
  DEF.i_star0 = { w: 11, h: 11, ol: '#3a3a44', draw(g) { g.rect(5, 1, 1, 9, '#8a8a9a'); g.rect(1, 4, 9, 2, '#8a8a9a'); g.rect(3, 3, 5, 5, '#8a8a9a'); g.set(2, 8, '#8a8a9a'); g.set(8, 8, '#8a8a9a'); } };
  DEF.i_trophy = { w: 14, h: 14, ol: '#5a3a00', draw(g) { g.rect(1, 3, 2, 3, '#e0b84a'); g.rect(11, 3, 2, 3, '#e0b84a'); g.sh(7, 5, 4.4, 4.4, '#ffd23f', { gloss: true }); g.rect(3, 1, 8, 2, '#ffd23f'); g.rect(6, 9, 2, 2, '#c99a1a'); g.rect(4, 11, 6, 2, '#c99a1a'); } };
  DEF.i_bolt = { w: 14, h: 14, ol: '#1c2a3a', draw(g) { g.sh(7, 7, 5.4, 5.4, '#a9b6c6', { gloss: true }); g.ell(7, 7, 2.4, 2.4, '#3a4658'); g.set(7, 7, '#5ff1ff'); } };
  DEF.granny = { w: 26, h: 26, oy: 0, ol: '#2a1610', draw(g) {
    g.sh(13, 4.5, 7, 4, '#ffffff'); g.rect(7, 6, 13, 3, '#f1f1f1');
    g.sh(6, 11, 3, 3, '#e8e8f0'); g.sh(20, 11, 3, 3, '#e8e8f0');
    g.sh(13, 14, 7.5, 7, '#f5c9a0');
    g.rect(7, 9, 12, 2, '#e8e8f0');
    g.ell(10, 14, 2.2, 2, '#3a3a5a'); g.ell(16, 14, 2.2, 2, '#3a3a5a'); g.ell(10, 14, 1.4, 1.2, '#cfe8ff'); g.ell(16, 14, 1.4, 1.2, '#cfe8ff');
    g.rect(12, 14, 2, 1, '#3a3a5a'); g.set(10, 14, EYE); g.set(16, 14, EYE);
    g.set(7, 17, BLUSH); g.set(19, 17, BLUSH); g.rect(12, 18, 3, 1, MOUTH);
    g.rect(6, 22, 15, 4, '#e86a5a'); g.rect(10, 22, 7, 4, '#ffffff');
  } };

  DEF.i_gold = { w: 11, h: 11, ol: '#5a3a00', draw(g) { g.sh(5.5, 5.5, 4.6, 4.6, '#ffc93a', { gloss: true }); g.rect(5, 3, 1, 5, '#d99a1a'); g.rect(4, 3, 3, 1, '#d99a1a'); } };
  DEF.i_flour = { w: 11, h: 12, ol: '#5a4630', draw(g) { g.sh(5.5, 7, 4.5, 4.3, '#f6efe0'); g.rect(3, 2, 5, 2, '#e8dcc0'); g.rect(4, 3, 3, 1, '#c98a4a'); g.set(5, 7, '#e0b84a'); g.set(4, 8, '#e0b84a'); g.set(6, 6, '#e0b84a'); } };
  DEF.i_energy = { w: 10, h: 12, ol: '#4a3000', draw(g) { [[5, 1], [4, 2], [5, 2], [3, 3], [4, 3], [2, 4], [3, 4], [4, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [5, 6], [6, 6], [4, 7], [5, 7], [4, 8], [3, 9], [4, 9], [3, 10]].forEach(([x, y]) => g.set(x, y, y < 5 ? '#fff07a' : '#ffd23f')); } };
  DEF.i_flame = { w: 10, h: 12, ol: '#5a1800', draw(g) { g.sh(5, 7.5, 3.6, 3.6, '#ff6a1a'); g.ell(5, 4.5, 2, 3, '#ff6a1a'); g.set(5, 1, '#ff6a1a'); g.ell(5, 8, 1.8, 2, '#ffd23f'); g.set(5, 6, '#ffe98a'); } };
  DEF.i_star = { w: 11, h: 11, ol: '#6a4a00', draw(g) { g.rect(5, 1, 1, 9, '#ffd23f'); g.rect(1, 4, 9, 2, '#ffd23f'); g.rect(3, 3, 5, 5, '#ffd23f'); g.set(2, 8, '#ffd23f'); g.set(8, 8, '#ffd23f'); g.set(4, 3, '#fff3a0'); } };
  DEF.i_map = { w: 18, h: 16, ol: '#3a2410', draw(g) { g.shRect(2, 2, 14, 12, '#f2dfb0'); g.line(4, 10, 8, 7, '#b88a4a'); g.line(8, 7, 11, 9, '#b88a4a'); g.line(11, 5, 13, 7, '#e8384f'); g.line(13, 5, 11, 7, '#e8384f'); g.rect(1, 2, 1, 12, '#c9a46a'); g.rect(16, 2, 1, 12, '#c9a46a'); } };
  DEF.i_book = { w: 18, h: 16, ol: '#2a1408', draw(g) { g.shRect(3, 1, 12, 14, '#a8442a'); g.rect(3, 1, 2, 14, '#7a2a18'); g.rect(14, 2, 1, 12, '#fff1d6'); g.sh(9.5, 7.5, 3, 2.6, '#e8a85a'); g.set(8, 7, EYE); g.set(10, 7, EYE); } };
  DEF.i_party = { w: 18, h: 16, ol: '#2a1408', draw(g) { g.line(4, 1, 4, 15, '#8b5a2b'); g.shRect(5, 1, 10, 7, '#f0a830'); g.sh(9.5, 4.5, 2, 1.6, '#c9772f'); g.set(14, 3, '#d98a1a'); } };
  DEF.i_gacha = { w: 18, h: 16, ol: '#2a1408', draw(g) { g.sh(9, 9, 7.5, 6.5, '#e0b84a', { gloss: true }); g.sh(9, 10, 3.6, 3, '#3a1a10'); g.ell(9, 11, 2.2, 1.5, '#ff8a2a'); g.set(9, 11, '#ffe14d'); g.rect(8, 1, 2, 3, '#a0a0a8'); } };
  DEF.i_gear = { w: 14, h: 14, ol: '#2a2a2a', draw(g) { g.sh(7, 7, 4.6, 4.6, '#a8b0bc'); [[7, 1], [7, 12], [1, 7], [12, 7], [3, 3], [11, 3], [3, 11], [11, 11]].forEach(([x, y]) => g.rect(x - 1 + (x > 7 ? 0 : 0), y - (y > 7 ? 1 : 0), 2, 2, '#a8b0bc')); g.ell(7, 7, 1.8, 1.8, '#4a4f5a'); } };

  // ───── 성 (적 기지 / 오븐) ─────
  function crack(g, seed, n, col) {
    const r = BW.seeded(seed);
    for (let k = 0; k < n; k++) {
      let x = 8 + r() * (g.w - 16), y = 20 + r() * (g.h - 34);
      for (let s = 0; s < 6; s++) { const nx = x + (r() - 0.5) * 6, ny = y + r() * 4; g.line(x, y, nx, ny, col); x = nx; y = ny; }
    }
  }
  DEF.base = { w: 54, h: 88, ol: '#0e0a1a', frames: 3, draw(g, dmg) {
    g.shRect(2, 80, 50, 6, '#3a3550');
    for (let y = 22; y <= 80; y++) {
      const hw = Math.round(12 + (y - 22) * 0.11);
      for (let x = 27 - hw; x <= 27 + hw; x++) {
        let c = '#4a4e6e';
        if (x <= 27 - hw + 1) c = '#646a90'; else if (x >= 27 + hw - 2) c = '#33364e';
        if ((y - 22) % 11 === 0) c = '#2c2f44';
        g.set(x, y, c);
      }
    }
    [[20, 40], [34, 40], [20, 62], [34, 62]].forEach(([x, y]) => { g.rect(x - 1, y, 3, 4, '#5fff9a'); g.set(x - 1, y, '#c8ffd8'); });
    g.sh(27, 32, 5, 3.6, '#5fff9a', { gloss: true });
    g.sh(27, 20, 14, 8.5, '#6b5fa8', { gloss: true, maxY: 24 });
    g.line(27, 12, 27, 3, '#8a8fa8'); g.sh(27, 2.5, 1.6, 1.6, '#ff3b3b');
    g.sh(40, 9, 5, 3, '#b8c0d0', { gloss: true }); g.line(37, 12, 33, 15, '#8a8fa8');
    g.ell(37, 72, 6.5, 7.5, '#1d1430'); g.ell(37, 72, 4.5, 5.5, '#2fbf6a'); g.ell(37, 72, 3, 4, '#1d1430'); g.ell(37, 72, 1.5, 2, '#5fff9a');
    [[13, 50], [41, 50], [12, 70], [42, 70]].forEach(([x, y]) => { g.set(x < 27 ? x - 1 : x + 1, y, '#8a8fa8'); g.set(x < 27 ? x - 2 : x + 2, y + 1, '#8a8fa8'); });
    if (dmg >= 1) crack(g, 3, 5, '#141020');
    if (dmg >= 2) { crack(g, 9, 7, '#141020'); g.clearEll(20, 18, 5, 4); g.clearEll(38, 24, 3, 3); }
  } };
  DEF.oven = { w: 66, h: 76, ol: '#2a0e08', frames: 3, draw(g, dmg) {
    g.shRect(45, 6, 10, 24, '#9a4433');
    for (let y = 6; y < 30; y++) for (let x = 45; x < 55; x++) if (y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0) g.paint(x, y, '#6e2c20');
    g.shRect(43, 3, 14, 4, '#5a5d6e');
    g.sh(33, 48, 29, 25, '#b5523b', { maxY: 66 });
    g.over((x, y, c) => {
      if (y < 23 || y > 66 || x < 3 || x > 62) return;
      if (y % 5 === 0 || (x + (Math.floor(y / 5) % 2) * 4) % 8 === 0) return sh(c, -0.3);
    });
    g.sh(33, 54, 15.5, 13.5, '#d06a4c', { maxY: 66 });
    g.over((x, y, c) => { if (y > 40 && y <= 66 && Math.abs(Math.atan2(y - 54, x - 33) * 6) % 1 < 0.18) return sh(c, -0.35); });
    g.ell(33, 55, 12.5, 11, '#3a1a10', 66); g.ell(33, 56, 10.5, 9.5, '#120806', 66);
    g.shRect(20, 27, 26, 8, '#8b5a2b'); g.sh(33, 31, 5, 2.4, '#e8a85a'); g.set(31, 31, EYE); g.set(35, 31, EYE);
    g.line(10, 8, 10, 30, '#6b4a24'); g.shRect(11, 8, 10, 7, '#f5d76e'); g.sh(16, 11.5, 2.4, 1.8, '#c9772f');
    g.shRect(1, 66, 64, 8, '#7b7d8c');
    for (let x = 1; x < 65; x += 8) g.rect(x, 66, 1, 8, '#55576a'); g.rect(1, 70, 64, 1, '#55576a');
    if (dmg >= 1) crack(g, 5, 5, '#3a140c');
    if (dmg >= 2) { crack(g, 13, 7, '#3a140c'); g.clearEll(48, 3, 7, 4); g.clearEll(9, 30, 4, 4); }
  } };

  // ───── 캐시 ─────
  const cache = {};
  function build(id, f, e) {
    const D = DEF[id];
    const g = new G(D.w, D.h, D.oy || 0);
    D.draw(g, f, e);
    g.outline(D.ol || '#000000');
    const cv = g.canvas();
    return { cv, w: D.w, h: D.h };
  }
  // 속성 외계인: 원본 스프라이트에 속성 색을 덧입힘
  const TINT = { f: ['#ff3a10', 0.5], w: ['#b8ffe0', 0.55], d: ['#3a1466', 0.6], i: ['#8ad8ff', 0.6] };
  function get(id, f = 0, e = false, el = '') {
    const k = id + '|' + f + '|' + (e ? 1 : 0) + (el || '');
    if (cache[k]) return cache[k];
    if (!el || !TINT[el]) return (cache[k] = build(id, f, e));
    const s = get(id, f, e);
    const cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h;
    const c = cv.getContext('2d'); c.drawImage(s.cv, 0, 0);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = TINT[el][1]; c.fillStyle = TINT[el][0]; c.fillRect(0, 0, s.w, s.h);
    return (cache[k] = { cv, w: s.w, h: s.h });
  }
  function white(id, f = 0, e = false) {
    const k = 'W|' + id + '|' + f + '|' + (e ? 1 : 0);
    if (cache[k]) return cache[k];
    const s = get(id, f, e);
    const cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h;
    const c = cv.getContext('2d'); c.drawImage(s.cv, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = '#ffffff'; c.fillRect(0, 0, s.w, s.h);
    return (cache[k] = { cv, w: s.w, h: s.h });
  }
  function silhouette(id, e = false) {
    const k = 'S|' + id + '|' + (e ? 1 : 0);
    if (cache[k]) return cache[k];
    const s = get(id, 0, e);
    const cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h;
    const c = cv.getContext('2d'); c.drawImage(s.cv, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = '#3a2a24'; c.fillRect(0, 0, s.w, s.h);
    return (cache[k] = { cv, w: s.w, h: s.h });
  }
  const urls = {};
  function url(id, e = false, kind = '', f = 0, el = '') {
    const k = id + (e ? '*' : '') + kind + f + (el || '');
    if (urls[k]) return urls[k];
    const s = kind === 'sil' ? silhouette(id, e) : get(id, f, e, el);
    return (urls[k] = s.cv.toDataURL());
  }
  // HTML용 <img> 태그 (유닛 스프라이트는 data-a 로 걷기 프레임을 번갈아 보여줌)
  function img(id, scale = 3, e = false, cls = '', kind = '', el = '') {
    const D = DEF[id];
    const anim = !kind && !id.startsWith('i_') && id !== 'granny' && id !== 'oven' && id !== 'base' ? ` data-a="${id}|${e ? 1 : 0}|${el || ''}"` : '';
    return `<img class="px ${cls}" src="${url(id, e, kind, 0, el)}" width="${Math.round(D.w * scale)}" height="${Math.round(D.h * scale)}" alt="" draggable="false"${anim}>`;
  }
  // 화면의 모든 유닛 이미지를 한 프레임 넘김
  let animF = 0;
  function tickImgs() {
    animF ^= 1;
    document.querySelectorAll('img[data-a]').forEach((im) => {
      const [id, e, el] = im.dataset.a.split('|');
      im.src = url(id, e === '1', '', animF, el);
    });
  }
  const icon = (name, scale = 2) => img('i_' + name, scale, false, 'ico');

  return { G, DEF, get, white, url, img, icon, face, tickImgs };
})();
