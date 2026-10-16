// Offline adapter: no external SDK, requests, mock ads, purchases or cloud writes.
(() => {
'use strict';
window.BerriesPlatform.register('local', () => ({
  capabilities: { cloud: false, rewarded: false, purchases: false },
  async init() {},
  getLanguage: () => window.navigator?.language || 'ru',
  async restoreProgress() { window.BerriesCampaign?.read(); return false; },
  saveProgress() { return false; },
  async flushProgress() { return true; },
  async getPurchaseCatalog() { return []; },
  async purchaseProduct() { return { ok: false, reason: 'unavailable' }; },
  async restorePurchases() { return []; },
  async showRewardedVideo() { return false; }
}));
})();
