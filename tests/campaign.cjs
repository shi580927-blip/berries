const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {LEVELS,create,REGEN_MS}=require('../src/campaign.js');
let time=1e6;const mem={berries_vs_04:JSON.stringify({done:[1,6,11,16,21,30],coins:1500})};const storage={getItem:k=>mem[k]??null,setItem:(k,v)=>mem[k]=v};const api=create(storage,()=>time);
assert.equal(Object.keys(LEVELS).length,30);
for(const [n,l] of Object.entries(LEVELS)){
const blocked=new Set([...l.root,...l.ac].map(x=>x.join(',')));assert.equal(blocked.size,l.root.length+l.ac.length);
for(const p of [...l.ice,...l.root,...l.ac])assert(p[0]>=0&&p[0]<8&&p[1]>=0&&p[1]<8);
for(const [type,id,need] of l.g){if(type==='ice')assert(need<=l.ice.length,'ice '+n);if(type==='roots')assert(need<=l.root.length);if(type==='acorn')assert(need<=l.ac.length)}
}
assert.equal(api.read().lives,5);
for(let i=0;i<10;i++){const attempt=api.begin(1);api.abandon(attempt)}
assert.equal(api.read().lives,5,'unfinished exits are free');
const legacyState=api.read();delete legacyState.lifePolicy;legacyState.lives=1;
mem.berries_campaign_v1=JSON.stringify(legacyState);
assert.equal(api.read().lives,5,'one-time old-save compensation');
const loss=api.begin(1);api.lose(loss);api.abandon(loss);
assert.equal(create(storage,()=>time).read().lives,4,'compensation cannot repeat');
time+=REGEN_MS;assert.equal(api.read().lives,5);
assert.equal(api.unlocked(),1);assert.equal(api.read().coins,1500);assert.equal(JSON.parse(mem.berries_vs_04).done.length,6);assert.equal(api.begin(6),null);
let token=api.begin(1);assert(token);assert(api.consume('hammer'));assert(api.win(token));assert.equal(api.unlocked(),2);assert.equal(api.read().lives,5);assert(api.doubleReward(token));assert(!api.doubleReward(token));
let next=api.begin(2);assert.equal(api.read().inventory.hammer,1);assert(api.lose(next));assert(!api.lose(next));assert.equal(api.read().lives,4);assert(api.resume(next));assert.equal(api.read().lives,5);assert(api.lose(next));api.abandon(next);assert.equal(api.read().lives,4);time+=REGEN_MS;assert.equal(api.read().lives,5);
let balance=api.read().coins;assert(api.buy('fan'));assert.equal(api.read().coins,balance-400);assert.equal(api.read().inventory.fan,3);
for(let i=0;i<5;i++){const t=api.begin(1);assert(t);api.lose(t);api.abandon(t)}assert.equal(api.read().lives,0);assert.equal(api.begin(1),null);assert(api.addLife());assert(!api.addLife());assert.equal(create(storage,()=>time).read().inventory.hammer,1);
while(api.buy('fan')){}const poor=api.read();assert(!api.buy('fan'));assert.equal(api.read().coins,poor.coins);
time+=REGEN_MS*10;assert.equal(api.read().lives,5);
for(let n=2;n<=30;n++){const t=api.begin(n);assert(t,'level '+n);assert(api.win(t));assert.equal(api.unlocked(),Math.min(30,n+1))}
assert.equal(api.read().done.length,30);
(async()=>{
const source=fs.readFileSync(path.join(__dirname,'../src/vertical_slice.js'),'utf8');
const method=source.slice(source.indexOf('async clearCells'),source.indexOf('async fallRefill')).trim();
const clear=new Function('inBounds','return ({'+method+'}).clearCells')((r,c)=>r>=0&&r<8&&c>=0&&c<8);
const board=Array.from({length:8},()=>Array(8).fill(null)),cell=Array.from({length:8},()=>Array.from({length:8},()=>({ice:0,block:null})));
let sounds=0,shards=0,iceGoals=0,acGoals=0;
const ctx={board,cell,spr:board.map(r=>r.slice()),expandSpecials:s=>s,fx:{iceBreak(){sounds++},pop(){},spark(){},wood(){}},iceShards(){shards++},pos:()=>({x:0,y:0}),burst(){},render(){},updateHud(){},score:0,bumpGoal(t){if(t==='ice')iceGoals++;if(t==='acorn')acGoals++}};
board[0][0]={id:'berry'};cell[0][0].ice=2;
await clear.call(ctx,new Set(['0,0']));assert.equal(cell[0][0].ice,1);assert.equal(iceGoals,0);
await clear.call(ctx,new Set(['0,0']));assert.equal(cell[0][0].ice,0);assert.equal(iceGoals,1);assert.equal(sounds,2);assert.equal(shards,2);
cell[0][1]={ice:2,block:'acorn'};
await clear.call(ctx,new Set(['0,1']));assert.equal(cell[0][1].ice,1);assert.equal(acGoals,0);
await clear.call(ctx,new Set(['0,1']));assert.equal(cell[0][1].ice,0);assert.equal(acGoals,0);
await clear.call(ctx,new Set(['0,1']));assert.equal(acGoals,1);
console.log('PASS campaign economy, life accounting, 30 layouts and both ice layers');
})().catch(e=>{console.error(e);process.exitCode=1});
