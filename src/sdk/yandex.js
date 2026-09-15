(() => {
  'use strict';

  const state = {
    ysdk: null,
    player: null,
    ready: false,
    gameplayActive: false,
    initPromise: null,
  };

  const isMockAds = () => new URLSearchParams(location.search).get('mockAds') === '1';

  async function init() {
    if (state.initPromise) return state.initPromise;
    state.initPromise = (async () => {
      if (!window.YaGames?.init) {
        console.info('[Yandex] SDK unavailable: standalone mode');
        return null;
      }
      try {
        state.ysdk = await window.YaGames.init();
        try {
          state.player = await state.ysdk.getPlayer({ scopes: false });
        } catch (err) {
          console.warn('[Yandex] getPlayer unavailable, local save will be used', err);
        }
        return state.ysdk;
      } catch (err) {
        console.warn('[Yandex] init failed: standalone mode', err);
        return null;
      }
    })();
    return state.initPromise;
  }

  async function loadingReady() {
    await init();
    if (state.ready) return;
    state.ready = true;
    try { state.ysdk?.features?.LoadingAPI?.ready(); } catch (err) { console.warn(err); }
  }

  async function gameplayStart() {
    await init();
    if (state.gameplayActive) return;
    state.gameplayActive = true;
    try { state.ysdk?.features?.GameplayAPI?.start(); } catch (err) { console.warn(err); }
  }

  async function gameplayStop() {
    await init();
    if (!state.gameplayActive) return;
    state.gameplayActive = false;
    try { state.ysdk?.features?.GameplayAPI?.stop(); } catch (err) { console.warn(err); }
  }

  async function showRewardedVideo() {
    await init();
    if (!state.ysdk?.adv?.showRewardedVideo) {
      if (isMockAds()) {
        await new Promise(resolve => setTimeout(resolve, 700));
        return true;
      }
      return false;
    }

    await gameplayStop();
    return new Promise(resolve => {
      let rewarded = false;
      try {
        state.ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              try { window.__berriesPauseAudio?.(true); } catch {}
            },
            onRewarded: () => { rewarded = true; },
            onClose: () => {
              try { window.__berriesPauseAudio?.(false); } catch {}
              if(window.__berriesGameplayShouldRun)gameplayStart();
              resolve(rewarded);
            },
            onError: (error) => {
              console.warn('[Yandex] rewarded error', error);
              try { window.__berriesPauseAudio?.(false); } catch {}
              if(window.__berriesGameplayShouldRun)gameplayStart();
              resolve(false);
            },
          },
        });
      } catch (err) {
        console.warn('[Yandex] rewarded call failed', err);
        if(window.__berriesGameplayShouldRun)gameplayStart();
        resolve(false);
      }
    });
  }

  async function loadCloudData() {
    await init();
    if (!state.player?.getData) return null;
    try {
      return await state.player.getData(['berries']);
    } catch (err) {
      console.warn('[Yandex] cloud load failed', err);
      return null;
    }
  }

  async function saveCloudData(data, flush = false) {
    await init();
    if (!state.player?.setData) return false;
    try {
      await state.player.setData({ berries: data }, flush);
      return true;
    } catch (err) {
      console.warn('[Yandex] cloud save failed', err);
      return false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gameplayStop();
    else if (window.__berriesGameplayShouldRun) gameplayStart();
  });

  window.BerriesYandex = {
    init,
    loadingReady,
    gameplayStart,
    gameplayStop,
    showRewardedVideo,
    loadCloudData,
    saveCloudData,
    get sdk() { return state.ysdk; },
    get player() { return state.player; },
  };
})();
