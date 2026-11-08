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
   // Load the approved stone atlas only on a level that contains rocks.
   // Other levels and the first launch remain unaffected.
   const basePreload=p.preload;
   p.preload=function preloadGameplay3(){
     basePreload?.call(this);
     if(this.cfg?.rocks?.length&&!this.textures.exists('berries_boulder3')){
       this.load.atlas('berries_boulder3',
         'assets/blockers/boulder_atlas_game.png',
         'assets/blockers/boulder_atlas_game.json');
     }
   };
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
     // User-approved transparent texture atlas, keeping a Graphics fallback for QA.
     const hp=ce.rockHp||1;
     if(this.textures.exists('berries_boulder3')){
       const rock=imageFit(this.add.image(point.x,point.y,'berries_boulder3',
         hp>1?'boulder_hp2':'boulder_hp1'),CELL*.92).setDepth(4);
       rock.setData({r,c,sx:rock.scaleX,sy:rock.scaleY,ang:0});
       rebind(this,rock,r,c);this.spr[r][c]=rock;
       return;
     }
     const g=this.add.graphics({x:point.x,y:point.y}).setDepth(4);
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
     if(this.cfg.dropAcorns){
       // Clearly show the destination for acorns, without obstructing bottom-row taps.
       const exits=[...new Set(this.cfg.ac.map(([,c])=>c))];
       for(const c of exits){
         const x=this.pos(R-1,c).x,y=BY+R*CELL+14;
         const arrow=this.add.triangle(x,y,0,-10,-13,-10,0,12,0xd9b268,.93)
           .setStrokeStyle(2,0x654820,.9).setDepth(10);
         this.tweens.add({targets:arrow,alpha:{from:.55,to:1},duration:950,yoyo:true,repeat:-1});
       }
       const tip=this.add.text(285,835,'Жёлуди — к стрелкам внизу!',{
         fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'23px',fontStyle:'bold',
         color:'#fff2c3',stroke:'#4e3729',strokeThickness:5,align:'center',
         wordWrap:{width:340}}).setOrigin(.5).setDepth(20);
       this.tweens.add({targets:tip,alpha:0,delay:3700,duration:400,onComplete:()=>tip.destroy()});
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
     // Tiny idle movements are purely cosmetic: no logical swaps and no timers during cascades.
     this.time.addEvent({delay:2300,loop:true,callback:()=>{
       if(this.busy||this.sel||window.BerriesLifecycle.paused)return;
       const candidates=[];
       for(let r=0;r<R;r++)for(let c=0;c<C;c++){
         const sp=this.spr[r][c],ce=this.cell[r][c],it=this.board[r][c];
         if(it&&!it.sp&&!ce.block&&!ce.ice&&sp?.active&&!this.tweens.isTweening(sp))candidates.push(sp);
       }
       if(!candidates.length)return;
       const s=candidates[Math.floor(Math.random()*candidates.length)];
       const sx=s.getData('sx')||s.scaleX,sy=s.getData('sy')||s.scaleY,angle=s.getData('ang')||0;
       this.tweens.add({targets:s,scaleX:sx*1.045,scaleY:sy*.96,
         angle:angle+(Math.random()>.5?2.5:-2.5),duration:155,yoyo:true,
         ease:'Sine.inOut',onComplete:()=>{if(s.active)s.setAngle(angle)}});
     }});
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
     const destroyed=ce.rockHp===0,at=scene.pos(r,c);
     const textured=scene.textures.exists('berries_boulder3');
     if(destroyed)ce.block=null;
     scene.render(r,c);
     // Nonblocking feedback: none of these tweens delays game resolution or combo.
     if(textured){
       const hit=scene.add.circle(at.x,at.y,9,0xffe49c,.9).setDepth(15);
       scene.tweens.add({targets:hit,scale:5,alpha:0,duration:210,onComplete:()=>hit.destroy()});
       const rock=scene.spr?.[r]?.[c];
       if(!destroyed&&rock?.active){
         const sx=rock.scaleX,sy=rock.scaleY;
         scene.tweens.add({targets:rock,scaleX:sx*1.05,scaleY:sy*.94,
           angle:{from:-3,to:0},duration:150,ease:'Back.out',
           onComplete:()=>{if(rock.active)rock.setScale(sx,sy).setAngle(0)}});
       }
       if(destroyed){
         const atlas='berries_boulder3';
         const overlay=(frame,size,ms,shift=0)=>{
           const part=scene.add.image(at.x,at.y,atlas,frame).setDepth(15).setAlpha(.97);
           imageFit(part,size);
           scene.tweens.add({targets:part,scaleX:part.scaleX*(1+shift),
             scaleY:part.scaleY*(1+shift),alpha:0,duration:ms,
             ease:'Sine.out',onComplete:()=>part.destroy()});
         };
         overlay('rock_shards_group',CELL*1.18,480,.32);
         overlay('dust_cloud_group',CELL*1.17,580,.55);
         overlay('moss_leaves_group',CELL*1.05,540,.47);
         for(let i=0;i<6;i++){
           const fragment=scene.add.image(at.x,at.y,atlas,
             'rock_shard_0'+(i+1)).setDepth(16);
           imageFit(fragment,CELL*(.12+Math.random()*.13));
           const angle=(i/6)*Math.PI*2+Math.random()*.2;
           scene.tweens.add({targets:fragment,
             x:at.x+Math.cos(angle)*CELL*(.65+Math.random()*.35),
             y:at.y+Math.sin(angle)*CELL*(.5+Math.random()*.30),
             angle:Math.random()*200-100,alpha:0,
             duration:430+Math.random()*200,ease:'Cubic.out',
             onComplete:()=>fragment.destroy()});
         }
       }else{
         const dust=scene.add.image(at.x,at.y,'berries_boulder3','dust_puff_02').setDepth(15);
         imageFit(dust,CELL*.44);
         scene.tweens.add({targets:dust,y:at.y-CELL*.18,scaleX:dust.scaleX*1.5,
           scaleY:dust.scaleY*1.5,alpha:0,duration:320,onComplete:()=>dust.destroy()});
       }
     }else{
       for(let i=0;i<9;i++){
         const angle=i/9*Math.PI*2;
         const x=at.x+Math.cos(angle)*(23+Math.random()*23);
         const y=at.y+Math.sin(angle)*(20+Math.random()*23);
         const bit=scene.add.circle(at.x,at.y,3+Math.random()*4,
           i%3===0?0x718a58:0x89958d,.94).setDepth(14);
         scene.tweens.add({targets:bit,x,y,alpha:0,scale:0,
           duration:280+Math.random()*180,onComplete:()=>bit.destroy()});
       }
     }
     scene.fx?.crack?.();
     return true;
   }
   p.clearCells=async function clearGameplay3(initial,chain=1){
     const source=new Set(initial),expanded=this.expandSpecials(new Set(source));
     const hasSpecial=this._cycle3Fan||[...source].some(k=>{
       const [r,c]=k.split(',').map(Number);return !!this.board?.[r]?.[c]?.sp;
     });
     // The fan marks exactly one clearing wave, not subsequent natural cascades.
     if(this._cycle3Fan)this._cycle3Fan=false;
     await baseClear.call(this,initial,chain);
     if(hasSpecial)for(const k of expanded){
       const [r,c]=k.split(',').map(Number);
       damageRock(this,r,c);
     }
   };
   p.useBoosterAt=async function boosterGameplay3(r,c){
     const id=this.boosterMode;
     if(this.cell?.[r]?.[c]?.block==='void')return;
     if(id==='hammer'&&(this.cell?.[r]?.[c]?.block==='rock'||this.cell?.[r]?.[c]?.acorn)){
       if(this.busy||this.inventory.hammer<=0||!Campaign.consume('hammer'))return;
       this.inventory.hammer--;this.boosterMode=null;this.busy=true;
       try{
         this.boosterHint?.setText('');
         if(this.cell[r][c].acorn){
           this.cell[r][c].acorn=false;
           this.bumpGoal('acorn',null,1);
           this.fx?.acornCrunch?.();
           this.render(r,c);
         }else damageRock(this,r,c);
         await this.fallRefill();await this.resolve();
         this.refreshBoosters();this.updateHud();this.busy=false;this.endCheck();this.scheduleHint();
       }catch(error){console.error('[berries] obstacle hammer',error);this.busy=false;this.drawAll();this.updateHud()}
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
   // Temporary code-driven cosmetic variants: special berry rules never change.
   const baseSpecialFx=p.specialCreateFx;
   p.specialCreateFx=function themedSpecialFx(at){
     baseSpecialFx.call(this,at);
     const color=this.cfg?.zone==='frost_queen'?0xa8edff:
       this.cfg?.zone==='alchemist'?0xba83e8:0xffd777;
     const point=this.pos(at.r,at.c);
     for(let i=0;i<7;i++){
       const angle=(i/7)*Math.PI*2;
       const star=this.add.star(point.x,point.y,4,3,8,color,.92).setDepth(14);
       this.tweens.add({targets:star,x:point.x+Math.cos(angle)*60,
         y:point.y+Math.sin(angle)*55,scale:0,alpha:0,
         duration:360,onComplete:()=>star.destroy()});
     }
   };
   const baseWin=p.win;
   p.win=function winGameplay3(){
     if(!this.busy&&this.allDone()){
       try{sessionStorage.setItem('berries_cycle3_last_won',String(this.no))}catch{}
     }
     return baseWin.call(this);
   };
   const mapScene=window.__berriesGame?.scene?.keys?.Map;
   const mapProto=mapScene&&Object.getPrototypeOf(mapScene);
   if(mapProto?.__berriesMapV11&&!mapProto.__berriesCycle3){
     mapProto.__berriesCycle3=true;
     const baseMap=mapProto.create;
     mapProto.create=function mapWithRoyalTrail(){
       baseMap.call(this);
       const Trail=window.BerriesRoyalTrail;
       if(!Trail)return;
       // Scene decorations are independent of the base map bitmap and level markers.
       for(const z of Trail.ZONES.slice(1)){
         const location=z.id==='frost_queen'?{x:400,y:208}:{x:1160,y:206};
         const sign=this.add.text(location.x,location.y,z.title,{
           fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'25px',fontStyle:'bold',
           color:z.id==='frost_queen'?'#e4f7ff':'#f0dfff',
           stroke:'#234032',strokeThickness:5
         }).setOrigin(.5).setDepth(6);
         const glow=this.add.ellipse(location.x,location.y,sign.width+38,55,z.accent,.14).setDepth(5);
         this.tweens.add({targets:glow,alpha:{from:.13,to:.29},duration:1700,yoyo:true,repeat:-1});
       }
       let level=0;
       try{level=Number(sessionStorage.getItem('berries_cycle3_last_won')||0);
         sessionStorage.removeItem('berries_cycle3_last_won')}catch{}
       const quip=Trail.levelStory(level);
       if(quip){
         const banner=this.add.container(W/2,160).setDepth(65);
         const plaque=this.add.rectangle(0,0,1100,78,0x1e392d,.92).setStrokeStyle(3,0xe5cc81,.9);
         const words=this.add.text(0,0,quip,{fontFamily:'Trebuchet MS, Arial, sans-serif',
           fontSize:'28px',fontStyle:'bold',color:'#fff5dc',align:'center',
           wordWrap:{width:1000}}).setOrigin(.5);
         banner.add([plaque,words]);
         this.tweens.add({targets:banner,alpha:0,delay:2400,duration:350,
           onComplete:()=>banner.destroy()});
       }
     };
   }
   return true;
 }
 let count=0;
 const timer=setInterval(()=>{count++;if(install()||count>300)clearInterval(timer)},20);
})();
