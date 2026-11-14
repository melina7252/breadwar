// 빵들의 전쟁 - 공용 유틸리티
'use strict';
const BW = window.BW = {};

BW.W = 480;   // 내부 픽셀 해상도 (가로)
BW.H = 270;   // 내부 픽셀 해상도 (세로)
BW.GY = 192;  // 전투 지면 기준선

BW.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
BW.lerp = (a, b, t) => a + (b - a) * t;
BW.rand = (a, b) => a + Math.random() * (b - a);
BW.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
BW.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
BW.fmt = (n) => Math.floor(n).toLocaleString('ko-KR');
BW.$ = (s, root = document) => root.querySelector(s);
BW.$$ = (s, root = document) => Array.from(root.querySelectorAll(s));

BW.el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

// 결정적 의사난수 (스프라이트 질감용)
BW.seeded = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s % 10000) / 10000;
  };
};

// 색상 보정
BW.shadeHex = (hex, amt) => {
  const alpha = hex.length === 9 ? hex.slice(7) : '';
  const n = parseInt(hex.slice(1, 7), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt;
  } else {
    r *= 1 + amt; g *= 1 + amt; b *= 1 + amt;
  }
  const h = (v) => Math.round(BW.clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b) + alpha;
};

BW.fmtTime = (sec) => {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
};

BW.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
