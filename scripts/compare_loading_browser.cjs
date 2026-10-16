// Compare unmodified main checkout, previous base checkout and this checkout.
// BERRIES_REFERENCE_RU and BERRIES_REFERENCE_BASE must point to clean git archives.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.BERRIES_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 if(!process.env.BERRIES_REFERENCE_RU||!process.env.BERRIES_REFERENCE_BASE)throw Error('Supply both reference checkouts');
 const instrumentation=`;(()=>{
    window.__textureProfile={canvas:[],upload:[]};
    const manager=Phaser.Textures.TextureManager.prototype,original=manager.addCanvas;
    manager.addCanvas=function(key,...args){const t=performance.now();try{return original.call(this,key,...args)}finally{window.__textureProfile.canvas.push({key,ms:performance.now()-t})}};
    for(const Type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(Type){const proto=Type.prototype,upload=proto.texImage2D;proto.texImage2D=function(...args){const t=performance.now();try{return upload.apply(this,args)}finally{window.__textureProfile.upload.push(performance.now()-t)}}}
   })();`;
 const server=http.createServer((q,r)=>{
  let u=new URL(q.url,'http://local').pathname,dir=root;
  for(const [prefix,ref] of [['/reference-ru/',process.env.BERRIES_REFERENCE_RU],['/reference-base/',process.env.BERRIES_REFERENCE_BASE]])if(u.startsWith(prefix)){dir=ref;u=u.slice(prefix.length);break}
  let p=path.join(dir,u);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  try{r.setHeader('Cache-Control','public,max-age=3600');r.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.woff':'font/woff','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');r.end(p.endsWith('/vendor/phaser.min.js')?fs.readFileSync(p,'utf8')+instrumentation:fs.readFileSync(p))}catch{r.statusCode=404;r.end()}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BERRIES_BROWSER_EXECUTABLE,args:JSON.parse(process.env.BERRIES_BROWSER_ARGS||'[]')});
 const records=[];
 try{for(const entry of ['/reference-ru/','/','/reference-base/docs/game-localization-preview.html?lang=en','/reference-base/docs/game-localization-preview.html?lang=tr','/docs/game-localization-preview.html?lang=en','/docs/game-localization-preview.html?lang=tr']){
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  for(let run=0;run<3;run++){
   const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
   await page.goto('http://127.0.0.1:'+server.address().port+entry,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__berriesGame?.scene?.isActive('Title'),{},{timeout:60000});
   const titleMs=await page.evaluate(()=>performance.now());
   await page.waitForFunction(()=>window.__berriesStartupReady,{},{timeout:60000});
   records.push(await page.evaluate(({entry,run,titleMs,errors})=>({entry,run,cache:run?'repeat':'fresh-context',titleMs,readyMs:performance.now(),textures:window.__textureProfile,errors,resources:performance.getEntriesByType('resource').map(r=>({name:r.name.startsWith('data:')?r.name.split(',')[0]+',[omitted]':r.name,dataUriCharacters:r.name.startsWith('data:')?r.name.length:undefined,duration:r.duration,transferSize:r.transferSize,responseEnd:r.responseEnd}))}),{entry,run,titleMs,errors}));
   page.off('pageerror',onError);if(errors.length)throw Error(JSON.stringify(errors));
   console.log(entry,run,Math.round(records.at(-1).readyMs));
  }await context.close();
 }}finally{await browser.close();server.close()}
 const report={environment:'Local HTTP, Chromium, 915x412 DPR2; WebGL timings measure CPU submission, not GPU completion. Instrumentation is appended by the local server; max-age=3600 permits real HTTP cache reuse on repeat navigation. No network throttling.',records};
 fs.writeFileSync(process.env.BERRIES_QA_OUTPUT||'/tmp/berries-comparison.json',JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
