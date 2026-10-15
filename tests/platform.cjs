const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/platform/platform.js','utf8'),local=fs.readFileSync('src/platform/local.js','utf8');
function env(platform='local',language='en-US'){
 const data={},events={},paused=new Set();let rewarded=false;
 const campaign={ROYAL_PRODUCTS:{coins_1000:{}},read:()=>({lastWin:{id:1,doubled:false}})};
 const scene={Play:{attemptId:1,scene:{isActive:()=>true},winRewardDoubled:false}};
 const context={console,Map,Promise,Date,localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v}},document:{documentElement:{},addEventListener:(e,f)=>events[e]=f},window:{navigator:{language},BerriesPlatformConfig:{platform},BerriesCampaign:campaign,__berriesGameplayShouldRun:true,__berriesGame:{scene:{keys:scene}},BerriesLifecycle:{paused:false,set:(reason,yes)=>yes?paused.add(reason):paused.delete(reason)},addEventListener:(e,f)=>events[e]=f}};
 context.window.localStorage=context.localStorage;
 // Any accidental network or external SDK access fails this test.
 context.fetch=()=>{throw Error('unexpected network')};Object.defineProperty(context.window,'YaGames',{get(){throw Error('unexpected SDK')}});
 vm.runInNewContext(source,context);vm.runInNewContext(local,context);
 return {api:context.window.BerriesPlatform,context,data,paused};
}
(async()=>{
 const e=env();await e.api.languageReady();assert.equal(e.api.language.current,'ru');assert.equal(e.api.language.detected,'en');assert.equal(e.context.document.documentElement.lang,'ru');
 assert.equal(e.api.id,'local');assert.equal(e.api.capabilities.rewarded,false);assert.equal(e.api.capabilities.purchases,false);assert.equal(e.api.capabilities.cloud,false);
 assert.equal(await e.api.showRewardedVideo(),false);assert.equal((await e.api.purchaseProduct('coins_1000')).reason,'unavailable');assert.equal((await e.api.getPurchaseCatalog()).length,0);assert.equal(await e.api.restoreProgress(),false);assert.equal(e.api.saveProgress({coins:10}),false);assert.equal(await e.api.flushProgress(),true);assert.equal((await e.api.restorePurchases()).length,0);assert.equal(e.paused.size,0);
 await e.api.loadingReady();await e.api.gameplayStart();await e.api.gameplayStop();
 assert.throws(()=>e.api.register('late',()=>({})),/before init/);
 const m=env('test');let calls=0,resolveAd,purchases=0;
 m.api.register('test',()=>({capabilities:{rewarded:true,purchases:true},getLanguage:()=> 'ru',showRewardedVideo(){calls++;return new Promise(r=>resolveAd=r)},async purchaseProduct(){purchases++;return {ok:false,reason:'cancelled'}}}));
 await m.api.init();const a=m.api.showRewardedVideo(),b=m.api.showRewardedVideo();assert.equal(a,b);await new Promise(r=>setImmediate(r));assert.equal(calls,1);assert(m.paused.has('advertisement'));resolveAd(false);assert.equal(await a,false);assert.equal(m.paused.size,0);assert.equal(m.api.rewardedCooldownRemaining(),0);
 const success=m.api.showRewardedVideo();await new Promise(r=>setImmediate(r));resolveAd(true);assert.equal(await success,true);assert(m.api.rewardedCooldownRemaining()>0);assert.equal(await m.api.showRewardedVideo(),false);assert.equal(calls,2);
 assert.equal((await m.api.purchaseProduct('unknown')).reason,'unknown_product');assert.equal(purchases,0);assert.equal((await m.api.purchaseProduct('coins_1000')).reason,'cancelled');assert.equal(purchases,1);assert.equal(m.paused.size,0);
 const missing=env('missing');await assert.rejects(missing.api.init(),/not loaded/);
 // Local saves are still campaign-owned and survive reloads; neutral hook cannot grant a purchase.
 const {create}=require('../src/campaign.js');const saves={};const storage={getItem:k=>saves[k]||null,setItem:(k,v)=>saves[k]=v};const c=create(storage);const attempt=c.begin(1);c.win(attempt);const snapshot=c.read();await e.api.purchaseProduct('coins_1000');assert.equal(create(storage).read().coins,snapshot.coins);
 console.log('PASS platform: no SDK/network, RU fallback, unavailable monetization, local progress, adapter registration, reward dedup/cooldown, nested pause cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
