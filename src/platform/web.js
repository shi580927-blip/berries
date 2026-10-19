// Website platform adapter. No ads or payments without separate provider approval/configuration.
// RСЯ loader belongs in the page head, once, using code from the owner's RСЯ cabinet.
(() => {
  'use strict';
  const cfg = window.BerriesWebConfig || {};
  const rsy = cfg.rsy || {};
  const validID = id => /^R-A-[0-9]+-[0-9]+$/.test(String(id || ''));
  const rewardedEnabled = rsy.enabled === true && rsy.rewardedApprovedAndTested === true
    && validID(rsy.rewarded?.desktop) && validID(rsy.rewarded?.touch);

  async function showRewardedVideo() {
    if (!rewardedEnabled) return false;
    const manager = window.Ya?.Context?.AdvManager;
    if (!manager || typeof manager.render !== 'function') return false;
    const platform = manager.getPlatform?.() === 'desktop' ? 'desktop' : 'touch';
    const blockId = rsy.rewarded[platform];
    return new Promise(resolve => {
      let finished = false;
      const complete = value => {
        if (finished) return;
        finished = true;
        resolve(value === true);
      };
      try {
        const result = manager.render({
          blockId, type: 'rewarded', platform,
          onRewarded: isRewarded => complete(isRewarded === true),
          onError: error => {
            console.warn('[Berries RСЯ]', error);
            if (error?.type === 'error') complete(false);
          }
        });
        Promise.resolve(result).catch(error => {
          console.warn('[Berries RСЯ] Render failed', error);
          complete(false);
        });
      } catch (error) {
        console.warn('[Berries RСЯ] Call failed', error);
        complete(false);
      }
    });
  }

  window.BerriesPlatform.register('web', () => ({
    capabilities: { cloud: false, rewarded: rewardedEnabled, purchases: false },
    async init() {},
    getLanguage: () => window.navigator?.language || 'ru',
    async restoreProgress() { window.BerriesCampaign?.read(); return false; },
    saveProgress() { return false; },
    async flushProgress() { return true; },
    async getPurchaseCatalog() { return []; },
    async restorePurchases() { return []; },
    async purchaseProduct() { return { ok: false, reason: 'unavailable' }; },
    showRewardedVideo
  }));
})();