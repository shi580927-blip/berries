// Verify image readiness while audio is deliberately delayed, plus cached results.
const fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require(process.env.BERRIES_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{const p=path.join(root,new URL(req.url,'http://local').pathname);try{const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg'}[path.extname(p)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(fs.readFileSync(p))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BERRIES_BROWSER_EXECUTABLE,args:JSON.parse(process.env.BERRIES_BROWSER_ARGS||'[]'),headless:true});
 const records=[];
 for(const lang of ['en','tr']){
  const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[],failed=[];let audioReleased=false;
  let releaseAudio;const audioGate=new Promise(r=>releaseAudio=r);
  await page.route(/\.mp3(?:\?|$)/,async route=>{await audioGate;if(!page.isClosed())await route.continue().catch(()=>{})});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
  const start=Date.now();await page.goto('http://127.0.0.1:'+server.address().port+'/docs/game-localization-preview.html?lang='+lang,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__berriesStartupReady,{},{timeout:15000});
  const readyMs=Date.now()-start;
  const readyWithoutAudio=await page.evaluate(()=>!window.__berriesGame.cache.audio.exists('music_menu')&&!window.__berriesGame.cache.audio.exists('sfx_berry_pop'));
  if(!readyWithoutAudio||audioReleased)throw Error('Startup waited for audio');
  console.log('READY',lang,readyMs);
  await page.evaluate(()=>window.__berriesGame.scene.keys.Title.scene.start('Play',{n:1}));
  await page.waitForFunction(()=>window.__berriesGame.scene.keys.Play.cfg&&['popup_win','popup_lose'].every(k=>window.__berriesGame.textures.exists(k)));
  console.log('RESULTS PRELOADED',lang);
  await page.evaluate(()=>{window.__resultHeadingDraws=0;const draw=window.BerriesHeadingPainter.draw;window.BerriesHeadingPainter={draw(...args){window.__resultHeadingDraws++;return draw(...args)}}});
  const popupMs=[];
  for(const win of [true,false]){
   if(!win)await page.evaluate(()=>{const scene=window.__berriesGame.scene.keys.Play;for(const n of [...scene.children.list])if(n.depth===30||n.depth===31)n.destroy()});
   popupMs.push(await page.evaluate(async win=>{
    const scene=window.__berriesGame.scene.keys.Play;scene.busy=true;
    const before=performance.getEntriesByType('resource').length,t=performance.now();await scene.resultPopup(win);
    if(!scene.children.list.some(n=>n.type==='Container'&&n.depth===31))throw Error('Result missing');
    return {win,ms:Math.round(performance.now()-t),newResources:performance.getEntriesByType('resource').length-before,headingDraws:window.__resultHeadingDraws};
   },win));
   if(win&&process.env.BERRIES_QA_SCREENSHOT)await page.screenshot({path:process.env.BERRIES_QA_SCREENSHOT.replace('.png','-'+lang+'.png')});
  }
  console.log(JSON.stringify({lang,readyMs,popupMs}));
  if(popupMs.some(x=>x.ms>1000||x.newResources||x.headingDraws))throw Error('Cached result delayed or requested network');
  audioReleased=true;releaseAudio();
  await page.waitForFunction(()=>window.__berriesGame.cache.audio.exists('sfx_berry_pop'),{},{timeout:15000});
  const audioSurvivedSceneChange=true;
  if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
  records.push({lang,readyMs,readyWithoutAudio,popupMs,audioSurvivedSceneChange,errors,failed});
  await context.close();console.log('LOADING '+lang+' PASSED');
 }
 await browser.close();server.close();
 const report={date:'2026-10-16',environment:'Local Chromium, mobile viewport 915x412 DPR2; audio held until after both results',records};
 if(process.env.BERRIES_QA_OUTPUT)fs.writeFileSync(process.env.BERRIES_QA_OUTPUT,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
