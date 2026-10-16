const assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('src/runtime_stable_v10.js','utf8');
assert.ok(!code.includes('victoryCoinBurst'));
function compile(name,endMarker){const a=code.indexOf('p.'+name+'='),b=code.indexOf(endMarker,a);return new Function('window','W','H','FONT','return '+code.slice(a+('p.'+name+'=').length,b).trim().replace(/;$/,''))({BerriesI18n:{t:k=>k}},1920,1080,'Arial')}
const nodes=[],tweens=[];
const node=kind=>{const n={kind,angle:0,x:960,y:540,setPosition(x,y){this.x=x;this.y=y;return this},setOrigin(){return this},setDepth(){return this},setAlpha(a){this.alpha=a;return this},setAngle(a){this.angle=a;return this},setScale(){return this},setTint(){return this}};nodes.push(n);return n};
const scene={add:{text:(x,y,text)=>Object.assign(node('text'),{x,y,text}),star:()=>node('star'),rectangle:()=>node('confetti')},fxTween:(n,c)=>tweens.push({n,c}),fxBits(){}};
scene.comboArcWord=compile('comboArcWord','\n  p.comboCelebration');
compile('comboCelebration','\n  const baseClearCells').call(scene,5);
assert.equal(nodes.filter(n=>n.kind==='confetti').length,180);
assert.equal(nodes.filter(n=>n.kind==='star').length,53);
assert.ok(nodes.filter(n=>n.kind==='text').every(n=>n.alpha>=.5&&n.alpha<=.78));
assert.ok(tweens.every(({c})=>c.duration>=2600&&c.alpha.ease==='Expo.in'));
assert.match(code,/fxAllow\('combo-vfx',220\)/);
console.log('PASS juicy combo: 180 confetti, 53 stars, translucent text, late fade, 220ms cadence; coin effect removed');

const moving=tweens.filter(({c})=>c.comboMixProgress===1);
assert.equal(moving.length,4);
const starts=moving.map(({n})=>[n.x,n.y]);
moving.forEach(({n,c},i)=>{
  const word=n.text;n.comboMixProgress=.5;c.onUpdate();
  assert.notEqual(n.x,starts[i][0]);assert.notEqual(n.y,starts[i][1]);
  n.comboMixProgress=1;c.onUpdate();assert.equal(n.text,word);
  assert.ok(starts.some(([x,y],j)=>j!==i&&x===n.x&&y===n.y));
});
assert.equal(new Set(moving.map(({n})=>n.x+','+n.y)).size,4);
console.log('PASS whole combo words exchange distinct slots along curved paths');
