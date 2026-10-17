const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/platform/vk.js','utf8');
async function trial({embedded=true,ad={result:true},cloudValue='',failStorage=false}={}){
 const calls=[],written={},paused=new Set();let callback,restored=0,adapter;
 const state={version:1,done:[1],coins:100,lives:5,inventory:{hammer:2},updatedAt:3};
 const bridge={
 isEmbedded:()=>embedded,
 subscribe:f=>callback=f,
 send:async(m,args)=>{
  calls.push({m,args});
  if(m==='VKWebAppInit')return {result:true};
  if(m==='VKWebAppGetUserInfo')return {id:1,language:'ru'};
  if(m==='VKWebAppStorageGet'){if(failStorage)throw Error('cloud');return {keys:[{key:'berries_vk_progress_1',value:cloudValue}]}}
  if(m==='VKWebAppStorageSet'){written[args.key]=args.value;return {result:true}}
  if(m==='VKWebAppShowNativeAds')return ad;
  throw Error(m);
 }};
 const win={location:{search:embedded?'?vk_platform=desktop_web&vk_app_id=54798320':''},
 vkBridge:bridge,BerriesLifecycle:{set:(r,on)=>on?paused.add(r):paused.delete(r)},
 BerriesCampaign:{restore:()=>restored++,read:()=>state},
 BerriesPlatform:{register:(id,factory)=>{assert.equal(id,'vk');adapter=factory()}}};
 vm.runInNewContext(src,{window:win,navigator:{language:'ru'},URLSearchParams,Promise,JSON,queueMicrotask,setTimeout,console:{warn:()=>{}}});
 await adapter.init();await adapter.restoreProgress();
 return {adapter,calls,written,paused,sendEvent:type=>callback?.({detail:{type}}),restored,state}
}
(async()=>{
 let x=await trial({embedded:false});assert.equal(x.calls.length,0);assert.equal(x.adapter.capabilities.rewarded,false);
 x=await trial();assert.equal(x.adapter.capabilities.cloud,true);assert.equal(x.adapter.capabilities.purchases,false);
 assert.equal(await x.adapter.showRewardedVideo(),true);
 x.adapter.saveProgress(x.state);await new Promise(r=>setImmediate(r));await x.adapter.flushProgress();
 assert.equal(JSON.parse(x.written.berries_vk_progress_1).coins,100);
 x.sendEvent('VKWebAppViewHide');assert(x.paused.has('vkView'));
 x.sendEvent('VKWebAppViewRestore');assert(!x.paused.has('vkView'));
 assert.equal((await x.adapter.getPurchaseCatalog()).length,0);
 assert.equal((await x.adapter.purchaseProduct('coins_1000')).ok,false);
 x=await trial({ad:{result:false}});assert.equal(await x.adapter.showRewardedVideo(),false);
 x=await trial({failStorage:true});assert.equal(x.adapter.capabilities.cloud,false);
 x=await trial({cloudValue:JSON.stringify({version:1,done:[1],coins:200,inventory:{hammer:2},lives:5,updatedAt:30})});
 assert.equal(x.restored,1);
 console.log('PASS VK init, local preview, cloud, view lifecycle, rewarded, safe IAP disable');
})().catch(e=>{console.error(e);process.exitCode=1});