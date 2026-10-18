// VK fullscreen button supports true fullscreen only if the host iframe permits it.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('src/platform/vk-fullscreen.js','utf8');
async function trial({fullscreen=true,embedded=false}={}){
 let requestCount=0,resize=[],button;
 const shell={appendChild:x=>{if(x.id==='berries-vk-fullscreen')button=x},
   requestFullscreen:async()=>{requestCount++;if(!fullscreen)throw Error('Denied');doc.fullscreenElement=shell}};
 const doc={fullscreenEnabled:true,fullscreenElement:null,head:{appendChild:()=>{}},getElementById:id=>id==='game-shell'?shell:null,
   createElement:()=>({style:{},setAttribute:()=>{},addEventListener(name,cb){this.handlers??={};this.handlers[name]=cb}}),
   addEventListener:()=>{}};
 const win={matchMedia:()=>({matches:true}),location:{search:embedded?'?vk_app_id=54798320&vk_platform=desktop_web':''},
   screen:{availWidth:1600,availHeight:900},vkBridge:{send:async(name,payload)=>{resize.push({name,payload});return {result:true}}},
   __berriesGame:{scale:{refresh:()=>{}}}};
 vm.runInNewContext(code,{window:win,document:doc,URLSearchParams,console:{warn:()=>{}},clearTimeout,setTimeout});
 assert(button,'fullscreen button missing');
 await button.handlers.click({preventDefault:()=>{},stopPropagation:()=>{}});
 return {requestCount,resize,doc,button};
}
(async()=>{
 let x=await trial();assert.equal(x.requestCount,1);assert.equal(x.resize.length,0);assert(x.doc.fullscreenElement);
 x=await trial({fullscreen:false,embedded:true});assert.equal(x.requestCount,1);
 assert.equal(x.resize.length,1);assert.equal(x.resize[0].name,'VKWebAppResizeWindow');
 assert(x.resize[0].payload.width>0&&x.resize[0].payload.height>0);
 x=await trial({fullscreen:false,embedded:false});assert.equal(x.resize.length,0);
 console.log('PASS VK fullscreen click, denied fullscreen fallback, no standalone VK resize');
})().catch(e=>{console.error(e);process.exitCode=1});
