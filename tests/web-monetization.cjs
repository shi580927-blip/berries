const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const cfgSource = fs.readFileSync('src/site/web-config.js', 'utf8');
const adapterSource = fs.readFileSync('src/platform/web.js', 'utf8');

function run(webSettings, adManager) {
  const providers = {};
  const win = {
    navigator: { language: 'ru-RU' },
    BerriesPlatform: { register(name, factory) { providers[name] = factory; } },
    BerriesCampaign: { read: () => ({}) }
  };
  if (adManager) win.Ya = { Context: { AdvManager: adManager } };
  const ctx = { window: win, console, Promise };
  vm.runInNewContext(cfgSource, ctx);
  if (webSettings) win.BerriesWebConfig = webSettings;
  vm.runInNewContext(adapterSource, ctx);
  assert.equal(win.BerriesPlatformConfig.platform, 'web');
  assert.equal(typeof providers.web, 'function');
  return providers.web();
}

(async () => {
  const disabled = run(null, null);
  assert.equal(disabled.capabilities.rewarded, false);
  assert.equal(disabled.capabilities.purchases, false);
  assert.equal(disabled.capabilities.cloud, false);
  assert.equal(await disabled.showRewardedVideo(), false);
  assert.equal(await disabled.purchaseProduct('coins_1000').then(x => x.ok), false);
  assert.equal((await disabled.getPurchaseCatalog()).length, 0);
  assert.equal(await disabled.flushProgress(), true);

  let renders = 0;
  let complete;
  const manager = {
    getPlatform: () => 'desktop',
    render(options) {
      renders++;
      assert.equal(options.type, 'rewarded');
      assert.equal(options.platform, 'desktop');
      assert.equal(options.blockId, 'R-A-12345-7');
      complete = options.onRewarded;
    }
  };
  const settings = {
    rsy: {
      enabled: true, rewardedApprovedAndTested: true,
      rewarded: { desktop: 'R-A-12345-7', touch: 'R-A-12345-8' }
    }
  };
  const adapter = run(settings, manager);
  assert.equal(adapter.capabilities.rewarded, true);
  const success = adapter.showRewardedVideo();
  assert.equal(renders, 1);
  complete(true);
  complete(false); // A repeated callback must not undo a granted reward.
  assert.equal(await success, true);
  const cancelled = adapter.showRewardedVideo();
  complete(false);
  assert.equal(await cancelled, false);
  assert.equal(renders, 2);

  let onError;
  const warning = run(settings, {
    getPlatform: () => 'touch',
    render(options) {
      assert.equal(options.blockId, 'R-A-12345-8');
      onError = options.onError;
      complete = options.onRewarded;
    }
  });
  const wait = warning.showRewardedVideo();
  onError({ type: 'warning', code: 'CONTAINER_IS_HIDDEN' });
  complete(true); // Warning does not mean the ad was cancelled.
  assert.equal(await wait, true);

  const fail = run(settings, {
    getPlatform: () => 'desktop',
    render(options) { options.onError({ type: 'error', code: 'BLOCK_NOT_FOUND' }); }
  });
  assert.equal(await fail.showRewardedVideo(), false);
  const invalid = run({ rsy: { enabled: true, rewardedApprovedAndTested: true,
    rewarded: { desktop: 'R-A-12345-7', touch: 'fake' } } }, manager);
  assert.equal(invalid.capabilities.rewarded, false);
  assert.equal(await invalid.showRewardedVideo(), false);

  console.log('PASS staged RСЯ: default disabled, no IAP, one reward callback, cancellation, warnings, errors, desktop/touch IDs');
})().catch(error => { console.error(error); process.exitCode = 1; });
