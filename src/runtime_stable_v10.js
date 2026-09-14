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


  p.hud=function hudStable(){
    fit(this.add.image(W/2,64,'plevel'),560,125);
    this.add.text(W/2,64,`УРОВЕНЬ ${this.no}`,{fontFamily:FONT,fontSize:'42px',fontStyle:'bold',color:'#fff0b7',stroke:'#6a3219',strokeThickness:7}).setOrigin(.5);
    this.mt=this.add.text(1510,64,'',{fontFamily:FONT,fontSize:'32px',fontStyle:'bold',color:'#fff3c4',stroke:'#5b2d18',strokeThickness:5}).setOrigin(.5);
    this.st=this.add.text(1695,64,'',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff0b7',stroke:'#5b2d18',strokeThickness:4}).setOrigin(.5);

    fit(this.add.image(285,410,'pgoals'),430,570);
    this.gt=this.goals.map((goal,index)=>this.add.text(285,290+index*102,'',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',align:'center',color:'#49331f',stroke:'#fff0cf',strokeThickness:1,wordWrap:{width:300}}).setOrigin(.5));

    fit(this.add.image(1640,365,'pboost'),375,445);
    this.boosterButtons={};
    [['hammer',1640,274],['shuffle',1640,364],['fan',1640,454]].forEach(([id,x,y])=>{
      const im=fit(this.add.image(x,y,id),68,68).setInteractive({useHandCursor:true});
      const tx=this.add.text(x+82,y,'',{fontFamily:FONT,fontSize:'22px',fontStyle:'bold',color:'#fff4ca',stroke:'#4b2915',strokeThickness:4}).setOrigin(.5);
      im.on('pointerdown',()=>this.pickBooster(id));this.boosterButtons[id]={im,tx};
    });
    this.boosterHint=this.add.text(1640,537,'',{fontFamily:FONT,fontSize:'18px',fontStyle:'bold',align:'center',color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,wordWrap:{width:320}}).setOrigin(.5);
    this.king=fit(this.add.image(1650,760,'king_idle'),330,330);this.kingBaseY=760;this.kingBaseScale=this.king.scaleX;

    const boardFrame=this.add.graphics();boardFrame.fillStyle(0x302014,.72);boardFrame.fillRoundedRect(BX-25,BY-25,C*CELL+50,R*CELL+50,32);boardFrame.lineStyle(6,0xd2a45c,.85);boardFrame.strokeRoundedRect(BX-25,BY-25,C*CELL+50,R*CELL+50,32);
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){boardFrame.fillStyle((r+c)%2?0x4a6d3c:0x557b43,.68);boardFrame.fillRoundedRect(BX+c*CELL+4,BY+r*CELL+4,CELL-8,CELL-8,16)}

    const addTop=()=>{
      if(this.__topUiAdded)return;this.__topUiAdded=true;
      const back=fit(this.add.image(92,66,'ui_back'),62,62).setDepth(20).setInteractive({useHandCursor:true});
      back.on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});
      fit(this.add.image(1285,64,'ui_life'),50,50).setDepth(20);
      this.add.text(1320,64,'5',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);
      let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
      fit(this.add.image(1780,64,'ui_coin'),46,46).setDepth(20);
      this.add.text(1820,64,String(save.coins||0),{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);
      const settings=fit(this.add.image(1880,64,'ui_settings'),48,48).setDepth(20).setInteractive({useHandCursor:true});
      settings.on('pointerdown',()=>this.fx.click());
      fit(this.add.image(285,850,'panel_championat'),330,150).setDepth(2);
    };
    if(this.textures.exists('ui_back'))addTop();
    else{
      ['ui_back','ui_life','ui_coin','ui_settings'].forEach(key=>this.load.image(key,`assets/ui/icons/${key}.png`));
      this.load.image('panel_championat','assets/ui/panels/panel_championat.png');
      this.load.once('complete',addTop);this.load.start();
    }
  };

  p.resultPopup=function resultPopupStable(win){
    const shade=this.add.rectangle(W/2,H/2,W,H,0x061008,.76).setDepth(30);
    const box=this.add.container(W/2,H/2).setDepth(31);
    box.add(fit(this.add.image(0,0,win?'popup_win':'popup_lose'),860,700));
    const hit=(x,y,w,h,cb)=>{
      const area=this.add.rectangle(x,y,w,h,0xffffff,.001).setInteractive({useHandCursor:true});
      box.add(area);area.on('pointerdown',()=>{this.fx.click();cb(area)});return area;
    };
    hit(292,-226,78,78,()=>this.scene.start('Map'));
    if(win){
      hit(0,112,455,96,async area=>{
        if(this.winRewardDoubled)return;
        area.disableInteractive();
        const ok=await window.BerriesYandex?.showRewardedVideo?.();
        if(ok){
          const reward=this.no<=5?80:this.no<=10?100:this.no<=15?120:this.no<=20?140:this.no<=25?160:180;
          let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
          save.coins=(save.coins||0)+reward;localStorage.setItem('berries_vs_04',JSON.stringify(save));window.BerriesYandex?.saveCloudData?.(save,false);
          this.winRewardDoubled=true;this.fx.reward();
        }else area.setInteractive({useHandCursor:true});
      });
      hit(0,235,350,92,()=>{
        const levels=[1,6,11,16,21,30],index=levels.indexOf(this.no),next=index>=0?levels[index+1]:null;
        if(next)this.scene.start('Play',{n:next});else this.scene.start('Map');
      });
    }else{
      hit(0,90,465,104,async area=>{
        if(this.continueUsed)return;
        area.disableInteractive();
        const ok=await window.BerriesYandex?.showRewardedVideo?.();
        if(ok){
          this.continueUsed=true;this.moves+=5;this.fx.reward();shade.destroy();box.destroy();this.busy=false;
          window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();
          this.kingAnim('idle');this.updateHud();this.scheduleHint();
        }else area.setInteractive({useHandCursor:true});
      });
      hit(-150,223,260,82,()=>this.scene.restart({n:this.no}));
      hit(150,223,260,82,()=>this.scene.start('Map'));
    }
    box.setScale(.84).setAlpha(0);
    this.tweens.add({targets:box,scale:1,alpha:1,duration:250,ease:'Back.out'});
  };

  const basePickBooster=p.pickBooster;
  p.pickBooster=function(id){
    basePickBooster.call(this,id);
    if(!this.boosterMode)return;
    const label=this.boosterMode==='hammer'?'МОЛОТОК — выбери одну клетку':this.boosterMode==='fan'?'ВЕЕР — выбери ряд':'';
    if(label)this.boosterHint.setText(label);
  };

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
