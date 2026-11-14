// 개발용: 헤드리스 밸런스 시뮬레이터 (게임에는 로드되지 않음)
// 콘솔에서: BW.sim({ from: 0, to: 59, runs: 2, lvBonus: 0, extra: ['toaster'] })
'use strict';
BW.simParty = (g, opts = {}) => {
  const avail = ['loaf', 'croissant'];
  for (let k = 0; k < g; k++) if (BW.STAGES[k].recipe) avail.push(BW.STAGES[k].recipe);
  (opts.extra || []).forEach((id) => avail.includes(id) || avail.push(id));
  const lv = Math.min(20, 1 + Math.floor(g / 3.2) + (opts.lvBonus || 0));
  const owned = {}; avail.forEach((id) => (owned[id] = lv));
  // 값싼 근접 2 + 최근 획득 5
  const els = BW.STAGES[g].els, sc = (id) => avail.indexOf(id) + BW.matchEls(id, els).length * 6;
  const cheap = avail.filter((id) => BW.BREADS[id].cost <= 5).sort((a, b) => sc(a) - sc(b)).slice(-2);
  const rest = avail.filter((id) => !cheap.includes(id)).sort((a, b) => sc(a) - sc(b)).slice(-5);
  const party = [...cheap, ...rest].sort((a, b) => BW.BREADS[a].cost - BW.BREADS[b].cost);
  return { party, owned, lv };
};
BW.simOne = (g, party, owned, maxT = 600, pre) => {
  const b = pre || new BW.Battle(g, { headless: true, party, owned, diff: BW.simDiff });
  let acc = 0;
  while (!b.ended && b.t < maxT) {
    b.update(0.025); acc += 0.025;
    if (acc >= 0.2) {
      acc = 0;
      const front = Math.max(0, ...b.units.filter((u) => u.team === 'e').map((u) => u.x));
      if (b.cannon >= 1 && front > 300) b.fireCannon();
      const danger = front > 280;
      if (b.ovenLv < 6 && !danger) { if (b.cost >= b.oven.up) b.upgradeOven(); else if (b.t > 8) continue; }
      const order = b.cards.map((c, k) => k).sort(() => Math.random() - 0.5);
      for (const k of order) if (b.canDeploy(k)) b.deploy(k);
    }
  }
  return b;
};
BW.sim = (opts = {}) => {
  const out = [];
  for (let g = opts.from || 0; g <= (opts.to ?? BW.STAGES.length - 1); g++) {
    const { party, owned, lv } = BW.simParty(g, opts);
    const runs = opts.runs || 2;
    let wins = 0, tsum = 0, hpsum = 0; const fails = [];
    for (let r = 0; r < runs; r++) {
      const b = BW.simOne(g, party, owned);
      if (b.over === 'win') { wins++; tsum += b.t; hpsum += b.P.hp / b.P.max; }
      else fails.push(`${b.over === 'lose' ? '패' : '시간'}@${Math.round(b.t)}s 기지${Math.round(b.E.hp / b.E.max * 100)}%`);
    }
    out.push(`${Math.floor(g / 20) + 1}-${g % 20 + 1} ${BW.STAGES[g].name} Lv${lv} ${wins}/${runs} ${wins ? Math.round(tsum / wins) + 's 오븐' + Math.round(hpsum / wins * 100) + '%' : ''} ${fails.join(' ')}`);
  }
  return out.join('\n');
};
// 스테이지별 난이도 배율 자동 탐색: 기준 AI가 전승하면서 목표 시간 안에 끝나는 가장 높은 배율
BW.simTune = (from, to, opts = {}) => {
  const runs = opts.runs || 4, target = opts.target || 185, res = {};
  const ok = (g, df, party, owned) => {
    let t = 0, hp = 0;
    for (let i = 0; i < runs; i++) {
      const b = new BW.Battle(g, { headless: true, party, owned, diff: df });
      const r = BW.simOne(g, party, owned, 300, b);
      if (r.over !== 'win') return null;
      t += r.t; hp += r.P.hp / r.P.max;
    }
    return t / runs <= target ? [Math.round(t / runs), Math.round(hp / runs * 100)] : null;
  };
  for (let g = from; g <= to; g++) {
    const { party, owned } = BW.simParty(g, opts);
    let lo = 0.4, hi = 3.2, best = null;
    if (!ok(g, lo, party, owned)) { res[g] = [0.4, 'X']; continue; }
    for (let k = 0; k < 6; k++) {
      const mid = (lo + hi) / 2, r = ok(g, mid, party, owned);
      if (r) { lo = mid; best = r; } else hi = mid;
    }
    res[g] = [Math.round(lo * 100) / 100, best ? best.join('s/') + '%' : ''];
  }
  return res;
};
// 2단계 자동 튜닝: (1) 난이도 배율 → 목표 시간, (2) 대공세 위력 → 오븐이 위협받는 수준
BW.simTune2 = (from, to, opts = {}) => {
  const runs = opts.runs || 5, out = [];
  const run = (g, df, rp, party, owned) => {
    let t = 0, hp = 0, w = 0;
    for (let i = 0; i < runs; i++) {
      const b = new BW.Battle(g, { headless: true, party, owned, diff: df, rp });
      BW.simOne(g, party, owned, 300, b);
      if (b.over === 'win') { w++; t += b.t; hp += b.P.hp / b.P.max; }
    }
    return { w, t: w ? t / w : 999, hp: w ? hp / w : 0 };
  };
  for (let g = from; g <= to; g++) {
    const { party, owned } = BW.simParty(g, opts);
    let lo = 0.3, hi = 3.2;
    for (let k = 0; k < 6; k++) {
      const mid = (lo + hi) / 2, r = run(g, mid, 2.2, party, owned);
      if (r.w === runs && r.t <= (opts.target || 170)) lo = mid; else hi = mid;
    }
    let rp = 2.2, last = run(g, lo, rp, party, owned);
    for (let k = 0; k < 8; k++) {
      const r = run(g, lo, rp + 0.3, party, owned);
      if (r.w === runs && r.hp >= 0.78 && r.t <= 215) { rp += 0.3; last = r; } else break;
    }
    out.push([Math.round(lo * 100) / 100, Math.round(rp * 10) / 10, Math.round(last.t), Math.round(last.hp * 100), last.w]);
  }
  return out;
};
