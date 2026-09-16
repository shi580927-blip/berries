(() => {
'use strict';
const state={ysdk:null,player:null,ready:false,gameplayActive:false,initPromise:null,cloudLoaded:false,adPromise:null};
let queued=null,saveTimer=null,saving=false;
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
  saveCloudData(window.BerriesCampaign.read());return true;
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
 if(saving||!queued||!state.cloudLoaded)return;
 saving=true;const data=queued;queued=null;
 try{await state.player.setData({berries:data},true)}
 catch(e){if(!queued)queued=data;console.warn('[Yandex] cloud write queued for retry',e)}
 finally{saving=false;if(queued&&!saveTimer)saveTimer=setTimeout(flushCloud,5000)}
}
function showRewardedVideo(){
 if(state.adPromise)return state.adPromise;
 state.adPromise=(async()=>{
  await init();if(!state.ysdk?.adv?.showRewardedVideo)return false;
  window.BerriesLifecycle.set('advertisement',true);await gameplayStop();
  return new Promise(resolve=>{
   let rewarded=false,finished=false;
   const finish=ok=>{if(finished)return;finished=true;window.BerriesLifecycle.set('advertisement',false);resolve(ok)};
   try{state.ysdk.adv.showRewardedVideo({callbacks:{
    onOpen:()=>window.BerriesLifecycle.set('advertisement',true),
    onRewarded:()=>{if(!finished)rewarded=true},
    onClose:()=>finish(rewarded),onError:()=>finish(false)
   }})}catch(e){console.warn('[Yandex] ad unavailable',e);finish(false)}
  });
 })().finally(()=>{state.adPromise=null});return state.adPromise;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCloud()});
window.addEventListener('pagehide',flushCloud);
window.BerriesYandex={init,loadingReady,gameplayStart,gameplayStop,restoreCampaign,saveCloudData,flushCloud,showRewardedVideo,
 get language(){const detected=state.ysdk?.environment?.i18n?.lang||navigator.language||'ru';return {detected,supported:['ru'],current:'ru'}},
 get sdk(){return state.ysdk},get player(){return state.player}};
})();
