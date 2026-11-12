/* Browser smoke for the real Phaser runtime, not a mocked game board. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,
   ...(process.env.BERRIES_CHROMIUM_PATH?{executablePath:process.env.BERRIES_CHROMIUM_PATH}:{}),
   args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:810}});
 const errors=[];
 const missing=[];
 const shots=process.env.BERRIES_SCREENSHOTS;
 if(shots)fs.mkdirSync(shots,{recursive:true});
 const shot=async name=>{if(shots)await page.screenshot({path:path.join(shots,name+'.png')})};
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)missing.push(response.status()+' '+response.url())});
 page.on('console',msg=>{
   if(msg.type()==='error'&&!msg.location().url.endsWith('/favicon.ico'))
     errors.push(msg.text()+' '+msg.location().url);
 });
 await page.goto(process.env.BERRIES_TEST_URL||'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__berriesStartupReady===true,{timeout:45000});
 await page.evaluate(()=>{
   const c=window.BerriesCampaign,s=c.read();
   s.done=Array.from({length:17},(_,i)=>i+1);
   s.lives=5;s.nextLifeAt=null;s.active=null;
   localStorage.setItem(c.KEY,JSON.stringify(s));
 });
 const launch=async n=>{
   await page.evaluate(n=>{window.__berriesGame.scene.stop('Play');window.__berriesGame.scene.start('Play',{n})},n);
   await page.waitForFunction(n=>{
     const sc=window.__berriesGame.scene.keys.Play;
     return sc.scene.isActive()&&sc.no===n&&sc.spr?.length===8&&!!sc._cycle3;
   },n,{timeout:12000});
   console.log('Phaser level ready:',n);
   return page.evaluate(()=>{
     const s=window.__berriesGame.scene.keys.Play;
     return {no:s.no,acorns:s.cell.flat().filter(c=>c.acorn).length,
       stones:s.cell.flat().filter(c=>c.block==='rock').map(c=>c.rockHp),
       holes:s.cell.flat().filter(c=>c.block==='void').length,
       boardFrame:s._cycle3BoardFrame?.name||null,
       rockTexture:s.spr?.[4]?.[3]?.texture?.key||null,
       madness:s.cfg.madnessStage||0,moves:s.moves};
   });
 };
 let status=await launch(6);
 assert.equal(status.acorns,2,'level 6: acorns are falling goals');
 assert.equal(status.madness,1);
 const delivery=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   const before=s.goals.find(g=>g.type==='acorn').done;
   let acorn;
   for(let r=0;r<8&&!acorn;r++)for(let c=0;c<8;c++)if(s.cell[r][c].acorn){acorn={r,c};break}
   if(!acorn)throw Error('missing acorn to deliver');
   for(let r=acorn.r+1;r<8;r++){
     if(s.cell[r][acorn.c].block||s.cell[r][acorn.c].ice)throw Error('blocked exit test column');
     s.spr[r][acorn.c]?.destroy();
     s.spr[r][acorn.c]=null;s.board[r][acorn.c]=null;
   }
   await s.fallRefill();
   return {before,after:s.goals.find(g=>g.type==='acorn').done,ok:s.assertBoard('acorn exit browser')};
 });
 assert.equal(delivery.after,delivery.before+1,'a real acorn must reach the exit and count as goal');
 const moveResult=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   const pair=s.findHintMove();
   if(!pair)return {error:'no legal move'};
   await s.swap(...pair);
   return {moves:s.moves,ok:!!s.assertBoard('browser smoke level6')};
 });
 assert(moveResult.ok,JSON.stringify(moveResult));assert.equal(moveResult.moves,status.moves-1);
 status=await launch(7);
 assert.equal(status.acorns,4,'level 7 has four falling acorns');
 assert((await page.evaluate(()=>window.__berriesGame.scene.keys.Play.findHintMove())),'level 7 has a move');
 status=await launch(8);
 assert.equal(status.holes,4,'level 8 has only four absent corner cells');
 assert.equal(status.boardFrame,'berries_frost_chamfered_board','level 8 uses the contoured art board');
 await shot('level-8-whole');
 if(shots){
   const box=await page.locator('canvas').boundingBox();
   const scale=box.width/1920;
   await page.screenshot({path:path.join(shots,'level-8-upper-corner.png'),
     clip:{x:box.x+565*scale,y:box.y+135*scale,width:245*scale,height:245*scale}});
 }
 const bevel=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   const corners=[[0,0],[0,7],[7,0],[7,7]];
   const empty=corners.every(([r,c])=>s.cell[r][c].block==='void'&&!s.board[r][c]&&!s.spr[r][c]);
   const border=s._cycle3BoardFrame;
   const notCovered=border?.depth===1&&s.spr[0][1]?.depth>border.depth;
   const pair=s.findHintMove();
   if(!pair)throw Error('no hint on chamfered field');
   await s.swap(...pair);
   return {empty,notCovered,valid:s.assertBoard('chamfered level8 swap'),moves:s.moves};
 });
 assert(bevel.empty&&bevel.notCovered&&bevel.valid,'no hidden or covered berries on shape');
 assert.equal(bevel.moves,status.moves-1,'level 8 shape still allows real swaps');
 for(const [name,width,height] of [['desktop-1920',1920,1080],['laptop-1366',1366,768],['mobile-wide',844,390],['mobile-compact',667,375]]){
   await page.setViewportSize({width,height});
   await page.waitForTimeout(120);
   const box=await page.locator('canvas').boundingBox();
   assert(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,
     name+' canvas must fit viewport');
   await shot('level-8-'+name);
 }
 await page.setViewportSize({width:1440,height:810});
 status=await launch(9);
 assert.equal(status.holes,0,'level 9 returns to a complete board');
 assert((await page.evaluate(()=>window.__berriesGame.scene.keys.Play.findHintMove())),'level 9 has a move');
 status=await launch(10);
 assert.equal(status.holes,0,'level 10 uses a full 8x8 board without inactive corner tiles');assert.deepEqual(status.stones,[2]);assert.equal(status.acorns,3);
 assert.equal(status.rockTexture,'berries_boulder3','level 10 must render the approved textured boulder');
 await shot('level-10-intact');
 const hammer=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   s.boosterMode='hammer';
   await s.useBoosterAt(4,3);
   return {hp:s.cell[4][3].rockHp,frame:s.spr[4][3]?.frame?.name,
     inventory:s.inventory.hammer,ok:s.assertBoard('hammer first rock hit')};
 });
 assert.equal(hammer.hp,1,'one hammer hit must only crack the boulder');
 assert.equal(hammer.frame,'boulder_hp1');
 assert(hammer.ok&&hammer.inventory<2,'hammer should be consumed');
 await shot('level-10-cracked');
 const special=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   // Provision a line berry beside the obstacle, then trigger it through the actual swap path.
   // This checks movement, expansion, hit, destruction, and subsequent gravity together.
   s.board[4][1].sp='line_h';s.render(4,1);
   const moves=s.moves;
   await s.swap({r:4,c:1},{r:4,c:2});
   return {rockGone:s.cell[4][3].block!=='rock',hp:s.cell[4][3].rockHp,
     filled:!!s.board[4][3],moves:s.moves,ok:s.assertBoard('special swap rock destruction')};
 });
 assert(special.rockGone&&special.filled&&special.ok,'a swapped line berry must destroy the cracked rock and refill it');
 assert.equal(special.moves,status.moves-1,'special rock hit spends one move');
 await shot('level-10-refilled');
 status=await launch(12);assert.equal(status.madness,2);
 const insane=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play,pair=s.findHintMove();
   if(!pair)throw Error('level 12 has no legal move');
   await s.swap(...pair);
   return {moves:s.moves,busy:s.busy,ok:s.assertBoard('madness after swap')};
 });
 assert.equal(insane.moves,status.moves-1);assert(insane.ok&&!insane.busy);
 await page.evaluate(()=>{
   window.__berriesGame.scene.stop('Play');
   window.__berriesGame.scene.start('Map');
 });
 await page.waitForFunction(()=>window.__berriesGame.scene.keys.Map.scene.isActive(),{timeout:10000});
 assert.equal(errors.length,0,'console/runtime exceptions: '+errors.join('; ')+'; HTTP: '+missing.join('; '));
 console.log('PASS Phaser browser smoke: levels 6,8,10,12; contoured board, real swaps, rock special hit; no console errors');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
