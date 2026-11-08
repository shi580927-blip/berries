/* Gameplay cycle 3.0 isolated Phaser integration. Requires stable v10 already installed. */
(() => {
 'use strict';
 const Core=window.BerriesGameplay3;
 const Campaign=window.BerriesCampaign;
 const W=1920,H=1080,R=8,C=8;
 const MOBILE=!!(window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0);
 const CELL=MOBILE?110:96,BX=(W-C*CELL)/2,BY=MOBILE?130:150;
 const TYPES=['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
 const pause=ms=>window.BerriesLifecycle.wait(ms);
 const stateKey=(r,c)=>Core.key(r,c);
 const randBerry=(count)=>({id:TYPES[Math.floor(Math.random()*Math.max(1,count))],sp:null});
 function install(){
   const scene=window.__berriesGame?.scene?.keys?.Play;
   const p=scene&&Object.getPrototypeOf(scene);
   if(!p?.__berriesStableV10||p.__berriesCycle3)return false;
   p.__berriesCycle3=true;
   const baseCreate=p.create,baseRender=p.render,baseFall=p.fallRefill;
   const baseResolve=p.resolve,baseClear=p.clearCells,baseUseBoosterAt=p.useBoosterAt;
   const baseAssert=p.assertBoard;
   const hasNewGeometry=function(){
     return !!(this.cfg?.dropAcorns||this.cfg?.holes?.length||this.cfg?.rocks?.length);
   };
   const imageFit=(image,size)=>{image.setScale(Math.min(size/image.width,size/image.height));return image};
   const rebind=(scene,s,r,c)=>{
     if(!s)return;
     s.setData?.('r',r);s.setData?.('c',c);
     s.removeAllListeners?.('pointerdown');
     s.setInteractive?.({useHandCursor:true});
     s.on?.('pointerdown',()=>scene.tap(r,c));
   };
   p.render=function renderGameplay3(r,c,first=false,fall=false){
     const ce=this.cell[r][c],point=this.pos(r,c);
     if(!ce.acorn&&ce.block!=='rock'&&ce.block!=='void'){
       return baseRender.call(this,r,c,first,fall);
     }
     this.spr[r][c]?.destroy?.();ce.over?.destroy?.();
     this.spr[r][c]=null;ce.over=null;
     if(ce.block==='void')return;
     if(ce.acorn){
       const img=imageFit(this.add.image(point.x,point.y,'acorn'),CELL*.85).setDepth(4);
       img.setData({r,c,sx:img.scaleX,sy:img.scaleY,ang:0});
       rebind(this,img,r,c);this.spr[r][c]=img;
       if(first){
         const sx=img.scaleX,sy=img.scaleY;
         img.setScale(sx*.8,sy*.8);
         this.tweens.add({targets:img,scaleX:sx,scaleY:sy,duration:260,ease:'Back.out'});
       }
       return;
     }
     // Temporary in-engine stone artwork; separate production PNG/WebP to be approved later.
     const g=this.add.graphics({x:point.x,y:point.y}).setDepth(4);
     const hp=ce.rockHp||1;
     g.fillStyle(0x1c302b,.45);g.fillEllipse(0,18,CELL*.85,CELL*.57);
     g.fillStyle(hp>1?0x6b7b6e:0x83938a,1);g.fillEllipse(0,0,CELL*.87,CELL*.78);
     g.fillStyle(0x9fae91,.7);g.fillEllipse(-17,-15,CELL*.44,CELL*.22);
     g.fillStyle(0x476d44,.95);
     for(const [x,y,radius] of [[-30,-19,12],[-6,-28,9],[26,-17,13],[34,2,7]])
       g.fillCircle(x,y,radius);
     g.lineStyle(3,0x2b3839,.95);
     if(hp===1){g.lineBetween(-19,-18,4,3);g.lineBetween(4,3,-1,23);g.lineBetween(4,3,29,-7)}
     else {g.lineBetween(-27,13,-10,18);g.lineBetween(13,-20,28,-13)}
     g.setData({r,c,sx:1,sy:1,ang:0});
     g.setInteractive(new Phaser.Geom.Rectangle(-CELL/2,-CELL/2,CELL,CELL),Phaser.Geom.Rectangle.Contains);
     g.on('pointerdown',()=>this.tap(r,c));
     this.spr[r][c]=g;
   };
   p.create=function createGameplay3(){
     if(baseCreate.call(this)===false)return false;
     this._cycle3={madnessBusy:false,acornsDelivered:0};
     for(const [r,c] of this.cfg.holes||[]){
       const ce=this.cell?.[r]?.[c];if(!ce)continue;
       ce.block='void';ce.acorn=false;this.board[r][c]=null;
       const pos=this.pos(r,c);
       this.add.rectangle(pos.x,pos.y,CELL-8,CELL-8,0x10291d,.94).setDepth(2);
     }
     for(const [r,c,hp] of this.cfg.rocks||[]){
       const ce=this.cell?.[r]?.[c];if(!ce)continue;
       ce.block='rock';ce.rockHp=hp;this.board[r][c]=null;
     }
     if(this.cfg.dropAcorns)for(const [r,c] of this.cfg.ac){
       const ce=this.cell?.[r]?.[c];
       if(!ce||ce.block!=='acorn')continue;
       ce.block=null;ce.acorn=true;this.board[r][c]=null;
     }
     if(hasNewGeometry.call(this)){
       this.drawAll(false,false);
       if(!this.hasMove())for(let attempt=0;attempt<80&&!this.hasMove();attempt++)this.shuffleBoard();
       this.drawAll(false,false);
     }
     if(this.cfg.madnessStage){
       const tint=[0xe6a8ef,0xcf8ded,0xba79e9][Math.min(2,this.cfg.madnessStage-1)];
       const outline=this.add.graphics().setDepth(2);
       outline.lineStyle(9,tint,.9);outline.strokeRoundedRect(BX-22,BY-22,C*CELL+44,R*CELL+44,25);
       const title=this.add.text(W/2,104,'ОСТОРОЖНО! ЯГОДНОЕ БЕЗУМИЕ! ЯГОДЫ ЗАБРОДИЛИ!',{
         fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'26px',fontStyle:'bold',
         color:'#fff1df',stroke:'#632056',strokeThickness:6,align:'center'
       }).setDepth(35).setOrigin(.5);
       this.tweens.add({targets:title,alpha:0,delay:1350,duration:360,onComplete:()=>title.destroy()});
     }
     this.events.once('shutdown',()=>{this._cycle3=null});
     return true;
   };
   p.assertBoard=function assertGameplay3(stage){
     if(!hasNewGeometry.call(this))return baseAssert.call(this,stage);
     const used=new Set();
     for(let r=0;r<R;r++)for(let c=0;c<C;c++){
       const ce=this.cell[r][c],item=this.board[r][c],sprite=this.spr[r][c];
       if(ce.block==='void'){if(item||sprite)throw Error('void occupied: '+stateKey(r,c));continue}
       if(ce.acorn&&item)throw Error('acorn shares cell with berry: '+stateKey(r,c));
       const anchored=!!(ce.block||ce.ice||ce.acorn);
       if(!anchored&&!item)throw Error('empty playable cell: '+stateKey(r,c)+' at '+stage);
       if((item||ce.acorn)&&!sprite)throw Error('sprite missing: '+stateKey(r,c));
       if(sprite){if(used.has(sprite))throw Error('duplicate sprite');used.add(sprite);sprite.setData?.('r',r);sprite.setData?.('c',c)}
     }
     return true;
   };
   p.fallRefill=async function fallGameplay3(){
     if(!hasNewGeometry.call(this))return baseFall.call(this);
     const barriers=new Set(),exits=new Set(),snapshot=[];
     for(let r=0;r<R;r++){
       const row=[];
       for(let c=0;c<C;c++){
         const ce=this.cell[r][c];
         if(ce.block||ce.ice){barriers.add(stateKey(r,c));row.push(null);continue}
         row.push(ce.acorn?{kind:'acorn',ref:null,sprite:this.spr[r][c]}:
           this.board[r][c]?{kind:'berry',ref:this.board[r][c],sprite:this.spr[r][c]}:null);
         if(r===R-1&&ce.block!=='void')exits.add(stateKey(r,c));
       }
       snapshot.push(row);
     }
     const plan=Core.gravityPlan(snapshot,barriers,exits);
     const animations=[];
     for(let r=0;r<R;r++)for(let c=0;c<C;c++){
       if(barriers.has(stateKey(r,c)))continue;
       this.board[r][c]=null;this.cell[r][c].acorn=false;this.spr[r][c]=null;
     }
     for(const move of plan.moves){
       const {r,c}=move.to,it=move.item,sp=it.sprite;
       if(it.kind==='acorn')this.cell[r][c].acorn=true;
       else this.board[r][c]=it.ref;
       this.spr[r][c]=sp;rebind(this,sp,r,c);
       if(!sp)continue;
       const at=this.pos(r,c),distance=r-move.from.r;
       if(distance>0)animations.push(new Promise(resolve=>this.tweens.add({
         targets:sp,x:at.x,y:at.y,duration:195+distance*90,ease:'Cubic.in',onComplete:resolve
       })));
     }
     for(const entry of plan.collected){
       const sp=entry.item.sprite,at=this.pos(entry.exit.r,entry.exit.c);
       this.bumpGoal('acorn',null,1);this._cycle3.acornsDelivered++;
       if(sp)animations.push(new Promise(resolve=>this.tweens.add({
         targets:sp,x:at.x,y:at.y+CELL*.35,alpha:0,scaleX:sp.scaleX*.5,scaleY:sp.scaleY*.5,
         duration:275,ease:'Cubic.in',onComplete:()=>{sp.destroy();resolve()}
       })));
       const sparkle=this.add.circle(at.x,at.y,8,0xffdf86,.9).setDepth(10);
       this.tweens.add({targets:sparkle,scale:5,alpha:0,duration:350,onComplete:()=>sparkle.destroy()});
       this.fx?.acornCrunch?.();
     }
     const spawnCounts=new Map();
     for(const spawn of plan.spawn){
       const {r,c,top,belowBarrier}=spawn;
       this.board[r][c]=randBerry(this.cfg.n);this.render(r,c);
       const sp=this.spr[r][c];
       if(!sp)continue;
       rebind(this,sp,r,c);
       const at=this.pos(r,c),num=(spawnCounts.get(c)||0)+1;spawnCounts.set(c,num);
       const startY=belowBarrier?this.pos(top,c).y-18-num*8:BY-CELL*num-30;
       sp.y=startY;sp.x=at.x;sp.alpha=belowBarrier?0:.98;
       animations.push(new Promise(resolve=>this.tweens.add({
         targets:sp,y:at.y,alpha:1,duration:330+num*38+(r-top)*18,
         ease:belowBarrier?'Back.out':'Bounce.out',onComplete:resolve
       })));
     }
     if(animations.length)await Promise.all(animations);
     await pause(65);
     this.updateHud();
   };
   function damageRock(scene,r,c){
     const ce=scene.cell?.[r]?.[c];
     if(ce?.block!=='rock')return false;
     ce.rockHp=Math.max(0,(ce.rockHp||1)-1);
     const at=scene.pos(r,c);
     for(let i=0;i<9;i++){
       const angle=i/9*Math.PI*2;
       const x=at.x+Math.cos(angle)*(23+Math.random()*23);
       const y=at.y+Math.sin(angle)*(20+Math.random()*23);
       const bit=scene.add.circle(at.x,at.y,3+Math.random()*4,i%3===0?0x718a58:0x89958d,.94).setDepth(14);
       scene.tweens.add({targets:bit,x,y,alpha:0,scale:0,duration:280+Math.random()*180,onComplete:()=>bit.destroy()});
     }
     if(!ce.rockHp)ce.block=null;
     scene.fx?.crack?.();scene.render(r,c);
     return true;
   }
   p.clearCells=async function clearGameplay3(initial,chain=1){
     const source=new Set(initial),expanded=this.expandSpecials(new Set(source));
     const hasSpecial=this._cycle3Fan||[...source].some(k=>{
       const [r,c]=k.split(',').map(Number);return !!this.board?.[r]?.[c]?.sp;
     });
     await baseClear.call(this,initial,chain);
     if(hasSpecial)for(const k of expanded){
       const [r,c]=k.split(',').map(Number);
       damageRock(this,r,c);
     }
   };
   p.useBoosterAt=async function boosterGameplay3(r,c){
     const id=this.boosterMode;
     if(this.cell?.[r]?.[c]?.block==='void')return;
     if(id==='hammer'&&this.cell?.[r]?.[c]?.block==='rock'){
       if(this.busy||this.inventory.hammer<=0||!Campaign.consume('hammer'))return;
       this.inventory.hammer--;this.boosterMode=null;this.busy=true;
       try{
         this.boosterHint?.setText('');damageRock(this,r,c);
         await this.fallRefill();await this.resolve();
         this.refreshBoosters();this.updateHud();this.busy=false;this.endCheck();this.scheduleHint();
       }catch(error){console.error('[berries] rock hammer',error);this.busy=false;this.drawAll();this.updateHud()}
       return;
     }
     this._cycle3Fan=id==='fan';
     try{return await baseUseBoosterAt.call(this,r,c)}
     finally{this._cycle3Fan=false}
   };
   p.resolve=async function resolveGameplay3(){
     await baseResolve.call(this);
     if(!this.cfg.madnessStage||this._cycle3?.madnessBusy||this.allDone()||!this.scene?.isActive?.())return;
     this._cycle3.madnessBusy=true;
     try{
       const stage=this.cfg.madnessStage;
       const count=Math.min(3,stage),blocked=Core.blockedCells(this.cell);
       for(let k=0;k<count;k++){
         if(!this.scene?.isActive?.()||this.allDone())break;
         const selection=Core.chooseMadness(this.board,blocked,stage);
         if(!selection)break;
         const {a,b}=selection,A=this.spr[a.r][a.c],B=this.spr[b.r][b.c];
         if(!A||!B)break;
         await Promise.all([this.move(A,b),this.move(B,a)]);
         if(!this.scene?.isActive?.())break;
         this.swapData(a,b);this.spr[a.r][a.c]=B;this.spr[b.r][b.c]=A;
         rebind(this,A,b.r,b.c);rebind(this,B,a.r,a.c);
         if(this.groups().length)await baseResolve.call(this);
         else if(!this.hasMove())await this.autoShuffle();
       }
     }catch(error){console.error('[berries] berry madness',error);this.drawAll(false,false)}
     finally{if(this._cycle3)this._cycle3.madnessBusy=false}
   };
   return true;
 }
 let count=0;
 const timer=setInterval(()=>{count++;if(install()||count>300)clearInterval(timer)},20);
})();
