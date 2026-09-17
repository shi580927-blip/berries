(() => {
'use strict';
const REWARDED_COOLDOWN_MS=2*60*1000,REWARDED_AT_KEY='berries_rewarded_last_at';
const state={ysdk:null,player:null,payments:null,ready:false,gameplayActive:false,initPromise:null,paymentsPromise:null,purchasePromise:null,cloudLoaded:false,adPromise:null,rewardedBlock:{reason:null,remainingMs:0}};
let queued=null,saveTimer=null,saving=false;
function rewardedCooldownRemaining(){
 let last=0;try{last=Number(localStorage.getItem(REWARDED_AT_KEY)||0)}catch{}
 return Math.max(0,REWARDED_COOLDOWN_MS-(Date.now()-last));
}
function rewardedCooldownLabel(){
 const ms=rewardedCooldownRemaining();if(ms<=0)return '';
 const sec=Math.ceil(ms/1000),min=Math.floor(sec/60),rest=String(sec%60).padStart(2,'0');
 return `${min}:${rest}`;
}
function markRewardedShown(){try{localStorage.setItem(REWARDED_AT_KEY,String(Date.now()))}catch{}}
function rewardedOfferEligible(){
 const campaign=window.BerriesCampaign?.read?.();
 const game=window.__berriesGame,play=game?.scene?.keys?.Play,map=game?.scene?.keys?.Map;
 if(play?.scene?.isActive?.()){
  const attempt=play.attemptId;
  if(campaign?.lastWin?.id===attempt)return !campaign.lastWin.doubled&&!play.winRewardDoubled;
  if(campaign?.active?.id===attempt&&campaign.active.lost)return !play.continueUsed;
  return false;
 }
 if(map?.scene?.isActive?.())return campaign?.lives===0;
 return false;
}
async function init(){
 if(state.initPromise)return state.initPromise;
 state.initPromise=(async()=>{
  if(!window.YaGames?.init)return null;
  try{
   state.ysdk=await window.YaGames.init();
   state.ysdk.on?.('game_api_pause',()=>window.BerriesLifecycle.set('platform',true));
   state.ysdk.on?.('game_api_resume',()=>window.BerriesLifecycle.set('platform',false));
   try{state.player=await state.ysdk.getPlayer()}catch(e){console.warn('[Yandex] local save mode',e)}
   return state.ysdk;
  }catch(e){console.warn('[Yandex] standalone mode',e);return null}
 })();return state.initPromise;
}
async function loadingReady(){await init();if(state.ready)return;state.ready=true;(()=>{try{state.ysdk?.features?.LoadingAPI?.ready()}catch(e){console.warn(e)}})()}
async function gameplayStart(){await init();if(state.gameplayActive||window.BerriesLifecycle.paused||!window.__berriesGameplayShouldRun)return;state.gameplayActive=true;(()=>{try{state.ysdk?.features?.GameplayAPI?.start()}catch(e){console.warn(e)}})()}
async function gameplayStop(){await init();if(!state.gameplayActive)return;state.gameplayActive=false;(()=>{try{state.ysdk?.features?.GameplayAPI?.stop()}catch(e){console.warn(e)}})()}
async function restoreCampaign(){
 await init();
 if(!state.player){window.BerriesCampaign.read();return false}
 try{
  const data=await state.player.getData(['berries']);
  // Read the cloud before enabling any writes. A failed read must not erase remote progress.
  window.BerriesCampaign.restore(data?.berries);state.cloudLoaded=true;
  saveCloudData(window.BerriesCampaign.read());await restorePurchases();return true;
 }catch(e){console.warn('[Yandex] cloud read failed; remote save protected',e);window.BerriesCampaign.read();return false}
}
function saveCloudData(data){
 if(!state.cloudLoaded||!state.player)return false;
 queued=JSON.parse(JSON.stringify(data));
 if(!saveTimer&&!saving)saveTimer=setTimeout(flushCloud,3000);
 return true;
}
async function flushCloud(){
 clearTimeout(saveTimer);saveTimer=null;
 if(saving)return false;
 if(!queued)return true;
 if(!state.cloudLoaded||!state.player)return false;
 saving=true;const data=queued;queued=null;
 let ok=false;
 try{await state.player.setData({berries:data},true);ok=true}
 catch(e){if(!queued)queued=data;console.warn('[Yandex] cloud write queued for retry',e)}
 finally{saving=false;if(queued&&!saveTimer)saveTimer=setTimeout(flushCloud,5000)}
 return ok;
}
async function getPayments(){
 await init();if(!state.ysdk)return null;if(state.payments)return state.payments;
 if(!state.paymentsPromise)state.paymentsPromise=state.ysdk.getPayments().then(value=>(state.payments=value)).catch(e=>{console.warn('[Yandex] purchases unavailable',e);return null}).finally(()=>{state.paymentsPromise=null});
 return state.paymentsPromise;
}
async function getPurchaseCatalog(){const payments=await getPayments();if(!payments)return [];try{return await payments.getCatalog()}catch(e){console.warn('[Yandex] catalog unavailable',e);return []}}
async function creditPurchase(purchase){
 const productID=purchase?.productID,purchaseToken=purchase?.purchaseToken;
 const result=window.BerriesCampaign?.grantPurchase?.(productID,purchaseToken);if(!result?.ok)return {ok:false,reason:'unknown_product'};
 saveCloudData(window.BerriesCampaign.read());const saved=await flushCloud();if(!saved)return {ok:false,reason:'save_pending'};
 const payments=await getPayments();await payments.consumePurchase(purchaseToken);return {ok:true,duplicate:result.duplicate,productID};
}
async function restorePurchases(){
 const payments=await getPayments();if(!payments||!state.player)return [];
 try{const list=await payments.getPurchases();const restored=[];for(const purchase of list){const result=await creditPurchase(purchase);if(result.ok)restored.push(result.productID)}return restored}
 catch(e){console.warn('[Yandex] pending purchases check failed',e);return []}
}
function purchaseProduct(productID){
 if(state.purchasePromise)return state.purchasePromise;
 state.purchasePromise=(async()=>{
  if(!window.BerriesCampaign?.ROYAL_PRODUCTS?.[productID])return {ok:false,reason:'unknown_product'};
  const payments=await getPayments();if(!payments||!state.player)return {ok:false,reason:'unavailable'};
  window.BerriesLifecycle.set('purchase',true);await gameplayStop();
  try{const purchase=await payments.purchase({id:productID});return await creditPurchase(purchase)}
  catch(e){console.warn('[Yandex] purchase cancelled or failed',e);return {ok:false,reason:'cancelled'}}
  finally{window.BerriesLifecycle.set('purchase',false);if(window.__berriesGameplayShouldRun)gameplayStart()}
 })().finally(()=>{state.purchasePromise=null});return state.purchasePromise;
}
function showRewardedVideo(){
 if(state.adPromise)return state.adPromise;
 if(!rewardedOfferEligible()){state.rewardedBlock={reason:'already_claimed',remainingMs:0};return Promise.resolve(false)}
 const remaining=rewardedCooldownRemaining();
 if(remaining>0){state.rewardedBlock={reason:'cooldown',remainingMs:remaining};return Promise.resolve(false)}
 state.rewardedBlock={reason:null,remainingMs:0};
 state.adPromise=(async()=>{
  await init();if(!state.ysdk?.adv?.showRewardedVideo){state.rewardedBlock={reason:'unavailable',remainingMs:0};return false}
  window.BerriesLifecycle.set('advertisement',true);await gameplayStop();
  return new Promise(resolve=>{
   let rewarded=false,finished=false;
   const finish=ok=>{
    if(finished)return;finished=true;
    if(ok){markRewardedShown();state.rewardedBlock={reason:null,remainingMs:0}}
    else state.rewardedBlock={reason:'not_rewarded',remainingMs:0};
    window.BerriesLifecycle.set('advertisement',false);resolve(ok)
   };
   try{state.ysdk.adv.showRewardedVideo({callbacks:{
    onOpen:()=>window.BerriesLifecycle.set('advertisement',true),
    onRewarded:()=>{if(!finished)rewarded=true},
    onClose:()=>finish(rewarded),onError:()=>finish(false)
   }})}catch(e){console.warn('[Yandex] ad unavailable',e);state.rewardedBlock={reason:'unavailable',remainingMs:0};finish(false)}
  });
 })().finally(()=>{state.adPromise=null});return state.adPromise;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCloud()});
window.addEventListener('pagehide',flushCloud);
window.BerriesYandex={init,loadingReady,gameplayStart,gameplayStop,restoreCampaign,saveCloudData,flushCloud,showRewardedVideo,getPurchaseCatalog,purchaseProduct,restorePurchases,rewardedCooldownRemaining,rewardedCooldownLabel,rewardedOfferEligible,REWARDED_COOLDOWN_MS,
 get rewardedBlock(){const remaining=rewardedCooldownRemaining();return remaining>0?{reason:'cooldown',remainingMs:remaining}:{...state.rewardedBlock,remainingMs:0}},
 get language(){const detected=state.ysdk?.environment?.i18n?.lang||navigator.language||'ru';return {detected,supported:['ru'],current:'ru'}},
 get sdk(){return state.ysdk},get player(){return state.player}};
})();
