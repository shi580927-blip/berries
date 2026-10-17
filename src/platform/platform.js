// Stable game-facing interface. Provider SDKs belong in separately loaded adapters.
(() => {
'use strict';
const registry=new Map(),config=window.BerriesPlatformConfig||{};
const platformId=config.platform||'local',supported=['ru'];
const COOLDOWN=120000,COOLDOWN_KEY='berries_'+platformId+'_rewarded_last_at';
let adapter=null,initPromise=null,adPromise=null,purchasePromise=null;
let language={detected:'ru',current:'ru',supported:[...supported]};
let block={reason:'unavailable',remainingMs:0};
const capabilities=()=>({cloud:false,rewarded:false,purchases:false,...adapter?.capabilities});
function register(id,factory){
  if(initPromise)throw Error('Platform registration must finish before init');
  if(registry.has(id)||typeof factory!=='function')throw Error('Invalid platform registration: '+id);
  registry.set(id,factory);
}
function init(){
  if(initPromise)return initPromise;
  initPromise=Promise.resolve().then(async()=>{
    const factory=registry.get(platformId);
    if(!factory)throw Error('Platform adapter is not loaded: '+platformId);
    adapter=factory();await adapter.init?.();
    const detected=String(await adapter.getLanguage?.()||window.navigator?.language||'ru').toLowerCase().split('-')[0];
    language={detected,current:supported.includes(detected)?detected:'ru',supported:[...supported]};
    if(document.documentElement)document.documentElement.lang=language.current;
    return adapter;
  });return initPromise;
}
const invoke=async(name,...args)=>{const a=await init();return a[name]?.(...args)};
function rewardedCooldownRemaining(){let last=0;try{last=Number(localStorage.getItem(COOLDOWN_KEY)||0)}catch{}return Math.max(0,COOLDOWN-(Date.now()-last))}
function rewardedCooldownLabel(){const n=Math.ceil(rewardedCooldownRemaining()/1000);return n?`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`:''}
function rewardedOfferEligible(){
  const c=window.BerriesCampaign?.read?.(),scenes=window.__berriesGame?.scene?.keys,play=scenes?.Play;
  if(play?.scene?.isActive?.()){
    if(c?.lastWin?.id===play.attemptId)return !c.lastWin.doubled&&!play.winRewardDoubled;
    return c?.active?.id===play.attemptId&&c.active.lost&&!play.continueUsed;
  }
  return !!(scenes?.Map?.scene?.isActive?.()&&c?.lives===0);
}
function showRewardedVideo(){
  if(adPromise)return adPromise;
  adPromise=(async()=>{
    await init();
    if(!capabilities().rewarded){block={reason:'unavailable',remainingMs:0};return false}
    if(!rewardedOfferEligible()){block={reason:'already_claimed',remainingMs:0};return false}
    const remaining=rewardedCooldownRemaining();
    if(remaining){block={reason:'cooldown',remainingMs:remaining};return false}
    window.BerriesLifecycle?.set('advertisement',true);
    try{
      // Adapter resolves true only for an actual confirmed reward callback.
      const rewarded=await adapter.showRewardedVideo?.()===true;
      block={reason:rewarded?null:'not_rewarded',remainingMs:0};
      if(rewarded)try{localStorage.setItem(COOLDOWN_KEY,String(Date.now()))}catch{}
      return rewarded;
    }catch{block={reason:'unavailable',remainingMs:0};return false}
    finally{window.BerriesLifecycle?.set('advertisement',false)}
  })().finally(()=>{adPromise=null});return adPromise;
}
function purchaseProduct(id){
  if(purchasePromise)return purchasePromise;
  purchasePromise=(async()=>{
    await init();
    if(!capabilities().purchases)return {ok:false,reason:'unavailable'};
    if(!window.BerriesCampaign?.ROYAL_PRODUCTS?.[id])return {ok:false,reason:'unknown_product'};
    window.BerriesLifecycle?.set('purchase',true);
    try{return await adapter.purchaseProduct(id)}
    catch{return {ok:false,reason:'cancelled'}}
    finally{window.BerriesLifecycle?.set('purchase',false)}
  })().finally(()=>{purchasePromise=null});return purchasePromise;
}
const api={
  id:platformId,register,init,languageReady:()=>init().then(()=>({...language})),
  loadingReady:()=>invoke('loadingReady'),
  gameplayStart(){if(!window.BerriesLifecycle?.paused&&window.__berriesGameplayShouldRun)return invoke('gameplayStart');},
  gameplayStop:()=>invoke('gameplayStop'),
  restoreProgress:()=>invoke('restoreProgress'),
  saveProgress(data){return capabilities().cloud&&adapter?.saveProgress?.(data)||false;},
  flushProgress:()=>invoke('flushProgress'),
  getPurchaseCatalog:async()=>{await init();return capabilities().purchases?await adapter.getPurchaseCatalog?.()||[]:[]},
  restorePurchases:async()=>{await init();return capabilities().purchases?await adapter.restorePurchases?.()||[]:[]},
  purchaseProduct,showRewardedVideo,rewardedCooldownRemaining,rewardedCooldownLabel,rewardedOfferEligible,
  REWARDED_COOLDOWN_MS:COOLDOWN,
  get capabilities(){return capabilities()},
  get language(){return {...language,supported:[...supported]}},
  get rewardedBlock(){return {...block}}
};
window.BerriesPlatform=api;
document.addEventListener('visibilitychange',()=>{if(document.hidden)api.flushProgress()});
window.addEventListener('pagehide',()=>api.flushProgress());
})();
