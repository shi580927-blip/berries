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
        console.error('[berries] normal swap failed',error);
        try{this.drawAll(false,false);this.updateHud?.()}catch{}
        this.busy=false;
        this.endCheck?.();
        if(this.moves>0&&!this.allDone?.())this.scheduleHint?.();
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
      this.updateHud();
      this.busy=false;
      this.endCheck();
      if(this.scene?.isActive?.()&&!this.allDone?.()&&this.moves>0)this.scheduleHint?.();
    }catch(error){
      console.error('[berries] special swap failed',error);
      try{this.drawAll(false,false);this.updateHud?.()}catch{}
      this.busy=false;
      this.endCheck?.();
      if(this.scene?.isActive?.()&&this.moves>0&&!this.allDone?.())this.scheduleHint?.();
    }
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


  p.hud=function hudPolished(){
    // Board first: production frame replaces the temporary programmatic brown rectangle.
    fit(this.add.image(BX+C*CELL/2,BY+R*CELL/2,'pboard'),C*CELL+82,R*CELL+82).setDepth(1);
    const boardCells=this.add.graphics().setDepth(1.2);
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      boardCells.fillStyle((r+c)%2?0x426838:0x507943,.58);
      boardCells.fillRoundedRect(BX+c*CELL+5,BY+r*CELL+5,CELL-10,CELL-10,18);
      boardCells.lineStyle(1,0xffefbd,.10);
      boardCells.strokeRoundedRect(BX+c*CELL+6,BY+r*CELL+6,CELL-12,CELL-12,17);
    }

    // Top hierarchy: navigation, level, progress, resources, settings.
    fit(this.add.image(W/2,62,'plevel'),510,112).setDepth(10);
    this.add.text(W/2,58,`УРОВЕНЬ ${this.no}`,{fontFamily:FONT,fontSize:'39px',fontStyle:'bold',color:'#fff4c2',stroke:'#6a3219',strokeThickness:7}).setOrigin(.5).setDepth(11);

    fit(this.add.image(1258,62,'plives'),240,92).setDepth(10);
    fit(this.add.image(1538,62,'pcoins'),265,92).setDepth(10);
    this.add.text(1276,61,'5',{fontFamily:FONT,fontSize:'28px',fontStyle:'bold',color:'#fff8d8',stroke:'#5a2e18',strokeThickness:5}).setOrigin(.5).setDepth(12);
    let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
    this.coinText=this.add.text(1560,61,String(save.coins||0),{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff8d8',stroke:'#5a2e18',strokeThickness:5}).setOrigin(.5).setDepth(12);

    const back=fit(this.add.image(76,62,'ui_back'),64,64).setDepth(15).setInteractive({useHandCursor:true});
    back.on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});
    const settings=fit(this.add.image(1845,62,'ui_settings'),58,58).setDepth(15).setInteractive({useHandCursor:true});
    settings.on('pointerdown',()=>{this.fx.click();this.tweens.add({targets:settings,angle:90,duration:220,yoyo:true})});

    // Compact progress ribbon above the board.
    fit(this.add.image(W/2,125,'pprogress'),700,82).setDepth(8);
    this.mt=this.add.text(770,124,'',{fontFamily:FONT,fontSize:'26px',fontStyle:'bold',color:'#fff4c4',stroke:'#5b2d18',strokeThickness:5}).setOrigin(.5).setDepth(9);
    this.st=this.add.text(1125,124,'',{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#fff4c4',stroke:'#5b2d18',strokeThickness:5}).setOrigin(.5).setDepth(9);

    // Left column.
    fit(this.add.image(286,383,'pgoals'),420,545).setDepth(3);
    this.gt=this.goals.map((goal,index)=>this.add.text(286,278+index*96,'',{fontFamily:FONT,fontSize:'24px',fontStyle:'bold',align:'center',color:'#49331f',stroke:'#fff4dc',strokeThickness:2,wordWrap:{width:292}}).setOrigin(.5).setDepth(5));
    fit(this.add.image(286,822,'pchamp'),350,165).setDepth(3);
    this.add.text(286,860,'СКОРО',{fontFamily:FONT,fontSize:'18px',fontStyle:'bold',color:'#fff1bd',stroke:'#5a2d17',strokeThickness:4}).setOrigin(.5).setDepth(5).setAlpha(.86);

    // Right column.
    fit(this.add.image(1642,348,'pboost'),365,430).setDepth(3);
    this.boosterButtons={};
    [['hammer',1605,268],['shuffle',1605,358],['fan',1605,448]].forEach(([id,x,y])=>{
      const halo=this.add.circle(x,y,43,0xffdc75,.08).setStrokeStyle(2,0xffedac,.25).setDepth(4);
      const im=fit(this.add.image(x,y,id),72,72).setDepth(5).setInteractive({useHandCursor:true});
      const tx=this.add.text(1702,y,'',{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#fff7d5',stroke:'#4b2915',strokeThickness:4}).setOrigin(.5).setDepth(6);
      im.on('pointerover',()=>this.tweens.add({targets:im,scaleX:im.getData('baseSX')*1.05,scaleY:im.getData('baseSY')*1.05,duration:100}));
      im.on('pointerout',()=>{this.tweens.killTweensOf(im);im.setScale(im.getData('baseSX'),im.getData('baseSY'));halo.setScale(1)});
      im.setData('baseSX',im.scaleX);im.setData('baseSY',im.scaleY);
      im.on('pointerdown',()=>{this.tweens.add({targets:im,scaleX:im.scaleX*.92,scaleY:im.scaleY*.92,duration:75,yoyo:true});this.pickBooster(id)});
      this.boosterButtons[id]={im,tx,halo};
    });
    this.boosterHint=this.add.text(1642,526,'',{fontFamily:FONT,fontSize:'17px',fontStyle:'bold',align:'center',color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,wordWrap:{width:315}}).setOrigin(.5).setDepth(6);

    this.king=fit(this.add.image(1645,785,'king_idle'),350,350).setDepth(4);
    this.kingBaseY=785;this.kingBaseScale=this.king.scaleX;
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

  const baseClearCells=p.clearCells;
  p.clearCells=async function clearCellsPolished(initial,chain=1){
    const beforeGoals=this.goals.map(g=>g.done);
    const keys=[...initial];
    keys.slice(0,18).forEach((key,index)=>{
      const [r,c]=String(key).split(',').map(Number),q=this.pos(r,c);
      this.time.delayedCall(index*10,()=>{
        const glow=this.add.circle(q.x,q.y,14,chain>=3?0xfff2a1:0xffc85a,.24).setDepth(11);
        this.tweens.add({targets:glow,scale:3.1,alpha:0,duration:260,ease:'Quad.out',onComplete:()=>glow.destroy()});
      });
    });
    await baseClearCells.call(this,initial,chain);
    this.goals.forEach((goal,index)=>{
      if(goal.done>beforeGoals[index]){
        const target=this.gt?.[index];
        if(target)this.tweens.add({targets:target,scale:1.12,duration:115,yoyo:true,ease:'Back.out'});
      }
    });
    if(chain>=2){
      const words=['СОЧНО!','КОМБО!','ЕЩЁ!','ВЕЛИКОЛЕПНО!'];
      const label=this.add.text(W/2,178,words[Math.min(chain-2,words.length-1)],{fontFamily:FONT,fontSize:chain>=4?'45px':'37px',fontStyle:'bold',color:'#fff5a8',stroke:'#743416',strokeThickness:8}).setOrigin(.5).setDepth(30).setScale(.65).setAlpha(0);
      this.tweens.add({targets:label,y:154,scale:1.08,alpha:1,duration:180,ease:'Back.out',yoyo:true,hold:210,onComplete:()=>label.destroy()});
    }
  };

  p.lineFx=function lineFxPolished(r,c,dir){
    const q=this.pos(r,c),horizontal=dir==='h';
    for(let i=0;i<3;i++){
      const beam=this.add.rectangle(q.x,q.y,horizontal?C*CELL:10,horizontal?10:R*CELL,0xfff1a0,.75-i*.16).setDepth(13);
      if(!horizontal)beam.setSize(10,R*CELL);
      beam.setScale(horizontal?.1:1,horizontal?1:.1);
      this.tweens.add({targets:beam,scaleX:1,scaleY:1,alpha:0,duration:260+i*55,ease:'Cubic.out',onComplete:()=>beam.destroy()});
    }
    this.burst(q.x,q.y,0xffe477,18);this.fx.whoosh();
  };

  p.bombFx=function bombFxPolished(r,c){
    const q=this.pos(r,c);
    [0xfff09a,0xffa43f,0xff6688].forEach((color,index)=>{
      const ring=this.add.circle(q.x,q.y,15,0xffffff,.02).setStrokeStyle(8-index*2,color,.95).setDepth(14);
      this.tweens.add({targets:ring,scale:5.8+index,alpha:0,duration:280+index*70,ease:'Quad.out',onComplete:()=>ring.destroy()});
    });
    this.burst(q.x,q.y,0xffc052,24);this.cameras.main.shake(125,.0045);this.fx.bomb();
  };

  p.rainbowFx=function rainbowFxPolished(){
    const x=BX+C*CELL/2,y=BY+R*CELL/2,colors=[0xff6f91,0xffd966,0x77e9a6,0x72cfff,0xc88cff];
    colors.forEach((color,index)=>{
      const ring=this.add.circle(x,y,28,0xffffff,.01).setStrokeStyle(7,color,.8).setDepth(14);
      this.tweens.add({targets:ring,scale:7+index*.7,alpha:0,duration:440+index*55,delay:index*25,ease:'Quad.out',onComplete:()=>ring.destroy()});
    });
    this.fx.whoosh();this.kingReact?.('celebrate',900);
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
  p.create=function createPolished(){
    baseCreate.call(this);
    this.input.keyboard?.on('keydown-G',()=>this.toggleDebugGrid());
    if(new URLSearchParams(location.search).get('debugGrid')==='1')this.time.delayedCall(50,()=>this.toggleDebugGrid(true));
    if(this.fx&&!this.fx.__juicyV11){
      this.fx.__juicyV11=true;
      this.fx.pop=(chain=1)=>{
        if(!this.fx.can?.('juicy_pop',34))return;
        const ctx=this.sound?.context;if(!ctx||this.fx.muted)return;
        if(ctx.state==='suspended')ctx.resume().catch(()=>{});
        const now=ctx.currentTime,pitch=1+Math.min(chain,5)*.035+(Math.random()-.5)*.06;
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(235*pitch,now);osc.frequency.exponentialRampToValueAtTime(92*pitch,now+.095);
        gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.105);
        osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.12);
        const len=Math.floor(ctx.sampleRate*.055),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);
        for(let i=0;i<len;i++){const fade=1-i/len;data[i]=(Math.random()*2-1)*fade*fade}
        const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),ng=ctx.createGain();
        src.buffer=buf;filter.type='lowpass';filter.frequency.value=1150+chain*90;
        ng.gain.setValueAtTime(.018,now);ng.gain.exponentialRampToValueAtTime(.0001,now+.06);
        src.connect(filter).connect(ng).connect(ctx.destination);src.start(now);src.stop(now+.065);
        if(chain>=3)this.fx.tone?.(720+chain*55,.075,.006,'sine',120,.025);
      };
    }
    this.ambientFx=[];
    for(let i=0;i<18;i++){
      const x=70+Math.random()*(W-140),y=150+Math.random()*(H-210);
      if(x>BX-70&&x<BX+C*CELL+70&&y>BY-70&&y<BY+R*CELL+70)continue;
      const mote=this.add.circle(x,y,1.5+Math.random()*2.2,Math.random()>.5?0xffed8b:0x9dffb8,.18+Math.random()*.3).setDepth(2);
      this.ambientFx.push(mote);
      this.tweens.add({targets:mote,x:x-25+Math.random()*50,y:y-35-Math.random()*45,alpha:{from:mote.alpha,to:.05},duration:2200+Math.random()*2800,yoyo:true,repeat:-1,delay:Math.random()*1600,ease:'Sine.inOut'});
    }
  };


  // Full level map: logo asset plus 30 stops following the existing winding trail.
  const mapScene=window.__berriesGame?.scene?.keys?.Map;
  const mapProto=mapScene?Object.getPrototypeOf(mapScene):null;
  if(mapProto&&!mapProto.__berriesMapV11){
    mapProto.__berriesMapV11=true;
    mapProto.create=function createMapPolished(){
      window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
      this.fx=new (window.__BerriesSfxClass||class{click(){}})(this);
      this.add.image(W/2,H/2,'mapbg').setDisplaySize(W,H);
      this.add.rectangle(W/2,58,760,116,0x163d24,.20).setDepth(1);
      fit(this.add.image(W/2,92,'logo'),620,245).setDepth(3);

      let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
      const done=new Set(save.done||[]);
      const anchors=[
        {n:1,x:330,y:790},{n:6,x:585,y:610},{n:11,x:820,y:760},
        {n:16,x:1080,y:548},{n:21,x:1355,y:684},{n:26,x:1530,y:500},{n:30,x:1660,y:335}
      ];
      const pointFor=n=>{
        for(let i=0;i<anchors.length-1;i++){
          const a=anchors[i],b=anchors[i+1];
          if(n>=a.n&&n<=b.n){
            const t=(n-a.n)/(b.n-a.n);
            return{x:Phaser.Math.Linear(a.x,b.x,t),y:Phaser.Math.Linear(a.y,b.y,t)+Math.sin(t*Math.PI)*(i%2?58:-58)};
          }
        }
        return anchors[anchors.length-1];
      };
      const highest=Math.max(1,...done);
      for(let n=1;n<=30;n++){
        const q=pointFor(n),completed=done.has(n),unlocked=n<=Math.max(2,highest+1);
        const key=completed?'lvl_completed':unlocked?'lvl_current':'lvl_locked';
        const size=n%5===0?102:78;
        const button=fit(this.add.image(q.x,q.y,key),size,size).setDepth(5);
        if(unlocked)button.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
          button.disableInteractive();this.tweens.add({targets:button,scaleX:button.scaleX*.9,scaleY:button.scaleY*.9,duration:80,yoyo:true,onComplete:()=>this.scene.start('Play',{n})});
        });
        this.add.text(q.x,q.y,String(n),{fontFamily:FONT,fontSize:n%5===0?'27px':'21px',fontStyle:'bold',color:unlocked?'#fff7d5':'#b9aa92',stroke:'#542a15',strokeThickness:5}).setOrigin(.5).setDepth(6);
        if(n===highest+1||n===1&&!done.size)this.tweens.add({targets:button,y:q.y-7,duration:950,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      }
      const king=fit(this.add.image(1740,785,'king_point'),285,285).setDepth(4);
      this.tweens.add({targets:king,y:770,angle:{from:-2,to:2},duration:1250,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    };
  }

  return true;
}

let attempts=0;
const timer=setInterval(()=>{attempts++;if(install()||attempts>250)clearInterval(timer)},20);
})();
