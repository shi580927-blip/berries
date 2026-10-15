/* Cosmetic-only VFX: scene time, bounded objects, no game-state writes. */
(() => {
'use strict';
const COLORS={strawberry:0xf52b62,raspberry:0xe52c86,blueberry:0x6575f5,gooseberry:0x9bdd35,blackberry:0x9a48c7,cloudberry:0xffab26};
class Juice {
  constructor(scene){
    this.s=scene;this.objects=new Set();this.closed=false;this.nextStain=0;
    scene.events.once('shutdown',()=>{this.closed=true;for(const o of this.objects){scene.tweens.killTweensOf(o);o.destroy()}this.objects.clear();if(scene.juice===this)scene.juice=null});
    this.textures();
  }
  textures(){
    const t=this.s.textures;
    for(const kind of ['drop','splat','glow']){
      const key='juice_'+kind;if(t.exists(key))continue;
      const tex=t.createCanvas(key,128,128),c=tex.context;
      if(kind==='glow'){
        const g=c.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128);
      }else{
        c.fillStyle='#fff';c.beginPath();
        if(kind==='drop'){c.moveTo(64,8);c.bezierCurveTo(78,42,102,70,94,92);c.bezierCurveTo(82,125,34,117,32,88);c.bezierCurveTo(29,65,53,39,64,8)}
        else {for(let i=0;i<=64;i++){const a=i*Math.PI*2/64,r=34+10*Math.sin(a*5)+6*Math.cos(a*9);const x=64+Math.cos(a)*r,y=64+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y)}}
        c.closePath();c.fill();
      }
      tex.refresh();
    }
  }
  keep(o){if(this.closed||this.objects.size>=180){o.destroy();return null}this.objects.add(o);o.once('destroy',()=>this.objects.delete(o));return o}
  animate(o,config){if(!o)return;this.s.tweens.add({targets:o,...config,onComplete:()=>o.destroy()})}
  image(x,y,key,color,size,depth=15){if(this.closed||this.objects.size>=180)return null;return this.keep(this.s.add.image(x,y,key).setTint(color).setDisplaySize(size,size).setDepth(depth))}
  glow(x,y,color,size=180){const o=this.image(x,y,'juice_glow',color,size,12);if(o){o.setBlendMode(Phaser.BlendModes.ADD).setAlpha(.8);this.animate(o,{scaleX:o.scaleX*1.8,scaleY:o.scaleY*1.8,alpha:0,duration:460,ease:'Cubic.out'})}}
  berry(x,y,id,power=1){
    const color=COLORS[id]||COLORS.raspberry,s=this.s,count=7+Math.min(4,power);
    for(let i=0;i<count;i++){
      const a=Math.PI*2*i/count+Math.random()*.5,d=45+Math.random()*80;
      const o=this.image(x,y,'juice_drop',color,10+Math.random()*17);if(!o)break;
      o.setRotation(a+Math.PI/2);
      const sx=o.scaleX,sy=o.scaleY;o.t=0;
      this.animate(o,{t:1,duration:420+Math.random()*220,ease:'Linear',onUpdate:()=>{const t=o.t;o.x=x+Math.cos(a)*d*t;o.y=y+Math.sin(a)*d*t+100*t*t;o.alpha=1-t*t;o.setScale(sx*(1-.65*t),sy*(1-.3*t))}});
    }
    // One glossy glass stain per group, rather than covering every cell.
    if(s.time.now>=this.nextStain&&this.objects.size<135){
      this.nextStain=s.time.now+170;
      const o=this.image(x+Math.random()*50-25,y,'juice_splat',color,56+Math.random()*25,18);
      if(o){o.setAlpha(.48);const sy=o.scaleY;this.animate(o,{y:y+95,scaleY:sy*1.7,alpha:0,duration:1300,ease:'Quad.in'});
        const shine=this.keep(s.add.ellipse(o.x-9,o.y-10,13,5,0xffffff,.65).setDepth(19));this.animate(shine,{y:y+35,alpha:0,duration:700,ease:'Quad.in'});
      }
    }
  }
  lightning(a,b,color=0x96ffe0){
    if(this.objects.size>=170)return;
    const g=this.keep(this.s.add.graphics().setDepth(16));if(!g)return;
    g.setBlendMode(Phaser.BlendModes.ADD);
    let last=-1;g.t=0;
    const draw=()=>{
      const frame=Math.floor(g.t*8);if(last===frame)return;last=frame;g.clear();
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,points=[a];
      for(let i=1;i<12;i++){const t=i/12,j=(Math.random()-.5)*42;points.push({x:a.x+dx*t-dy/len*j,y:a.y+dy*t+dx/len*j})}points.push(b);
      const path=(pts,w,c,alpha)=>{g.lineStyle(w,c,alpha);g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.strokePath()};
      for(const [w,c,alpha] of [[24,color,.1],[10,color,.4],[3,0xffffff,1]])path(points,w,c,alpha);
      for(let i=2;i<11;i+=3){const p=points[i],sign=i%2?1:-1;const end={x:p.x+dx*.09-dy/len*sign*48,y:p.y+dy*.09+dx/len*sign*48};path([p,{x:(p.x+end.x)/2+12,y:(p.y+end.y)/2-9},end],2,color,.8)}
    };draw();this.animate(g,{t:1,alpha:0,duration:360,onUpdate:draw});
  }
  aura(sprite,color=0xffc85c){
    if(!sprite||sprite._juiceAura)return;
    const o=this.image(sprite.x,sprite.y,'juice_glow',color,115,2.9);if(!o)return;
    sprite._juiceAura=o;o.setBlendMode(Phaser.BlendModes.ADD).setAlpha(.45);
    const sx=o.scaleX;this.s.tweens.add({targets:o,scaleX:sx*1.25,scaleY:sx*1.25,alpha:.75,duration:850,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    const follow=()=>{o.x=sprite.x;o.y=sprite.y;o.visible=sprite.visible};this.s.events.on('postupdate',follow);
    o.once('destroy',()=>{this.s.events.off('postupdate',follow);this.s.tweens.killTweensOf(o)});
    sprite.once('destroy',()=>o.destroy());
  }
  line(a,b){this.lightning(a,b);this.glow((a.x+b.x)/2,(a.y+b.y)/2,0xb8fff0,220)}
  bomb(x,y){this.glow(x,y,0xffc45e,350);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.lightning({x,y},{x:x+Math.cos(a)*155,y:y+Math.sin(a)*155},0xff99dd)}for(let i=0;i<3;i++)this.berry(x,y,Object.keys(COLORS)[i*2],3)}
  rainbow(center,targets){this.glow(center.x,center.y,0xffd2ff,370);targets.slice(0,10).forEach((p,i)=>this.lightning(center,p,Object.values(COLORS)[i%6]))}
  coins(x,y){
    for(let i=0;i<32;i++){
      const o=this.image(x,y,'ui_coin',0xffffff,30+Math.random()*17,30);if(!o)break;
      const sx=o.scaleX,sy=o.scaleY,vx=(Math.random()-.5)*720,vy=-330-Math.random()*350,phase=Math.random()*Math.PI;o.t=0;
      this.animate(o,{t:1,duration:1500+Math.random()*400,ease:'Linear',onUpdate:()=>{const t=o.t;o.x=x+vx*t;o.y=y+vy*t+650*t*t;o.setScale(sx*(.12+.88*Math.abs(Math.cos(phase+t*17))),sy);o.angle=t*110;o.alpha=Math.min(1,(1-t)*4)}});
    }
  }
}
window.BerriesJuice={get(scene){return scene.juice||(scene.juice=new Juice(scene))},COLORS};
})();
