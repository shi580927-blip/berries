const assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('src/runtime_stable_v10.js','utf8');
const start=code.indexOf('p.victoryCoinBurst=function');
const end=code.indexOf('\n  const baseResultPopup',start);
const fit=(image,w,h)=>{image.width=w;return image};
function scenario(reduced=false,exists=true){
 const nodes=[],tweens=[];
 const coin=()=>{const n={angle:0,setDepth(d){this.depth=d;return this},setAngle(a){this.angle=a;return this},setPosition(x,y){this.x=x;this.y=y;return this}};nodes.push(n);return n};
 const burst=new Function('window','W','H','fit','return '+code.slice(start+'p.victoryCoinBurst='.length,end).trim().replace(/;$/,''))({matchMedia:()=>({matches:reduced})},1920,1080,fit);
 burst.call({textures:{exists:()=>exists},add:{image:(x,y,key)=>{assert.equal(key,'ui_coin');return coin()}},fxTween:(node,config)=>tweens.push({node,config})});
 for(const {node,config} of tweens){assert.equal(node.depth,30);assert.equal(node.input,undefined);node._burstT=.5;config.onUpdate();assert.ok(Number.isFinite(node.x)&&Number.isFinite(node.y));assert.ok(node.x>=0&&node.x<=1920);assert.equal(config.alpha,0)}
 return nodes.length;
}
assert.equal(scenario(),28);assert.equal(scenario(true),8);assert.equal(scenario(false,false),0);
assert.match(code,/duration:2150\+i\*22/);assert.match(code,/duration:1980\+i\*80/);
console.log('PASS cosmetic coins: existing texture, bounded counts/trajectory, no currency API or input; combo +1000ms');
