// Optional browser regression. Requires Playwright and an installed Chromium.
import http from 'node:http';
import fs from 'node:fs';
import pathUtil from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium:pw,devices}=require(process.env.BERRIES_PLAYWRIGHT_MODULE || 'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const output=process.env.BERRIES_QA_OUTPUT || pathUtil.join(os.tmpdir(),'berries-localization-qa');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const p=pathUtil.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));try{const type={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'}[pathUtil.extname(p)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(p))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=process.env.BERRIES_BROWSER_EXECUTABLE;
const args=JSON.parse(process.env.BERRIES_BROWSER_ARGS || '[]');
const origin='http://127.0.0.1:'+server.address().port;


const records=[];
for(const mobile of (process.env.BERRIES_QA_MOBILE_ONLY==='1'?[true]:[false,true])) for(const lang of ['en','tr']) {
 const browser=await pw.launch({executablePath,args,headless:true});
 const context=await browser.newContext({viewport:mobile?{width:915,height:412}:{width:1920,height:1080},isMobile:mobile,hasTouch:mobile,userAgent:mobile?devices['Pixel 7'].userAgent:undefined,deviceScaleFactor:mobile?2:1});
 const page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
 await page.addInitScript(()=>localStorage.setItem('berries_campaign_v1','{"coins":98765}'));
 await page.goto(origin+'/docs/game-localization-preview.html?lang='+lang);
 await page.waitForFunction(()=>window.__berriesStartupReady&&window.__berriesLocalizationPreview?.normalized.size===10);
 const tap=async(x,y)=>{const r=await page.locator('#game canvas').boundingBox();const px=r.x+x*r.width/1920,py=r.y+y*r.height/1080;if(mobile)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py)};
 await tap(960,805);
 await page.waitForFunction(()=>window.__berriesGame.scene.keys.Title._dailyRewardModal?.active);
 const chest=await page.evaluate(()=>{const box=window.__berriesGame.scene.keys.Title._dailyRewardModal;const c=box.list.find(n=>n.type==='Container'&&n.list?.some(i=>i.texture?.key==='daily_chest_closed'));return {x:c.x,y:c.y}});
 await tap(chest.x,chest.y);await page.waitForTimeout(1000);
 const next=await page.evaluate(()=>{const box=window.__berriesGame.scene.keys.Title._dailyRewardModal;const n=box.list.find(n=>n.type==='Zone'&&n.input?.enabled);return {x:n.x,y:n.y}});
 await tap(next.x,next.y);await page.waitForFunction(()=>window.__berriesGame.scene.keys.Map.scene.isActive());
 const openLevel=async()=>{
 const p=await page.evaluate(()=>{const scene=window.__berriesGame.scene.keys.Map;const n=scene.children.list.find(n=>n.input?.enabled&&n.getData?.('level')===1);return n?{x:n.x,y:n.y}:null});
 if(!p)throw Error('No clickable level button');await tap(p.x,p.y);
 await page.waitForFunction(()=>window.__berriesGame.scene.keys.Play.scene.isActive()&&window.__berriesGame.scene.keys.Play.cfg);
 await page.waitForTimeout(350);
 };
 await openLevel();
 const stem=(mobile?'android':'desktop')+'-'+lang;
 await page.screenshot({path:pathUtil.join(output,stem+'-level.png')});
 for(const kind of ['win','lose','shop','paid']){
 if(!await page.evaluate(()=>window.__berriesGame.scene.keys.Play.scene.isActive()))await openLevel();
 const b=page.locator('[data-preview="'+kind+'"]');if(mobile&&!await b.isVisible())await page.locator('#preview-toggle').tap();if(mobile)await b.tap();else await b.click();
 await page.waitForTimeout(450);
 const err=await page.locator('#preview-error').textContent();if(err)throw Error(err);
 await page.screenshot({path:pathUtil.join(output,stem+'-'+kind+'.png')});
 if(kind==='win'||kind==='lose'){
 const p=await page.evaluate(win=>{const scene=window.__berriesGame.scene.keys.Play;const box=scene.children.list.find(n=>n.type==='Container'&&n.depth===31);const art=box.list.find(n=>n.texture?.key===(win?'popup_win':'popup_lose'));return {x:box.x+art.x+((win?.891:.918)-.5)*art.displayWidth,y:box.y+art.y+((win?.172:.237)-.5)*art.displayHeight}},kind==='win');await tap(p.x,p.y);await page.waitForFunction(()=>window.__berriesGame.scene.keys.Map.scene.isActive());
 }else if(kind==='shop'){await tap(1260,218)}else{
 const p=await page.evaluate(()=>{const box=window.__berriesGame.scene.keys.Play._paidShopModal;const art=box.list.find(n=>n.texture?.key==='popup_royal_shop');return{x:art.x+(.91-.5)*art.displayWidth,y:art.y+(.17-.5)*art.displayHeight}});await tap(p.x,p.y);
 }
 }
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
 records.push({lang,mobile,errors,failed,font:await page.evaluate(()=>document.fonts.check('800 64px BerriesHeading')),normalized:await page.evaluate(()=>[...window.__berriesLocalizationPreview.normalized]),productionSave:await page.evaluate(()=>localStorage.getItem('berries_campaign_v1'))});if(records.at(-1).productionSave!=='{"coins":98765}'||records.at(-1).normalized.length!==10||!records.at(-1).font)throw Error('Preview isolation/assets/font assertion failed');
 await browser.close();console.log("PROFILE "+stem+" PASSED");
}
console.log(JSON.stringify(records));fs.writeFileSync(pathUtil.join(output,"results.json"),JSON.stringify(records,null,2));server.close();
