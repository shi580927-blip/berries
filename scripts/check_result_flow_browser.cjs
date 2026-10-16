// Real terminal handlers and their next/retry/map buttons; not a full played level.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BERRIES_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((q,r)=>{let p=path.join(root,new URL(q.url,'http://local').pathname);try{r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff':'font/woff'})[path.extname(p)]||'application/octet-stream');r.end(fs.readFileSync(p))}catch{r.statusCode=404;r.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BERRIES_BROWSER_EXECUTABLE,args:JSON.parse(process.env.BERRIES_BROWSER_ARGS||'[]')}),records=[];
 try{for(const lang of ['en','tr']){
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('berries_campaign_v1','{"coins":98765}'));
  await page.goto('http://127.0.0.1:'+server.address().port+'/docs/game-localization-preview.html?lang='+lang,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__berriesStartupReady,{},{timeout:60000});
  const fieldStart=Date.now();await page.evaluate(()=>window.__berriesGame.scene.keys.Title.scene.start('Play',{n:1}));
  await page.waitForFunction(()=>window.__berriesGame.scene.keys.Play.cfg&&['popup_win','popup_lose'].every(k=>window.__berriesGame.textures.exists(k)));
  const fieldAndResultsReadyMs=Date.now()-fieldStart;
  const trigger=async win=>{
   const start=Date.now();await page.evaluate(win=>{const s=window.__berriesGame.scene.keys.Play;s.busy=false;if(win)s.goals.forEach(g=>g.done=g.need);return win?s.win():s.lose()},win);
   await page.waitForFunction(()=>window.__berriesGame.scene.keys.Play.children.list.some(n=>n.type==='Container'&&n.depth===31&&n.alpha>=.99));
   return Date.now()-start;
  };
  const tapResult=async(win,u,v)=>{
   const at=await page.evaluate(({win,u,v})=>{const s=window.__berriesGame.scene.keys.Play,b=s.children.list.find(n=>n.type==='Container'&&n.depth===31),a=b.list.find(n=>n.texture?.key===(win?'popup_win':'popup_lose'));return{x:b.x+a.x+(u-.5)*a.displayWidth,y:b.y+a.y+(v-.5)*a.displayHeight}},{win,u,v});
   const r=await page.locator('#game canvas').boundingBox();await page.touchscreen.tap(r.x+at.x*r.width/1920,r.y+at.y*r.height/1080);
  };
  const winVisibleMs=await trigger(true);await tapResult(true,.5,.899);await page.waitForFunction(()=>window.__berriesGame.scene.keys.Play.no===2&&window.__berriesGame.scene.keys.Play.cfg&&!window.__berriesGame.scene.keys.Play.busy);
  const attempt=await page.evaluate(()=>window.__berriesGame.scene.keys.Play.attemptId);
  const loseVisibleMs=await trigger(false);await tapResult(false,.294,.873);await page.waitForFunction(attempt=>{const s=window.__berriesGame.scene.keys.Play;return s.no===2&&s.attemptId!==attempt&&!s.busy},attempt);
  await trigger(false);await tapResult(false,.714,.873);await page.waitForFunction(()=>window.__berriesGame.scene.keys.Map.scene.isActive());
  const primarySave=await page.evaluate(()=>localStorage.getItem('berries_campaign_v1'));if(primarySave!=='{"coins":98765}'||errors.length)throw Error(JSON.stringify({errors,primarySave}));
  records.push({lang,fieldAndResultsReadyMs,terminalHandlerToVisible:{win:winVisibleMs,lose:loseVisibleMs},next:true,retry:true,map:true,primarySaveUnchanged:true,errors});console.log('RESULT FLOW',JSON.stringify(records.at(-1)));await context.close();
 }}finally{await browser.close();server.close()}
 if(process.env.BERRIES_QA_OUTPUT)fs.writeFileSync(process.env.BERRIES_QA_OUTPUT,JSON.stringify({note:'Simulated terminal outcomes via actual win/lose handlers; visible includes popup tween and browser wait. Not last-swap/cascade timing or full-level balance.',records},null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
