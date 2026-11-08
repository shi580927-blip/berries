const assert=require('node:assert/strict');
const {LEVELS,MAX_LEVEL,KEY,create}=require('../src/campaign.js');
const G=require('../src/gameplay_cycle_3_core.js');
const Trail=require('../src/royal_trail.js');
assert.equal(Trail.zoneForLevel(3).id,'frost_queen');
assert.equal(Trail.zoneForLevel(9).id,'alchemist');
assert.equal(Trail.stageForLevel(12),2);
assert.equal(Trail.pages(75).length,3);
assert.equal(Trail.pages(75)[2].to,75);
assert.equal(MAX_LEVEL,30);assert.equal(KEY,'berries_campaign_v1');
assert.equal(LEVELS[3].zone,'frost_queen');assert.equal(LEVELS[8].zone,'frost_queen');
assert.equal(LEVELS[9].zone,'alchemist');
for(const n of [6,12,18,24,30])assert.equal(LEVELS[n].madnessStage,n/6);
assert.equal(LEVELS[6].dropAcorns,true);
assert.equal(LEVELS[7].dropAcorns,true);
assert.equal(LEVELS[10].dropAcorns,true);
assert.equal(LEVELS[16].dropAcorns,undefined,'defer old 11-30 goals');
const used=new Set([...LEVELS[10].ice,...LEVELS[10].root,...LEVELS[10].ac].map(p=>G.key(p[0],p[1])));
for(const [r,c] of [...LEVELS[10].holes,...LEVELS[10].rocks]){
 assert(!used.has(G.key(r,c)),'new geometry may not overwrite an existing goal');
}
const berry=(id)=>({kind:'berry',id});
const acorn=()=>({kind:'acorn'});
let g=Array.from({length:8},()=>Array(3).fill(null));
g[3][1]=acorn();g[5][1]=berry('raspberry');g[6][1]=berry('blueberry');g[7][1]=berry('strawberry');
let drop=G.gravityPlan(g,new Set(),new Set(['7,1']));
assert.equal(drop.collected.length,0,'acorn is not removed until reaching exit');
assert.equal(drop.grid[4][1].kind,'acorn','fall only to first available place');
g=Array.from({length:8},()=>Array(3).fill(null));g[5][1]=acorn();g[7][1]=berry('strawberry');
drop=G.gravityPlan(g,new Set(),new Set(['7,1']));
assert.equal(drop.collected.length,0,'berry beneath acorn must hold it up');
assert.equal(drop.grid[6][1].kind,'acorn');
g=Array.from({length:8},()=>Array(3).fill(null));g[5][1]=acorn();
drop=G.gravityPlan(g,new Set(),new Set(['7,1']));
assert.equal(drop.collected.length,1,'acorn reaches bottom exit');
assert.equal(drop.collected[0].exit.r,7);
assert(drop.spawn.some(x=>x.r===7&&x.c===1),'free column slot is refilled after exit');
g=Array.from({length:8},()=>Array(3).fill(null));g[1][1]=acorn();
drop=G.gravityPlan(g,new Set(['5,1']),new Set(['7,1']));
assert.equal(drop.collected.length,0,'acorn cannot cross a rock/ice/root');
assert.equal(drop.grid[4][1].kind,'acorn');
g=Array.from({length:8},()=>Array(3).fill(null));g[0][1]=berry('blueberry');
drop=G.gravityPlan(g,new Set(['3,1','6,1']),new Set(['7,1']));
assert.equal(drop.grid[2][1].id,'blueberry','split column prevents falling through dividers');
assert(drop.spawn.every(q=>!['3,1','6,1'].includes(G.key(q.r,q.c))));
const board=[
 [{id:'a'},{id:'a'},{id:'b'}],
 [{id:'b'},{id:'c'},{id:'a'}],
 [{id:'c'},{id:'b'},{id:'c'}]
];
const original=JSON.stringify(board);
const moves=G.legalMoves(board);
assert(moves.length>0);assert.equal(JSON.stringify(board),original,'move discovery is non-mutating');
const blocked=new Set(['0,1','1,1']);
assert(!G.madnessCandidates(board,blocked).some(m=>[m.a,m.b].some(p=>blocked.has(G.key(p.r,p.c)))),'no swapping through blockers');
const pick=G.chooseMadness(board,new Set(),1,()=>0);
assert(pick&&Math.abs(pick.a.r-pick.b.r)+Math.abs(pick.a.c-pick.b.c)===1);
assert.equal(JSON.stringify(board),original,'madness should not edit the live board in the chooser');
const saved={version:1,lifePolicy:2,done:[1,2,3,4,5],coins:999,inventory:{hammer:2,shuffle:1,fan:3},lives:4,nextLifeAt:Date.now()+100000,active:null,serial:0,lastWin:null,purchaseTokens:[],daily:{lastClaimDay:null,lastReward:null}};
const memory={[KEY]:JSON.stringify(saved)};
const api=create({getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v});
assert.equal(api.unlocked(),6);assert.equal(api.read().coins,999);assert.deepEqual(api.read().inventory,saved.inventory);
console.log('PASS gameplay3 board gravity, rock dividers, mask, acorn exits, madness, saves, and 30-level continuity');
