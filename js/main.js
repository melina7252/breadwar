// 빵들의 전쟁 - 시작
'use strict';
(function boot() {
  const app = document.getElementById('app');
  function fit() {
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    app.style.transform = `translate(-50%, -50%) scale(${s})`;
    app.style.transformOrigin = 'center center';
  }
  window.addEventListener('resize', fit);
  fit();

  BW.Save.load();
  BW.Audio.setSfx(BW.Save.data.sfx);
  BW.Audio.setMusic(BW.Save.data.music);
  document.addEventListener('pointerdown', () => BW.Audio.init(), { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { BW.Save.tickEnergy(); BW.UI.refreshRes(); } });

  const go = () => BW.UI.start();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('12px Galmuri11'), document.fonts.load('40px Galmuri14')]).catch(() => {}).then(go);
  } else go();
})();
