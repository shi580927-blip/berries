(() => {
  'use strict';

  const W=1920,H=1080,R=8,C=8,CELL=96,BX=576,BY=150;
  const FONT='Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif';
  const TYPES=['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
  const pause=ms=>new Promise(r=>setTimeout(r,ms));

  function fit(img,maxW,maxH){const s=Math.min(maxW/img.width,maxH/img.height);img.setScale(s);return img}
  function proto(){const s=window.__berriesGame?.scene?.keys?.Play;return s?Object.getPrototypeOf(s):null}

  function patch(){
    const p=proto();
    if(!p||p.__berriesFixV07)return false;
    p.__berriesFixV07=true;

    // ---- No more circular hint markers. Only pulse the two berries of a valid move.
    p.showHint=function showHintV07(){
      const m=this.findHintMove?.();
      if(!m)return;
      this.hideHint?.();
      this.hintObjs=[];
      m.forEach(q=>{
        const s=this.spr?.[q.r]?.[q.c];
        if(!s)return;
        const sx=s.getData('sx')||s.scaleX, sy=s.getData('sy')||s.scaleY;
        this.tweens.add({targets:s,scaleX:sx*1.10,scaleY:sy*1.10,duration:360,yoyo:true,repeat:3,ease:'Sine.inOut'});
      });
      this.fx?.spark?.();
      setTimeout(()=>this.scheduleHint?.(),2600);
    };

    // ---- Safer gravity/refill. Existing lower berries keep their sprites and do not blink.
    // Ice/blockers are hard anchors; empty cells are filled within each open segment.
    p.fallRefill=async function fallRefillV07(){
      const animations=[];
      const available=TYPES.slice(0,this.cfg.n);
      const rebind=(s,r,c)=>{
        if(!s)return;
        s.setData('r',r);s.setData('c',c);
        s.removeAllListeners('pointerdown');
        s.setInteractive({useHandCursor:true});
        s.on('pointerdown',()=>this.tap(r,c));
      };

      for(let c=0;c<C;c++){
        let segBottom=R-1;
        while(segBottom>=0){
          // Skip anchors completely; do not recreate/destroy their berry sprites.
          if(this.cell[segBottom][c].block||this.cell[segBottom][c].ice){segBottom--;continue}
          let segTop=segBottom;
          while(segTop-1>=0&&!this.cell[segTop-1][c].block&&!this.cell[segTop-1][c].ice)segTop--;

          const entries=[];
          for(let r=segBottom;r>=segTop;r--){
            if(this.board[r][c])entries.push({item:this.board[r][c],sprite:this.spr[r][c],from:r});
          }
          for(let r=segTop;r<=segBottom;r++){this.board[r][c]=null;this.spr[r][c]=null}

          let target=segBottom;
          for(const e of entries){
            const tr=target--;
            this.board[tr][c]=e.item;this.spr[tr][c]=e.sprite;
            const s=e.sprite;if(!s)continue;
            rebind(s,tr,c);
            const q=this.pos(tr,c),dist=Math.max(0,tr-e.from),ang=s.getData('ang')??s.angle??0;
            if(dist>0){
              animations.push(new Promise(resolve=>this.tweens.add({
                targets:s,x:q.x,y:q.y,angle:ang,duration:180+dist*85,ease:'Cubic.in',
                onComplete:()=>{
                  const sx=s.getData('sx')||s.scaleX,sy=s.getData('sy')||s.scaleY;
                  this.tweens.add({targets:s,scaleX:sx*1.035,scaleY:sy*.965,duration:65,yoyo:true,ease:'Sine.inOut'});
                  resolve();
                }
              })));
            }
          }

          let spawn=0;
          while(target>=segTop){
            const tr=target--;
            this.board[tr][c]={id:Phaser.Utils.Array.GetRandom(available),sp:null};
            this.render(tr,c,false,false);
            const s=this.spr[tr][c];if(!s)continue;
            rebind(s,tr,c);
            const q=this.pos(tr,c),ang=s.getData('ang')??s.angle??0;
            spawn++;
            // New berries always appear from the top edge of THIS open segment.
            // They never cross an ice/blocker anchor visually.
            const localTopY=this.pos(segTop,c).y-CELL*.72;
            s.x=q.x;s.y=localTopY-(spawn-1)*10;s.alpha=.02;
            animations.push(new Promise(resolve=>this.tweens.add({
              targets:s,y:q.y,alpha:1,angle:ang,duration:320+spawn*45,ease:'Cubic.in',onComplete:resolve
            })));
          }
          segBottom=segTop-1;
        }
      }

      // Never leave holes after refill.
      for(let r=0;r<R;r++)for(let c=0;c<C;c++){
        if(!this.cell[r][c].block&&!this.cell[r][c].ice&&!this.board[r][c]){
          this.board[r][c]={id:Phaser.Utils.Array.GetRandom(available),sp:null};
          this.render(r,c,false,false);
        }
      }
      if(animations.length)await Promise.race([Promise.all(animations),pause(1800)]);
      await pause(45);
    };

    // ---- Prevent a long cascade/animation chain from locking input forever.
    const oldResolve=p.resolve;
    p.resolve=async function resolveV07(){
      const unlock=setTimeout(()=>{if(this.scene?.isActive?.()){this.busy=false;this.scheduleHint?.()}},4500);
      try{return await oldResolve.call(this)}finally{clearTimeout(unlock)}
    };

    // ---- HUD polish: move boosters slightly upward and restore top controls / championship.
    const oldHud=p.hud;
    p.hud=function hudV07(){
      oldHud.call(this);

      // Shift booster icons/counters up a little.
      Object.values(this.boosterButtons||{}).forEach(b=>{b.im.y-=18;b.tx.y-=18});
      if(this.boosterHint)this.boosterHint.y-=18;

      // Improve runtime heading font where possible.
      this.mt?.setFontFamily?.(FONT);this.st?.setFontFamily?.(FONT);
      (this.gt||[]).forEach(t=>t.setFontFamily?.(FONT));

      const addTopUi=()=>{
        if(this.__topUiAdded)return;this.__topUiAdded=true;
        // Hide the temporary text arrow created by previous HUD layers.
        this.children.list.filter(o=>o.type==='Text'&&o.text==='←').forEach(o=>o.setVisible(false));

        const back=fit(this.add.image(92,66,'ui_back'),62,62).setDepth(20).setInteractive({useHandCursor:true});
        back.on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});

        fit(this.add.image(1285,64,'ui_life'),50,50).setDepth(20);
        this.add.text(1320,64,'5',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);

        const sv=(()=>{try{return JSON.parse(localStorage.getItem('berries_vs_04')||'{}')}catch{return {}}})();
        fit(this.add.image(1780,64,'ui_coin'),46,46).setDepth(20);
        this.add.text(1820,64,String(sv.coins||0),{fontFamily:FONT,fontSize:'23px',fontStyle:'bold',color:'#fff3c4',stroke:'#5a2e18',strokeThickness:4}).setOrigin(.5).setDepth(20);

        const settings=fit(this.add.image(1880,64,'ui_settings'),48,48).setDepth(20).setInteractive({useHandCursor:true});
        settings.on('pointerdown',()=>this.fx.click());

        // Championship badge/panel in the free lower-left zone.
        fit(this.add.image(285,850,'panel_championat'),330,150).setDepth(2);
      };

      if(this.textures.exists('ui_back')){addTopUi();return}
      ['ui_back','ui_life','ui_coin','ui_settings'].forEach(k=>this.load.image(k,`assets/ui/icons/${k}.png`));
      this.load.image('panel_championat','assets/ui/panels/panel_championat.png');
      this.load.once('complete',addTopUi);
      this.load.start();
    };

    return true;
  }

  let tries=0;const t=setInterval(()=>{tries++;if(patch()||tries>250)clearInterval(t)},20);
})();
