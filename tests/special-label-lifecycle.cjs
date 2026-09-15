// Isolated lifecycle regression; uses real resolve/showSpecialInfo with scene/render stubs.
// Run: node tests/special-label-lifecycle.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function compileShow(code){
const a=code.indexOf("p.showSpecialInfo=function"),b=code.indexOf("\n  const baseSelect",a);
return new Function("W","FONT","clearTimeout","setTimeout","return "+code.slice(a+"p.showSpecialInfo=".length,b).trim().replace(/;$/,""))(1920,"Arial",()=>{},()=>0);
}
function compileResolve(code){
const a=code.indexOf("p.resolve=async function"),b=code.indexOf("\n  const baseSwap",a);
return new Function("pause","return "+code.slice(a+"p.resolve=".length,b).trim().replace(/;$/,""))(async()=>{});
}
async function scenario(code){
const board=Array.from({length:8},()=>Array.from({length:8},()=>({id:"berry"})));
let waves=0,refills=0;
const label=()=>({scene:{},setText(){if(!this.scene)throw Error("Text context destroyed");return this},setAlpha(){return this},setScale(){return this},setOrigin(){return this},setDepth(){return this}});
const dead=label();dead.scene=null;
const ctx={board,specialInfoText:dead,scene:{isActive:()=>true},add:{text:label},tweens:{add(){}},
groups(){return waves++<4?[{p:[{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:3}]}]:[]},
findCreation:()=>({at:{r:0,c:0},sp:"line_h"}),
async clearCells(cells){for(const key of cells){const[r,c]=key.split(",").map(Number);board[r][c]=null}},
render(){},specialCreateFx(){},kingReact(){},showSpecialInfo:compileShow(code),
async fallRefill(){refills++;for(let r=0;r<8;r++)for(let c=0;c<8;c++)board[r][c]??={id:"berry"}},
hasMove:()=>true,assertBoard(){if(board.flat().some(x=>!x))throw Error("hole")}};
try{await compileResolve(code).call(ctx);return {completed:true,refills,holes:board.flat().filter(x=>!x).length}}catch(e){return{completed:false,error:e.message,refills,holes:board.flat().filter(x=>!x).length}}
}
(async()=>{
const code=fs.readFileSync(path.join(__dirname,'../src/runtime_stable_v10.js'),'utf8');
const result=await scenario(code);
assert.deepEqual(result,{completed:true,refills:4,holes:0});
console.log('PASS: destroyed special label is recreated; four cascades refill without holes');
})().catch(e=>{console.error(e);process.exitCode=1});
