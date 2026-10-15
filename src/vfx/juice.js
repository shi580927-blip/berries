/* Cosmetic-only VFX: scene time, bounded objects, no game-state writes. */
(() => {
'use strict';
const COLORS={strawberry:0xd92d42,raspberry:0xd32767,blueberry:0x6575f5,gooseberry:0x9bdd35,blackberry:0x642b75,cloudberry:0xffab26};
class Juice {
  constructor(scene){
    this.s=scene;this.objects=new Set();this.closed=false;this.nextStain=0;this.nextGlass=0;
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
  // Baked colour + white reflections: tinting a white mask also tints its highlights.
  liquidTexture(kind,id){
    const color=COLORS[id]||COLORS.raspberry,key='juice_wet_'+kind+'_'+id,t=this.s.textures;
    if(t.exists(key))return key;
    const width=kind==='curtain'?768:kind==='drop'?64:256,height=kind==='curtain'?384:width;
    const tex=t.createCanvas(key,width,height),c=tex.context;
    const rgb=[color>>16&255,color>>8&255,color&255];
    const shade=(factor)=>'rgb('+rgb.map(v=>Math.min(255,Math.round(v*factor))).join(',')+')';
    const gradient=c.createLinearGradient(0,0,width*.7,height);
    gradient.addColorStop(0,shade(1.25));gradient.addColorStop(.35,shade(.93));gradient.addColorStop(.7,shade(.65));gradient.addColorStop(1,shade(1.05));
    c.beginPath();
    if(kind==='curtain'){
      c.moveTo(-10,-10);c.lineTo(width+10,-10);c.lineTo(width+10,88);
      // Varying rounded heavy drips joined by a thin, curved membrane.
      for(let i=7;i>=0;i--){
        const x=i*96,tip=155+((i*73+31)%185),neck=14+(i%3)*3;
        c.bezierCurveTo(x+85,76,x+61,72,x+55,115);
        c.bezierCurveTo(x+51,151,x+55+neck,tip-16,x+42+neck,tip);
        c.bezierCurveTo(x+26,tip+18,x+27,tip-12,x+29,tip-41);
        c.bezierCurveTo(x+36,107,x+17,76,x,84);
      }
      c.lineTo(-10,-10);
    }else if(kind==='drop'){
      c.moveTo(31,3);c.bezierCurveTo(39,20,55,35,48,49);c.bezierCurveTo(40,65,14,61,14,44);c.bezierCurveTo(14,28,29,17,31,3);
    }else{
      // Smooth liquid lobes, with thin bridges between longer fingers.
      const pts=[];
      for(let i=0;i<48;i++){
        const a=i*Math.PI*2/48,r=67+18*Math.sin(a*7)+19*Math.pow(Math.max(0,Math.cos(a*11)),6);
        pts.push({x:128+Math.cos(a)*r,y:121+Math.sin(a)*r});
      }
      const first=pts[0],last=pts[pts.length-1];c.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
      for(let i=0;i<pts.length;i++){const p=pts[i],n=pts[(i+1)%pts.length];c.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2);}

    }
    c.closePath();c.fillStyle=gradient;c.fill();
    c.lineJoin='round';c.lineWidth=kind==='drop'?1:2;c.strokeStyle=shade(.55);c.stroke();
    c.save();c.clip();
    if(kind==='curtain'){
      for(let i=0;i<8;i++){
        const x=i*96,tip=155+((i*73+31)%185);
        c.save();c.translate(x+43,(tip+65)/2);c.scale(24,(tip-35)/2);
        const g=c.createRadialGradient(-.18,-.12,0,0,0,1);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(.35,'rgba(255,255,255,.18)');g.addColorStop(.75,'rgba(0,0,0,.08)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
        const round=c.createRadialGradient(x+39,tip-9,1,x+42,tip-7,18);round.addColorStop(0,'rgba(255,255,255,.65)');round.addColorStop(.25,'rgba(255,255,255,.15)');round.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=round;c.fillRect(x+22,tip-27,42,40);
      }
    }else{
      const dome=c.createRadialGradient(width*.43,height*.35,2,width*.5,height*.5,width*.43);dome.addColorStop(0,'rgba(255,255,255,.4)');dome.addColorStop(.45,'rgba(255,255,255,.05)');dome.addColorStop(.84,'rgba(0,0,0,.12)');dome.addColorStop(1,'rgba(255,255,255,.2)');c.fillStyle=dome;c.fillRect(0,0,width,height);
    }
    const sheen=c.createLinearGradient(0,0,0,height);sheen.addColorStop(0,'rgba(255,255,255,.45)');sheen.addColorStop(.22,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(255,255,255,.03)');c.fillStyle=sheen;c.fillRect(0,0,width,height);
    c.strokeStyle='rgba(255,255,255,.78)';c.lineWidth=kind==='drop'?2:2.4;c.lineCap='round';
    if(kind==='curtain'){
      for(let i=0;i<8;i++){const x=i*96,tip=155+((i*73+31)%185);c.beginPath();c.moveTo(x+47,113);c.bezierCurveTo(x+40,150,x+43,tip-42,x+38,tip-17);c.stroke();
        c.fillStyle='rgba(255,255,255,.82)';c.beginPath();c.ellipse(x+38,tip-13,4,7,-.2,0,Math.PI*2);c.fill();}
    }else{
      c.beginPath();c.ellipse(width*.38,height*.35,width*.12,height*.055,-.65,Math.PI*.2,Math.PI*1.2);c.stroke();
      c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.ellipse(width*.34,height*.28,width*.035,height*.065,.45,0,Math.PI*2);c.fill();
    }
    c.restore();
    if(kind!=='drop'){
      // Transparent openings have their own bright wet rim.
      const holes=kind==='curtain'?[[150,64,20,29],[411,71,29,21],[620,54,17,26]]:[[107,79,15,11],[157,143,13,18],[91,152,9,14]];
      for(const [x,y,rx,ry] of holes){c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.ellipse(x,y,rx,ry,.3,0,Math.PI*2);c.fill();c.restore();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;c.beginPath();c.ellipse(x,y+2,rx+1,ry+1,.3,0,Math.PI);c.stroke();}
    }
    tex.refresh();return key;
  }
  wetImage(x,y,kind,id,width,height=width,depth=26){
    if(this.closed||this.objects.size>=180)return null;
    return this.keep(this.s.add.image(x,y,this.liquidTexture(kind,id)).setDisplaySize(width,height).setDepth(depth));
  }
  glass(id='strawberry'){
    if(this.closed||this.s.time.now<this.nextGlass||this.objects.size>145)return;
    this.nextGlass=this.s.time.now+2800;
    // Foreground impact followed by two rivulets hanging from the top of the glass.
    const impact=this.wetImage(960,420,'splash',id,620,510,28);
    if(impact){const sx=impact.scaleX,sy=impact.scaleY;impact.setScale(sx*.25,sy*.25);impact.t=0;
      this.animate(impact,{t:1,duration:1250,onUpdate:()=>{const t=impact.t,grow=Math.min(1,t*7);impact.setScale(sx*(.25+.85*grow),sy*(.25+.85*grow));impact.y=420+t*t*190;impact.alpha=t<.45?.95:Math.max(0,(1-t)/.55)}});}
    for(let i=0;i<2;i++){
      const o=this.wetImage(i?1390:480,0,'curtain',i?'blackberry':id,1060,460,29);if(!o)continue;
      o.setOrigin(.5,0);const sy=o.scaleY;o.t=0;
      this.animate(o,{t:1,duration:2100,delay:130+i*70,onUpdate:()=>{const t=o.t;o.setScale(o.scaleX,sy*(.45+.72*Math.min(1,t*2.7)));o.y=-70+90*t*t;o.alpha=t<.58?.96:Math.max(0,(1-t)/.42)}});
    }
    // Large detached drops slip down the glass after the initial impact.
    for(let i=0;i<8;i++){
      const x=400+i*155,y=110+Math.random()*150,o=this.wetImage(x,y,'drop',i%2?'blackberry':id,19+Math.random()*16,42+Math.random()*24,29);if(!o)break;
      this.animate(o,{y:y+260+Math.random()*160,alpha:0,duration:1300+Math.random()*500,delay:140,ease:'Quad.in'});
    }
  }
  berry(x,y,id,power=1){
    const s=this.s,count=8+Math.min(4,power);
    for(let i=0;i<count;i++){
      const a=Math.PI*2*i/count+Math.random()*.5,d=45+Math.random()*100;
      const o=this.wetImage(x,y,'drop',id,12+Math.random()*16,18+Math.random()*22,15);if(!o)break;
      o.setRotation(a+Math.PI/2);const sx=o.scaleX,sy=o.scaleY;o.t=0;
      this.animate(o,{t:1,duration:420+Math.random()*220,ease:'Linear',onUpdate:()=>{const t=o.t;o.x=x+Math.cos(a)*d*t;o.y=y+Math.sin(a)*d*t+100*t*t;o.alpha=1-t*t;o.setScale(sx*(1-.65*t),sy*(1-.3*t))}});
    }
    if(s.time.now>=this.nextStain&&this.objects.size<135){
      this.nextStain=s.time.now+220;
      const o=this.wetImage(x,y,'splash',id,120+Math.random()*45,110+Math.random()*35,18);
      if(o){const sy=o.scaleY;o.setAlpha(.9);this.animate(o,{y:y+80,scaleY:sy*1.35,alpha:0,duration:1050,ease:'Quad.in'});}
    }
    if(power>=3)this.glass(id);
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
  line(a,b){this.glass();this.lightning(a,b);this.glow((a.x+b.x)/2,(a.y+b.y)/2,0xb8fff0,220)}
  bomb(x,y){this.glow(x,y,0xffc45e,350);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.lightning({x,y},{x:x+Math.cos(a)*155,y:y+Math.sin(a)*155},0xff99dd)}for(let i=0;i<3;i++)this.berry(x,y,Object.keys(COLORS)[i*2],3)}
  rainbow(center,targets){this.glass('blueberry');this.glow(center.x,center.y,0xffd2ff,370);targets.slice(0,10).forEach((p,i)=>this.lightning(center,p,Object.values(COLORS)[i%6]))}
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
