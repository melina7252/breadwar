// 빵들의 전쟁 - 저장 데이터
'use strict';
BW.ENERGY_MAX = 40;
BW.ENERGY_MS = 60000;

BW.Save = {
  key: 'breadwar_save_v2',
  data: null,
  fresh() {
    return {
      v: 2, gold: 300, flour: 500, energy: BW.ENERGY_MAX, energyTs: Date.now(),
      owned: { loaf: 1, croissant: 1 },
      party: ['loaf', 'croissant'],
      cleared: {},      // { 전투 번호: 별 개수 }
      unlocked: 0,
      claimed: {},      // 수령한 도전 과제
      pity: 0,          // 특별 뽑기 천장 카운트
      elSeen: {},       // 안내를 본 속성
      introSeen: false, tutorialSeen: false, sfx: true, music: true,
      stats: { pulls: 0, wins: 0, losses: 0, kills: 0 },
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) { d = null; }
    const f = this.fresh();
    if (d && d.v === 2) {
      this.data = Object.assign(f, d);
      this.data.stats = Object.assign(this.fresh().stats, d.stats || {});
      // 사라진 레시피 정리
      Object.keys(this.data.owned).forEach((id) => { if (!BW.BREADS[id]) delete this.data.owned[id]; });
      this.data.party = this.data.party.filter((id) => this.data.owned[id]);
    } else this.data = f;
    this.tickEnergy();
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* 저장 불가 환경 */ }
  },
  reset() {
    this.data = this.fresh();
    this.save();
  },
  tickEnergy() {
    const d = this.data, now = Date.now();
    if (d.energy >= BW.ENERGY_MAX) { d.energyTs = now; return; }
    const n = Math.floor((now - d.energyTs) / BW.ENERGY_MS);
    if (n > 0) {
      d.energy = Math.min(BW.ENERGY_MAX, d.energy + n);
      d.energyTs += n * BW.ENERGY_MS;
      if (d.energy >= BW.ENERGY_MAX) d.energyTs = now;
      this.save();
    }
  },
  energyNext() {
    const d = this.data;
    if (d.energy >= BW.ENERGY_MAX) return 0;
    return (BW.ENERGY_MS - (Date.now() - d.energyTs)) / 1000;
  },
  spendEnergy(n) {
    const d = this.data;
    if (d.energy < n) return false;
    const wasFull = d.energy >= BW.ENERGY_MAX;
    d.energy -= n;
    if (wasFull) d.energyTs = Date.now();
    this.save();
    return true;
  },
  // 레시피 획득: 신규면 Lv1, 보유 중이면 +1 (최대 레벨이면 골드 환급)
  grantRecipe(id) {
    const d = this.data;
    const prev = d.owned[id] || 0;
    let res;
    if (!prev) { d.owned[id] = 1; res = { id, isNew: true, lv: 1 }; }
    else if (prev < BW.MAX_LV) { d.owned[id] = prev + 1; res = { id, isNew: false, lv: prev + 1, evolved: prev + 1 === BW.EVO_LV }; }
    else { d.gold += 300; res = { id, isNew: false, lv: prev, maxed: true, gold: 300 }; }
    if (res.isNew && d.party.length < 7 && !d.party.includes(id)) d.party.push(id);
    this.save();
    return res;
  },
};
