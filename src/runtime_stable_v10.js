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

  p.fallRefill=async function fallRefillStable() {
      const animations = [];
      const availableTypes = TYPES.slice(0, this.cfg.n);

      const rebind = (sprite, r, c) => {
        if (!sprite) return;
        sprite.setData('r', r);
        sprite.setData('c', c);
        sprite.removeAllListeners('pointerdown');
        sprite.setInteractive({ useHandCursor: true });
        sprite.on('pointerdown', () => this.tap(r, c));
      };

      for (let c = 0; c < C; c++) {
        let r = R - 1;
        while (r >= 0) {
          if (this.cell[r][c].block || this.cell[r][c].ice) {
            // Re-render the anchor once to guarantee exactly one berry + overlay.
            // The berry under ice stays in the same logical cell.
            this.render(r, c, false, false);
            r--;
            continue;
          }

          const bottom = r;
          while (r >= 0 && !this.cell[r][c].block && !this.cell[r][c].ice) r--;
          const top = r + 1;
          const hasAnchorAbove = top > 0 && (this.cell[top - 1][c].block || this.cell[top - 1][c].ice);

          const existing = [];
          for (let rr = bottom; rr >= top; rr--) {
            if (this.board[rr][c]) {
              existing.push({ item: this.board[rr][c], sprite: this.spr[rr][c], from: rr });
            }
          }

          for (let rr = top; rr <= bottom; rr++) {
            this.board[rr][c] = null;
            this.spr[rr][c] = null;
          }

          let target = bottom;
          for (const entry of existing) {
            const tr = target--;
            this.board[tr][c] = entry.item;
            this.spr[tr][c] = entry.sprite;
            const s = entry.sprite;
            if (!s) continue;
            rebind(s, tr, c);
            const p = this.pos(tr, c);
            const distance = Math.max(0, tr - entry.from);
            const baseAngle = s.getData('ang') ?? s.angle ?? 0;
            s.setData('ang', baseAngle);
            if (distance > 0) {
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  x: p.x,
                  y: p.y,
                  angle: baseAngle,
                  duration: 210 + distance * 95,
                  ease: 'Cubic.in',
                  onComplete: () => {
                    this.tweens.add({
                      targets: s,
                      scaleX: (s.getData('sx') || s.scaleX) * 1.04,
                      scaleY: (s.getData('sy') || s.scaleY) * 0.94,
                      duration: 75,
                      yoyo: true,
                      ease: 'Sine.inOut',
                    });
                    resolve();
                  },
                });
              }));
            }
          }

          let spawnIndex = 0;
          while (target >= top) {
            const tr = target--;
            this.board[tr][c] = { id: Phaser.Utils.Array.GetRandom(availableTypes), sp: null };
            this.render(tr, c, false, false);
            const s = this.spr[tr][c];
            if (!s) continue;
            rebind(s, tr, c);
            const p = this.pos(tr, c);
            const finalAngle = s.getData('ang') ?? s.angle ?? 0;
            const finalSX = s.getData('sx') || s.scaleX;
            const finalSY = s.getData('sy') || s.scaleY;
            spawnIndex++;

            if (hasAnchorAbove) {
              // Do not cross the intact ice/blocker visually.
              const segmentTopY = this.pos(top, c).y;
              s.y = segmentTopY - 18 - (spawnIndex - 1) * 8;
              s.x = p.x;
              s.alpha = 0;
              s.setScale(finalSX * .66, finalSY * .66);
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  y: p.y,
                  alpha: 1,
                  scaleX: finalSX,
                  scaleY: finalSY,
                  angle: finalAngle,
                  duration: 300 + spawnIndex * 45,
                  ease: 'Back.out',
                  onComplete: resolve,
                });
              }));
            } else {
              const startY = BY - CELL * spawnIndex - 35;
              s.y = startY;
              s.x = p.x;
              s.angle = finalAngle + (Math.random() - .5) * 12;
              s.alpha = .98;
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  y: p.y,
                  angle: finalAngle,
                  alpha: 1,
                  duration: 410 + spawnIndex * 55 + (tr - top) * 20,
                  ease: 'Bounce.out',
                  onComplete: resolve,
                });
              }));
            }
          }
        }
      }

      if (animations.length) await Promise.all(animations);
      await pause(80);
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
      try{this.assertBoard('cascade safety shuffle')}catch(error){console.warn('[berries] board diagnostic',error)}
    }
    if(!this.hasMove())await this.autoShuffle();
    try{this.assertBoard('resolve')}catch(error){console.warn('[berries] board diagnostic',error)}
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

    // Cohesive top ribbon, created synchronously on every level.
    const topBar=this.add.graphics().setDepth(18);
    topBar.fillStyle(0x183a24,.82);topBar.fillRoundedRect(24,14,W-48,100,30);
    topBar.lineStyle(3,0xd3a555,.72);topBar.strokeRoundedRect(24,14,W-48,100,30);
    topBar.fillStyle(0x6fa63b,.75);topBar.fillRoundedRect(180,105,W-360,5,3);

    const backPlate=this.add.circle(80,64,43,0x75401f,.96).setStrokeStyle(4,0xe2b866,.95).setDepth(19).setInteractive({useHandCursor:true});
    const backIcon=fit(this.add.image(80,64,'ui_back'),54,54).setDepth(20);
    this.add.text(132,64,'КАРТА',{fontFamily:FONT,fontSize:'22px',fontStyle:'bold',color:'#fff2bd',stroke:'#542813',strokeThickness:5}).setOrigin(0,.5).setDepth(20);
    backPlate.on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});
    backIcon.setInteractive({useHandCursor:true}).on('pointerdown',()=>backPlate.emit('pointerdown'));

    fit(this.add.image(1285,64,'ui_life'),50,50).setDepth(20);
    this.add.text(1320,64,'5',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);
    let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
    fit(this.add.image(1780,64,'ui_coin'),46,46).setDepth(20);
    this.add.text(1820,64,String(save.coins||0),{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);
    const settings=fit(this.add.image(1880,64,'ui_settings'),48,48).setDepth(20).setInteractive({useHandCursor:true});
    settings.on('pointerdown',()=>this.fx.click());
    fit(this.add.image(285,850,'panel_championat'),330,150).setDepth(2);
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
    if(this.fx&&!this.fx.__juicyV12){
      this.fx.__juicyV12=true;
      this.fx.pop=(chain=1)=>{
        if(!this.fx.can?.('berry_pop',30))return;
        const ctx=this.sound?.context;if(!ctx||this.fx.muted)return;
        if(ctx.state==='suspended')ctx.resume().catch(()=>{});
        const now=ctx.currentTime;
        const pitch=1+Math.min(chain,5)*.045+(Math.random()-.5)*.075;
        const makeTone=(from,to,volume,duration,type='sine',delay=0)=>{
          const o=ctx.createOscillator(),g=ctx.createGain(),t=now+delay;
          o.type=type;o.frequency.setValueAtTime(from*pitch,t);o.frequency.exponentialRampToValueAtTime(to*pitch,t+duration);
          g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
          o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+duration+.015);
        };
        // Bright skin snap followed by a tiny round juice bubble.
        makeTone(1050,520,.026,.032,'triangle');
        makeTone(470,210,.038,.082,'sine',.008);
        const len=Math.floor(ctx.sampleRate*.038),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);
        for(let i=0;i<len;i++){const fade=1-i/len;data[i]=(Math.random()*2-1)*fade*fade}
        const src=ctx.createBufferSource(),band=ctx.createBiquadFilter(),ng=ctx.createGain();
        src.buffer=buf;band.type='bandpass';band.frequency.value=2500;band.Q.value=.7;
        ng.gain.setValueAtTime(.020,now);ng.gain.exponentialRampToValueAtTime(.0001,now+.04);
        src.connect(band).connect(ng).connect(ctx.destination);src.start(now);src.stop(now+.045);
        if(chain>=3)makeTone(760+chain*45,980+chain*45,.007,.065,'sine',.022);
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
    mapProto.create=function createMapWithEditor(){
      window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
      this.add.image(W/2,H/2,'mapbg').setDisplaySize(W,H);
      fit(this.add.image(W/2,100,'map_header_levels'),560,175).setDepth(8);

      let save={};try{save=JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{}
      const done=new Set(save.done||[]),highest=Math.max(0,...done);
      const defaults=[
        [360,760,1],[402,735,1],[445,705,1],[490,668,1],[535,635,1.12],[610,610,1],
        [655,622,1],[700,648,1],[744,684,1],[800,720,1.12],[860,735,1],
        [910,714,1],[955,680,1],[1000,634,1],[1050,582,1.12],[1110,545,1],
        [1160,555,1],[1212,582,1],[1265,620,1],[1320,655,1.12],[1370,670,1],
        [1412,653,1],[1448,625,1],[1475,588,1],[1498,548,1.12],[1515,508,1],
        [1530,474,1],[1548,446,1],[1565,425,1],[1580,410,1.18]
      ];
      const LAYOUT_KEY='berries_map_layout_v1';
      let stored=[];try{stored=JSON.parse(localStorage.getItem(LAYOUT_KEY)||'[]')}catch{}
      const layout=defaults.map((base,index)=>({
        x:Number(stored[index]?.x??base[0]),y:Number(stored[index]?.y??base[1]),
        scale:Number(stored[index]?.scale??base[2])
      }));
      const editor=new URLSearchParams(location.search).get('mapEditor')==='1';
      const nodes=[];let selected=null,selection=null,status=null;

      const saveLayout=()=>{
        localStorage.setItem(LAYOUT_KEY,JSON.stringify(layout.map(q=>({x:Math.round(q.x),y:Math.round(q.y),scale:+q.scale.toFixed(2)}))));
        status?.setText('Сохранено');
      };
      const select=node=>{
        selected=node;
        selection?.destroy();
        selection=this.add.rectangle(node.x,node.y,node.getData('size')*node.scaleX+14,node.getData('size')*node.scaleY+14,0xffffff,.02).setStrokeStyle(4,0x66ffb0,.95).setDepth(49);
        status?.setText(`Уровень ${node.getData('level')}  x:${Math.round(node.x)}  y:${Math.round(node.y)}  ×${node.scaleX.toFixed(2)}`);
      };
      const resize=delta=>{
        if(!selected)return;
        const index=selected.getData('level')-1,next=Phaser.Math.Clamp(selected.scaleX+delta,.55,2.2);
        selected.setScale(next);layout[index].scale=next;select(selected);saveLayout();
      };

      layout.forEach((q,index)=>{
        const n=index+1,completed=done.has(n),unlocked=n===1||completed||n<=highest+1;
        const key=completed?'lvl_completed':unlocked?'lvl_current':'lvl_locked';
        const major=n%5===0||n===1||n===30,size=major?76:58;
        const button=fit(this.add.image(0,0,key),size,size);
        const number=this.add.text(0,0,String(n),{fontFamily:FONT,fontSize:major?'21px':'16px',fontStyle:'bold',color:unlocked?'#fff8dc':'#c2b49d',stroke:'#512814',strokeThickness:major?4:3}).setOrigin(.5);
        const node=this.add.container(q.x,q.y,[button,number]).setDepth(5).setSize(size,size).setScale(q.scale);
        node.setData({level:n,size});nodes.push(node);
        if(editor){
          node.setInteractive(new Phaser.Geom.Rectangle(-size/2,-size/2,size,size),Phaser.Geom.Rectangle.Contains);
          this.input.setDraggable(node);
          node.on('pointerdown',()=>select(node));
          node.on('drag',(pointer,x,y)=>{
            node.x=Phaser.Math.Clamp(x,35,W-35);node.y=Phaser.Math.Clamp(y,175,H-35);
            layout[index].x=node.x;layout[index].y=node.y;
            if(selection){selection.x=node.x;selection.y=node.y}
            status?.setText(`Уровень ${n}  x:${Math.round(node.x)}  y:${Math.round(node.y)}  ×${node.scaleX.toFixed(2)}`);
          });
          node.on('dragend',saveLayout);
        }else if(unlocked){
          node.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start('Play',{n}));
        }
      });

      const king=fit(this.add.image(1715,790,'king_point'),265,265).setDepth(4);
      this.tweens.add({targets:king,y:778,angle:{from:-1.5,to:1.5},duration:1350,yoyo:true,repeat:-1,ease:'Sine.inOut'});

      if(editor){
        const panel=this.add.rectangle(W/2,1025,1320,82,0x10281b,.94).setStrokeStyle(3,0xe1b45f,.9).setDepth(45);
        const makeButton=(x,label,width,cb)=>{
          const bg=this.add.rectangle(x,1025,width,52,0x784322,.98).setStrokeStyle(2,0xf0c873,.9).setDepth(46).setInteractive({useHandCursor:true});
          this.add.text(x,1025,label,{fontFamily:FONT,fontSize:'20px',fontStyle:'bold',color:'#fff4c5'}).setOrigin(.5).setDepth(47);
          bg.on('pointerdown',cb);
        };
        makeButton(420,'−',62,()=>resize(-.08));makeButton(500,'+',62,()=>resize(.08));
        makeButton(720,'КОПИРОВАТЬ JSON',300,async()=>{
          saveLayout();const json=JSON.stringify(layout.map(q=>({x:Math.round(q.x),y:Math.round(q.y),scale:+q.scale.toFixed(2)})),null,2);
          try{await navigator.clipboard.writeText(json);status.setText('JSON скопирован')}catch{status.setText('JSON сохранён в localStorage')}
        });
        makeButton(1000,'СБРОСИТЬ',180,()=>{
          localStorage.removeItem(LAYOUT_KEY);this.scene.restart();
        });
        this.add.text(1180,1025,'Перетащите точку • колёсико меняет размер',{fontFamily:FONT,fontSize:'18px',color:'#fff0bd'}).setOrigin(.5).setDepth(47);
        status=this.add.text(28,160,'Выберите уровень',{fontFamily:FONT,fontSize:'20px',fontStyle:'bold',color:'#caffd9',backgroundColor:'#10281bdd',padding:{x:12,y:7}}).setDepth(50);
        this.input.on('wheel',(pointer,objects,dx,dy)=>resize(dy>0?-.05:.05));
      }
    };
  }

  return true;
}

let attempts=0;
const timer=setInterval(()=>{attempts++;if(install()||attempts>250)clearInterval(timer)},20);
})();
