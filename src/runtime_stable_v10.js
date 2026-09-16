(() => {
'use strict';

const Campaign=window.BerriesCampaign;
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
    clearTimeout(this.hintTimer);clearTimeout(this.hintCleanupTimer);
    // Only hint-owned objects: berry tweens complete the pending game operation.
    for(const obj of this.hintObjs||[]){
      try{this.tweens.killTweensOf(obj);obj.destroy?.()}catch{}
    }
    this.hintObjs=[];
  };

  p.isHintCell=function(q){
    const cell=this.cell?.[q.r]?.[q.c],sprite=this.spr?.[q.r]?.[q.c];
    return !!(cell&&!cell.ice&&!cell.block&&this.board?.[q.r]?.[q.c]&&sprite?.active);
  };
  p.findHintMove=function(){
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      const a={r,c};if(!this.isHintCell(a))continue;
      for(const [dr,dc] of [[0,1],[1,0]]){
        const b={r:r+dr,c:c+dc};if(!this.isHintCell(b))continue;
        const A=this.board[r][c],B=this.board[b.r][b.c];
        if(A.sp||B.sp)return [a,b];
        if(A.id===B.id)continue;
        let valid=false;
        this.swapData(a,b);
        try{valid=this.groups().some(g=>g.p.some(q=>(q.r===a.r&&q.c===a.c)||(q.r===b.r&&q.c===b.c)))}
        finally{this.swapData(a,b)}
        if(valid)return [a,b];
      }
    }
    return null;
  };
  p.showHint=function showHintStable(){
    if(this.busy||this.boosterMode||!this.scene?.isActive?.())return;
    this.hideHint();
    const move=this.findHintMove();
    if(!move||!move.every(q=>this.isHintCell(q)))return;
    move.forEach((q,index)=>{
      const sprite=this.spr[q.r][q.c];
      const halo=this.add.circle(sprite.x,sprite.y,CELL*.40,0xffb52b,.25).setDepth(2.8);
      const rays=this.add.graphics().setPosition(sprite.x,sprite.y).setDepth(2.9);
      for(let i=0;i<12;i++){
        const angle=i*Math.PI/6,spread=.085,inner=CELL*.32,outer=CELL*.485;
        rays.fillStyle(i%2?0xffb820:0xda7905,.95);
        rays.fillTriangle(Math.cos(angle-spread)*inner,Math.sin(angle-spread)*inner,Math.cos(angle)*outer,Math.sin(angle)*outer,Math.cos(angle+spread)*inner,Math.sin(angle+spread)*inner);
      }
      this.hintObjs.push(halo,rays);
      this.tweens.add({targets:rays,angle:360,duration:6500+index*500,repeat:-1,ease:'Linear'});
      this.tweens.add({targets:rays,alpha:{from:.35,to:1},duration:1100,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.tweens.add({targets:halo,alpha:{from:.12,to:.36},duration:1100,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    });
  };

  p.showSpecialInfo=function(sp,autoHide=3100){
    const label=sp==='line_h'?'ПОЛОСАТАЯ • поменяй с соседней ягодой → очистит РЯД':
      sp==='line_v'?'ПОЛОСАТАЯ • поменяй с соседней ягодой → очистит КОЛОНКУ':
      sp==='bomb'?'БОМБА • поменяй с соседней ягодой → взрыв 3×3':
      sp==='rainbow'?'РАДУГА • поменяй с ягодой → уберёт весь её цвет':'';
    if(!label)return;
    if(!this.specialInfoText?.scene)this.specialInfoText=this.add.text(W/2,955,'',{
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


  p.hud=function hudDesigned(){
    // Board stays in its proven position; only the visual shell is rebuilt.
    const frame=this.add.graphics().setDepth(1);
    frame.fillStyle(0xfff5e6,.62);frame.fillRoundedRect(BX-20,BY-20,C*CELL+40,R*CELL+40,28);
    frame.lineStyle(5,0xd5aa62,.82);frame.strokeRoundedRect(BX-20,BY-20,C*CELL+40,R*CELL+40,28);
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){
      frame.fillStyle((r+c)%2?0xf3e6d2:0xfffaf0,.42);
      frame.fillRoundedRect(BX+c*CELL+5,BY+r*CELL+5,CELL-10,CELL-10,15);
    }

    const label=(x,y,value,size=30,color='#fff4cf')=>this.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',color,stroke:color==='#57301d'?'#fff4d5':'#63351e',strokeThickness:color==='#57301d'?1:5,align:'center'}).setOrigin(.5).setDepth(20);
    const wood=(x,y,w,h)=>fit(this.add.image(x,y,'wood_flat'),w,h).setDepth(17);
    const nav=(x,y,title,icon,action)=>{
      const bg=wood(x,y,345,108).setInteractive({useHandCursor:true});
      fit(this.add.image(x-115,y,icon),65,65).setDepth(20);
      label(x+27,y,title,30);
      bg.on('pointerdown',()=>{this.fx.click();action()});
    };
    fit(this.add.image(960,73,'plevel'),610,140).setDepth(18);
    label(960,70,`УРОВЕНЬ ${this.no}`,42);
    let save=Campaign.read();
    const coinPanel=fit(this.add.image(300,77,'pcoins'),380,104).setDepth(18).setInteractive({useHandCursor:true});
    this.coinText=label(310,77,String(save.coins||0),32,'#57301d');
    coinPanel.disableInteractive();
    this.add.zone(445,77,76,86).setDepth(21).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openPaidShop());
    const lifePanel=fit(this.add.image(1610,77,'plives'),380,104).setDepth(18).setInteractive({useHandCursor:true});
    this.lifeText=label(1620,77,String(Campaign.read().lives),32,'#57301d');
    this.lifeClockPanel=wood(960,1016,360,88);
    this.lifeClock=label(960,1016,'',22);
    this.refreshLifeDisplay=()=>{
      const state=Campaign.read(),show=state.lives<5;
      this.lifeText.setText(String(state.lives));
      this.lifeClockPanel.setVisible(show);this.lifeClock.setVisible(show);
      if(show)this.lifeClock.setText('До +1 жизни: '+Campaign.lifeLabel().split(' • ')[1]);
    };
    this.refreshLifeDisplay();
    this.time.addEvent({delay:1000,loop:true,callback:()=>this.refreshLifeDisplay()});
    lifePanel.disableInteractive();
    this.add.zone(1755,77,76,86).setDepth(21).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openPaidShop());
    wood(300,180,300,88);this.mt=label(300,180,'',29);
    wood(1610,180,300,88);this.st=label(1610,180,'',27);
    nav(300,1016,'НАЗАД','ui_back',()=>{window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});
    nav(1610,1016,'МАГАЗИН','ui_shop',()=>this.openPaidShop());

    const settingsBg=this.add.circle(1872,66,38,0x75401f,.97).setStrokeStyle(4,0xe5bd6b,.96).setDepth(19);
    const settings=fit(this.add.image(1872,66,'ui_settings'),49,49).setDepth(20).setInteractive({useHandCursor:true});
    settings.on('pointerdown',()=>{
      if(this._soundMenu?.active){this._soundMenu.destroy();this._soundMenu=null;return}
      const box=this.add.container(1640,265).setDepth(40);
      const bg=this.add.graphics();
      bg.fillStyle(0xfff7e9,.95);bg.fillRoundedRect(-235,-145,470,290,24);
      bg.lineStyle(3,0xcda36a,1);bg.strokeRoundedRect(-235,-145,470,290,24);
      box.add(bg);
      const blocker=this.add.zone(0,0,470,290).setInteractive();
      box.add(blocker);
      const text=(x,y,value,size=26)=>this.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',color:'#543922',align:'center'}).setOrigin(.5);
      box.add(text(0,-100,'НАСТРОЙКИ',30));
      const close=text(200,-108,'×',34).setInteractive({useHandCursor:true});
      close.on('pointerdown',()=>{box.destroy();this._soundMenu=null});box.add(close);
      const row=(y,title,bus)=>{
        box.add(text(-112,y,title));
        const button=fit(this.add.image(106,y,'btn'),170,65).setInteractive({useHandCursor:true});
        const label=text(106,y,'',22);label.setColor('#fff5da').setStroke('#59331c',3);
        const update=()=>label.setText(bus?.muted?'ВЫКЛ':'ВКЛ');
        button.on('pointerdown',()=>{
          if(!bus)return;bus.muted=!bus.muted;
          if(bus===this.music){
            if(bus.muted)bus.stop();
            else bus.play(this.no>=21?'music_gameplay_magic':'music_gameplay_calm');
          }
          update();
        });
        update();box.add([button,label]);
      };
      row(-22,'ЗВУК',this.fx);row(70,'МУЗЫКА',this.music);
      const credits=text(0,122,'О музыке',18).setInteractive({useHandCursor:true});
      credits.on('pointerdown',()=>{
        if(this._musicCredits?.active){this._musicCredits.destroy();return}
        const card=this.add.container(960,540).setDepth(60);
        card.add(this.add.rectangle(0,0,1080,430,0xfff7e9,.98).setStrokeStyle(3,0xcda36a).setInteractive());
        const copy='Музыка: Kevin MacLeod (incompetech.com)\nMorning • Devonshire Waltz Moderato\nMagic Escape Room • Adventures in Adventureland\nАкценты: фрагменты с плавным началом и окончанием\nLicensed under Creative Commons: By Attribution 4.0\nhttps://creativecommons.org/licenses/by/4.0/';
        card.add(text(0,-20,copy,26));
        const exit=text(0,155,'ЗАКРЫТЬ',26).setInteractive({useHandCursor:true});
        exit.on('pointerdown',()=>card.destroy());card.add(exit);this._musicCredits=card;
      });
      box.add(credits);
      this._soundMenu=box;
    });

    // Fixed-size panels and slot centres in the 1920x1080 reference grid.
    fit(this.add.image(300,500,'pgoals'),280,560).setDepth(3);
    fit(this.add.image(300,325,'head_goals'),350,106).setDepth(20);
    const count=Math.max(1,this.goals.length),gap=Math.min(112,300/count);
    this.gt=this.goals.map((goal,index)=>{
      const y=510+(index-(count-1)/2)*gap;
      const key=goal.type==='berry'?'b_'+goal.id:goal.type==='ice'?'ice1':goal.type==='acorn'?'acorn':goal.type==='roots'?'roots':'ui_coin';
      fit(this.add.image(250,y,key),70,70).setDepth(5);
      return label(345,y,'',25,'#57301d');
    });
    fit(this.add.image(1610,570,'pboost'),280,650).setDepth(3);
    const boosterHead=fit(this.add.image(1610,302,'head_boosters'),380,110).setDepth(20);
    this.add.zone(1610+boosterHead.displayWidth*.338,302,70,70).setDepth(21).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openShop());
    this.boosterButtons={};
    [['hammer',441],['shuffle',582],['fan',722]].forEach(([id,y])=>{
      const im=fit(this.add.image(1610,y,id),96,96).setDepth(5).setInteractive({useHandCursor:true});
      this.add.circle(1660,y+39,24,0x237fbd,1).setStrokeStyle(3,0xffe9b0).setDepth(6);
      const tx=label(1660,y+39,'',24);tx.setDepth(7);
      im.on('pointerdown',()=>this.pickBooster(id));this.boosterButtons[id]={im,tx};
    });
    this.boosterHint=this.add.text(1610,920,'',{fontFamily:FONT,fontSize:'19px',fontStyle:'bold',align:'center',color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,wordWrap:{width:330}}).setOrigin(.5).setDepth(6);
    this.king=fit(this.add.image(300,883,'king_idle'),195,195).setDepth(4);
    this.kingBaseY=883;this.kingBaseScale=this.king.scaleX;

  };

  const referenceRefreshBoosters=p.refreshBoosters;
  p.refreshBoosters=function(){
    referenceRefreshBoosters.call(this);
    for(const [id,b] of Object.entries(this.boosterButtons))b.tx.setText(String(this.inventory[id]));
  };
  const referenceUpdateHud=p.updateHud;
  p.updateHud=function(){
    referenceUpdateHud.call(this);
    const state=Campaign.read();this.coinText?.setText(String(state.coins));this.refreshLifeDisplay?.();
    // Fit text to fixed slots; never change panel dimensions.
    for(const [text,width,size] of [[this.mt,245,29],[this.st,245,27],[this.coinText,165,32],[this.lifeText,165,32]]){
      if(!text)continue;text.setFontSize(size);
      if(text.width>width)text.setFontSize(Math.max(16,Math.floor(size*width/text.width)));
    }
    this.goals.forEach((g,i)=>this.gt[i].setText(`${g.type==='score'?Math.min(g.need,Math.round(this.score)):g.done} / ${g.need}`));
    for(const [id,b] of Object.entries(this.boosterButtons))b.tx.setText(String(this.inventory[id]));
  };
  p.openPaidShop=function(){
    if(this._paidShop?.scene)return;
    const box=this.add.container(W/2,H/2).setDepth(70);this._paidShop=box;
    const close=()=>{box.destroy();this._paidShop=null};
    const shade=this.add.rectangle(0,0,W,H,0x102419,.8).setInteractive();
    shade.on('pointerdown',close);box.add(shade);
    const art=fit(this.add.image(0,-20,'popup_shop'),850,970);
    box.add(art);
    // Input follows the painted controls, independent of the source resolution.
    const hit=(x,y,w,h,action)=>{
      const area=this.add.zone((x-.5)*art.displayWidth,-20+(y-.5)*art.displayHeight,w*art.displayWidth,h*art.displayHeight).setInteractive({useHandCursor:true});
      area.on('pointerdown',action);box.add(area);
    };
    box.add(this.add.zone(0,-20,art.displayWidth,art.displayHeight).setInteractive());
    const note=this.add.text(0,505,'Покупки за деньги пока недоступны',{
      fontFamily:FONT,fontSize:'23px',color:'#fff4cf',align:'center',
      backgroundColor:'#542f20',padding:{x:14,y:7}
    }).setOrigin(.5);box.add(note);
    hit(.891,.187,.13,.105,close);
    for(const y of [.448,.607,.767])hit(.767,y,.24,.09,()=>{
      note.setText('Покупки за деньги пока недоступны');
    });
  };

  p.openShop=function(){
    if(this._shopModal?.active)return;
    const box=this.add.container(0,0).setDepth(70);this._shopModal=box;
    const close=()=>{box.destroy();this._shopModal=null;this.updateHud?.()};
    const shade=this.add.rectangle(W/2,H/2,W,H,0x102419,.8).setInteractive();box.add(shade);
    shade.on('pointerdown',close);
    const panel=this.add.rectangle(960,540,1020,650,0xfff2d9,1).setStrokeStyle(5,0x945022).setInteractive();box.add(panel);
    const text=(x,y,t,size=28)=>this.add.text(x,y,t,{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',color:'#59331d',align:'center'}).setOrigin(.5);
    box.add(text(960,260,'БУСТЕРЫ ЗА МОНЕТЫ',36));
    const coins=text(960,315,'',28),message=text(960,790,'Бустеры сохраняются между уровнями',23);box.add([coins,message]);
    const counts=[];
    const refresh=()=>{const state=Campaign.read();coins.setText('Монеты: '+state.coins);counts.forEach(([id,t])=>t.setText('В запасе: '+state.inventory[id]));if(this.inventory)this.inventory={...state.inventory};this.refreshBoosters?.()};
    [['hammer','Молоток'],['shuffle','Перемешивание'],['fan','Вентилятор']].forEach(([id,title],i)=>{
      const x=650+i*310;box.add(fit(this.add.image(x,435,id),115,115));box.add(text(x,525,title,25));
      const count=text(x,570,'',23);counts.push([id,count]);box.add(count);
      const buy=fit(this.add.image(x,650,'wood_flat'),260,88).setInteractive({useHandCursor:true});
      const price=text(x,650,Campaign.PRICES[id]+' монет',26);price.setColor('#fff3c3').setStroke('#60331c',4);
      buy.on('pointerdown',()=>{if(Campaign.buy(id)){this.fx?.reward?.();message.setText('Куплено: '+title);refresh();this.updateHud?.()}else message.setText('Не хватает монет — их можно заработать на уровнях')});
      box.add([buy,price]);
    });
    const exit=fit(this.add.image(1415,260,'ui_close'),64,64);box.add(exit);
    const closeHit=this.add.zone(1415,260,86,86).setInteractive({useHandCursor:true});closeHit.on('pointerdown',close);box.add(closeHit);refresh();
  };

  p.resultPopup=function resultPopupStable(win){
    const shade=this.add.rectangle(W/2,H/2,W,H,0x061008,.76).setDepth(30).setInteractive();
    const box=this.add.container(W/2,H/2).setDepth(31);
    const art=fit(this.add.image(0,0,win?'popup_win':'popup_lose'),860,820);box.add(art);
    const hit=(x,y,w,h,cb)=>{
      const area=this.add.zone((x-.5)*art.displayWidth,(y-.5)*art.displayHeight,w*art.displayWidth,h*art.displayHeight).setInteractive({useHandCursor:true});
      box.add(area);area.on('pointerdown',()=>{this.fx.click();cb(area)});return area;
    };
    hit(win?.891:.918,win?.172:.237,.14,.115,()=>this.scene.start('Map'));
    if(win){
      hit(.5,.737,.74,.16,async area=>{
        if(this.winRewardDoubled)return;
        const attempt=this.attemptId;
        area.disableInteractive();
        const ok=await window.BerriesYandex?.showRewardedVideo?.();
        if(!this.scene.isActive()||this.attemptId!==attempt)return;
        if(ok&&Campaign.doubleReward(attempt)){
          this.updateHud();
          this.winRewardDoubled=true;this.fx.reward();
        }else area.setInteractive({useHandCursor:true});
      });
      hit(.5,.899,.55,.13,()=>{
        const next=this.no<30?this.no+1:null;
        if(next)this.scene.start('Play',{n:next});else this.scene.start('Map');
      });
    }else{
      hit(.5,.697,.74,.16,async area=>{
        if(this.continueUsed)return;
        const attempt=this.attemptId;
        area.disableInteractive();
        const ok=await window.BerriesYandex?.showRewardedVideo?.();
        if(!this.scene.isActive()||this.attemptId!==attempt)return;
        if(ok&&Campaign.resume(attempt)){
          this.continueUsed=true;this.moves+=5;this.fx.reward();shade.destroy();box.destroy();this.busy=false;
          window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();
          this.kingAnim('idle');this.updateHud();this.scheduleHint();
        }else area.setInteractive({useHandCursor:true});
      });
      hit(.294,.873,.40,.105,()=>this.scene.restart({n:this.no}));
      hit(.714,.873,.40,.105,()=>this.scene.start('Map'));
    }
    box.setScale(.84).setAlpha(0);
    this.tweens.add({targets:box,scale:1,alpha:1,duration:250,ease:'Back.out'});
  };

  const basePickBooster=p.pickBooster;
  p.pickBooster=function(id){
    if(!this.busy&&this.inventory[id]<=0){this.openShop();return}
    basePickBooster.call(this,id);
    if(!this.boosterMode)return;
    const label=this.boosterMode==='hammer'?'МОЛОТОК — выбери одну клетку':this.boosterMode==='fan'?'ВЕЕР — выбери ряд':'';
    if(label)this.boosterHint.setText(label);
  };

  // Cosmetic objects only. No tween below owns a berry sprite or gates a move.
  p.fxAllow=function(key,gap=180){
    this._fxTimes??={};const now=this.time.now;
    if(now<(this._fxTimes[key]??-Infinity))return false;
    this._fxTimes[key]=now+gap;return true;
  };
  p.fxTween=function(object,config){
    this._fxObjects??=new Set();
    if(this._fxObjects.size>=160){object.destroy();return}
    this._fxObjects.add(object);
    this.tweens.add({targets:object,...config,onComplete:()=>{this._fxObjects.delete(object);object.destroy()}});
  };
  p.fxBits=function(x,y,colors,count=14,radius=110,depth=14){
    for(let i=0;i<count;i++){
      const a=Math.PI*2*i/count+Math.random()*.25,d=radius*(.4+Math.random()*.6);
      const bit=i%3===0?this.add.star(x,y,4,3,9,colors[i%colors.length],1):this.add.ellipse(x,y,6+Math.random()*5,12+Math.random()*7,colors[i%colors.length],.95);
      bit.setDepth(depth).setAngle(a*180/Math.PI);
      this.fxTween(bit,{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d+24,angle:bit.angle+100,scale:0,alpha:0,duration:440+Math.random()*280,ease:'Cubic.out'});
    }
  };
  p.fxWave=function(x,y,color,radius,depth=14){
    const ring=this.add.circle(x,y,16,color,.06).setStrokeStyle(6,color,.9).setDepth(depth);
    this.fxTween(ring,{scale:radius/16,alpha:0,duration:450,ease:'Cubic.out'});
  };
  p.burst=function(x,y,color=0xffe36d,n=8){
    this.fxBits(x,y,[color,0xfff4c3,0xffbb54],Math.min(n,14),70);
  };
  const baseClearCells=p.clearCells;
  p.clearCells=async function clearCellsPolished(initial,chain=1){
    const beforeGoals=this.goals.map(g=>g.done);
    await baseClearCells.call(this,initial,chain);
    this.goals.forEach((goal,index)=>{
      if(goal.done>beforeGoals[index]){
        const target=this.gt?.[index];
        if(target)this.tweens.add({targets:target,scale:1.12,duration:115,yoyo:true,ease:'Back.out'});
      }
    });
    if(chain>=2&&this.fxAllow('combo',700)){
      const words=['СОЧНО!','КОМБО!','ЯГОДНЫЙ БУМ!','ВОТ ЭТО КАСКАД!'];
      const label=this.add.text(BX+C*CELL/2,BY+82,words[Math.min(chain-2,3)],{fontFamily:FONT,fontSize:chain>=4?'51px':'43px',fontStyle:'bold',color:'#fff6bb',stroke:'#793322',strokeThickness:9,shadow:{offsetX:0,offsetY:5,color:'#6a3020',blur:10,fill:true}}).setOrigin(.5).setDepth(24).setScale(.65);
      this.fxTween(label,{y:BY+42,scale:1.05,alpha:0,duration:900,ease:'Cubic.out'});
      this.fxBits(BX+C*CELL/2,BY+72,[0xffd45a,0xff759e,0xfff6d0],18,175,23);
      this.kingReact('celebrate',900);
      if(chain>=3)this.music?.accent('combo');
    }
  };
  p.iceShards=function(x,y){
    for(let i=0;i<12;i++){
      const angle=Math.PI*2*i/12,d=45+Math.random()*65;
      const shard=this.add.triangle(x,y,0,-10,-6,6,7,4,i%2?0xc6f4ff:0xffffff,.9).setStrokeStyle(1,0x7cd9ed,.8).setDepth(15);
      this.fxTween(shard,{x:x+Math.cos(angle)*d,y:y+Math.sin(angle)*d+30,angle:90+i*23,alpha:0,scale:.2,duration:470+Math.random()*130,ease:'Cubic.out'});
    }
  };
  p.specialCreateFx=function(cell){
    const q=this.pos(cell.r,cell.c);
    this.fxWave(q.x,q.y,0xffdf6a,88);
    this.fxBits(q.x,q.y,[0xffed9c,0xffffff,0xffa851],18,110);
    this.fx.spark();
  };
  p.lineFx=function(r,c,dir){
    if(!this.fxAllow('line-'+dir+'-'+(dir==='h'?r:c),180))return;
    const q=this.pos(r,c),horizontal=dir==='h';
    const x=horizontal?BX+C*CELL/2:q.x,y=horizontal?q.y:BY+R*CELL/2;
    [38,15,5].forEach((thickness,i)=>{
      const beam=this.add.rectangle(x,y,horizontal?C*CELL:thickness,horizontal?thickness:R*CELL,i===2?0xffffff:0xffdf76,i===0?.22:.9).setDepth(13+i);
      beam.setScale(horizontal?.05:1,horizontal?1:.05);
      this.fxTween(beam,{scaleX:1,scaleY:1,alpha:0,duration:330+i*65,ease:'Expo.out'});
    });
    for(let i=0;i<8;i++){
      const at=this.pos(horizontal?r:i,horizontal?i:c);
      this.fxBits(at.x,at.y,[0xffee9f,0xffffff],4,52);
    }
  };
  p.bombFx=function(r,c){
    if(!this.fxAllow('bomb-'+r+'-'+c,220))return;
    const q=this.pos(r,c);
    this.fxWave(q.x,q.y,0xffd268,CELL*1.5);
    this.fxWave(q.x,q.y,0xff7697,CELL*1.25);
    this.fxBits(q.x,q.y,[0xffc45e,0xfff7be,0xff7c99],28,CELL*1.7);
    const colors=[0xf4a0c9,0xb8a5ef,0x8fd9d2,0xffcb94];
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      const cloud=this.add.graphics().setPosition(q.x,q.y).setDepth(12);
      cloud.fillStyle(colors[i%colors.length],.34);
      cloud.fillCircle(-15,0,20);cloud.fillCircle(6,-10,25);cloud.fillCircle(23,6,18);cloud.fillCircle(3,13,20);
      cloud.setScale(.35);
      this.fxTween(cloud,{x:q.x+Math.cos(angle)*110,y:q.y+Math.sin(angle)*95-30,scale:1.35,alpha:0,angle:(i%2?1:-1)*25,duration:950+i*45,ease:'Cubic.out'});
    }
    const flash=this.add.circle(q.x,q.y,42,0xfff0b0,.5).setDepth(13);
    this.fxTween(flash,{scale:2.2,alpha:0,duration:190,ease:'Quad.out'});
  };
  p.rainbowFx=function(){
    if(!this.fxAllow('rainbow',650))return;
    const x=BX+C*CELL/2,y=BY+R*CELL/2,colors=[0xff719c,0xffd56b,0x81edb0,0x72d8ff,0xc78aff];
    colors.forEach((color,i)=>{
      this.fxWave(x,y,color,170+i*42);
      this.fxBits(x,y,[color,0xffffff],9,180+i*30);
    });
    this.music?.accent('combo');this.fx.whoosh();this.kingReact('celebrate',900);
  };
  const baseResultPopup=p.resultPopup;
  p.resultPopup=function(win,...args){
    const result=baseResultPopup.call(this,win,...args);
    if(win){
      this.music?.accent('victory');
      // Confetti stays behind popup controls; never captures input.
      [[W/2-420,H/2],[W/2+420,H/2]].forEach(([x,y])=>{
        this.fxBits(x,y,[0xffd35f,0xff79a6,0x7de4c5,0xffffff],36,280,30);
        this.fxWave(x,y,0xffe7a0,210,30);
      });
      this.kingReact('celebrate',1400);
    }
    return result;
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
    this.specialInfoText=null;
    this._fxObjects=new Set();this._fxTimes={};
    if(baseCreate.call(this)===false)return;
    this.events.once('shutdown',()=>{clearTimeout(this.hintTimer);clearTimeout(this.hintCleanupTimer);clearTimeout(this.specialInfoTimer);this.specialInfoText=null});
    this.input.keyboard?.on('keydown-G',()=>this.toggleDebugGrid());
    if(new URLSearchParams(location.search).get('debugGrid')==='1')this.time.delayedCall(50,()=>this.toggleDebugGrid(true));
    if(this.fx&&!this.fx.__juicyV12){
      this.fx.__juicyV12=true;
      this.fx.pop=(chain=1)=>{
        if(this.fx.sample('sfx_berry_pop',.35))return;
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
    mapProto.openShop=p.openShop;
    mapProto.openPaidShop=p.openPaidShop;
    mapProto.openLevel=function(n){
      const state=Campaign.read();
      if(state.lives<=0){
        if(!this._mapNotice?.scene)this._mapNotice=this.add.text(W/2,944,'',{
          fontFamily:FONT,fontSize:'26px',fontStyle:'bold',color:'#fff4cf',
          backgroundColor:'#542f20',padding:{x:22,y:14},align:'center'
        }).setOrigin(.5).setDepth(60);
        this._mapNotice.setText('Жизни закончились. До +1 жизни: '+Campaign.lifeLabel().split(' • ')[1]+'\nВнизу карты можно получить жизнь за рекламу.').setVisible(true);
        return;
      }
      this._mapNotice?.setVisible(false);
      this.scene.start('Play',{n});
    };
    mapProto.create=function createMapWithEditor(){
      this.music=new window.BerriesMusicBus(this);
      window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
      this.add.image(W/2,H/2,'mapbg').setDisplaySize(W,H);
      fit(this.add.image(W/2,100,'map_header_levels'),560,175).setDepth(8);

      let save=Campaign.read();
      Campaign.abandon();save=Campaign.read();
      const done=new Set(save.done||[]),highest=Campaign.unlocked(save);
      const defaults=[
        [303,759,1.67],[417,804,1.56],[503,873,1.48],[622,939,1.56],[741,966,1.20],
        [192,398,2.04],[317,400,1.48],[406,450,1.40],[464,531,1.48],[553,605,1.12],
        [664,615,1.96],[736,453,1.56],[863,583,1.40],[969,577,1.40],[1092,606,1.04],
        [1238,540,1.96],[1301,437,1.40],[1225,361,1.32],[1097,319,1.64],[986,293,1.04],
        [832,283,1.96],[731,222,1.40],[944,213,1.32],[1198,672,1.40],[1289,762,1.20],
        [1371,707,1.40],[1497,692,1.40],[1584,655,1.40],[1694,603,1.24],[1784,463,1.26]
      ];
      const LAYOUT_KEY='berries_map_layout_v1';
      let stored=[];try{stored=JSON.parse(localStorage.getItem(LAYOUT_KEY)||'[]')}catch{}
      const layout=defaults.map((base,index)=>({
        x:Number(stored[index]?.x??base[0]),y:Number(stored[index]?.y??base[1]),
        scale:Number(stored[index]?.scale??base[2])
      }));
      const editor=new URLSearchParams(location.search).get('mapEditor')==='1';
      const nodes=[];let selected=null,selection=null,status=null;
      if(!editor){
        for(const x of [400,960,1520])fit(this.add.image(x,1026,'wood_flat'),490,92).setDepth(40);
        const lives=this.add.text(400,1026,'',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff4cf'}).setOrigin(.5).setDepth(41);
        const shop=this.add.text(960,1026,'МАГАЗИН',{fontFamily:FONT,fontSize:'26px',fontStyle:'bold',color:'#ffe5a1'}).setOrigin(.5).setDepth(41).setInteractive({useHandCursor:true});
        this.add.zone(960,1026,490,92).setDepth(42).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openPaidShop());
        const extra=this.add.text(1520,1026,'',{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#ffe5a1'}).setOrigin(.5).setDepth(41).setInteractive({useHandCursor:true});
        let pending=false;
        this.add.zone(1520,1026,490,92).setDepth(42).setInteractive({useHandCursor:true}).on('pointerdown',async()=>{
          if(pending||Campaign.read().lives!==0)return;pending=true;extra.setText('Загрузка…');
          try{const ok=await window.BerriesYandex?.showRewardedVideo?.();if(ok)Campaign.addLife();else extra.setText('Реклама недоступна')}
          finally{pending=false}
        });
        const update=()=>{const state=Campaign.read();lives.setText('Жизни: '+Campaign.lifeLabel());shop.setText('МАГАЗИН • '+state.coins);
          if(!pending)extra.setText(state.lives===0?'▶ +1 жизнь за рекламу':'Открыт уровень '+highest);
        };
        update();this.time.addEvent({delay:1000,loop:true,callback:update});
      }


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
        const n=index+1,completed=done.has(n),unlocked=n<=highest;
        const key=completed?'lvl_completed':unlocked?'lvl_current':'lvl_locked';
        const major=n%5===0||n===1||n===30,size=major?76:58;
        const button=fit(this.add.image(0,0,key),size,size);
        const node=this.add.container(q.x,q.y,[button]).setDepth(5).setSize(size,size).setScale(q.scale);
        const number=this.add.text(q.x,q.y,String(n),{
          fontFamily:FONT,fontSize:'24px',fontStyle:'bold',
          color:unlocked?'#fff8dc':'#c2b49d',stroke:'#512814',strokeThickness:5
        }).setOrigin(.5).setDepth(7).setResolution(3);
        node.setData({level:n,size,number});nodes.push(node);
        if(editor){
          node.setInteractive(new Phaser.Geom.Rectangle(-size/2,-size/2,size,size),Phaser.Geom.Rectangle.Contains);
          this.input.setDraggable(node);
          node.on('pointerdown',()=>select(node));
          node.on('drag',(pointer,x,y)=>{
            node.x=Phaser.Math.Clamp(x,35,W-35);node.y=Phaser.Math.Clamp(y,175,H-35);
            number.setPosition(Math.round(node.x),Math.round(node.y));
            layout[index].x=node.x;layout[index].y=node.y;
            if(selection){selection.x=node.x;selection.y=node.y}
            status?.setText(`Уровень ${n}  x:${Math.round(node.x)}  y:${Math.round(node.y)}  ×${node.scaleX.toFixed(2)}`);
          });
          node.on('dragend',saveLayout);
        }else if(unlocked){
          node.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openLevel(n));
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
