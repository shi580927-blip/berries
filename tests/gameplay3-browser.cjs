/* Browser smoke for the real Phaser runtime, not a mocked game board. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:810}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
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
   return page.evaluate(()=>{
     const s=window.__berriesGame.scene.keys.Play;
     return {no:s.no,acorns:s.cell.flat().filter(c=>c.acorn).length,
       stones:s.cell.flat().filter(c=>c.block==='rock').map(c=>c.rockHp),
       holes:s.cell.flat().filter(c=>c.block==='void').length,
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
 status=await launch(10);
 assert.equal(status.holes,0,'level 10 uses a full 8x8 board without inactive corner tiles');assert.deepEqual(status.stones,[2]);assert.equal(status.acorns,3);
 assert.equal(status.rockTexture,'berries_boulder3','level 10 must render the approved textured boulder');
 const forced=await page.evaluate(async()=>{
   const s=window.__berriesGame.scene.keys.Play;
   s.cell[4][3].rockHp=1;
   const special=s.board[4][2];
   s.board[4][2]={id:'raspberry',sp:'line_h'};
   await s.clearCells(new Set(['4,2']),1);
   await s.fallRefill();
   return {rockGone:s.cell[4][3].block!=='rock',ok:s.assertBoard('special clears rock')};
 });
 assert(forced.rockGone&&forced.ok,'special explosion must remove cracked rock');
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
 assert.equal(errors.length,0,'console/runtime exceptions: '+errors.join('; '));
 assert.equal(errors.length,0,'console/runtime exceptions: '+errors.join('; '));
 console.log('PASS Phaser browser smoke: levels 6,10,12; real swaps; rock special hit; no console errors');
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
