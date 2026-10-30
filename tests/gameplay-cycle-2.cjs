const assert=require('node:assert/strict');
const {LEVELS,KEY,create,MAX_LEVEL}=require('../src/campaign.js');
assert.equal(MAX_LEVEL,30);assert.equal(KEY,'berries_campaign_v1');
const goals=[['berry'],['berry'],['ice'],['ice'],['score'],['acorn'],['acorn','berry'],['roots'],['ice','roots'],['ice','acorn','roots']];
for(let n=1;n<=10;n++){
 const l=LEVELS[n];assert.deepEqual(l.g.map(x=>x[0]),goals[n-1]);
 const blocked=new Set([...l.root,...l.ac].map(x=>x.join(',')));
 assert.equal(blocked.size,l.root.length+l.ac.length);
 for(const [r,c,h] of l.ice){assert(!blocked.has(r+','+c));assert.equal(h,1)}
 for(const [type,,count] of l.g){const available={ice:l.ice.length,roots:l.root.length,acorn:l.ac.length}[type];if(available!==undefined)assert.equal(count,available)}
}
const tutorial=LEVELS[2];assert.equal(tutorial.openingBoard.length,8);
const b=tutorial.openingBoard.map(row=>row.split('').map(Number));
const matches=(board)=>{const hit=[];for(let r=0;r<8;r++)for(let c=0;c<6;c++)if(board[r][c]===board[r][c+1]&&board[r][c]===board[r][c+2])hit.push([r,c]);for(let r=0;r<6;r++)for(let c=0;c<8;c++)if(board[r][c]===board[r+1][c]&&board[r][c]===board[r+2][c])hit.push([r,c]);return hit};
assert.deepEqual(matches(b),[]);
const [[r,c],[y,x]]=tutorial.openingSwap;assert.equal(Math.abs(r-y)+Math.abs(c-x),1);
[b[r][c],b[y][x]]=[b[y][x],b[r][c]];
assert.deepEqual(b[3].slice(2,6),[1,1,1,1]);
assert.deepEqual(LEVELS[11].g,[['ice',null,8]]);assert.equal(LEVELS[16].ac.length,4);assert.equal(LEVELS[21].root.length,8);
const old={version:1,lifePolicy:2,done:[1,2],coins:900,inventory:{hammer:3,shuffle:4,fan:5},lives:5,nextLifeAt:null,active:null,serial:0,lastWin:null,purchaseTokens:[],daily:{lastClaimDay:null,lastReward:null}};
const mem={[KEY]:JSON.stringify(old)};const api=create({getItem:k=>mem[k]??null,setItem:(k,v)=>mem[k]=v},()=>Date.UTC(2026,9,30));
assert.equal(api.unlocked(),3);assert.equal(api.read().coins,900);assert.deepEqual(api.read().inventory,old.inventory);
const token=api.begin(3);assert(token);assert(api.win(token));assert.equal(api.unlocked(),4);
console.log('PASS gameplay cycle stages 1–2: layout, guided four-match, progress compatibility');
