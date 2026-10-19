// Dedicated web monetization settings. Defaults are SAFE: no network, no ads, no payments.
// Fill only after RСЯ moderation, official block IDs, Rewarded access and live lifecycle testing.
window.BerriesPlatformConfig = { platform: 'web' };
window.BerriesWebConfig = Object.freeze({
  rsy: Object.freeze({
    enabled: false,
    loaderUrl: '',
    rewardedApprovedAndTested: false,
    rewarded: Object.freeze({ desktop: '', touch: '' }),
    // Ordinary fullscreen interstitial is NOT activated for SPA scene transitions.
    bannerEnabled: false
  }),
  checkout: Object.freeze({
    enabled: false,
    // Must be implemented by a server-side payment integration, never by localStorage.
    apiBase: '/api/berries'
  })
});
