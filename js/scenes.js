// 빵들의 전쟁 - 배경, 월드맵, 타이틀 장면
'use strict';
BW.Scenes = (() => {
  const W = BW.W, H = BW.H, GY = BW.GY;
  const S = BW.Sprites;
  const hexRgb = (h) => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const THEMES = {
    field: { sky: ['#6ec0f0', '#dff3ff'], far: '#a6d0ae', near: '#72b35c', grass: '#7cc44c', dirt: '#a8743f', dirt2: '#8a5a2e', road: '#c99c5e', deco: 'field', clouds: true },
    river: { sky: ['#7cc0ec', '#e9f6ff'], far: '#a2c8b6', near: '#5fa860', grass: '#6cba4c', dirt: '#9a6a3a', dirt2: '#7a4f28', road: '#c2965a', deco: 'river', clouds: true },
    forest: { sky: ['#e98f5a', '#ffe1a6'], far: '#7a8f6a', near: '#3f6e45', grass: '#4f9a3e', dirt: '#7d5230', dirt2: '#5e3b20', road: '#a8794a', deco: 'trees', clouds: true },
    swamp: { sky: ['#4e3f72', '#c79a86'], far: '#5a4a5a', near: '#4a3a32', grass: '#5c6a34', dirt: '#5a3a22', dirt2: '#40281a', road: '#7a5a3a', deco: 'swamp', ufo: 2 },
    alien: { sky: ['#1e1240', '#8a4ab0'], far: '#4a2a6a', near: '#36285a', grass: '#6a46a0', dirt: '#3a2a4a', dirt2: '#2a1a36', road: '#5a4a6a', deco: 'crystals', stars: true, ufo: 3 },
    ruins: { sky: ['#6e5e66', '#eaa878'], far: '#6a5a5a', near: '#4e4444', grass: '#6a6a4a', dirt: '#6a5040', dirt2: '#4a3830', road: '#8a7058', deco: 'ruins', ufo: 2 },
    desert: { sky: ['#ee9a4c', '#ffe8b4'], far: '#e4b676', near: '#d09a58', grass: '#e2bc7c', dirt: '#c89458', dirt2: '#a87840', road: '#e8c48e', deco: 'desert', ufo: 1 },
    night: { sky: ['#080820', '#3a2a5a'], far: '#2a2a44', near: '#1e1e34', grass: '#2e4a3a', dirt: '#3a3040', dirt2: '#2a2232', road: '#4a4058', deco: 'city', stars: true, mother: true, ufo: 3 },
    mother: { sky: ['#120a20', '#3a2050'], far: '#2a2040', near: '#221a34', grass: '#56567a', dirt: '#33334a', dirt2: '#24243a', road: '#4a4a66', deco: 'ship' },
    // 시리즈 2
    beach: { sky: ['#58c0f0', '#e8f8ff'], far: '#8ad0c8', near: '#f0dca0', grass: '#f6e8b8', dirt: '#e0c080', dirt2: '#c8a060', road: '#fbf0cc', deco: 'beach', clouds: true, sun: true },
    ice: { sky: ['#7aa8e0', '#eef6ff'], far: '#c8dcf0', near: '#e4eef8', grass: '#f4f8fc', dirt: '#b8cce0', dirt2: '#9ab4d0', road: '#dce8f4', deco: 'ice', snow: true },
    cave: { sky: ['#0a1426', '#284a6a'], far: '#1e3450', near: '#16283e', grass: '#4a7a9a', dirt: '#22364e', dirt2: '#182a40', road: '#3a5a78', deco: 'cave' },
    volcano: { sky: ['#2a0a0a', '#c8482a'], far: '#4a1a14', near: '#30120e', grass: '#6a3222', dirt: '#3a1a14', dirt2: '#28100c', road: '#5a3a30', deco: 'volcano', embers: true },
    // 시리즈 3
    moon: { sky: ['#000008', '#141428'], far: '#5a5a68', near: '#44444f', grass: '#8a8a98', dirt: '#5e5e6c', dirt2: '#4a4a56', road: '#9a9aa8', deco: 'moon', stars: true, noMoon: true, earth: true, ufo: 2 },
    station: { sky: ['#0a1020', '#1a3050'], far: '#1e2e48', near: '#18243a', grass: '#5a7a9a', dirt: '#2e3e56', dirt2: '#223048', road: '#4a6484', deco: 'ship' },
    asteroid: { sky: ['#14082a', '#5a2a7a'], far: '#3a2a5a', near: '#2a1e44', grass: '#6a5a8a', dirt: '#3a2e54', dirt2: '#2a2040', road: '#5a4a78', deco: 'asteroid', stars: true, noMoon: true, planet: true, ufo: 3 },
    jungle: { sky: ['#0a3a3a', '#58c8a8'], far: '#1e6a5a', near: '#145244', grass: '#3ad09a', dirt: '#1e4a44', dirt2: '#143a36', road: '#3a7a6a', deco: 'jungle', ufo: 1 },
    core: { sky: ['#1a0010', '#7a1030'], far: '#3a0a20', near: '#2a0618', grass: '#8a2a4a', dirt: '#3a1020', dirt2: '#2a0a18', road: '#5a2038', deco: 'core', embers: true },
    title: { sky: ['#2a1f5a', '#f2a070'], far: '#6a5a8a', near: '#4a5a4a', grass: '#5a8a3e', dirt: '#7a5432', dirt2: '#5a3a20', road: '#9a7448', deco: 'town', stars: true, rift: true, ufo: 4 },
  };

  function skyFill(ctx, top, bot, y0, y1) {
    const a = hexRgb(top), b = hexRgb(bot), n = 12;
    const img = ctx.createImageData(W, y1 - y0);
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0), k = t * n, band = Math.floor(k), fr = k - band;
      const c1 = mix(a, b, band / n), c2 = mix(a, b, Math.min(1, (band + 1) / n));
      for (let x = 0; x < W; x++) {
        const use2 = fr > 0.75 ? ((x + y) & 1) === 0 : fr > 0.5 ? ((x & 1) === 0 && (y & 1) === 0) : false;
        const c = use2 ? c2 : c1, i = ((y - y0) * W + x) * 4;
        img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, y0);
  }
  function hills(ctx, col, base, amp, seed, fr, bottom = GY) {
    const r = BW.seeded(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
    const hi = BW.shadeHex(col, 0.15);
    for (let x = 0; x < W; x++) {
      const h = Math.round(base - amp * (0.5 * Math.sin(x * fr + p1) + 0.3 * Math.sin(x * fr * 2.3 + p2) + 0.2 * Math.sin(x * fr * 5.1 + p3)));
      ctx.fillStyle = col; ctx.fillRect(x, h, 1, bottom - h);
      ctx.fillStyle = hi; ctx.fillRect(x, h, 1, 1);
    }
  }
  const px = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  // ───── 장식 ─────
  function tree(ctx, x, y, s, leaf, berry) {
    px(ctx, '#5a3a20', x - 1, y - 6 * s, 2 * s, 6 * s);
    const g = new S.G(14 * s, 14 * s);
    g.sh(7 * s, 7 * s, 6 * s, 6 * s, leaf);
    if (berry) for (let i = 0; i < 4 * s; i++) g.paint(2 + ((i * 7) % (10 * s)), 3 + ((i * 5) % (8 * s)), berry);
    g.outline(BW.shadeHex(leaf, -0.5));
    ctx.drawImage(g.canvas(), Math.round(x - 7 * s), Math.round(y - 6 * s - 12 * s));
  }
  function house(ctx, x, y, w, h, wall, roof, lit) {
    px(ctx, wall, x, y - h, w, h);
    px(ctx, BW.shadeHex(wall, -0.2), x + w - 2, y - h, 2, h);
    for (let i = 0; i <= w / 2 + 1; i++) px(ctx, roof, x - 1 + i, y - h - i * 0.8 - 1, w + 2 - i * 2, 1);
    px(ctx, lit ? '#ffd86a' : '#4a6a8a', x + 2, y - h + 3, 2, 2);
    if (w > 9) px(ctx, lit ? '#ffd86a' : '#4a6a8a', x + w - 5, y - h + 3, 2, 2);
    px(ctx, '#5a3a20', x + Math.floor(w / 2) - 1, y - 4, 2, 4);
  }
  function crystal(ctx, x, y, h, c) {
    for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((h - i) * 0.35)); px(ctx, i % 4 === 0 ? BW.shadeHex(c, 0.3) : c, x - w / 2, y - i, w, 1); }
    px(ctx, BW.shadeHex(c, 0.6), x - 1, y - h * 0.6, 1, h * 0.3);
  }
  function deco(ctx, th, r) {
    if (th.deco === 'field' || th.deco === 'town') {
      for (let i = 0; i < 6; i++) house(ctx, 20 + i * 80 + r() * 30, 172, 10 + Math.round(r() * 6), 8 + Math.round(r() * 5), '#f2e2c0', '#c8573a', th.deco === 'town');
      if (th.deco === 'field') {
        const wx = 330, wy = 168;
        for (let y = 0; y < 26; y++) px(ctx, y % 6 === 0 ? '#d8c8a8' : '#f4ead2', wx - 4 + y * 0.12, wy - y, 8 - y * 0.24, 1);
        px(ctx, '#a8443a', wx - 3, wy - 30, 7, 4);
        for (let k = -12; k <= 12; k++) { px(ctx, '#6b4a2a', wx + k, wy - 27 + k * 0.9, 1, 1); px(ctx, '#6b4a2a', wx + k, wy - 27 - k * 0.9, 1, 1); }
        [[-10, -9], [9, -9], [-10, 8], [9, 8]].forEach(([dx, dy]) => px(ctx, '#e8dcc0', wx + dx - 1, wy - 27 + dy - 1, 4, 3));
      }
      for (let x = 0; x < W; x += 3) { const hgt = 4 + Math.round(r() * 4); px(ctx, '#d9b44a', x, 180 - hgt, 1, hgt); px(ctx, '#f2d37a', x, 180 - hgt, 1, 2); }
    } else if (th.deco === 'river') {
      px(ctx, '#4a9ad8', 0, 166, W, 12);
      for (let i = 0; i < 70; i++) px(ctx, '#bfe6ff', r() * W, 167 + r() * 10, 3 + r() * 4, 1);
      for (let i = 0; i < 4; i++) house(ctx, 40 + i * 120 + r() * 30, 160, 12, 10, '#ffe08a', '#d88a2a', false);
      for (let i = 0; i < 8; i++) tree(ctx, r() * W, 162, 1, '#5aa848');
    } else if (th.deco === 'trees') {
      for (let i = 0; i < 16; i++) tree(ctx, i * 32 + r() * 16, 160 + r() * 14, r() > 0.7 ? 2 : 1, BW.pick(['#3f7e3a', '#4e9440', '#2f6a35']), '#d8344a');
    } else if (th.deco === 'swamp') {
      for (let i = 0; i < 8; i++) { const x = r() * W; px(ctx, '#2e1c12', x, 170 + r() * 6, 20 + r() * 30, 3); }
      for (let i = 0; i < 7; i++) { const x = r() * W, y = 176; px(ctx, '#3a2a22', x, y - 24, 2, 24); px(ctx, '#3a2a22', x - 5, y - 20, 6, 1); px(ctx, '#3a2a22', x + 2, y - 15, 5, 1); }
    } else if (th.deco === 'crystals') {
      for (let i = 0; i < 14; i++) crystal(ctx, r() * W, 178, 8 + r() * 18, BW.pick(['#b46cff', '#5fff9a', '#ff6ad5']));
    } else if (th.deco === 'ruins') {
      for (let i = 0; i < 9; i++) {
        const x = i * 55 + r() * 20, w = 18 + r() * 16, h = 20 + r() * 40;
        px(ctx, '#3e3838', x, 178 - h, w, h);
        for (let k = 0; k < 6; k++) px(ctx, r() > 0.5 ? '#ffb85a' : '#2a2424', x + 3 + r() * (w - 6), 178 - h + 4 + r() * (h - 8), 2, 2);
        for (let k = 0; k < w; k += 2) px(ctx, '#3e3838', x + k, 178 - h - r() * 5, 2, 5);
      }
    } else if (th.deco === 'desert') {
      for (let i = 0; i < 7; i++) { const x = r() * W; px(ctx, '#4f8a3b', x, 160, 3, 18); px(ctx, '#4f8a3b', x - 3, 166, 3, 2); px(ctx, '#4f8a3b', x - 3, 162, 1, 4); px(ctx, '#4f8a3b', x + 3, 164, 3, 2); px(ctx, '#4f8a3b', x + 5, 160, 1, 4); }
      for (let i = 0; i < 6; i++) px(ctx, '#a87840', r() * W, 172 + r() * 4, 8 + r() * 8, 4);
    } else if (th.deco === 'city') {
      for (let i = 0; i < 16; i++) {
        const x = i * 30 + r() * 10, w = 16 + r() * 12, h = 24 + r() * 50;
        px(ctx, '#15152a', x, 178 - h, w, h);
        for (let k = 0; k < 8; k++) if (r() > 0.4) px(ctx, '#ffd86a', x + 2 + Math.floor(r() * (w - 4) / 3) * 3, 178 - h + 4 + Math.floor(r() * (h - 8) / 4) * 4, 2, 2);
      }
    } else if (th.deco === 'ship') {
      for (let x = 0; x < W; x += 40) { px(ctx, '#2e2a48', x, 40, 38, 136); px(ctx, '#3a3658', x + 2, 42, 34, 2); for (let y = 60; y < 170; y += 24) px(ctx, (x / 40) % 2 ? '#5fff9a' : '#ff5fd0', x + 16, y, 6, 3); }
      px(ctx, '#1a162e', 0, 30, W, 10);
      for (let x = 0; x < W; x += 12) px(ctx, '#4a4670', x, 32, 8, 3);
    } else if (th.deco === 'beach') {
      px(ctx, '#2f8fd0', 0, 150, W, 28);
      for (let i = 0; i < 80; i++) px(ctx, '#bfe6ff', r() * W, 151 + r() * 22, 3 + r() * 5, 1);
      px(ctx, '#fbf0cc', 0, 172, W, 6);
      for (let i = 0; i < 6; i++) {
        const x = 30 + i * 80 + r() * 30;
        for (let y = 0; y < 24; y++) px(ctx, '#8b5a2b', x + Math.round(y * y * 0.012), 176 - y, 2, 1);
        const tx = x + 7;
        [[-9, 0], [-6, -3], [0, -5], [6, -3], [9, 0]].forEach(([dx, dy]) => { px(ctx, '#3f9a48', tx + dx - 3, 152 + dy, 7, 2); px(ctx, '#6fd070', tx + dx - 2, 151 + dy, 4, 1); });
      }
    } else if (th.deco === 'ice') {
      for (let i = 0; i < 12; i++) {
        const x = r() * W, y = 166 + r() * 10, h = 12 + r() * 12;
        for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round(k * 0.7)); px(ctx, k % 4 < 2 ? '#f4f8fc' : '#2f6a55', x - w / 2, y - h + k, w, 1); }
        px(ctx, '#5a3a20', x - 1, y, 2, 3);
      }
      for (let i = 0; i < 9; i++) crystal(ctx, r() * W, 178, 6 + r() * 12, '#9ad8ff');
    } else if (th.deco === 'cave') {
      for (let i = 0; i < 28; i++) { const x = r() * W, h = 10 + r() * 44; for (let k = 0; k < h; k++) px(ctx, '#0c1626', x - (h - k) * 0.12, k, Math.max(1, (h - k) * 0.24), 1); }
      for (let i = 0; i < 13; i++) crystal(ctx, r() * W, 178, 8 + r() * 18, BW.pick(['#5ff1ff', '#9ad8ff', '#b46cff']));
    } else if (th.deco === 'volcano') {
      for (let y = 0; y < 80; y++) px(ctx, y < 3 ? '#ff8a2a' : '#220a08', 300 - y * 1.1 - 12, 98 + y, 24 + y * 2.2, 1);
      px(ctx, '#ffd23f', 291, 96, 18, 3);
      for (let i = 0; i < 5; i++) { let x = 292 + r() * 16; for (let y = 100; y < 176; y += 2) { x += (r() - 0.5) * 5 + (i - 2) * 0.9; px(ctx, y % 6 < 2 ? '#ffd23f' : '#ff6a1a', x, y, 2, 2); } }
      for (let i = 0; i < 10; i++) px(ctx, '#ff6a1a', r() * W, 172 + r() * 5, 10 + r() * 20, 2);
    } else if (th.deco === 'moon') {
      for (let i = 0; i < 16; i++) { const x = r() * W, y = 150 + r() * 26, w = 8 + r() * 16; px(ctx, '#3a3a46', x, y, w, 2); px(ctx, '#a8a8b8', x + 1, y + 2, w - 2, 1); }
    } else if (th.deco === 'asteroid') {
      for (let i = 0; i < 12; i++) { const g = new S.G(28, 18); g.sh(14, 9, 5 + r() * 7, 3 + r() * 4, '#5a4a78'); g.outline('#1a1030'); ctx.drawImage(g.canvas(), Math.round(r() * W), Math.round(20 + r() * 110)); }
    } else if (th.deco === 'jungle') {
      for (let i = 0; i < 20; i++) { const x = r() * W, L = 20 + r() * 40; for (let y = 0; y < L; y += 2) px(ctx, '#145244', x + Math.sin(y * 0.3) * 2, y, 1, 2); }
      for (let i = 0; i < 14; i++) {
        const x = r() * W, h = 14 + r() * 26, col = BW.pick(['#ff6ad5', '#5ff1ff', '#b8ff5a']);
        px(ctx, '#0e3a34', x, 178 - h, 3, h);
        const g = new S.G(22, 12); g.sh(11, 7, 9, 5, col, { maxY: 7 }); g.outline('#0a2a26');
        ctx.drawImage(g.canvas(), Math.round(x - 10), Math.round(178 - h - 7));
      }
    } else if (th.deco === 'core') {
      for (let x = 10; x < W; x += 60) {
        px(ctx, '#1a0410', x, 30, 16, 148); px(ctx, '#4a1028', x + 2, 30, 3, 148);
        px(ctx, '#c8203a', x + 24, 50, 20, 60); px(ctx, '#ffd23f', x + 32, 72, 4, 4);
        for (let k = 0; k < 20; k += 4) px(ctx, '#c8203a', x + 24 + k, 110, 2, 4);
      }
      px(ctx, '#12020a', 0, 22, W, 10);
    }
  }

  function ground(ctx, th, r) {
    px(ctx, th.grass, 0, 176, W, 8);
    for (let x = 0; x < W; x++) if (r() < 0.35) px(ctx, BW.shadeHex(th.grass, 0.2), x, 175, 1, 1 + (r() < 0.3 ? 1 : 0));
    px(ctx, th.dirt, 0, 184, W, H - 184);
    px(ctx, th.road, 0, 186, W, 18);
    for (let x = 0; x < W; x += 2) { if (r() < 0.5) px(ctx, th.road, x, 185, 2, 1); if (r() < 0.5) px(ctx, th.road, x, 204, 2, 1); }
    for (let i = 0; i < 260; i++) px(ctx, r() < 0.5 ? th.dirt2 : BW.shadeHex(th.dirt, 0.12), r() * W, 206 + r() * 64, 2, 1);
    for (let i = 0; i < 90; i++) px(ctx, BW.shadeHex(th.road, r() < 0.5 ? -0.12 : 0.12), r() * W, 187 + r() * 16, r() < 0.3 ? 2 : 1, 1);
    for (let i = 0; i < 40; i++) px(ctx, BW.shadeHex(th.grass, -0.15), r() * W, 177 + r() * 6, 1, 1);
  }

  const bgCache = {};
  function background(themeName, seed = 1) {
    const k = themeName + seed;
    if (bgCache[k]) return bgCache[k];
    const th = THEMES[themeName] || THEMES.field;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const r = BW.seeded(seed * 97 + themeName.length * 13);
    skyFill(ctx, th.sky[0], th.sky[1], 0, 180);
    if (th.stars) for (let i = 0; i < 90; i++) px(ctx, r() > 0.8 ? '#ffffff' : '#c8c0ff', r() * W, r() * 120, 1, 1);
    if (th.earth) {
      const g = new S.G(34, 34); g.sh(17, 17, 14, 14, '#3a8ae0', { gloss: true });
      [[10, 12, 4, 3], [20, 18, 5, 4], [14, 24, 3, 2], [24, 9, 3, 2]].forEach(([x, y, a, b]) => g.eachEll(x, y, a, b, (xx, yy) => g.paint(xx, yy, '#4fbf6a')));
      g.outline('#0a1a3a'); ctx.drawImage(g.canvas(), 360, 22);
    }
    if (th.planet) {
      const g = new S.G(60, 30); g.sh(30, 15, 11, 11, '#e0a060', { gloss: true }); g.outline('#3a1a30');
      for (let x = 6; x < 54; x++) { const y = Math.round(15 + (x - 30) * 0.18); if (Math.abs(x - 30) > 10 || y > 15) g.set(x, y, '#f2d8a0'); }
      ctx.drawImage(g.canvas(), 340, 26);
    }
    if (th.deco === 'field' || th.deco === 'desert' || th.deco === 'river' || th.sun) { const sx = 380, sy = 40; const g = new S.G(20, 20); g.ell(10, 10, 8, 8, th.deco === 'desert' ? '#fff0a0' : '#fff7c8'); ctx.globalAlpha = 0.9; ctx.drawImage(g.canvas(), sx, sy); ctx.globalAlpha = 1; }
    if (th.stars && !th.rift && !th.noMoon) { const g = new S.G(16, 16); g.ell(8, 8, 6.5, 6.5, '#f4f0d8'); g.ell(10, 7, 5.5, 5.5, 0); ctx.drawImage(g.canvas(), 60, 24); }
    if (th.rift) {
      for (let i = 0; i < 4; i++) {
        let x = 120, y = 30 + i;
        ctx.globalAlpha = 0.4 + i * 0.15;
        for (let s = 0; s < 40; s++) { const nx = x + 6 + r() * 4, ny = 30 + Math.sin(s * 1.3) * 6 + (r() - 0.5) * 4; px(ctx, i < 2 ? '#2fff8a' : '#d8ffe6', x, y, nx - x, 2 - (i > 2 ? 1 : 0)); x = nx; y = ny; }
      }
      ctx.globalAlpha = 1;
    }
    if (th.mother) {
      const g = new S.G(300, 50);
      g.ell(150, 30, 150, 18, '#141428'); g.ell(150, 18, 60, 16, '#18182e');
      for (let x = 10; x < 290; x += 14) g.set(x, 34, x % 28 ? '#ff5f5f' : '#5fff9a');
      ctx.drawImage(g.canvas(), 90, -6);
    }
    hills(ctx, th.far, 140, 26, seed + 1, 0.018, 180);
    hills(ctx, th.near, 162, 14, seed + 2, 0.03, 180);
    deco(ctx, th, r);
    ground(ctx, th, r);
    return (bgCache[k] = cv);
  }

  // ───── 움직이는 요소 (구름, UFO) ─────
  let clouds = null, ufoSpr = null;
  function initAnim() {
    if (clouds) return;
    clouds = [0, 1, 2].map((i) => {
      const g = new S.G(44, 16), r = BW.seeded(i + 5);
      for (let k = 0; k < 5; k++) g.ell(8 + k * 7 + r() * 3, 9 - r() * 3, 6 + r() * 3, 4 + r() * 2, '#ffffff');
      g.over((x, y) => (y > 10 ? '#dfe9f5' : undefined));
      return g.canvas();
    });
    const u = new S.G(18, 10);
    u.sh(9, 3.5, 3.6, 3, '#a8ecff', { gloss: true }); u.sh(9, 6.2, 8, 2.5, '#9aa4b8', { gloss: true });
    u.set(4, 6, '#ffe14d'); u.set(9, 7, '#ff5f5f'); u.set(14, 6, '#ffe14d');
    u.outline('#1a1a2a'); ufoSpr = u.canvas();
  }
  function anim(ctx, themeName, t) {
    initAnim();
    const th = THEMES[themeName] || THEMES.field;
    if (th.clouds) for (let i = 0; i < 5; i++) {
      const x = ((i * 113 + t * (4 + i)) % (W + 60)) - 50;
      ctx.globalAlpha = 0.85; ctx.drawImage(clouds[i % 3], Math.round(x), 14 + i * 17); ctx.globalAlpha = 1;
    }
    if (th.stars) for (let i = 0; i < 12; i++) if (Math.sin(t * 3 + i * 7) > 0.7) px(ctx, '#ffffff', (i * 137) % W, (i * 53) % 110, 1, 1);
    if (th.snow) for (let i = 0; i < 46; i++) {
      const sp = 14 + (i % 5) * 5, x = (i * 71 + Math.sin(t * 0.8 + i) * 10 + t * 6) % W, y = (i * 37 + t * sp) % 200;
      px(ctx, '#ffffff', x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
    if (th.embers) for (let i = 0; i < 26; i++) {
      const sp = 10 + (i % 4) * 6, x = (i * 67 + Math.sin(t + i) * 8) % W, y = 190 - ((i * 41 + t * sp) % 190);
      px(ctx, i % 3 ? '#ff8a2a' : '#ffd23f', x, y, 1, 1);
    }
    const nU = th.ufo || 0;
    for (let i = 0; i < nU; i++) {
      const sp = 18 + i * 7, x = ((i * 157 + t * sp) % (W + 80)) - 40, y = 30 + i * 22 + Math.sin(t * 2 + i) * 4;
      if ((i + Math.floor(t / 4)) % 3 === 0) { ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 8); ctx.fillStyle = '#9dffb0'; ctx.beginPath(); ctx.moveTo(x + 6, y + 9); ctx.lineTo(x + 12, y + 9); ctx.lineTo(x + 22, 176); ctx.lineTo(x - 4, 176); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.drawImage(ufoSpr, Math.round(x), Math.round(y));
    }
  }

  // ───── 월드맵 (시리즈별) ─────
  const NODE = Array.from({ length: 20 }, (_, i) => {
    const r = Math.floor(i / 5), c = i % 5;
    return { x: r % 2 === 0 ? 46 + c * 64 : 302 - c * 64, y: 72 + r * 53 };
  });
  const MAP_COL = {
    field: '#8fd26a', river: '#6ec0d8', forest: '#4f9a4a', swamp: '#7a6a4a', alien: '#7a52b0', ruins: '#8a8078', desert: '#e6c27e', night: '#3a3a6a', mother: '#4a2a6a',
    beach: '#f2dfa8', ice: '#f4f8fc', cave: '#3a5a78', volcano: '#8a2e1e', moon: '#9a9aa8', station: '#4a6484', asteroid: '#6a5a8a', jungle: '#2aa87e', core: '#8a2a4a',
  };
  const mapCache = {};
  function mapBase(s) {
    if (mapCache[s]) return mapCache[s];
    const M = BW.SERIES[s].map;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const r = BW.seeded(42 + s * 7);
    px(ctx, M.sea, 0, 0, W, H);
    for (let i = 0; i < 160; i++) px(ctx, M.wave, r() * W, r() * H, M.space ? 1 : 3 + r() * 3, 1);
    const land = new S.G(W, H);
    land.ell(240, 150, 236, 118, M.land);
    for (let i = 0; i < 20; i++) land.ell(30 + r() * 420, 50 + r() * 200, 30 + r() * 30, 20 + r() * 20, M.land);
    land.outline(M.edge);
    ctx.drawImage(land.canvas(), 0, 0);
    NODE.forEach((n, i) => {
      const col = MAP_COL[BW.STAGES[s * 20 + i].theme] || '#8fd26a';
      const g = new S.G(90, 70); g.ell(45, 35, 44, 30, col);
      g.over((x, y) => ((x + y) % 2 === 0 && ((x - 45) / 44) ** 2 + ((y - 35) / 30) ** 2 > 0.7 ? 0 : undefined));
      ctx.drawImage(g.canvas(), n.x - 45, n.y - 35);
    });
    NODE.forEach((n, i) => {
      const th = BW.STAGES[s * 20 + i].theme, rr = BW.seeded(i * 31 + 7 + s * 100);
      for (let k = 0; k < 5; k++) {
        const x = n.x - 34 + rr() * 68, y = n.y - 22 + rr() * 40;
        if (Math.abs(x - n.x) < 14 && Math.abs(y - n.y) < 12) continue;
        if (['forest', 'river', 'field', 'jungle', 'beach'].includes(th)) tree(ctx, x, y + 6, 1, th === 'field' ? '#5aa848' : th === 'jungle' ? '#ff6ad5' : th === 'beach' ? '#3f9a48' : '#2f6a35');
        else if (['alien', 'mother', 'asteroid', 'core'].includes(th)) crystal(ctx, x, y + 4, 8, th === 'core' ? '#ff5a7a' : BW.pick(['#b46cff', '#5fff9a']));
        else if (th === 'ice' || th === 'cave') crystal(ctx, x, y + 4, 7, '#9ad8ff');
        else if (th === 'desert') { px(ctx, '#4f8a3b', x, y - 6, 2, 8); px(ctx, '#4f8a3b', x - 2, y - 3, 2, 1); }
        else if (['ruins', 'night', 'station'].includes(th)) { px(ctx, '#2e2e3e', x, y - 10, 6, 10); px(ctx, '#ffd86a', x + 2, y - 7, 1, 1); px(ctx, '#ffd86a', x + 4, y - 4, 1, 1); }
        else if (th === 'volcano') { px(ctx, '#ff8a2a', x, y, 5, 2); px(ctx, '#ffd23f', x + 1, y, 2, 1); }
        else if (th === 'moon') { px(ctx, '#5e5e6c', x, y, 7, 2); px(ctx, '#c8c8d4', x + 1, y + 2, 5, 1); }
        else { px(ctx, '#3a2a22', x, y - 8, 1, 8); px(ctx, '#3a2a22', x - 2, y - 6, 2, 1); }
      }
    });
    for (let i = 0; i < NODE.length - 1; i++) {
      const a = NODE[i], b = NODE[i + 1], d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.floor(d / 6);
      for (let k = 1; k < n; k++) {
        const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n;
        px(ctx, M.space ? '#1a1030' : '#5a3a20', x - 1, y - 1, 3, 3); px(ctx, M.space ? '#c8c0ff' : '#f2e2b0', x, y, 1, 1);
      }
    }
    const ov = S.get('oven', 0); ctx.drawImage(ov.cv, 2, 34, Math.round(ov.w * 0.4), Math.round(ov.h * 0.4));
    return (mapCache[s] = cv);
  }
  function drawMap(ctx, t, s, unlocked, cleared, hover, sel) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapBase(s), 0, 0);
    if (BW.SERIES[s].map.space) for (let i = 0; i < 14; i++) if (Math.sin(t * 3 + i * 5) > 0.6) px(ctx, '#ffffff', (i * 139) % W, (i * 67) % H, 1, 1);
    NODE.forEach((n, i) => {
      const g = s * 20 + i, st = BW.STAGES[g];
      const locked = g > unlocked, stars = cleared[g] || 0, done = stars > 0, cur = g === unlocked && !done;
      const rad = st.boss ? 11 : 8;
      const bob = cur ? Math.round(Math.sin(t * 5) * 1.5) : 0;
      const gg = new S.G(rad * 2 + 4, rad * 2 + 4);
      const col = locked ? '#7a7a8a' : done ? '#ffd23f' : st.boss ? '#e8384f' : '#ff9a3a';
      gg.sh(rad + 2, rad + 2, rad, rad, col, { gloss: true });
      gg.outline(locked ? '#3a3a4a' : '#3b1d0c');
      const y = n.y + bob;
      if (cur || i === hover || i === sel) {
        ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 6);
        ctx.fillStyle = i === sel ? '#ffffff' : '#fff3a0';
        ctx.beginPath(); ctx.arc(n.x, y, rad + 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.drawImage(gg.canvas(), n.x - rad - 2, y - rad - 2);
      if (locked) { px(ctx, '#3a3a4a', n.x - 2, y - 3, 5, 2); px(ctx, '#3a3a4a', n.x - 3, y - 1, 7, 5); px(ctx, '#ffd23f', n.x, y + 1, 1, 2); }
      else if (st.boss) { const sp = S.get(st.boss), k = 18 / sp.h; ctx.drawImage(sp.cv, Math.round(n.x - sp.w * k / 2), Math.round(y - sp.h * k / 2 - 1), Math.round(sp.w * k), Math.round(sp.h * k)); }
      else if (done) { const sp = S.get('i_star'); ctx.drawImage(sp.cv, n.x - 5, y - 6); }
      if (done) for (let k = 0; k < 3; k++) { px(ctx, '#2a1408', n.x - 6 + k * 4, y + rad + 2, 4, 4); px(ctx, k < stars ? '#ffd23f' : '#6a6a7a', n.x - 5 + k * 4, y + rad + 3, 2, 2); }
      ctx.font = '8px Galmuri11, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#2a1408'; ctx.fillText(String(i + 1), n.x + 1, y - rad - 3 + 1);
      ctx.fillStyle = locked ? '#c8c8d0' : '#ffffff'; ctx.fillText(String(i + 1), n.x, y - rad - 3);
      if (st.recipe && !done && !locked) {
        const sp = S.get(st.recipe); ctx.globalAlpha = 0.9;
        ctx.drawImage(sp.cv, n.x + rad - 2, Math.round(y - 2 - sp.h / 2), Math.round(sp.w / 2), Math.round(sp.h / 2)); ctx.globalAlpha = 1;
      }
    });
    if (unlocked >= s * 20 && unlocked < s * 20 + 20) {
      const cn = NODE[unlocked - s * 20];
      const fy = cn.y - 26 + Math.round(Math.sin(t * 4) * 2);
      px(ctx, '#5a3a20', cn.x + 6, fy, 1, 14); px(ctx, '#f0a830', cn.x + 7, fy, 7, 5); px(ctx, '#c9772f', cn.x + 9, fy + 1, 3, 2);
    }
  }
  function mapHit(x, y) {
    let best = -1, bd = 14;
    NODE.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  // ───── 타이틀 / 메인 장면 ─────
  const parade = ['loaf', 'croissant', 'rolls', 'baguette', 'donut', 'bungeo', 'muffin', 'toaster', 'melonpan', 'cinnamon', 'guardian', 'brioche'];
  function drawTitle(ctx, t, opts = {}) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(background(opts.theme || 'title', 3), 0, 0);
    anim(ctx, opts.theme || 'title', t);
    const ov = S.get('oven', 0);
    ctx.drawImage(ov.cv, W - ov.w - 8, 186 - ov.h + 6);
    fire(ctx, W - ov.w - 8 + 33, 186 - ov.h + 6 + 56, t, 1);
    if (!opts.noParade) parade.forEach((id, i) => {
      const x = W - 70 - ((t * 22 + i * 36) % (W - 40));
      const f = Math.floor(t * 5 + i) % 2, s = S.get(id, f, i % 3 === 2);
      ctx.drawImage(s.cv, Math.round(x - s.w / 2), Math.round(GY + 4 - s.h + (f ? -1 : 0)));
    });
  }
  // 오븐 불꽃 (cx, cy = 아궁이 중심 하단)
  function fire(ctx, cx, cy, t, power) {
    const cols = ['#ff4d1a', '#ff8a2a', '#ffd23f', '#fff3a0'];
    ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 9);
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      const x = cx - 8 + i * 2, hh = (3 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 7) * power;
      for (let k = 0; k < 4; k++) { const hk = hh * (1 - k * 0.25); px(ctx, cols[k], x + (k > 1 ? 0 : 0), cy - hk, 2, Math.max(1, hk * 0.4 + 1)); }
    }
    px(ctx, '#4a2010', cx - 10, cy, 20, 2);
  }

  return { THEMES, background, anim, drawMap, mapHit, NODE, drawTitle, fire };
})();
