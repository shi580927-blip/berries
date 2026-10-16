const assert=require('node:assert/strict'),fs=require('node:fs'),{EventEmitter}=require('node:events');
const code=fs.readFileSync('src/vertical_slice.js','utf8');
const a=code.indexOf('function waitForTextureKeys'),b=code.indexOf('function ensureDailyAssets',a);
const wait=new Function(code.slice(a,b)+';return waitForTextureKeys')();
(async()=>{
 const load=new EventEmitter(),events=new EventEmitter(),textures=new Set();
 const scene={load,events,textures:{exists:k=>textures.has(k)}};
 const ready=wait(scene,['panel','map']);let resolved=false;ready.then(()=>resolved=true);
 textures.add('panel');load.emit('filecomplete','panel','image');await Promise.resolve();assert.equal(resolved,false);
 textures.add('map');load.emit('filecomplete','map','image');await ready;
 // No global loader complete: a slow unrelated file must not block readiness.
 assert.equal(resolved,true);assert.equal(load.listenerCount('filecomplete'),0);
 const canceled=wait(scene,['other']);events.emit('shutdown');await assert.rejects(canceled,/closed/);
 const failed=wait(scene,['broken']);load.emit('loaderror',{key:'broken'});await assert.rejects(failed,/broken/);
 assert.equal(load.listenerCount('loaderror'),0);assert.equal(events.listenerCount('shutdown'),0);
 console.log('PASS image readiness independent of music, cancellation/error cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
