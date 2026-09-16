(() => {
'use strict';
const reasons=new Set(),scenes=new Set(),saved=new Map();
const api={
 get paused(){return reasons.size>0},
 register(scene){
  scenes.add(scene);
  scene.events.once('shutdown',()=>{scenes.delete(scene);saved.delete(scene)});
  if(api.paused)apply(scene,true);
 },
 set(reason,on){
  const before=api.paused;if(on)reasons.add(reason);else reasons.delete(reason);
  if(before===api.paused)return;
  for(const scene of scenes)apply(scene,api.paused);
  const ctx=window.__berriesGame?.sound?.context;
  if(api.paused)ctx?.suspend?.().catch(()=>{});else ctx?.resume?.().catch(()=>{});
  if(api.paused)window.BerriesYandex?.gameplayStop?.();
  else if(window.__berriesGameplayShouldRun)window.BerriesYandex?.gameplayStart?.();
 },
 wait(ms){return new Promise(resolve=>{
  let left=ms,last=performance.now();
  const step=()=>{const now=performance.now();if(!api.paused)left-=now-last;last=now;if(left<=0)resolve();else setTimeout(step,Math.min(32,left))};step();
 })}
};
function apply(scene,paused){
 if(paused){
  if(saved.has(scene))return;
  saved.set(scene,{input:scene.input.enabled,time:scene.time.paused,tweens:scene.tweens.paused});
  scene.input.enabled=false;scene.time.paused=true;scene.tweens.pauseAll();
  scene.music?.pause(true);scene.fx?.stopAll?.();
 }else{
  const old=saved.get(scene);if(!old)return;saved.delete(scene);
  scene.input.enabled=old.input;scene.time.paused=old.time;if(!old.tweens)scene.tweens.resumeAll();scene.music?.pause(false);
 }
}
document.addEventListener('visibilitychange',()=>api.set('hidden',document.hidden));
window.addEventListener('blur',()=>api.set('blur',true));
window.addEventListener('focus',()=>{api.set('blur',false);api.set('hidden',document.hidden)});
if(document.hidden)reasons.add('hidden');
window.BerriesLifecycle=api;
})();
