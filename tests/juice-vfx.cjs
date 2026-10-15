// Execute actual VFX under a bounded scene clock, including its tween callbacks.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
class Obj extends EventEmitter {
 constructor(x=0,y=0){super();Object.assign(this,{x,y,scaleX:1,scaleY:1,angle:0,alpha:1,active:true})}
 setOrigin(){return this}setTint(){return this}setDisplaySize(w,h){this.scaleX=w/128;this.scaleY=h/128;return this}setDepth(){return this}setRotation(){return this}setAlpha(a){this.alpha=a;return this}setBlendMode(){return this}setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this}
 clear(){return this}lineStyle(){return this}beginPath(){return this}moveTo(){return this}lineTo(){return this}strokePath(){return this}
 destroy(){if(this.active){this.active=false;this.emit('destroy')}}
}
const canvas=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
const textures=new Set(),pending=[];const scene={events:new EventEmitter(),time:{now:0},textures:{exists:k=>textures.has(k),createCanvas(k){textures.add(k);return{context:canvas,refresh(){}}}},add:{image:(x,y)=>new Obj(x,y),ellipse:(x,y)=>new Obj(x,y),graphics:()=>new Obj()},tweens:{add(t){pending.push(t)},killTweensOf(o){for(let i=pending.length-1;i>=0;i--)if(pending[i].targets===o)pending.splice(i,1)}}};
const context={window:{},Phaser:{BlendModes:{ADD:1}},Math};vm.runInNewContext(fs.readFileSync('src/vfx/juice.js','utf8'),context);const fx=context.window.BerriesJuice.get(scene);
for(let i=0;i<30;i++){scene.time.now+=180;fx.berry(500,400,'strawberry',4)}
fx.line({x:0,y:0},{x:800,y:0});fx.bomb(500,400);fx.coins(500,400);
assert(fx.objects.size<=180);assert(textures.size<=11);const n=textures.size;fx.liquidTexture('splash','strawberry');assert.equal(textures.size,n);
for(const t of [...pending]){if(t.repeat===-1)continue;const o=t.targets;for(const k of ['t','x','y','alpha','scaleX','scaleY'])if(typeof t[k]==='number')o[k]=t[k];t.onUpdate?.();t.onComplete?.()}
assert.equal(fx.objects.size,0);
const sprite=new Obj(10,20);fx.aura(sprite);sprite.x=80;scene.events.emit('postupdate');assert.equal(sprite._juiceAura.x,80);sprite.destroy();assert.equal(scene.events.listenerCount('postupdate'),0);
fx.bomb(500,400);scene.events.emit('shutdown');assert(fx.closed);assert.equal(fx.objects.size,0);assert.equal(scene.juice,null);fx.berry(0,0,'blueberry');assert.equal(fx.objects.size,0);
console.log('PASS juice: object budget, animated callbacks, texture reuse, aura follows/destroys, scene shutdown');
