// Official VK Bridge integration. No fake payments or rewards outside VK/OK.
(() => {
'use strict';
const PARAMS=new URLSearchParams(window.location.search),APP_ID='54798320',KEY='berries_vk_progress_1';
window.BerriesPlatform.register('vk',()=>{
  let bridge,embedded=false,cloud=false,ready=false,user=null,last=null,chain=Promise.resolve(),scheduled=false;
  const capabilities={get cloud(){return cloud},get rewarded(){return embedded},purchases:false};
  const warn=(msg,e)=>console.warn('[Berries VK] '+msg,e);
  const send=(method,props)=>bridge.send(method,props||{});
  const events=e=>{
    if(e?.detail?.type==='VKWebAppViewHide')window.BerriesLifecycle?.set('vkView',true);
    if(e?.detail?.type==='VKWebAppViewRestore')window.BerriesLifecycle?.set('vkView',false);
  };
  function schedule(){
    if(!ready||!cloud||!last||scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{
      scheduled=false;
      chain=chain.then(async()=>{
        while(cloud&&last){
          const next=last;last=null;
          const value=JSON.stringify(next);
          if(value.length>3800){warn('Snapshot too large: cloud disabled',value.length);cloud=false;break}
          try{await send('VKWebAppStorageSet',{key:KEY,value})}
          catch(e){last=next;cloud=false;warn('Cloud save failed',e);break}
        }
      }).catch(e=>warn('Save queue failed',e));
    });
  }
  return {
    capabilities,
    async init(){
      const actual=PARAMS.get('vk_app_id');
      if(actual&&actual!==APP_ID)throw Error('Wrong VK app_id '+actual);
      bridge=window.vkBridge;
      const launch=PARAMS.has('vk_platform')||PARAMS.has('vk_app_id')||bridge?.isEmbedded?.();
      if(!launch)return;
      if(!bridge?.send){warn('VK Bridge JS missing');return}
      try{
        await Promise.race([send('VKWebAppInit'),new Promise((_,reject)=>setTimeout(()=>reject(Error('VK init timeout')),8000))]);
        embedded=true;bridge.subscribe?.(events);
        try{user=await send('VKWebAppGetUserInfo')}catch(e){warn('User info unavailable',e)}
      }catch(e){embedded=false;warn('VK init failed',e)}
    },
    getLanguage(){return user?.language||user?.lang||PARAMS.get('vk_language')||navigator.language||'ru'},
    async loadingReady(){},async gameplayStart(){},async gameplayStop(){},
    async restoreProgress(){
      if(!embedded)return false;
      try{
        const result=await send('VKWebAppStorageGet',{keys:[KEY]});
        cloud=true;
        const value=result?.keys?.find(x=>x.key===KEY)?.value;
        if(value){
          try{const remote=JSON.parse(value);if(remote?.version===1)window.BerriesCampaign?.restore?.(remote)}
          catch(e){warn('Invalid cloud progress',e)}
        }
        ready=true;
        const current=window.BerriesCampaign?.read?.();
        if(current)this.saveProgress(current);
        return true;
      }catch(e){cloud=false;warn('Cloud restore unavailable; keeping local',e);return false}
    },
    saveProgress(snapshot){
      if(!embedded||!snapshot||typeof snapshot!=='object')return false;
      last=JSON.parse(JSON.stringify(snapshot));schedule();return cloud;
    },
    async flushProgress(){schedule();await chain;return cloud},
    async showRewardedVideo(){
      if(!embedded)return false;
      try{
        const available=await send('VKWebAppCheckNativeAds',{ad_format:'reward'});
        if(available?.result!==true)return false;
        const response=await send('VKWebAppShowNativeAds',{ad_format:'reward'});
        return response?.result===true;
      }catch(e){warn('Rewarded unavailable/cancelled',e);return false}
    },
    async getPurchaseCatalog(){return []},
    async purchaseProduct(){return {ok:false,reason:'unavailable'}},
    async restorePurchases(){return []}
  };
});
})();