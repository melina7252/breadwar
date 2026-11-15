// 빵들의 전쟁 - 화면 (타이틀, 스토리, 메인, 맵, 레시피 북, 파티, 뽑기, 전투)
'use strict';
BW.UI = (() => {
  const S = BW.Sprites, A = BW.Audio, SV = BW.Save, $ = BW.$, $$ = BW.$$;
  const root = $('#screens'), modalEl = $('#modal'), fadeEl = $('#fade');
  const canvas = $('#scene'), ctx = canvas.getContext('2d');
  const screens = {};
  let cur = null, curName = '', busy = false;
  const D = () => SV.data;
  const NS = BW.STAGES.length;

  function reg(name, obj) {
    obj.el = BW.el('div', 'screen'); obj.el.id = 's-' + name;
    root.appendChild(obj.el); screens[name] = obj;
  }
  function go(name, params) {
    if (busy) return;
    busy = true;
    fadeEl.classList.add('on');
    setTimeout(() => {
      closeModal();
      if (cur) { cur.leave && cur.leave(); cur.el.classList.remove('on'); }
      cur = screens[name]; curName = name;
      cur.el.classList.add('on');
      cur.enter && cur.enter(params || {});
      refreshRes();
      fadeEl.classList.remove('on');
      busy = false;
    }, 220);
  }
  function toast(msg) {
    const t = BW.el('div', 't', msg);
    $('#toast').appendChild(t);
    setTimeout(() => t.remove(), 2300);
  }
  function modal(html, onClick) {
    modalEl.innerHTML = '';
    if (typeof html === 'string') modalEl.innerHTML = html; else modalEl.appendChild(html);
    modalEl.classList.remove('hidden');
    modalEl.onclick = onClick || null;
    return modalEl.firstElementChild;
  }
  function closeModal() { modalEl.classList.add('hidden'); modalEl.innerHTML = ''; modalEl.onclick = null; }
  function confirmBox(msg, yes, okLabel = '확인') {
    const el = modal(`<div class="panel notch confirm"><div>${msg}</div><div class="acts"><button class="btn cream" data-a="no">취소</button><button class="btn green" data-a="yes">${okLabel}</button></div></div>`);
    el.querySelector('[data-a=no]').onclick = () => { A.sfx.back(); closeModal(); };
    el.querySelector('[data-a=yes]').onclick = () => { closeModal(); yes(); };
  }

  // ───── 재화 바 ─────
  function resBar() {
    return `<div class="res">${S.icon('gold')}<span class="v-gold"></span></div>
      <div class="res">${S.icon('flour')}<span class="v-flour"></span></div>
      <div class="res">${S.icon('energy')}<span class="v-energy"></span><span class="sub v-etime"></span><button class="plus" data-act="refill" title="에너지 충전">+</button></div>`;
  }
  function refreshRes() {
    const d = D();
    $$('.v-gold').forEach((e) => (e.textContent = BW.fmt(d.gold)));
    $$('.v-flour').forEach((e) => (e.textContent = BW.fmt(d.flour)));
    $$('.v-energy').forEach((e) => (e.textContent = d.energy + '/' + BW.ENERGY_MAX));
    const nx = SV.energyNext();
    $$('.v-etime').forEach((e) => (e.textContent = nx > 0 ? BW.fmtTime(nx) : ''));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act=refill]');
    if (!b) return;
    A.sfx.click();
    if (D().energy >= BW.ENERGY_MAX) { toast('에너지가 이미 가득 찼어요!'); return; }
    confirmBox(`밀가루 ${S.icon('flour')} <b>50</b>개로 에너지를 <b>${BW.ENERGY_MAX}</b>까지 충전할까요?`, () => {
      if (D().flour < 50) { A.sfx.deny(); toast('밀가루가 부족해요.'); return; }
      D().flour -= 50; D().energy = BW.ENERGY_MAX; D().energyTs = Date.now(); SV.save(); refreshRes(); A.sfx.coin(); toast('에너지 충전 완료!');
    }, '충전');
  });
  const topbar = (title, opts = {}) => `<div class="topbar">
      ${opts.back !== false ? '<button class="btn small back" data-nav="back">◀ 뒤로</button>' : ''}
      <div class="title outline-text">${title}</div>${opts.extra || ''}<div class="spacer"></div>${resBar()}</div>`;
  function bindBack(el, to = 'main') { el.querySelectorAll('[data-nav=back]').forEach((b) => (b.onclick = () => { A.sfx.back(); go(to); })); }

  const stars = (r) => Array.from({ length: r }, () => S.icon('star', 1.4)).join('');
  const starRow = (n, sc = 2) => [0, 1, 2].map((k) => `<span class="sr" style="animation-delay:${0.25 + k * 0.25}s">${S.icon(k < n ? 'star' : 'star0', sc)}</span>`).join('');
  const bname = (id, lv) => (lv >= BW.EVO_LV ? BW.BREADS[id].evoName : BW.BREADS[id].name);
  const stageNo = (g) => `${Math.floor(g / 20) + 1}-${(g % 20) + 1}`;
  const bscale = (id, s) => s * Math.min(1, 24 / BW.Sprites.DEF[id].h + 0.12);
  // 속성 표시
  const elIcon = (el, sc = 1.2) => S.icon('el' + el, sc);
  const elChip = (el) => `<span class="elchip" style="--c:${BW.EL[el].col}" title="${BW.EL[el].name} 속성: ${BW.EL[el].enemy}">${elIcon(el, 1.3)}${BW.EL[el].name}</span>`;
  const affTags = (id, small) => {
    const b = BW.BREADS[id], sc = small ? 1 : 1.2;
    return [...b.res].map((el) => `<span class="aff" style="--c:${BW.EL[el].col}" title="${BW.EL[el].name} 저항: ${BW.EL[el].res}">${S.icon('shield', sc)}${elIcon(el, sc)}${small ? '' : '저항'}</span>`).join('')
      + [...b.bane].map((el) => `<span class="aff bane" style="--c:${BW.EL[el].col}" title="${BW.EL[el].name} 특효: ${BW.EL[el].bane}">${S.icon('sword', sc)}${elIcon(el, sc)}${small ? '' : '특효'}</span>`).join('');
  };
  const stageFoes = (st) => { const out = []; [...st.waves, ...st.triggers].forEach((w) => { if (!out.some((f) => f.e === w.e && f.el === w.el)) out.push(w); }); return out; };

  // ════════ 타이틀 ════════
  reg('title', {
    enter() {
      this.el.innerHTML = `<div class="logo"><div class="logo-main">${'빵들의 전쟁'.split('').map((ch, i) => `<span style="animation-delay:${i * 0.09}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</div><div class="logo-sub outline-text">BREAD WARS</div></div>
        <div class="press outline-text">▶ 화면을 눌러 시작하세요 ◀</div><div class="ver">v2.0 · 3 Series · Season 1</div>`;
      this.el.onclick = () => {
        A.init(); A.sfx.upgrade(); A.playMusic('menu');
        if (!D().introSeen) go('story', { key: 'intro', done: () => { D().introSeen = true; SV.save(); go('main'); } });
        else go('main');
      };
    },
    render(c, t) { BW.Scenes.drawTitle(c, t); },
  });

  // ════════ 스토리 ════════
  reg('story', {
    enter(p) {
      this.lines = BW.STORY[p.key]; this.i = 0; this.done = p.done;
      this.el.innerHTML = `<button class="btn small skip">건너뛰기 ▶▶</button>
        <div class="box panel"><div class="who"></div><div class="portrait"></div><div class="txt"></div><div class="next">▼</div></div>`;
      this.el.querySelector('.skip').onclick = (e) => { e.stopPropagation(); A.sfx.click(); this.finish(); };
      this.el.querySelector('.box').onclick = () => this.advance();
      this.show();
    },
    show() {
      const L = this.lines[this.i];
      const box = this.el.querySelector('.box');
      box.classList.toggle('nar', !L.who);
      box.querySelector('.who').textContent = L.who ? BW.NAMES[L.who] : '';
      const pd = L.who ? S.DEF[L.who] : null;
      box.querySelector('.portrait').innerHTML = L.who ? S.img(L.who, Math.min(4.4, 104 / Math.max(pd.w, pd.h))) : '';
      box.querySelector('.portrait').style.display = L.who ? '' : 'none';
      this.full = L.text; this.shown = 0; this.typing = true;
      const txt = box.querySelector('.txt'); txt.textContent = '';
      clearInterval(this.tm);
      this.tm = setInterval(() => {
        this.shown++; txt.textContent = this.full.slice(0, this.shown);
        if (this.shown % 2) A.sfx.type();
        if (this.shown >= this.full.length) { clearInterval(this.tm); this.typing = false; }
      }, 30);
    },
    advance() {
      if (this.typing) { clearInterval(this.tm); this.typing = false; this.el.querySelector('.txt').textContent = this.full; return; }
      A.sfx.click();
      this.i++;
      if (this.i >= this.lines.length) this.finish(); else this.show();
    },
    finish() { clearInterval(this.tm); const d = this.done; this.done = null; if (d) d(); },
    leave() { clearInterval(this.tm); },
    render(c, t) {
      const L = this.lines[this.i] || this.lines[this.lines.length - 1];
      c.imageSmoothingEnabled = false;
      c.drawImage(BW.Scenes.background(L.bg, 7), 0, 0);
      BW.Scenes.anim(c, L.bg, t);
      (L.cast || []).forEach(([id, x, sc], i) => {
        const fixed = id === 'oven' || id === 'granny';
        const f = fixed ? 0 : Math.floor(t * 3 + i) % 2;
        const s = S.get(id, f);
        const bob = fixed ? 0 : Math.round(Math.abs(Math.sin(t * 3 + i * 1.3)) * 3);
        const w = Math.round(s.w * sc), h = Math.round(s.h * sc);
        c.drawImage(s.cv, Math.round(x - w / 2), Math.round(BW.GY + 6 - h - bob), w, h);
        if (id === 'oven') BW.Scenes.fire(c, x, BW.GY + 6 - h + 64, t, 1);
      });
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, BW.W, 18);
    },
  });

  // ════════ 메인 ════════
  reg('main', {
    enter() {
      const d = D();
      const cleared = Object.keys(d.cleared).length;
      const owned = Object.keys(d.owned).length;
      const ready = BW.achReady(d);
      const curS = BW.SERIES[Math.floor(Math.min(d.unlocked, NS - 1) / 20)];
      this.el.innerHTML = `${topbar('', { back: false, extra: `<button class="btn small cream" data-a="set">${S.icon('gear', 1.6)} 설정</button>
          <button class="btn small ${ready ? '' : 'cream'}" data-a="ach">${S.icon('trophy', 1.5)} 도전 과제${ready ? ` <span class="cnt">${ready}</span>` : ''}</button>` })}
        <div class="menu">
          <div class="mbtn primary notch" data-go="map">${S.icon('map', 4)}<div class="lbl">정복 시작</div><div class="desc">${curS.short} · 전투 ${stageNo(Math.min(d.unlocked, NS - 1))}</div></div>
          <div class="mbtn notch" data-go="book">${S.icon('book', 4)}<div class="lbl">레시피 북</div><div class="desc">수집 ${owned} / ${BW.BREAD_ORDER.length}</div></div>
          <div class="mbtn notch" data-go="party">${S.icon('party', 4)}<div class="lbl">파티 구성</div><div class="desc">편성 ${d.party.length} / 7</div></div>
          <div class="mbtn notch" data-go="gacha">${S.icon('gacha', 4)}<div class="lbl">뽑기</div><div class="desc">상시 · 특별 시즌 1</div>${d.flour >= 100 ? '<div class="badge">가능!</div>' : ''}</div>
        </div>
        <div class="hero" style="left:auto;right:26px;top:70px;width:440px;text-align:center"><div class="logo-main">빵들의 전쟁</div></div>
        <div class="bubble panel notch" style="left:auto;right:26px;top:150px;width:440px"></div>
        <div class="progress panel notch" style="top:auto;bottom:14px;width:454px;left:26px">
          <div>전체 진행도 <b>${cleared}</b> / ${NS} · 별 ${S.icon('star', 1.2)} <b>${Object.values(d.cleared).reduce((a, b) => a + b, 0)}</b> / ${NS * 3}</div>
          <div class="bar"><i style="width:${cleared / NS * 100}%"></i></div>
        </div>`;
      this.el.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { A.sfx.click(); go(b.dataset.go); }));
      this.el.querySelector('[data-a=set]').onclick = () => { A.sfx.click(); settings(); };
      this.el.querySelector('[data-a=ach]').onclick = () => { A.sfx.click(); achievements(() => go('main')); };
      this.tip(); A.playMusic('menu');
      clearInterval(this.tt); this.tt = setInterval(() => this.tip(), 7000);
    },
    tip() {
      const b = this.el.querySelector('.bubble');
      if (b) b.innerHTML = `<b>밀라 할머니</b> : ${BW.pick(BW.TIPS)}`;
    },
    leave() { clearInterval(this.tt); },
    render(c, t) { BW.Scenes.drawTitle(c, t, { theme: 'field' }); },
  });

  function settings() {
    const el = modal(`<div class="panel notch settings"><h2>설정</h2>
      <div class="row">효과음 <button class="btn small" data-a="sfx"></button></div>
      <div class="row">배경음악 <button class="btn small" data-a="mus"></button></div>
      <div class="row">스토리 다시 보기 <button class="btn small cream" data-a="story">보기</button></div>
      <div class="row">데이터 초기화 <button class="btn small red" data-a="reset">초기화</button></div>
      <div style="font-size:11px;color:#6b3a1a;line-height:1.5;margin-top:6px">폰트: Galmuri (© Lee Minseo, SIL OFL 1.1)<br>모든 그래픽과 사운드는 코드로 생성되었습니다.</div>
      <button class="btn green" data-a="close">닫기</button></div>`);
    const upd = () => { el.querySelector('[data-a=sfx]').textContent = D().sfx ? '켜짐' : '꺼짐'; el.querySelector('[data-a=mus]').textContent = D().music ? '켜짐' : '꺼짐'; };
    upd();
    el.querySelector('[data-a=sfx]').onclick = () => { D().sfx = !D().sfx; A.setSfx(D().sfx); SV.save(); upd(); A.sfx.click(); };
    el.querySelector('[data-a=mus]').onclick = () => { D().music = !D().music; A.setMusic(D().music); SV.save(); upd(); A.sfx.click(); };
    el.querySelector('[data-a=story]').onclick = () => { closeModal(); go('story', { key: 'intro', done: () => go('main') }); };
    el.querySelector('[data-a=reset]').onclick = () => confirmBox('정말 모든 데이터를 초기화할까요?<br><b>되돌릴 수 없습니다.</b>', () => { SV.reset(); toast('데이터가 초기화되었어요.'); go('title'); }, '초기화');
    el.querySelector('[data-a=close]').onclick = () => { A.sfx.back(); closeModal(); };
  }

  // ───── 도전 과제 ─────
  function achievements(after) {
    const d = D();
    const rows = BW.ACH.map((a) => {
      const v = Math.min(a.goal, a.val(d)), done = v >= a.goal, got = !!d.claimed[a.id];
      return { a, v, done, got, ord: got ? 2 : done ? 0 : 1 };
    }).sort((x, y) => x.ord - y.ord);
    const el = modal(`<div class="panel notch achs"><h2>${S.icon('trophy', 2)} 도전 과제 <button class="btn small cream close">✕</button></h2><div class="alist">${rows.map(({ a, v, done, got }) => `
      <div class="ach ${got ? 'got' : done ? 'done' : ''}"><div class="ai"><b>${a.name}</b><span>${a.desc}</span>
        <div class="bar"><i style="width:${v / a.goal * 100}%"></i></div></div>
        <div class="ar">${a.flour ? `<span>${S.icon('flour', 1.4)}${a.flour}</span>` : ''}${a.gold ? `<span>${S.icon('gold', 1.4)}${BW.fmt(a.gold)}</span>` : ''}</div>
        ${got ? '<button class="btn small dis" disabled>완료</button>' : done ? `<button class="btn small green" data-c="${a.id}">받기</button>` : `<button class="btn small dis" disabled>${BW.fmt(v)}/${BW.fmt(a.goal)}</button>`}</div>`).join('')}</div></div>`);
    el.querySelector('.close').onclick = () => { A.sfx.back(); closeModal(); after && after(); };
    el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => {
      const a = BW.ACH.find((x) => x.id === b.dataset.c);
      d.claimed[a.id] = true; d.flour += a.flour; d.gold += a.gold; SV.save(); refreshRes();
      A.sfx.coin(); toast(`「${a.name}」 보상 획득!`);
      achievements(after);
    }));
  }

  // ════════ 맵 ════════
  reg('map', {
    enter(p) {
      const d = D();
      const g = p.sel ?? Math.min(d.unlocked, NS - 1);
      this.series = Math.floor(g / 20); this.sel = g % 20; this.hover = -1;
      this.el.innerHTML = `${topbar('정복')}<div class="info panel notch open"></div>
        <div class="snav"><button class="btn small cream" data-s="-1">◀</button><div class="sname panel"></div><button class="btn small cream" data-s="1">▶</button></div>`;
      bindBack(this.el);
      this.el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); this.setSeries(this.series + +b.dataset.s); }));
      this.onMove = (e) => { this.hover = this.hit(e); canvas.style.cursor = this.hover >= 0 ? 'pointer' : ''; };
      this.onClick = (e) => {
        const i = this.hit(e);
        if (i < 0) return;
        if (this.series * 20 + i > D().unlocked) { A.sfx.deny(); toast('이전 전투를 먼저 클리어하세요!'); return; }
        A.sfx.click(); this.sel = i; this.info();
      };
      this.el.addEventListener('pointermove', this.onMove);
      this.el.addEventListener('click', this.onClick);
      this.info(); A.playMusic('menu');
    },
    setSeries(s) {
      if (s < 0 || s >= BW.SERIES.length) { A.sfx.deny(); return; }
      if (s * 20 > D().unlocked || (s > 0 && !D().cleared[s * 20 - 1])) { A.sfx.deny(); toast(`시리즈 ${s}의 마지막 전투를 클리어하면 열려요!`); return; }
      A.sfx.click();
      this.series = s;
      this.sel = BW.clamp(D().unlocked - s * 20, 0, 19);
      this.info();
    },
    hit(e) {
      if (e.target.closest('.info, .topbar, .snav')) return -1;
      const r = canvas.getBoundingClientRect();
      return BW.Scenes.mapHit((e.clientX - r.left) / r.width * BW.W, (e.clientY - r.top) / r.height * BW.H);
    },
    info() {
      const d = D(), g = this.series * 20 + this.sel, st = BW.STAGES[g], sc = d.cleared[g] || 0, done = sc > 0;
      const foes = stageFoes(st);
      const good = d.party.filter((id) => BW.matchEls(id, st.els).length).length;
      this.el.querySelector('.sname').innerHTML = `${BW.SERIES[this.series].name} <span style="font-size:11px;color:#6b3a1a">(${Object.keys(d.cleared).filter((k) => Math.floor(k / 20) === this.series).length}/20)</span>`;
      const el = this.el.querySelector('.info');
      el.innerHTML = `<div class="no">전투 ${stageNo(g)} ${st.boss ? '<b style="color:#e8384f">· BOSS</b>' : ''} ${done ? `<span class="mini-stars">${starRow(sc, 1.3)}</span>` : ''}</div>
        <h2>${st.name}</h2><div class="desc">${st.desc}</div>
        <div class="sect">등장하는 적 <span class="els">${st.els.length ? st.els.map(elChip).join('') : '<span class="elchip none">일반 속성만</span>'}</span></div>
        <div class="foes">${foes.map((f) => `<div class="f" title="${BW.enemyName(f.e, f.el)}"${f.el ? ` style="border-color:${BW.EL[f.el].col}"` : ''}>${S.img(f.e, 30 / S.DEF[f.e].h, false, '', '', f.el)}${f.el ? `<span class="fel">${elIcon(f.el, 1)}</span>` : ''}</div>`).join('')}</div>
        <div class="sect">보상 ${done ? '(재도전: 골드만 획득)' : '(최초 클리어)'}</div>
        <div class="rew"><span>${S.icon('gold')} ${st.gold}</span><span class="${done ? 'done' : ''}">${S.icon('flour')} ${st.flour}</span>
          ${st.recipe ? `<span class="${done ? 'done' : ''}" title="레시피">${S.img(st.recipe, 1.2)} ${BW.BREADS[st.recipe].name}</span>` : ''}</div>
        <div class="sect">출격 파티${st.els.length ? ` · 상성 <b style="color:${good ? '#2f8a2a' : '#c0392b'}">${good}/${d.party.length}</b>` : ''} <button class="btn small cream" data-a="party" style="float:right;margin-top:-4px">편집</button></div>
        <div class="party-mini">${d.party.map((id) => { const m = BW.matchEls(id, st.els); return `<div class="p ${m.length ? 'good' : ''}" title="${bname(id, d.owned[id])}">${S.img(id, bscale(id, 1.4), d.owned[id] >= BW.EVO_LV)}${m.length ? `<span class="fel">${m.map((el) => elIcon(el, 0.9)).join('')}</span>` : ''}</div>`; }).join('') || '<span style="font-size:12px">파티가 비어 있어요!</span>'}</div>
        <button class="btn green go" style="font-size:22px">출격! <span style="font-size:15px;display:inline-flex;align-items:center;gap:2px">${S.icon('energy', 1.6)}${st.energy}</span></button>`;
      el.querySelector('[data-a=party]').onclick = () => { A.sfx.click(); go('party', { back: 'map', stage: g }); };
      el.querySelector('.go').onclick = () => startStage(g);
    },
    leave() { this.el.removeEventListener('pointermove', this.onMove); this.el.removeEventListener('click', this.onClick); canvas.style.cursor = ''; },
    render(c, t) { const d = D(); BW.Scenes.drawMap(c, t, this.series, d.unlocked, d.cleared, this.hover, this.sel); },
  });

  function startStage(g) {
    const d = D(), st = BW.STAGES[g];
    if (!d.party.length) { A.sfx.deny(); toast('파티에 빵을 1개 이상 편성하세요!'); return; }
    SV.tickEnergy();
    if (d.energy < st.energy) { A.sfx.deny(); toast(`에너지가 부족해요! (필요: ${st.energy})`); return; }
    SV.spendEnergy(st.energy); refreshRes();
    A.sfx.deploy();
    const pre = 'pre' + g;
    if (BW.STORY[pre] && !d.cleared[g]) go('story', { key: pre, done: () => go('battle', { idx: g }) });
    else go('battle', { idx: g });
  }

  // ════════ 레시피 북 ════════
  reg('book', {
    enter() {
      this.filter = this.filter || '1';
      this.el.innerHTML = `${topbar('레시피 북', { extra: `<div class="res cnt-box" style="min-width:0"></div>` })}
        <div class="ftabs"><button class="btn small" data-f="1">${S.icon('star', 1.1)} 일반</button><button class="btn small" data-f="2">${S.icon('star', 1.1)}${S.icon('star', 1.1)} 희귀</button><button class="btn small" data-f="3">${S.icon('star', 1.1)}${S.icon('star', 1.1)}${S.icon('star', 1.1)} 전설</button><button class="btn small" data-f="oven">${S.icon('flame', 1.2)} 오븐 강화</button></div>
        <button class="btn arrow l">◀</button><button class="btn arrow r">▶</button>
        <div class="shelf"></div><div class="hint outline-text">카드를 눌러 자세히 보기 · 좌우로 스크롤하여 모든 빵을 확인하세요</div>`;
      bindBack(this.el);
      const sh = this.el.querySelector('.shelf');
      sh.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { sh.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
      this.el.querySelector('.arrow.l').onclick = () => { A.sfx.click(); sh.scrollLeft -= 570; };
      this.el.querySelector('.arrow.r').onclick = () => { A.sfx.click(); sh.scrollLeft += 570; };
      this.el.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { A.sfx.click(); this.filter = b.dataset.f; sh.scrollLeft = 0; this.draw(); }));
      this.draw();
    },
    draw() {
      const d = D(), sh = this.el.querySelector('.shelf'), keep = sh.scrollLeft;
      this.el.querySelectorAll('[data-f]').forEach((b) => b.classList.toggle('cream', b.dataset.f !== this.filter));
      this.el.querySelector('.cnt-box').innerHTML = `${S.icon('book', 1.4)} 수집 ${Object.keys(d.owned).length}/${BW.BREAD_ORDER.length}`;
      this.el.querySelector('.hint').textContent = this.filter === 'oven' ? '골드로 오븐을 강화하면 모든 전투에 적용돼요' : '카드를 눌러 자세히 보기 · 좌우로 스크롤하여 모든 빵을 확인하세요';
      if (this.filter === 'oven') {
        // 오븐 강화 카드
        sh.innerHTML = BW.OVEN_UP.map((u) => {
          const lv = d.oven[u.id] || 0, max = lv >= u.max, cost = BW.ovenUpCost(lv);
          return `<div class="card ovencard notch"><div class="stars">오븐 강화</div>
            <div class="art">${S.img(u.spr, u.sc)}</div>
            <div class="nm">${u.name}</div><div class="lv ${max ? 'evo' : ''}">Lv.${lv} / ${u.max}</div>
            <div class="odesc">${u.desc}</div>
            <div class="oval">${u.fmt(lv)}${max ? '' : `<br>▶ <b>${u.fmt(lv + 1)}</b>`}</div>
            ${max ? '<button class="btn small dis" disabled>최대 레벨</button>' : `<button class="btn small green" data-ov="${u.id}">강화 ${S.icon('gold', 1.4)}${BW.fmt(cost)}</button>`}</div>`;
        }).join('');
        sh.scrollLeft = 0;
        sh.querySelectorAll('[data-ov]').forEach((b) => (b.onclick = () => {
          const id = b.dataset.ov, lv = d.oven[id] || 0, cost = BW.ovenUpCost(lv);
          if (d.gold < cost) { A.sfx.deny(); toast(`골드가 부족해요! (필요: ${BW.fmt(cost)})`); return; }
          d.gold -= cost; d.oven[id] = lv + 1; SV.save(); refreshRes();
          A.sfx.upgrade(); toast(`${BW.OVEN_UP.find((x) => x.id === id).name} Lv.${lv + 1} 달성!`);
          this.draw();
        }));
        return;
      }
      const ids = BW.BREAD_ORDER.filter((id) => String(BW.BREADS[id].rarity) === this.filter);
      sh.innerHTML = ids.map((id) => {
        const b = BW.BREADS[id], lv = d.owned[id], rb = b.group === 'robot' ? ' robot' : '';
        if (!lv) {
          const src = BW.STAGES.find((s) => s.recipe === id);
          const how = b.group === 'robot' ? '특별 뽑기 시즌 1<br>「메카 베이커리」에서 획득' : `${src ? `전투 ${stageNo(src.idx)} 클리어 보상<br>또는 ` : ''}상시 뽑기에서 획득`;
          return `<div class="card unknown r${b.rarity}${rb} notch"><div class="stars">${stars(b.rarity)}</div><div class="q">?</div>
            <div class="art" style="height:auto;background:none;opacity:.5">${S.img(id, bscale(id, 2), false, '', 'sil')}</div>
            <div class="nm">???</div><div style="font-size:12px;text-align:center;margin-top:auto">${how}</div></div>`;
        }
        const s = BW.breadStats(id, lv), evo = lv >= BW.EVO_LV, cost = BW.enhanceCost(id, lv), max = lv >= BW.MAX_LV;
        return `<div class="card r${b.rarity}${rb} notch" data-id="${id}"><div class="stars">${stars(b.rarity)}${b.group === 'robot' ? '<span class="rtag">ROBOT</span>' : ''}</div>
          <div class="art">${S.img(id, bscale(id, 4.6), evo)}</div>
          <div class="nm">${bname(id, lv)}</div><div class="lv ${evo ? 'evo' : ''}">Lv.${lv}${evo ? ' ★진화' : ''}</div>
          <div class="affs">${affTags(id) || '<span class="aff none">상성 없음</span>'}</div>
          <div class="st"><div><b>공격</b>${s.atk}</div><div><b>방어</b>${s.def}</div><div><b>체력</b>${s.hp}</div><div><b>코스트</b>${s.cost}</div>
          <div><b>속도</b>${s.spd}</div><div><b>사거리</b>${s.range}</div></div>
          ${max ? '<button class="btn small dis" disabled>최대 레벨</button>' : `<button class="btn small ${lv === BW.EVO_LV - 1 ? 'purple' : 'green'}" data-up="${id}">${lv === BW.EVO_LV - 1 ? '진화' : '강화'} ${S.icon('gold', 1.4)}${BW.fmt(cost)}</button>`}</div>`;
      }).join('');
      sh.scrollLeft = keep;
      sh.querySelectorAll('[data-up]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); enhance(b.dataset.up, () => this.draw()); }));
      sh.querySelectorAll('.card[data-id]').forEach((c) => (c.onclick = () => { A.sfx.click(); detail(c.dataset.id, () => this.draw()); }));
    },
    render(c, t) {
      c.drawImage(BW.Scenes.background('river', 5), 0, 0); BW.Scenes.anim(c, 'river', t);
      c.fillStyle = 'rgba(40,20,10,0.45)'; c.fillRect(0, 0, BW.W, BW.H);
    },
  });

  function enhance(id, after) {
    const d = D(), lv = d.owned[id];
    if (lv >= BW.MAX_LV) { toast('이미 최대 레벨이에요!'); return; }
    const cost = BW.enhanceCost(id, lv);
    if (d.gold < cost) { A.sfx.deny(); toast(`골드가 부족해요! (필요: ${BW.fmt(cost)})`); return; }
    d.gold -= cost; d.owned[id] = lv + 1; SV.save(); refreshRes();
    if (lv + 1 === BW.EVO_LV) evolveFx(id, after);
    else { A.sfx.upgrade(); toast(`${bname(id, lv + 1)} Lv.${lv + 1} 달성!`); after && after(); }
  }
  function evolveFx(id, after) {
    A.sfx.evolve();
    const b = BW.BREADS[id], sc = bscale(id, 8);
    const el = modal(`<div class="panel notch confirm" style="width:440px"><div style="font-size:14px;color:#a8442a">레벨 ${BW.EVO_LV} 달성!</div>
      <h1 style="margin:4px 0;font-family:Galmuri14">진화!</h1><div class="evoart" style="height:230px;display:flex;align-items:flex-end;justify-content:center"></div>
      <div class="evotxt" style="font-size:18px;min-height:28px"></div><div class="acts"><button class="btn green">확인</button></div></div>`);
    const art = el.querySelector('.evoart');
    let k = 0;
    const seq = setInterval(() => {
      k++;
      const showNew = k > 14 || (k > 4 && k % 2 === 0);
      art.innerHTML = S.img(id, sc, showNew, '', k < 14 && k % 3 === 0 ? 'sil' : '');
      art.style.transform = k < 14 ? `scale(${1 + 0.04 * (k % 2)})` : '';
      if (k > 14) { clearInterval(seq); el.querySelector('.evotxt').innerHTML = `${b.name} ➜ <b style="color:#c96a1a">${b.evoName}</b>`; art.style.filter = 'drop-shadow(0 0 12px #ffd23f)'; art.classList.add('evopop'); }
    }, 110);
    art.innerHTML = S.img(id, sc, false);
    el.querySelector('.btn').onclick = () => { clearInterval(seq); closeModal(); after && after(); };
  }

  function detail(id, after) {
    const d = D(), b = BW.BREADS[id], lv = d.owned[id], evo = lv >= BW.EVO_LV;
    const s = BW.breadStats(id, lv), n = lv < BW.MAX_LV ? BW.breadStats(id, lv + 1) : null;
    const fmtS = (k, v) => (k === 'aspd' ? v + '회/초' : k === 'cd' ? v + '초' : v);
    const rows = BW.STAT_LABEL.map(([k, l]) => {
      const up = n && n[k] !== s[k];
      return `<tr><td>${l}</td><td>${fmtS(k, s[k])}</td><td class="up">${up ? '▶ ' + fmtS(k, n[k]) : ''}</td></tr>`;
    }).join('');
    const cost = BW.enhanceCost(id, lv);
    const el = modal(`<div class="panel notch detail"><button class="btn small cream close">✕</button>
      <div class="left"><div class="bigart">${S.img(id, bscale(id, 8), evo)}</div>
        <div class="lvbar"><i style="width:${lv / BW.MAX_LV * 100}%"></i><div class="mark"></div></div>
        <div style="font-size:13px">Lv.${lv} / ${BW.MAX_LV} ${evo ? '<b style="color:#c96a1a">진화 완료</b>' : `· Lv.${BW.EVO_LV}에 진화`}</div>
        <div class="evo-prev"><div class="box">${S.img(id, bscale(id, 2), false)}</div>➜<div class="box">${evo ? S.img(id, bscale(id, 2), true) : S.img(id, bscale(id, 2), true, '', 'sil')}</div><span>${evo ? b.evoName : '???'}</span></div>
      </div>
      <div><span class="tag">${stars(b.rarity)} ${BW.RARITY_NAME[b.rarity]}</span>${b.group === 'robot' ? '<span class="tag" style="background:#d6f3ff">시즌 1 로봇</span>' : ''}${evo ? '<span class="tag" style="background:#ffe0a0">진화형</span>' : ''}
        <h2>${bname(id, lv)}</h2>
        <div class="desc">${evo ? b.evoDesc : b.desc}</div>
        ${b.trait ? `<div class="trait">◆ ${b.trait}</div>` : ''}
        ${[...b.res].map((el) => `<div class="trait" style="color:${BW.shadeHex(BW.EL[el].col, -0.3)}">${S.icon('shield', 1.2)}${elIcon(el)} ${BW.EL[el].name} 저항: ${BW.EL[el].res}</div>`).join('')}
        ${[...b.bane].map((el) => `<div class="trait" style="color:${BW.shadeHex(BW.EL[el].col, -0.3)}">${S.icon('sword', 1.2)}${elIcon(el)} ${BW.EL[el].name} 특효: ${BW.EL[el].bane}</div>`).join('')}
        <table>${rows}</table>
        <div class="actions">${n ? `<button class="btn ${lv === BW.EVO_LV - 1 ? 'purple' : 'green'} up">${lv === BW.EVO_LV - 1 ? '진화하기' : '강화하기'} ${S.icon('gold', 1.6)} ${BW.fmt(cost)}</button>` : '<button class="btn dis" disabled>최대 레벨 달성</button>'}
        <span style="font-size:12px;color:#6b3a1a">보유 ${S.icon('gold', 1.4)} ${BW.fmt(d.gold)}</span></div>
      </div></div>`);
    el.querySelector('.close').onclick = () => { A.sfx.back(); closeModal(); after && after(); };
    const up = el.querySelector('.up');
    if (up) up.onclick = () => enhance(id, () => { after && after(); detail(id, after); });
  }

  // ════════ 파티 ════════
  reg('party', {
    enter(p) {
      this.back = p.back || 'main';
      this.stage = p.stage ?? Math.min(D().unlocked, NS - 1);
      const st = BW.STAGES[this.stage];
      this.els = st.els;
      this.el.innerHTML = `${topbar('파티 구성', { extra: `<button class="btn small cream" data-a="auto" style="margin-left:6px">추천 편성</button>
          <div class="res nextst" style="min-width:0">전투 ${stageNo(this.stage)} 속성: ${st.els.length ? st.els.map(elChip).join('') : '일반'}</div>` })}
        <div class="slots panel notch"></div><div class="pool panel notch"></div>`;
      bindBack(this.el, this.back);
      if (p.stage !== undefined) this.el.querySelector('[data-nav=back]').onclick = () => { A.sfx.back(); go('map', { sel: p.stage }); };
      this.el.querySelector('[data-a=auto]').onclick = () => {
        A.sfx.click();
        const d = D();
        const score = (id) => BW.BREADS[id].rarity * 100 + d.owned[id] * 12 + BW.matchEls(id, this.els).length * 160;
        d.party = Object.keys(d.owned).sort((a, b2) => score(b2) - score(a)).slice(0, 7).sort((a, b2) => BW.BREADS[a].cost - BW.BREADS[b2].cost);
        SV.save(); this.draw();
      };
      this.draw();
    },
    draw() {
      const d = D();
      const slots = [];
      for (let i = 0; i < 7; i++) {
        const id = d.party[i];
        if (id) {
          const b = BW.BREADS[id], lv = d.owned[id];
          slots.push(`<div class="slot filled ${BW.matchEls(id, this.els).length ? 'match' : ''}" data-rm="${i}"><span class="num">${i + 1}</span><span class="x">✕</span><div class="affs sm">${affTags(id, true)}</div>${S.img(id, bscale(id, 3), lv >= BW.EVO_LV)}
            <div class="snm">${bname(id, lv)}</div><div class="cost">${S.icon('flame', 1.4)}${b.cost} · Lv.${lv}</div></div>`);
        } else slots.push(`<div class="slot"><span class="num">${i + 1}</span><div style="margin-bottom:46px;color:#a88858">빈 슬롯</div></div>`);
      }
      this.el.querySelector('.slots').innerHTML = slots.join('');
      this.el.querySelector('.pool').innerHTML = BW.BREAD_ORDER.map((id) => {
        const b = BW.BREADS[id], lv = d.owned[id];
        if (!lv) return `<div class="pitem lock"><div style="font-size:40px;margin-bottom:20px">?</div><div>미보유</div></div>`;
        return `<div class="pitem r${b.rarity} ${d.party.includes(id) ? 'in' : ''} ${BW.matchEls(id, this.els).length ? 'match' : ''}" data-add="${id}" title="${b.trait || ''}"><span class="lvt">Lv.${lv}</span><div class="affs sm">${affTags(id, true)}</div>${S.img(id, bscale(id, 2.4), lv >= BW.EVO_LV)}
          <div class="snm">${bname(id, lv)}</div><div class="cost" style="display:flex;align-items:center;gap:2px">${S.icon('flame', 1.2)}${b.cost}</div></div>`;
      }).join('');
      this.el.querySelectorAll('[data-rm]').forEach((e) => (e.onclick = () => { A.sfx.back(); d.party.splice(+e.dataset.rm, 1); SV.save(); this.draw(); }));
      this.el.querySelectorAll('[data-add]').forEach((e) => (e.onclick = () => {
        const id = e.dataset.add, k = d.party.indexOf(id);
        if (k >= 0) { A.sfx.back(); d.party.splice(k, 1); }
        else if (d.party.length >= 7) { A.sfx.deny(); toast('파티는 최대 7개까지 편성할 수 있어요!'); return; }
        else { A.sfx.click(); d.party.push(id); }
        SV.save();
        const sc = this.el.querySelector('.pool').scrollTop;
        this.draw(); this.el.querySelector('.pool').scrollTop = sc;
      }));
    },
    render(c, t) { c.drawImage(BW.Scenes.background('forest', 4), 0, 0); BW.Scenes.anim(c, 'forest', t); },
  });

  // ════════ 뽑기 ════════
  function rollBread(G, minR = 1) {
    let r = 1, x = Math.random();
    for (const [k, p] of G.rates) { if (x < p) { r = k; break; } x -= p; }
    r = Math.max(minR, r);
    const pool = BW.BREAD_ORDER.filter((id) => BW.BREADS[id].group === G.group);
    let c = pool.filter((id) => BW.BREADS[id].rarity === r);
    if (!c.length) c = pool;
    return BW.pick(c);
  }
  reg('gacha', {
    enter(p) {
      this.mode = p.mode || this.mode || 'standard';
      this.anim = 0; this.best = 1;
      this.draw();
    },
    draw() {
      const d = D(), G = BW.GACHA[this.mode], sp = this.mode === 'special';
      const legend = BW.BREAD_ORDER.filter((id) => BW.BREADS[id].group === G.group && (sp || BW.BREADS[id].rarity === 3));
      this.el.innerHTML = `${topbar('뽑기')}
        <div class="tabs"><div class="tab ${sp ? '' : 'on'}" data-m="standard">상시 뽑기</div><div class="tab sp ${sp ? 'on' : ''}" data-m="special">${S.icon('bolt', 1.2)} 특별 뽑기 <small>시즌 1</small></div></div>
        <div class="banner panel notch ${sp ? 'special' : ''}"><h2>${G.name}</h2>
          <div class="desc">${G.desc}<br>· 새로운 레시피는 <b>Lv.1</b>로 레시피 북에 등록<br>· 이미 가진 레시피는 <b>레벨 +1</b> (Lv.${BW.MAX_LV}이면 골드 300)</div>
          <div class="rates">${G.rateText.map(([r, t]) => `<span>${stars(+r)}</span><span>${t}</span>`).join('')}</div>
          <div style="font-size:12px">${sp ? '시즌 1 한정 로봇 빵' : '전설 레시피'}</div><div class="preview">${legend.map((id) => `<span class="pv ${d.owned[id] ? '' : 'no'}" title="${BW.BREADS[id].name}">${S.img(id, bscale(id, 1.5))}</span>`).join('')}</div>
          ${sp ? `<div class="pity">전설 확정까지 <b>${Math.max(1, G.pity - d.pity)}</b>회 <div class="bar"><i style="width:${Math.min(100, d.pity / G.pity * 100)}%"></i></div></div>` : ''}
          <div class="pullbtns">
            <button class="btn" data-n="1">1회 ${sp ? '조립' : '굽기'} <span class="price">${S.icon('flour')} ${G.price}</span></button>
            <button class="btn purple" data-n="10">10회 ${sp ? '조립' : '굽기'} <span class="price">${S.icon('flour')} ${G.price10}</span></button>
            <div style="font-size:11px;text-align:center">${G.note}</div>
          </div></div>`;
      bindBack(this.el);
      this.el.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { if (this.anim > 0) return; A.sfx.click(); this.mode = b.dataset.m; this.draw(); refreshRes(); }));
      this.el.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => this.pull(+b.dataset.n)));
    },
    pull(n) {
      if (this.anim > 0) return;
      const d = D(), G = BW.GACHA[this.mode], price = n === 10 ? G.price10 : G.price;
      if (d.flour < price) { A.sfx.deny(); toast(`밀가루가 부족해요! (필요: ${BW.fmt(price)})`); return; }
      d.flour -= price; d.stats.pulls += n;
      const ids = [];
      for (let i = 0; i < n; i++) {
        let id;
        if (G.pity) {
          d.pity++;
          id = rollBread(G, d.pity >= G.pity ? 3 : 1);
          if (BW.BREADS[id].rarity === 3) d.pity = 0;
        } else id = rollBread(G);
        ids.push(id);
      }
      if (!G.pity && n === 10 && !ids.some((id) => BW.BREADS[id].rarity >= 2)) ids[9] = rollBread(G, 2);
      const res = ids.map((id) => SV.grantRecipe(id));
      SV.save(); refreshRes();
      this.best = Math.max(...ids.map((id) => BW.BREADS[id].rarity));
      this.anim = 1.8; A.sfx.drum();
      this.el.querySelectorAll('.btn, .tab').forEach((b) => (b.style.pointerEvents = 'none'));
      setTimeout(() => {
        A.sfx.reveal(this.best);
        this.draw(); refreshRes();
        this.results(res, n);
      }, 1800);
    },
    results(res, n) {
      const G = BW.GACHA[this.mode];
      const el = modal(`<div class="panel notch results"><h2>${this.mode === 'special' ? '조립 완료!' : '구워진 레시피!'}</h2><div class="grid">${res.map((r) => {
        const b = BW.BREADS[r.id];
        const tag = r.isNew ? '<span class="tagnew">NEW!</span>' : r.maxed ? `<span class="tagup">+${S.icon('gold', 1)}300</span>` : r.evolved ? '<span class="tagevo">진화!</span>' : `<span class="tagup">Lv.${r.lv}</span>`;
        return `<div class="rcard r${b.rarity}"><div class="in"><div class="bk">?</div><div class="fr"><div>${stars(b.rarity)}</div>${S.img(r.id, bscale(r.id, 3.2), r.lv >= BW.EVO_LV)}<b>${bname(r.id, r.lv)}</b>${tag}</div></div></div>`;
      }).join('')}</div><div class="foot"><button class="btn cream" data-a="ok">확인</button><button class="btn ${n === 10 ? 'purple' : ''}" data-a="again">한 번 더 (${S.icon('flour')} ${n === 10 ? G.price10 : G.price})</button></div></div>`);
      const cards = el.querySelectorAll('.rcard');
      cards.forEach((c, i) => setTimeout(() => {
        c.classList.add('flip');
        const r = BW.BREADS[res[i].id].rarity;
        if (r >= 2) A.sfx.reveal(r); else A.sfx.click();
      }, 250 + i * (n === 10 ? 170 : 0)));
      el.querySelector('[data-a=ok]').onclick = () => { A.sfx.click(); closeModal(); };
      el.querySelector('[data-a=again]').onclick = () => { closeModal(); this.pull(n); };
    },
    render(c, t, dt) {
      const sp = this.mode === 'special', th = sp ? 'station' : 'title';
      c.drawImage(BW.Scenes.background(th, 9), 0, 0); BW.Scenes.anim(c, th, t);
      let shx = 0, shy = 0, k = 0;
      if (this.anim > 0) { this.anim -= dt; k = 1.8 - this.anim; shx = Math.round(Math.sin(k * 40) * Math.min(3, k * 2)); shy = Math.round(Math.cos(k * 33) * 1); }
      if (sp) {
        const m = S.get('oventron', this.anim > 0 ? Math.floor(k * 10) % 2 : Math.floor(t * 2) % 2, true), sc = 4;
        const x = 150 - m.w * sc / 2 + shx, y = 236 - m.h * sc + shy - (this.anim > 0 ? Math.abs(Math.sin(k * 14)) * 4 : 0);
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(150 - 50, 230, 100, 6);
        c.drawImage(m.cv, Math.round(x), Math.round(y), m.w * sc, m.h * sc);
        for (let i = 0; i < (this.anim > 0 ? 8 : 1); i++) { c.fillStyle = BW.pick(['#5ff1ff', '#ffffff', '#ffd23f']); c.fillRect(150 + BW.rand(-50, 50), 120 + BW.rand(-40, 90), 2, 2); }
      } else {
        const ov = S.get('oven', 0), sc = 2;
        const x = 150 - ov.w * sc / 2 + shx, y = 236 - ov.h * sc + shy;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 10, 230, ov.w * sc - 20, 6);
        c.save(); c.translate(x + ov.w, y + ov.h * sc); const p = this.anim > 0 ? 1 + Math.sin(k * 20) * 0.03 : 1; c.scale(2 - p, p);
        c.drawImage(ov.cv, -ov.w, -ov.h * sc, ov.w * sc, ov.h * sc); c.restore();
        c.save(); c.translate(x, y); c.scale(sc, sc); BW.Scenes.fire(c, 33, 64, t, this.anim > 0 ? 1.7 : 1); c.restore();
        if (this.anim > 0) for (let i = 0; i < 6; i++) { c.fillStyle = BW.pick(['#ffd23f', '#ff8a2a', '#fff3a0']); c.fillRect(150 + BW.rand(-40, 40), 150 + BW.rand(-30, 40), 2, 2); }
      }
      if (this.anim > 0 && this.anim < 0.5) {
        const col = this.best === 3 ? '#ffd23f' : this.best === 2 ? '#7fc8ff' : '#ffffff';
        c.globalAlpha = (0.5 - this.anim) * 2; c.fillStyle = col; c.fillRect(0, 0, BW.W, BW.H); c.globalAlpha = 1;
      }
    },
  });

  // ════════ 전투 ════════
  reg('battle', {
    enter(p) {
      const d = D();
      this.idx = p.idx; this.st = BW.STAGES[p.idx];
      this.el.innerHTML = `<div class="hud-top"><div class="stagebox">전투 ${stageNo(p.idx)} · ${this.st.name}<span class="timer">0:00</span></div><div class="spacer"></div>
          <button class="btn small cream" data-a="speed">▶ 1배속</button><button class="btn small cream" data-a="pause">❚❚ 일시정지</button></div>
        <div class="costbox">${S.icon('flame', 2)}<span class="cv">0</span><span style="font-size:13px;color:#c8a878" class="cm">/20</span><div class="cbar"><i></i></div><span class="rate"></span></div>
        <div class="bottom">
          <button class="btn sbtn" data-a="oven"><span>화력 업</span><span class="s1 olv">Lv.1</span><span class="s1 oup"></span></button>
          <div class="cards" style="display:flex;gap:6px;flex:1;justify-content:center"></div>
          <button class="btn red sbtn" data-a="cannon"><span>오븐 대포</span><div class="meter"><i></i></div><span class="s1 cst">충전 중</span></button>
        </div>
        <div class="banner"></div><div class="tip panel notch hidden"></div>`;
      this.battle = new BW.Battle(p.idx, {
        canvas, party: d.party,
        onEnd: (win) => this.end(win),
        onEvent: (ev, x) => this.event(ev, x),
      });
      const cw = this.el.querySelector('.cards');
      const cards = [];
      for (let i = 0; i < 7; i++) {
        const c = this.battle.cards[i];
        if (!c) { cw.insertAdjacentHTML('beforeend', '<div class="bcard empty"></div>'); continue; }
        const b = BW.BREADS[c.id];
        const el = BW.el('div', `bcard r${b.rarity}${b.group === 'robot' ? ' robot' : ''}${BW.matchEls(c.id, this.st.els).length ? ' match' : ''}`, `<span class="key">${i + 1}</span><div class="affs sm">${affTags(c.id, true)}</div>${S.img(c.id, bscale(c.id, 2.6), c.s.evo)}<div class="c">${S.icon('flame', 1.3)}${c.s.cost}</div><div class="cd"></div><div class="cdt"></div>`);
        el.title = `${bname(c.id, c.lv)} (Lv.${c.lv})${b.trait ? ' — ' + b.trait : ''}`;
        el.onpointerdown = (e) => { e.preventDefault(); if (this.battle.deploy(i)) { el.classList.remove('fired'); void el.offsetWidth; el.classList.add('fired'); } };
        cw.appendChild(el); cards.push({ el, cd: el.querySelector('.cd'), cdt: el.querySelector('.cdt'), was: false });
      }
      this.cardEls = cards;
      this.el.querySelector('[data-a=oven]').onpointerdown = (e) => { e.preventDefault(); this.battle.upgradeOven(); };
      this.el.querySelector('[data-a=cannon]').onpointerdown = (e) => { e.preventDefault(); this.battle.fireCannon(); };
      this.el.querySelector('[data-a=speed]').onclick = () => {
        A.sfx.click(); this.battle.speed = this.battle.speed === 1 ? 2 : 1;
        this.el.querySelector('[data-a=speed]').textContent = this.battle.speed === 2 ? '▶▶ 2배속' : '▶ 1배속';
      };
      this.el.querySelector('[data-a=pause]').onclick = () => this.pause();
      this.onKey = (e) => {
        if (!modalEl.classList.contains('hidden') || !this.battle) return;
        const k = e.key.toLowerCase();
        if (k >= '1' && k <= '7') { const ce = this.cardEls[+k - 1]; if (this.battle.deploy(+k - 1) && ce) { ce.el.classList.remove('fired'); void ce.el.offsetWidth; ce.el.classList.add('fired'); } }
        else if (k === 'q') this.battle.upgradeOven();
        else if (k === 'w' || k === ' ') { e.preventDefault(); this.battle.fireCannon(); }
        else if (k === 'escape' || k === 'p') this.pause();
      };
      window.addEventListener('keydown', this.onKey);
      this.cannonWas = false;
      A.playMusic(this.st.boss ? 'boss' : 'battle');
      this.startMsg = `전투 개시!${this.st.els.length ? `<small>등장 속성: ${this.st.els.map((el) => BW.EL[el].name).join(' · ')}</small>` : ''}`;
      const newEls = this.st.els.filter((el) => !d.elSeen[el]);
      if (this.idx === 0 && !d.tutorialSeen) this.tutorial(0);
      else if (newEls.length) {
        // 처음 만나는 속성 안내
        const tips = newEls.map((el) => {
          const E = BW.EL[el];
          const mine = Object.keys(d.owned).filter((id) => BW.BREADS[id].res.includes(el) || BW.BREADS[id].bane.includes(el));
          return `<b style="color:${E.col}">${elIcon(el, 1.6)} 새로운 속성: ${E.name} 외계인!</b><br>${E.enemy}<br>
            ${S.icon('shield', 1.2)} <b>${E.name} 저항</b> 빵으로 버티거나, ${S.icon('sword', 1.2)} <b>${E.name} 특효</b> 빵으로 빠르게 처치하세요.<br>
            <span style="font-size:13px">${mine.length ? '상성이 맞는 내 빵: ' + mine.map((id) => S.img(id, bscale(id, 1.3)) ).join(' ') : '아직 상성이 맞는 빵이 없어요. 전투 보상과 뽑기로 얻어 보세요!'}</span>`;
        });
        newEls.forEach((el) => { d.elSeen[el] = true; });
        SV.save();
        this.tutorial(0, tips);
      } else this.banner(this.startMsg, 1.6);
    },
    tutorial(k, list) {
      const tips = list || [
        `<b>빵 카드</b>를 누르면 오븐에서 빵이 출격해요! (단축키 <b>1~7</b>)<br>${S.icon('flame', 1.4)} 코스트는 1초마다 1씩 쌓여요.`,
        `<b>화력 업</b>(Q)을 하면 코스트가 더 빨리, 더 많이 쌓여요.<br><b>오븐 대포</b>(W)는 충전되면 적을 한꺼번에 날려버려요!`,
        `왼쪽의 <b>외계 기지</b>를 부수면 승리!<br>오른쪽의 <b>오븐</b>이 부서지면 패배예요. 오븐 체력을 많이 남길수록 ★이 늘어나요.`,
      ];
      const tip = this.el.querySelector('.tip');
      this.battle.paused = true;
      tip.classList.remove('hidden');
      tip.innerHTML = `<div>${tips[k]}</div><button class="btn small green">${k < tips.length - 1 ? '다음 ▶' : '시작!'}</button>`;
      tip.querySelector('.btn').onclick = () => {
        A.sfx.click();
        if (k < tips.length - 1) this.tutorial(k + 1, list);
        else { tip.classList.add('hidden'); this.battle.paused = false; if (!list) { D().tutorialSeen = true; SV.save(); } this.banner(this.startMsg, 1.6); }
      };
    },
    banner(html, dur, cls = '') {
      const b = this.el.querySelector('.banner');
      b.className = 'banner ' + cls; b.innerHTML = html;
      requestAnimationFrame(() => b.classList.add('show'));
      clearTimeout(this.bt);
      if (dur) this.bt = setTimeout(() => b.classList.remove('show'), dur * 1000);
    },
    event(ev, x) {
      if (ev === 'boss') { this.banner(`⚠ 보스 출현! ⚠<small>${BW.ENEMIES[x.id].name}</small>`, 2.2, 'warn'); A.playMusic('boss'); }
      else if (ev === 'reinforce') this.banner('적 증원 출현!', 1.2, 'warn');
      else if (ev === 'rush') this.banner('⚠ 적의 대공세! ⚠', 1.6, 'warn');
      else if (ev === 'enrage') this.banner(`${BW.ENEMIES[x.id].name} 분노!`, 1.4, 'warn');
      else if (ev === 'bossDown') this.banner('보스 격파!', 1.5);
      else if (ev === 'win') { this.banner('승리!', 0, 'win'); A.stopMusic(); }
      else if (ev === 'lose') { this.banner('패배…', 0, 'warn'); A.stopMusic(); }
    },
    pause() {
      if (!this.battle || this.battle.over) return;
      A.sfx.click(); this.battle.paused = true;
      const el = modal(`<div class="panel notch confirm"><h2 style="margin:0 0 10px">일시정지</h2>
        <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn green" data-a="go">계속하기</button>
        <button class="btn cream" data-a="spd">${this.battle.speed === 2 ? '1배속으로' : '2배속으로'}</button>
        <button class="btn" data-a="retry">다시 시작 (${S.icon('energy', 1.4)}${this.st.energy})</button>
        <button class="btn red" data-a="quit">후퇴하기</button></div>
        <div style="font-size:12px;margin-top:8px;color:#6b3a1a">후퇴하면 사용한 에너지는 돌아오지 않아요.</div></div>`);
      const resume = () => { closeModal(); this.battle.paused = false; };
      el.querySelector('[data-a=go]').onclick = () => { A.sfx.click(); resume(); };
      el.querySelector('[data-a=spd]').onclick = () => { this.el.querySelector('[data-a=speed]').click(); resume(); };
      el.querySelector('[data-a=retry]').onclick = () => { closeModal(); startStage(this.idx); };
      el.querySelector('[data-a=quit]').onclick = () => { A.sfx.back(); go('map', { sel: this.idx }); };
    },
    end(win) {
      const d = D(), st = this.st, g = this.idx, b = this.battle;
      const time = BW.fmtTime(b.t);
      d.stats.kills += b.stats.kills;
      if (win) {
        const prev = d.cleared[g] || 0, first = !prev;
        const sc = BW.starsFor(b.P.hp / b.P.max);
        d.gold += st.gold; d.stats.wins++;
        let rec = null, starFlour = 0, post = null;
        if (sc > prev) { starFlour = (sc - prev) * 15; d.flour += starFlour; d.cleared[g] = sc; }
        if (first) {
          d.flour += st.flour;
          d.unlocked = Math.max(d.unlocked, Math.min(g + 1, NS - 1));
          if (st.recipe) rec = SV.grantRecipe(st.recipe);
          if (BW.STORY['post' + g]) post = 'post' + g;
        }
        SV.save(); refreshRes();
        A.sfx.win();
        const el = modal(`<div class="panel notch result"><h1>승리!</h1><div class="bigstars">${starRow(sc, 4)}</div>
          <div class="stat">전투 ${stageNo(g)} · ${st.name} · ${time} · 처치 ${b.stats.kills} · 오븐 ${Math.round(b.P.hp / b.P.max * 100)}%</div>
          <div class="rew"><span>${S.icon('gold', 2.4)} +${st.gold}</span>${first || starFlour ? `<span>${S.icon('flour', 2.4)} +${(first ? st.flour : 0) + starFlour}</span>` : ''}</div>
          ${first ? `<div class="first">★ 최초 클리어 보상!${starFlour ? ` (별 보너스 +${starFlour})` : ''}</div>` : starFlour ? `<div class="first">★ 새로운 별 달성! 밀가루 +${starFlour}</div>` : '<div class="first" style="color:#6b3a1a">재도전 보상: 골드만 획득</div>'}
          ${rec ? `<div class="newrecipe">${S.img(rec.id, bscale(rec.id, 3))}<div style="text-align:left"><div style="font-size:12px;color:#a8442a">${rec.isNew ? '새로운 레시피 획득!' : '레시피 레벨 업!'}</div><b style="font-size:20px">${BW.BREADS[rec.id].name}</b>${rec.isNew ? `<div style="font-size:12px">${BW.BREADS[rec.id].trait || '레시피 북에 등록되었어요!'}</div>` : `<div style="font-size:12px">Lv.${rec.lv}</div>`}</div></div>` : ''}
          <div class="acts"><button class="btn cream" data-a="map">맵으로</button><button class="btn" data-a="retry">다시 하기 (${S.icon('energy', 1.4)}${st.energy})</button>
          ${g < NS - 1 ? `<button class="btn green" data-a="next">다음 전투 ▶</button>` : ''}</div></div>`);
        const after = (fn) => () => { A.sfx.click(); if (post) { const p = post; post = null; go('story', { key: p, done: fn }); } else fn(); };
        el.querySelector('[data-a=map]').onclick = after(() => go('map', { sel: Math.min(g + 1, NS - 1) }));
        el.querySelector('[data-a=retry]').onclick = after(() => startStage(g));
        const nx = el.querySelector('[data-a=next]');
        if (nx) nx.onclick = after(() => go('map', { sel: g + 1 }));
        [0, 1, 2].forEach((k) => { if (k < sc) setTimeout(() => A.sfx.coin(), 300 + k * 250); });
      } else {
        d.stats.losses++; SV.save();
        A.sfx.lose();
        const el = modal(`<div class="panel notch result lose"><h1>패배…</h1><div class="stat">전투 ${stageNo(g)} · ${st.name} · 버틴 시간 ${time} · 적 기지 ${Math.round(b.E.hp / b.E.max * 100)}% 남음</div>
          <div style="margin:14px 0;font-size:14px;line-height:1.6">${BW.pick(['레시피 북에서 빵을 강화해 보세요!', '탱커 빵을 앞세우고 원거리 빵으로 지원해 보세요.', '뽑기로 새로운 빵 레시피를 얻어 보세요!', '「화력 업」을 일찍 해 두면 후반이 편해져요.', '오븐 대포로 위기를 넘겨 보세요!', '대공세 경고가 뜨면 코스트를 아껴 두었다가 한꺼번에 내보내세요.'])}</div>
          <div class="acts"><button class="btn cream" data-a="map">맵으로</button><button class="btn" data-a="book">레시피 북</button><button class="btn green" data-a="retry">다시 하기 (${S.icon('energy', 1.4)}${st.energy})</button></div></div>`);
        el.querySelector('[data-a=map]').onclick = () => { A.sfx.click(); go('map', { sel: g }); };
        el.querySelector('[data-a=book]').onclick = () => { A.sfx.click(); go('book'); };
        el.querySelector('[data-a=retry]').onclick = () => startStage(g);
      }
    },
    leave() { window.removeEventListener('keydown', this.onKey); clearTimeout(this.bt); this.battle = null; },
    render(c, t, dt) {
      const b = this.battle;
      if (!b) return;
      b.step(dt);
      b.render();
      // HUD
      const ov = b.oven, q = (s) => this.el.querySelector(s);
      q('.cv').textContent = Math.floor(b.cost);
      q('.cm').textContent = '/' + ov.max;
      q('.cbar i').style.width = (b.cost / ov.max * 100) + '%';
      q('.rate').textContent = '+' + ov.rate.toFixed(1) + '/초';
      q('.timer').textContent = BW.fmtTime(b.t);
      const maxed = b.ovenLv >= BW.OVEN_MAX_LV;
      q('.olv').textContent = 'Lv.' + b.ovenLv + (maxed ? ' (MAX)' : '');
      q('.oup').innerHTML = maxed ? '' : `${S.icon('flame', 1.1)}${ov.up}`;
      q('[data-a=oven]').classList.toggle('dis', maxed || b.cost < ov.up);
      q('.meter i').style.width = (b.cannon * 100) + '%';
      q('.cst').textContent = b.cannon >= 1 ? '발사 가능!' : Math.floor(b.cannon * 100) + '%';
      const cb = q('[data-a=cannon]');
      cb.classList.toggle('ready', b.cannon >= 1 && !b.over);
      cb.classList.toggle('dis', b.cannon < 1);
      if (b.cannon >= 1 && !this.cannonWas) A.sfx.ready();
      this.cannonWas = b.cannon >= 1;
      this.cardEls.forEach((ce, i) => {
        const cd = b.cards[i];
        ce.cd.style.height = (cd.cd / cd.s.cd * 100) + '%';
        ce.cdt.textContent = cd.cd > 0 ? Math.ceil(cd.cd) : '';
        const ok = b.canDeploy(i);
        ce.el.classList.toggle('no', !ok && cd.cd <= 0);
        if (ok && !ce.was) { ce.el.classList.remove('ready'); void ce.el.offsetWidth; ce.el.classList.add('ready'); }
        ce.was = ok;
      });
    },
  });

  // ───── 메인 루프 ─────
  let last = performance.now(), t0 = last, resT = 0, imgT = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    resT += dt; imgT += dt;
    if (resT > 1) { resT = 0; SV.tickEnergy(); refreshRes(); }
    if (imgT > 0.32) { imgT = 0; S.tickImgs(); }
    if (cur && cur.render) {
      if (curName !== 'battle') { ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false; }
      cur.render(ctx, t, dt);
    }
    requestAnimationFrame(loop);
  }

  function start() {
    go('title');
    requestAnimationFrame(loop);
  }
  return { start, go, toast, modal, closeModal, refreshRes };
})();
