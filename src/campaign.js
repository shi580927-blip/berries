(function(root){
'use strict';
const KEY='berries_campaign_v1',LEGACY='berries_vs_04',MAX_LIVES=5,REGEN_MS=30*60*1000;
const PRICES={hammer:250,shuffle:300,fan:400};
const iceSlots=[[1,1],[1,6],[3,2],[3,5],[5,2],[5,5],[6,1],[6,6],[0,3],[0,4],[7,3],[7,4]];
const acSlots=[[2,2],[2,5],[5,2],[5,5],[3,3],[4,4],[3,4]];
const rootSlots=[[1,2],[1,5],[2,1],[2,6],[5,1],[5,6],[6,2],[6,5],[3,0],[4,7]];
const goals=(...g)=>g;
const berry=(id,n)=>['berry',id,n],ice=n=>['ice',null,n],ac=n=>['acorn',null,n],roots=n=>['roots',null,n],score=n=>['score',null,n];
const rows=[
[18,5,goals(berry('strawberry',12))],[18,5,goals(berry('raspberry',14))],
[20,5,goals(berry('blueberry',10),berry('strawberry',10))],[18,5,goals(score(900))],
[17,6,goals(berry('gooseberry',12))],[18,6,goals(berry('blackberry',16))],
[17,6,goals(berry('raspberry',14))],[17,6,goals(berry('blueberry',14))],
[18,6,goals(score(1100))],[18,6,goals(berry('strawberry',12),berry('cloudberry',12))],
[20,6,goals(ice(8)),8],[19,6,goals(ice(12)),12],
[19,6,goals(berry('strawberry',10)),10],[21,6,goals(ice(8)),8,2],
[20,6,goals(ice(12),score(1000)),12,'mixed'],
[20,6,goals(ac(4)),0,1,4],[20,6,goals(ac(6)),0,1,6],
[21,6,goals(ac(5)),0,1,5,0,3],[21,6,goals(ac(7)),6,1,7],
[22,6,goals(ac(6),berry('raspberry',10)),6,1,6,0,2],
[20,6,goals(roots(8)),0,1,0,8],[20,6,goals(roots(10)),0,1,0,10],
[22,6,goals(roots(8),ice(8)),8,1,0,8],[22,6,goals(ac(5)),0,1,5,8],
[21,6,goals(berry('strawberry',12),ice(10)),10,1,0,6],
[20,6,goals(score(1400)),0,1,0,10],
[22,6,goals(ac(7),ice(8)),8,1,7,6],
[21,6,goals(roots(10),berry('cloudberry',12)),0,1,0,10],
[23,6,goals(ac(6),ice(8)),8,2,6,6],
[24,6,goals(ice(12),ac(6),roots(8)),12,'mixed',6,8]
];
const LEVELS=Object.fromEntries(rows.map((row,i)=>{
const [m,n,g,ic=0,h=1,a=0,r=0,frozenAc=0]=row;
return [i+1,{m,n,g,ice:[...iceSlots.slice(0,ic).map(([y,x],k)=>[y,x,h==='mixed'?(k%3===0?2:1):h]),...acSlots.slice(0,frozenAc).map(([y,x])=>[y,x,1])],ac:acSlots.slice(0,a).map(x=>x.slice()),root:rootSlots.slice(0,r).map(x=>x.slice())}];
}));
function create(storage,now=Date.now,cloud=()=>{}){
const number=(v,f=0)=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):f;
function write(s){storage.setItem(KEY,JSON.stringify(s));cloud(s);return s}
function tick(s){
if(s.lives<MAX_LIVES&&s.nextLifeAt&&now()>=s.nextLifeAt){
const gain=1+Math.floor((now()-s.nextLifeAt)/REGEN_MS);
s.lives=Math.min(MAX_LIVES,s.lives+gain);s.nextLifeAt=s.lives===MAX_LIVES?null:s.nextLifeAt+gain*REGEN_MS;
}return s;
}
function read(){
let s;try{s=JSON.parse(storage.getItem(KEY)||'null')}catch{}
if(!s||s.version!==1){
let old;try{old=JSON.parse(storage.getItem(LEGACY)||'{}')}catch{}
s={version:1,done:[],coins:number(old?.coins),inventory:{hammer:2,shuffle:2,fan:2},lives:5,nextLifeAt:null,active:null,serial:0,lastWin:null};return write(s);
}
s.done=[...new Set((s.done||[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=30))];
s.coins=number(s.coins);s.inventory??={};
for(const id of Object.keys(PRICES))s.inventory[id]=number(s.inventory[id]);
s.lives=Math.min(5,number(s.lives,5));if(s.lives<5&&!s.nextLifeAt)s.nextLifeAt=now()+REGEN_MS;
const old=JSON.stringify(s);tick(s);if(JSON.stringify(s)!==old)write(s);return s;
}
function unlocked(s=read()){let n=1;const done=new Set(s.done);while(n<30&&done.has(n))n++;return n}
function debit(s){s.lives=Math.max(0,s.lives-1);if(!s.nextLifeAt)s.nextLifeAt=now()+REGEN_MS}
function abandon(token){const s=read();if(!s.active||(token&&s.active.id!==token))return s;if(!s.active.lost)debit(s);s.active=null;return write(s)}
function begin(n){
let s=read();if(!LEVELS[n]||n>unlocked(s))return null;
if(s.active)s=abandon(s.active.id);
if(s.lives<=0)return null;
s.serial=number(s.serial)+1;s.active={id:s.serial,level:n,lost:false};write(s);return s.active.id;
}
function lose(token){const s=read();if(s.active?.id!==token||s.active.lost)return false;debit(s);s.active.lost=true;write(s);return true}
function resume(token){const s=read();if(s.active?.id!==token||!s.active.lost)return false;s.lives=Math.min(5,s.lives+1);if(s.lives===5)s.nextLifeAt=null;s.active.lost=false;write(s);return true}
const reward=n=>80+Math.floor((n-1)/5)*20;
function win(token){const s=read();if(s.active?.id!==token)return false;const n=s.active.level;s.done=[...new Set([...s.done,n])];s.coins+=reward(n);s.lastWin={id:token,reward:reward(n),doubled:false};s.active=null;write(s);return true}
function doubleReward(token){const s=read();if(s.lastWin?.id!==token||s.lastWin.doubled)return false;s.coins+=s.lastWin.reward;s.lastWin.doubled=true;write(s);return true}
function consume(id){const s=read();if(!PRICES[id]||s.inventory[id]<=0)return false;s.inventory[id]--;write(s);return true}
function buy(id){const s=read(),price=PRICES[id];if(!price||s.coins<price)return false;s.coins-=price;s.inventory[id]++;write(s);return true}
function addLife(){const s=read();if(s.lives!==0)return false;s.lives=1;write(s);return true}
function lifeLabel(){const s=read();if(s.lives===5)return '5 / 5';const sec=Math.max(0,Math.ceil((s.nextLifeAt-now())/1000));return s.lives+' / 5  • '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
return {read,unlocked,begin,abandon,lose,resume,win,doubleReward,consume,buy,addLife,lifeLabel};
}
const api={KEY,LEVELS,PRICES,create,REGEN_MS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.BerriesCampaign={...api,...create(root.localStorage,Date.now,s=>root.BerriesYandex?.saveCloudData?.(s,false))};
})(typeof window!=='undefined'?window:this);
