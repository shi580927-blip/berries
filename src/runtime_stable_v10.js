(() => {
'use strict';

const W=1920,H=1080,R=8,C=8,CELL=96,BX=576,BY=150;
const TYPES=['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
const FONT='Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fit=(img,maxW,maxH)=>{const s=Math.min(maxW/img.width,maxH/img.height);img.setScale(s);return img};

function getProto(){
  const scene=window.__berriesGame?.scene?.keys?.Play;
  return scene?Object.getPrototypeOf(scene):null;
}

function install(){
  const p=getProto();
  if(!p||p.__berriesStableV10)return false;
  p.__berriesStableV10=true;

  p.assertBoard=function(stage){
    const seen=new Set();
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const anchored=!!(this.cell[r][c].block||this.cell[r][c].ice);
      const item=this.board[r][c],sprite=this.spr[r][c];
      if(!anchored&&!item)throw new Error(`empty movable cell at ${r},${c} after ${stage}`);
      if(item&&!sprite)throw new Error(`missing sprite at ${r},${c} after ${stage}`);
      if(sprite){
        if(seen.has(sprite))throw new Error(`duplicate sprite reference after ${stage}`);
        seen.add(sprite);
        sprite.setData('r',r);sprite.setData('c',c);
      }
    }
    return true;
  };

  p.fallRefill=async function fallRefillStable(){
    const animations=[];
    const available=TYPES.slice(0,this.cfg.n);
    const rebind=(sprite,r,c)=>{
      if(!sprite)return;
      sprite.setData('r',r);sprite.setData('c',c);
      sprite.removeAllListeners('pointerdown');
      sprite.setInteractive({useHandCursor:true});
      sprite.on('pointerdown',()=>this.tap(r,c));
    };

    for(let c=0;c<C;c++){
      let bottom=R-1;
      while(bottom>=0){
        if(this.cell[bottom][c].block||this.cell[bottom][c].ice){bottom--;continue}
        let top=bottom;
        while(top-1>=0&&!this.cell[top-1][c].block&&!this.cell[top-1][c].ice)top--;

        const survivors=[];
        for(let r=bottom;r>=top;r--){
          if(this.board[r][c])survivors.push({item:this.board[r][c],sprite:this.spr[r][c],from:r});
        }
        for(let r=top;r<=bottom;r++){this.board[r][c]=null;this.spr[r][c]=null}

        let target=bottom;
        for(const entry of survivors){
          const row=target--;
          this.board[row][c]=entry.item;this.spr[row][c]=entry.sprite;
          const sprite=entry.sprite;
          if(!sprite)throw new Error(`survivor without sprite at ${entry.from},${c}`);
          rebind(sprite,row,c);
          const pos=this.pos(row,c),distance=Math.max(0,row-entry.from);
          if(distance){
            const angle=sprite.getData('ang')??sprite.angle??0;
            animations.push(new Promise((resolve,reject)=>{
              if(!this.scene?.isActive?.()){resolve();return}
              this.tweens.add({
                targets:sprite,x:pos.x,y:pos.y,angle,duration:180+distance*85,ease:'Cubic.in',
                onComplete:resolve,onStop:resolve
              });
            }));
          }
        }

        let spawn=0;
        while(target>=top){
          const row=target--;
          this.board[row][c]={id:Phaser.Utils.Array.GetRandom(available),sp:null};
          this.render(row,c,false,false);
          const sprite=this.spr[row][c];
          if(!sprite)throw new Error(`new berry sprite was not created at ${row},${c}`);
          rebind(sprite,row,c);
          const pos=this.pos(row,c),angle=sprite.getData('ang')??sprite.angle??0;
          const sx=sprite.getData('sx')||sprite.scaleX,sy=sprite.getData('sy')||sprite.scaleY;
          spawn++;
          sprite.x=pos.x;
          sprite.y=this.pos(top,c).y-CELL*.72-(spawn-1)*12;
          sprite.alpha=.02;
          sprite.setScale(sx*.78,sy*.78);
          animations.push(new Promise(resolve=>{
            if(!this.scene?.isActive?.()){resolve();return}
            this.tweens.add({
              targets:sprite,y:pos.y,alpha:1,scaleX:sx,scaleY:sy,angle,
              duration:300+spawn*45,ease:'Cubic.in',onComplete:resolve,onStop:resolve
            });
          }));
        }
        bottom=top-1;
      }
    }
    await Promise.all(animations);
    if(!this.scene?.isActive?.())return;
    this.assertBoard('refill');
    await pause(45);
  };

  p.resolve=async function resolveStable(){
    const MAX_CHAINS=24;
    let chain=0;
    while(this.scene?.isActive?.()&&chain<MAX_CHAINS){
      const groups=this.groups();
      if(!groups.length)break;
      chain++;
      const create=this.findCreation(groups),cells=new Set();
      groups.forEach(group=>group.p.forEach(q=>cells.add(`${q.r},${q.c}`)));
      if(create)cells.delete(`${create.at.r},${create.at.c}`);
      await this.clearCells(cells,chain);
      if(create&&this.board?.[create.at.r]?.[create.at.c]){
        this.board[create.at.r][create.at.c].sp=create.sp;
        this.render(create.at.r,create.at.c);
        this.specialCreateFx(create.at);
        this.showSpecialInfo?.(create.sp,3000);
        this.kingReact?.(chain>=2?'celebrate':'point',650);
      }
      await this.fallRefill();
      await pause(70);
    }
    if(chain===MAX_CHAINS){
      for(let attempt=0;attempt<60;attempt++){
        this.shuffleBoard();
        if(!this.groups().length&&this.hasMove())break;
      }
      this.drawAll(false,false);
      this.assertBoard('cascade safety shuffle');
    }
    if(!this.hasMove())await this.autoShuffle();
    this.assertBoard('resolve');
  };

  const baseSwap=p.swap;
  p.swap=async function swapStable(a,b){
    const sa=this.board?.[a.r]?.[a.c]?.sp;
    const sb=this.board?.[b.r]?.[b.c]?.sp;
    const direct=(sa&&sa!=='rainbow')||(sb&&sb!=='rainbow');
    if(!direct){
      try{return await baseSwap.call(this,a,b)}
      catch(error){
        console.error('[berries] normal swap failed; restarting level safely',error);
        this.busy=true;
        this.scene.restart({n:this.no});
      }
      return;
    }

    this.busy=true;this.hideHint?.();this.last=b;this.fx?.swap?.();
    try{
      const A=this.spr[a.r][a.c],B=this.spr[b.r][b.c];
      await Promise.all([this.move(A,b),this.move(B,a)]);
      if(!this.scene?.isActive?.())return;
      this.swapData(a,b);
      this.spr[a.r][a.c]=B;this.spr[b.r][b.c]=A;
      if(A){A.setData('r',b.r);A.setData('c',b.c)}
      if(B){B.setData('r',a.r);B.setData('c',a.c)}
      this.moves--;
      const fire=new Set();
      if(sa)fire.add(`${b.r},${b.c}`);
      if(sb)fire.add(`${a.r},${a.c}`);
      this.kingReact?.('celebrate',850);
      await this.clearCells(fire,2);
      await this.fallRefill();
      await this.resolve();
      if(!this.scene?.isActive?.())return;
      this.updateHud();this.endCheck();this.scheduleHint?.();
    }catch(error){
      console.error('[berries] special swap failed; restarting level safely',error);
      this.scene.restart({n:this.no});
      return;
    }
    if(this.scene?.isActive?.()&&!this.allDone?.()&&this.moves>0)this.busy=false;
  };

  p.hideHint=function hideHintStable(){
    clearTimeout(this.hintCleanupTimer);
    for(const obj of this.hintObjs||[]){
      try{this.tweens.killTweensOf(obj);obj.destroy?.()}catch{}
    }
    this.hintObjs=[];
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const sprite=this.spr?.[r]?.[c];if(!sprite)continue;
      sprite.setAlpha(1);
      if(this.sel?.r===r&&this.sel?.c===c)continue;
      const sx=sprite.getData?.('sx'),sy=sprite.getData?.('sy'),angle=sprite.getData?.('ang');
      if(sx&&sy){this.tweens.killTweensOf(sprite);sprite.setScale(sx,sy)}
      if(Number.isFinite(angle))sprite.setAngle(angle);
    }
  };

  p.showHint=function showHintStable(){
    const move=this.findHintMove?.();if(!move)return;
    this.hideHint();this.hintObjs=[];
    move.forEach((q,index)=>{
      const sprite=this.spr?.[q.r]?.[q.c];if(!sprite)return;
      const ring1=this.add.circle(sprite.x,sprite.y,CELL*.43,0xffd65a,.015).setStrokeStyle(5,0xffd75a,.95).setDepth(8);
      const ring2=this.add.circle(sprite.x,sprite.y,CELL*.50,0xffef9a,.005).setStrokeStyle(2,0xffffc7,.8).setDepth(8);
      const glow=this.add.circle(sprite.x,sprite.y,CELL*.37,0xffc928,.10).setDepth(2.8);
      this.hintObjs.push(ring1,ring2,glow);
      this.tweens.add({targets:ring1,angle:360,scale:{from:.94,to:1.10},alpha:{from:.98,to:.28},duration:720+index*80,yoyo:true,repeat:3,ease:'Sine.inOut'});
      this.tweens.add({targets:ring2,angle:-360,scale:{from:1.02,to:1.18},alpha:{from:.75,to:.12},duration:880+index*70,yoyo:true,repeat:2,ease:'Sine.inOut'});
      this.tweens.add({targets:glow,alpha:{from:.18,to:.04},scale:{from:.96,to:1.09},duration:560,yoyo:true,repeat:4,ease:'Sine.inOut'});
    });
    this.hintCleanupTimer=setTimeout(()=>{
      if(!this.scene?.isActive?.())return;
      this.hideHint();this.scheduleHint?.();
    },3100);
  };

  p.showSpecialInfo=function(sp,autoHide=3100){
    const label=sp==='line_h'?'ПОЛОСАТАЯ • поменяй с соседней ягодой → очистит РЯД':
      sp==='line_v'?'ПОЛОСАТАЯ • поменяй с соседней ягодой → очистит КОЛОНКУ':
      sp==='bomb'?'БОМБА • поменяй с соседней ягодой → взрыв 3×3':
      sp==='rainbow'?'РАДУГА • поменяй с ягодой → уберёт весь её цвет':'';
    if(!label)return;
    if(!this.specialInfoText)this.specialInfoText=this.add.text(W/2,955,'',{
      fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff7c8',stroke:'#512715',
      strokeThickness:6,backgroundColor:'#3a2117dd',padding:{x:22,y:12},align:'center'
    }).setOrigin(.5).setDepth(25);
    clearTimeout(this.specialInfoTimer);
    this.specialInfoText.setText(label).setAlpha(1).setScale(.88);
    this.tweens.add({targets:this.specialInfoText,scale:1,duration:170,ease:'Back.out'});
    this.specialInfoTimer=setTimeout(()=>this.specialInfoText?.scene&&this.tweens.add({targets:this.specialInfoText,alpha:0,duration:220}),autoHide);
  };

  const baseSelect=p.select;
  p.select=function(r,c){baseSelect.call(this,r,c);const sp=this.board?.[r]?.[c]?.sp;if(sp)this.showSpecialInfo(sp,3200)};

  p.toggleDebugGrid=function(force){
    const enabled=force??!this.__debugGrid;
    this.__debugGrid?.destroy?.();this.__debugGrid=null;
    if(!enabled)return;
    const container=this.add.container(0,0).setDepth(1000);
    const g=this.add.graphics();
    g.fillStyle(0x001018,.12);g.fillRect(0,0,W,H);
    for(let x=0;x<=W;x+=96){g.lineStyle(x%480===0?3:1,x%480===0?0xffd65a:0xffffff,x%480===0?.8:.28);g.lineBetween(x,0,x,H)}
    for(let y=0;y<=H;y+=90){g.lineStyle(y%180===0?3:1,y%180===0?0xffd65a:0xffffff,y%180===0?.8:.28);g.lineBetween(0,y,W,y)}
    g.lineStyle(5,0x65ffab,.95);g.strokeRect(48,48,W-96,H-96);
    g.lineStyle(5,0xff7a7a,.95);g.strokeRect(BX,BY,C*CELL,R*CELL);
    container.add(g);
    for(let x=0;x<=W;x+=96)container.add(this.add.text(x+4,4,String(x),{fontFamily:FONT,fontSize:'16px',color:'#ffffff',backgroundColor:'#000000aa'}));
    for(let y=90;y<=H;y+=90)container.add(this.add.text(4,y+2,String(y),{fontFamily:FONT,fontSize:'16px',color:'#ffffff',backgroundColor:'#000000aa'}));
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const q=this.pos(r,c);
      container.add(this.add.text(q.x,q.y,`${r},${c}`,{fontFamily:FONT,fontSize:'15px',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(.5));
    }
    container.add(this.add.text(W-18,H-18,'G — скрыть сетку',{fontFamily:FONT,fontSize:'20px',color:'#fff3a6',backgroundColor:'#142016dd',padding:{x:10,y:6}}).setOrigin(1));
    this.__debugGrid=container;
  };

  const baseCreate=p.create;
  p.create=function createStable(){
    baseCreate.call(this);
    this.input.keyboard?.on('keydown-G',()=>this.toggleDebugGrid());
    if(new URLSearchParams(location.search).get('debugGrid')==='1')this.time.delayedCall(50,()=>this.toggleDebugGrid(true));
  };

  return true;
}

let attempts=0;
const timer=setInterval(()=>{attempts++;if(install()||attempts>250)clearInterval(timer)},20);
})();
